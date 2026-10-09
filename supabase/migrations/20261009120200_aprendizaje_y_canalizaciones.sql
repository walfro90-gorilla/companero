-- Aprendizaje (docs/adr/0011): módulos de inducción y de refuerzo con lecciones, test y situaciones
-- prácticas; avance de cada persona; consultas al asistente y canalizaciones a supervisor/RH.
--
-- Regla de la ficha de Del Río: la evaluación es de aprendizaje, sin decisiones automatizadas sobre
-- personas. Por eso el resultado del test (intentos) solo lo ve quien lo hizo; RH y supervisores ven
-- avance (quién terminó qué) y agregados por tema, nunca calificaciones individuales ni rankings.

create type public.tipo_modulo as enum ('induccion', 'refuerzo');
create type public.destino_canalizacion as enum ('supervisor', 'rh');

create table public.modulos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  puesto_id      uuid references public.puestos (id) on delete set null,   -- null: para todos los puestos
  tipo           public.tipo_modulo not null default 'induccion',
  titulo         text not null check (length(trim(titulo)) between 2 and 120),
  descripcion    text,
  estado         public.estado_contenido not null default 'borrador',
  orden          integer not null default 0,
  generado_por_ia boolean not null default false,
  creado_por     uuid references auth.users (id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index on public.modulos (empresa_id);
create trigger modulos_tocar before update on public.modulos
  for each row execute function public.tocar_actualizado();

create table public.lecciones (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  modulo_id  uuid not null references public.modulos (id) on delete cascade,
  orden      integer not null check (orden > 0),
  titulo     text not null,
  objetivo   text,
  contenido  text not null,                     -- texto con citas [D1-3]
  secciones  text[] not null default '{}',      -- códigos que la sustentan
  unique (modulo_id, orden)
);

create table public.preguntas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  modulo_id   uuid not null references public.modulos (id) on delete cascade,
  orden       integer not null check (orden > 0),
  enunciado   text not null,
  opciones    text[] not null check (array_length(opciones, 1) between 2 and 5),
  correcta    smallint not null check (correcta >= 0),
  explicacion text not null,
  seccion     text not null,                    -- la cita que sustenta la respuesta correcta
  unique (modulo_id, orden),
  check (correcta < array_length(opciones, 1))
);

create table public.escenarios (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  modulo_id  uuid not null references public.modulos (id) on delete cascade,
  orden      integer not null check (orden > 0),
  titulo     text not null,
  situacion  text not null,                     -- lo que pasa en la caja
  personaje  text not null,                     -- a quién interpreta el asistente (p. ej. "cliente con prisa")
  objetivo   text not null,                     -- qué debe hacer bien la persona
  secciones  text[] not null default '{}',
  unique (modulo_id, orden)
);

-- Los hijos de un módulo heredan su empresa (no se puede colgar contenido en otra empresa).
create function public.hijo_de_modulo_empresa() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  select m.empresa_id into new.empresa_id from public.modulos m where m.id = new.modulo_id;
  return new;
end
$$;
create trigger lecciones_empresa before insert or update of modulo_id on public.lecciones
  for each row execute function public.hijo_de_modulo_empresa();
create trigger preguntas_empresa before insert or update of modulo_id on public.preguntas
  for each row execute function public.hijo_de_modulo_empresa();
create trigger escenarios_empresa before insert or update of modulo_id on public.escenarios
  for each row execute function public.hijo_de_modulo_empresa();

-- Avance: qué lecciones completó cada quien (lo ven quienes supervisan).
create table public.avances (
  empresa_id    uuid not null references public.empresas (id) on delete cascade,
  usuario_id    uuid not null references auth.users (id) on delete cascade,
  modulo_id     uuid not null references public.modulos (id) on delete cascade,
  leccion_id    uuid not null references public.lecciones (id) on delete cascade,
  completada_en timestamptz not null default now(),
  primary key (usuario_id, leccion_id)
);
create index on public.avances (empresa_id, modulo_id);

-- Intentos del test: privados de quien los hizo (ver encabezado).
create table public.intentos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  modulo_id  uuid not null references public.modulos (id) on delete cascade,
  respuestas jsonb not null,                    -- [{pregunta_id, elegida, correcta}]
  aciertos   integer not null,
  total      integer not null,
  creado_en  timestamptz not null default now()
);
create index on public.intentos (empresa_id, modulo_id);

-- Cada pregunta al asistente: alimenta "lo que el material no cubre" (huecos) y las métricas de exactitud.
create table public.consultas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  sucursal_id uuid references public.sucursales (id) on delete set null,
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  pregunta    text not null,
  respuesta   text,
  consultadas text[] not null default '{}',     -- secciones que trajo la búsqueda
  citas       text[] not null default '{}',     -- secciones que citó la respuesta (válidas)
  invalidas   text[] not null default '{}',     -- citas a secciones que no estaban (error del modelo)
  canalizada  public.destino_canalizacion,
  proveedor   text,
  creada_en   timestamptz not null default now()
);
create index on public.consultas (empresa_id, creada_en desc);

create table public.canalizaciones (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas (id) on delete cascade,
  sucursal_id  uuid references public.sucursales (id) on delete set null,
  usuario_id   uuid not null references auth.users (id) on delete cascade,
  consulta_id  uuid references public.consultas (id) on delete set null,
  destino      public.destino_canalizacion not null,
  pregunta     text not null,
  estado       text not null default 'abierta' check (estado in ('abierta', 'atendida')),
  respuesta    text,
  atendida_por uuid references auth.users (id) on delete set null,
  atendida_en  timestamptz,
  creada_en    timestamptz not null default now()
);
create index on public.canalizaciones (empresa_id, estado, creada_en desc);

-- ¿Le toca atender lo de esta sucursal? Admin y RH: todo. Supervisor: su sucursal (o lo que no tiene sucursal).
create function public.atiendo(p_empresa uuid, p_sucursal uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros m
     where m.empresa_id = p_empresa and m.usuario_id = auth.uid()
       and (m.rol in ('admin', 'rh')
            or (m.rol = 'supervisor' and (p_sucursal is null or m.sucursal_id is null or m.sucursal_id = p_sucursal)))
  )
$$;

-- ───────────────────────────── RLS ─────────────────────────────
alter table public.modulos        enable row level security;
alter table public.lecciones      enable row level security;
alter table public.preguntas      enable row level security;
alter table public.escenarios     enable row level security;
alter table public.avances        enable row level security;
alter table public.intentos       enable row level security;
alter table public.consultas      enable row level security;
alter table public.canalizaciones enable row level security;

create policy modulos_leer on public.modulos for select to authenticated
  using (empresa_id in (select public.mis_empresas()) and (estado = 'autorizado' or (select public.gestiono(empresa_id))));
create policy modulos_gestionar on public.modulos for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

-- Lecciones, preguntas y escenarios: visibles si su módulo lo es.
create policy lecciones_leer on public.lecciones for select to authenticated
  using (exists (select 1 from public.modulos m where m.id = modulo_id));
create policy lecciones_gestionar on public.lecciones for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));
create policy preguntas_leer on public.preguntas for select to authenticated
  using (exists (select 1 from public.modulos m where m.id = modulo_id));
create policy preguntas_gestionar on public.preguntas for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));
create policy escenarios_leer on public.escenarios for select to authenticated
  using (exists (select 1 from public.modulos m where m.id = modulo_id));
create policy escenarios_gestionar on public.escenarios for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

create policy avances_mios on public.avances for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()));
create policy avances_equipo on public.avances for select to authenticated
  using ((select public.superviso(empresa_id)));

create policy intentos_mios on public.intentos for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()));

create policy consultas_mias on public.consultas for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()));

create policy canalizaciones_mias on public.canalizaciones for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy canalizaciones_crear on public.canalizaciones for insert to authenticated
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()));
create policy canalizaciones_atender on public.canalizaciones for select to authenticated
  using ((select public.atiendo(empresa_id, sucursal_id)));
create policy canalizaciones_responder on public.canalizaciones for update to authenticated
  using ((select public.atiendo(empresa_id, sucursal_id))) with check ((select public.atiendo(empresa_id, sucursal_id)));

revoke all on public.modulos, public.lecciones, public.preguntas, public.escenarios, public.avances,
              public.intentos, public.consultas, public.canalizaciones from anon;

-- La bandeja del supervisor se actualiza en vivo (Realtime respeta la RLS).
alter publication supabase_realtime add table public.canalizaciones;

-- ───────────────────────────── Agregados para RH (sin datos de personas) ─────────────────────────────

-- Lo que el material no cubre: preguntas que se canalizaron o no encontraron sección. Sin quién preguntó.
create function public.huecos_del_material(p_empresa uuid, p_dias integer default 30)
returns table (pregunta text, veces bigint, destino public.destino_canalizacion, ultima timestamptz)
language sql stable security definer set search_path = ''
as $$
  select min(c.pregunta), count(*), max(c.canalizada), max(c.creada_en)
    from public.consultas c
   where c.empresa_id = p_empresa
     and public.gestiono(p_empresa)
     and c.creada_en > now() - make_interval(days => greatest(1, least(p_dias, 365)))
     and (c.canalizada is not null or cardinality(c.consultadas) = 0)
   group by lower(trim(c.pregunta))
   order by count(*) desc, max(c.creada_en) desc
   limit 50
$$;

-- Qué preguntas del test cuestan trabajo (porcentaje de acierto por pregunta), agregado.
create function public.dificultad_del_test(p_modulo uuid)
returns table (pregunta_id uuid, enunciado text, respuestas bigint, aciertos bigint)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.enunciado, count(r.*), count(r.*) filter (where (r.valor ->> 'correcta')::boolean)
    from public.preguntas p
    left join public.intentos i on i.modulo_id = p.modulo_id
    left join lateral jsonb_array_elements(i.respuestas) r(valor) on (r.valor ->> 'pregunta_id')::uuid = p.id
   where p.modulo_id = p_modulo
     and public.superviso(p.empresa_id)
   group by p.id, p.enunciado, p.orden
   order by p.orden
$$;

-- Métricas de exactitud del asistente (criterio de Del Río "Exactitud y respaldo"), agregadas.
create function public.metricas_asistente(p_empresa uuid, p_dias integer default 30)
returns table (consultas bigint, con_cita bigint, canalizadas bigint, citas_invalidas bigint, sin_resultados bigint)
language sql stable security definer set search_path = ''
as $$
  select count(*),
         count(*) filter (where cardinality(c.citas) > 0),
         count(*) filter (where c.canalizada is not null),
         count(*) filter (where cardinality(c.invalidas) > 0),
         count(*) filter (where cardinality(c.consultadas) = 0)
    from public.consultas c
   where c.empresa_id = p_empresa
     and public.gestiono(p_empresa)
     and c.creada_en > now() - make_interval(days => greatest(1, least(p_dias, 365)))
$$;

revoke execute on function public.huecos_del_material(uuid, integer) from public, anon;
revoke execute on function public.dificultad_del_test(uuid) from public, anon;
revoke execute on function public.metricas_asistente(uuid, integer) from public, anon;
grant execute on function public.huecos_del_material(uuid, integer) to authenticated;
grant execute on function public.dificultad_del_test(uuid) to authenticated;
grant execute on function public.metricas_asistente(uuid, integer) to authenticated;
