-- Contenido y búsqueda RAG (docs/adr/0010). Cada empresa sube sus documentos desde la app; se parten en
-- secciones citables (D{numero}-{orden}); RH revisa y publica. El asistente solo ve lo `autorizado`.

create type public.estado_contenido as enum ('borrador', 'autorizado', 'archivado');

-- Español sin acentos: "cancelacion" encuentra "cancelación" y "cancelar" encuentra "cancelaciones".
create text search configuration public.es (copy = pg_catalog.spanish);
alter text search configuration public.es
  alter mapping for hword, hword_part, word with extensions.unaccent, spanish_stem;

create table public.documentos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  numero         integer not null default 0,       -- D{numero}: lo que cita el asistente (lo asigna el trigger)
  titulo         text not null check (length(trim(titulo)) between 2 and 160),
  fuente         text,                             -- nombre del archivo/documento original
  tipo           text not null default 'texto' check (tipo in ('texto', 'markdown', 'pdf', 'docx')),
  archivo        text,                             -- ruta en Storage: {empresa_id}/{documento_id}/{nombre}
  puesto_id      uuid references public.puestos (id) on delete set null,
  estado         public.estado_contenido not null default 'borrador',
  -- Contenido de ejemplo escrito por el equipo, no por la empresa: la UI lo avisa siempre.
  ejemplo        boolean not null default false,
  creado_por     uuid references auth.users (id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, numero)
);

create table public.secciones (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas (id) on delete cascade,
  documento_id uuid not null references public.documentos (id) on delete cascade,
  orden        integer not null check (orden > 0),  -- D{numero}-{orden}
  titulo       text not null,
  texto        text not null,
  pagina       integer,                             -- en PDFs, para que la cita se pueda verificar
  -- Contextual Retrieval (Anthropic): qué es esta sección dentro del documento y qué preguntas responde.
  -- Lo genera la IA al ingerir; acerca el vocabulario del empleado ("me equivoqué al cobrar") al del manual.
  contexto     text,
  busqueda     tsvector generated always as (
                 setweight(to_tsvector('public.es', coalesce(titulo, '')), 'A') ||
                 setweight(to_tsvector('public.es', coalesce(contexto, '')), 'B') ||
                 setweight(to_tsvector('public.es', texto), 'C')
               ) stored,
  embedding    extensions.vector(1024),             -- opcional: búsqueda por significado (ADR 0010)
  unique (documento_id, orden)
);
create index on public.secciones using gin (busqueda);
create index on public.secciones (empresa_id);
create index on public.secciones using hnsw (embedding extensions.vector_cosine_ops);

-- Numeración por empresa: D1, D2… (lo que el cajero ve en la cita).
create function public.documentos_numerar() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(new.numero, 0) = 0 then
    perform pg_advisory_xact_lock(hashtextextended(new.empresa_id::text, 0));
    select coalesce(max(d.numero), 0) + 1 into new.numero from public.documentos d where d.empresa_id = new.empresa_id;
  end if;
  return new;
end
$$;
create trigger documentos_numerar before insert on public.documentos
  for each row execute function public.documentos_numerar();

create function public.tocar_actualizado() returns trigger
language plpgsql set search_path = ''
as $$ begin new.actualizado_en := now(); return new; end $$;
create trigger documentos_tocar before update on public.documentos
  for each row execute function public.tocar_actualizado();

-- La sección hereda la empresa de su documento (no se puede colar una sección en otra empresa).
create function public.secciones_empresa() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  select d.empresa_id into new.empresa_id from public.documentos d where d.id = new.documento_id;
  return new;
end
$$;
create trigger secciones_empresa before insert or update of documento_id on public.secciones
  for each row execute function public.secciones_empresa();

alter table public.documentos enable row level security;
alter table public.secciones  enable row level security;

-- Colaboradores: solo lo autorizado de sus empresas. Admin/RH: todo, incluidos borradores.
create policy documentos_leer on public.documentos for select to authenticated
  using (empresa_id in (select public.mis_empresas()) and (estado = 'autorizado' or (select public.gestiono(empresa_id))));
create policy documentos_gestionar on public.documentos for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

create policy secciones_leer on public.secciones for select to authenticated
  using (
    empresa_id in (select public.mis_empresas())
    and ((select public.gestiono(empresa_id))
         or exists (select 1 from public.documentos d where d.id = documento_id and d.estado = 'autorizado'))
  );
create policy secciones_gestionar on public.secciones for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

revoke all on public.documentos, public.secciones from anon;

-- ───────────────────────────── Búsqueda híbrida ─────────────────────────────
-- Tres vías, fusionadas con Reciprocal Rank Fusion (k = 60):
--   texto        — cualquier palabra de la consulta cuenta (OR; las preguntas son largas y un AND no
--                  encuentra nada). Patrón de brotes, con la configuración sin acentos.
--   aproximada   — similitud de trigramas con el título y el contexto: aguanta faltas de ortografía.
--   significado  — distancia coseno con el embedding, solo si hay (p_embedding no nulo).
-- security invoker: la RLS decide qué secciones ve quien pregunta (un colaborador nunca ve borradores).
create function public.buscar_secciones(
  p_empresa uuid, p_consulta text, p_limite integer default 8,
  p_embedding extensions.vector default null, p_borradores boolean default false
)
returns table (seccion_id uuid, codigo text, documento text, fuente text, titulo text, texto text,
               pagina integer, puntaje real, vias text)
language sql stable security invoker set search_path = ''
as $$
  with q as (
    select to_tsquery('simple', string_agg(quote_literal(t.lexeme), ' | ')) as consulta
      from unnest(to_tsvector('public.es', coalesce(p_consulta, ''))) t
  ),
  base as (
    select s.id, s.titulo, s.texto, s.pagina, s.contexto, s.busqueda, s.embedding, s.orden,
           d.numero, d.titulo as doc_titulo, d.fuente as doc_fuente
      from public.secciones s join public.documentos d on d.id = s.documento_id
     where s.empresa_id = p_empresa
       and (d.estado = 'autorizado' or (p_borradores and d.estado = 'borrador'))
  ),
  texto as (
    select b.id, row_number() over (order by ts_rank_cd(b.busqueda, q.consulta) desc) as r
      from base b, q
     where q.consulta is not null and b.busqueda @@ q.consulta
     order by r limit 30
  ),
  aproximada as (
    select x.id, row_number() over (order by x.sim desc) as r
      from (select b.id, extensions.word_similarity(lower(p_consulta), lower(b.titulo || ' ' || coalesce(b.contexto, ''))) as sim
              from base b) x
     where x.sim > 0.35
     order by r limit 30
  ),
  significado as (
    select b.id, row_number() over (order by b.embedding operator(extensions.<=>) p_embedding) as r
      from base b
     where p_embedding is not null and b.embedding is not null
     order by r limit 30
  ),
  fusion as (
    select v.id, sum(1.0 / (60 + v.r)) as puntaje, string_agg(v.via, '+' order by v.via) as vias
      from (select id, r, 'texto' as via from texto
            union all select id, r, 'aproximada' from aproximada
            union all select id, r, 'significado' from significado) v
     group by v.id
  )
  select b.id, 'D' || b.numero || '-' || b.orden, b.doc_titulo, b.doc_fuente, b.titulo, b.texto, b.pagina,
         f.puntaje::real, f.vias
    from fusion f join base b on b.id = f.id
   order by f.puntaje desc, b.numero, b.orden
   limit greatest(1, least(p_limite, 20))
$$;

revoke execute on function public.buscar_secciones(uuid, text, integer, extensions.vector, boolean) from public, anon;
grant execute on function public.buscar_secciones(uuid, text, integer, extensions.vector, boolean) to authenticated;

-- ───────────────────────────── Storage: archivos originales ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 20971520, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/markdown'
])
on conflict (id) do nothing;

-- Convierte sin lanzar: una ruta que no empieza con un uuid da null (y null no gestiona nada).
create function public.a_uuid(p text) returns uuid
language plpgsql immutable set search_path = ''
as $$ begin return p::uuid; exception when others then return null; end $$;

-- Ruta: {empresa_id}/{documento_id}/{archivo}. Suben y borran admin/RH; el original de un documento
-- autorizado lo puede abrir cualquier miembro (para verificar la cita).
create policy documentos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (select public.gestiono(public.a_uuid((storage.foldername(name))[1]))));
create policy documentos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (select public.gestiono(public.a_uuid((storage.foldername(name))[1]))));
create policy documentos_abrir on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos'
    and (
      (select public.gestiono(public.a_uuid((storage.foldername(name))[1])))
      or exists (
        select 1 from public.documentos d
         where d.id = public.a_uuid((storage.foldername(name))[2])
           and d.estado = 'autorizado'
           and d.empresa_id in (select public.mis_empresas())
      )
    )
  );
