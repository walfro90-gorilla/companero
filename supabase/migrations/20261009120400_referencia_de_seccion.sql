-- Cómo cita cada sección su propio documento (docs/adr/0013): el manual del reto pide «sección 5, Si la segunda
-- parte queda incierta». La marca interna [D1-n] no cambia; esto es lo que ve la persona y lo que también entra a
-- la búsqueda (el número y el nombre de la sección ayudan: "pagos mixtos", "sección 5").

alter table public.secciones add column referencia text;

-- La columna generada de búsqueda se rehace para incluir la referencia (peso A, como el título).
alter table public.secciones drop column busqueda;
alter table public.secciones add column busqueda tsvector generated always as (
  setweight(to_tsvector('public.es', coalesce(titulo, '') || ' ' || coalesce(referencia, '')), 'A') ||
  setweight(to_tsvector('public.es', coalesce(contexto, '')), 'B') ||
  setweight(to_tsvector('public.es', texto), 'C')
) stored;
create index on public.secciones using gin (busqueda);

-- La búsqueda devuelve también la referencia (cambia el tipo de retorno: se borra y se crea de nuevo).
drop function public.buscar_secciones(uuid, text, integer, extensions.vector, boolean);
create function public.buscar_secciones(
  p_empresa uuid, p_consulta text, p_limite integer default 8,
  p_embedding extensions.vector default null, p_borradores boolean default false
)
returns table (seccion_id uuid, codigo text, documento text, fuente text, titulo text, texto text,
               pagina integer, referencia text, puntaje real, vias text)
language sql stable security invoker set search_path = ''
as $$
  with q as (
    select to_tsquery('simple', string_agg(quote_literal(t.lexeme), ' | ')) as consulta
      from unnest(to_tsvector('public.es', coalesce(p_consulta, ''))) t
  ),
  base as (
    select s.id, s.titulo, s.texto, s.pagina, s.referencia, s.contexto, s.busqueda, s.embedding, s.orden,
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
      from (select b.id, extensions.word_similarity(lower(p_consulta),
                     lower(b.titulo || ' ' || coalesce(b.referencia, '') || ' ' || coalesce(b.contexto, ''))) as sim
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
  select b.id, 'D' || b.numero || '-' || b.orden, b.doc_titulo, b.doc_fuente, b.titulo, b.texto, b.pagina, b.referencia,
         f.puntaje::real, f.vias
    from fusion f join base b on b.id = f.id
   order by f.puntaje desc, b.numero, b.orden
   limit greatest(1, least(p_limite, 20))
$$;

revoke execute on function public.buscar_secciones(uuid, text, integer, extensions.vector, boolean) from public, anon;
grant execute on function public.buscar_secciones(uuid, text, integer, extensions.vector, boolean) to authenticated;
