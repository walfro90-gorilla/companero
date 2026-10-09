-- La vía aproximada (trigramas) es para faltas de ortografía ("cancelasiones"), no para ordenar (prueba documentada
-- del 9-oct): al compararse contra el contexto largo, "revisar" y "caja" le daban puntos a casi todo y enterraban a
-- la sección 12 en "¿Qué debo revisar al cerrar caja?". Ahora compara solo título y referencia, pide más parecido
-- (0.45) y pesa la mitad que la vía de texto en la fusión (RRF ponderado).
-- Además, en la vía de texto la presencia de una palabra rara domina sobre la repetición de palabras comunes:
-- "¿Hasta cuándo puede devolver un cliente unas pilas?" dejaba fuera las secciones con "pilas" y con el plazo.

create or replace function public.buscar_secciones(
  p_empresa uuid, p_consulta text, p_limite integer default 8,
  p_embedding extensions.vector default null, p_borradores boolean default false
)
returns table (seccion_id uuid, codigo text, documento text, fuente text, titulo text, texto text,
               pagina integer, referencia text, puntaje real, vias text)
language sql stable security invoker set search_path = ''
as $$
  with base as (
    select s.id, s.titulo, s.texto, s.pagina, s.referencia, s.contexto, s.busqueda, s.embedding, s.orden,
           d.numero, d.titulo as doc_titulo, d.fuente as doc_fuente
      from public.secciones s join public.documentos d on d.id = s.documento_id
     where s.empresa_id = p_empresa
       and (d.estado = 'autorizado' or (p_borradores and d.estado = 'borrador'))
  ),
  n as (select count(*)::numeric as total from base),
  terminos as (
    select distinct
           to_tsquery('simple', case when length(l) >= 6 then left(l, 5) || ':*' else l end) as q
      from (select regexp_replace(t.lexeme, '[^a-z0-9]', '', 'g') as l
              from unnest(to_tsvector('public.es', coalesce(p_consulta, ''))) t) x
     where length(l) >= 2
  ),
  df as (
    select t.q, count(b.id) filter (where b.busqueda @@ t.q) as df
      from terminos t cross join base b
     group by t.q
  ),
  texto as (
    -- Cada término cuenta su rareza completa por estar presente, más hasta otro tanto según dónde y cuánto aparece
    -- (ts_rank normalizado 32 = r/(r+1), satura): la repetición de palabras comunes ya no le gana a una palabra rara.
    select b.id, row_number() over (order by sum(ln((n.total + 1) / (df.df + 0.5)) * (1 + ts_rank(b.busqueda, df.q, 32))) desc) as r
      from base b join df on df.df > 0 and b.busqueda @@ df.q cross join n
     group by b.id
     order by r limit 30
  ),
  aproximada as (
    select x.id, row_number() over (order by x.sim desc) as r
      from (select b.id, extensions.word_similarity(lower(p_consulta), lower(b.titulo || ' ' || coalesce(b.referencia, ''))) as sim
              from base b) x
     where x.sim > 0.45
     order by r limit 30
  ),
  significado as (
    select b.id, row_number() over (order by b.embedding operator(extensions.<=>) p_embedding) as r
      from base b
     where p_embedding is not null and b.embedding is not null
     order by r limit 30
  ),
  fusion as (
    select v.id, sum(v.peso / (60 + v.r)) as puntaje, string_agg(v.via, '+' order by v.via) as vias
      from (select id, r, 'texto' as via, 1.0 as peso from texto
            union all select id, r, 'aproximada', 0.5 from aproximada
            union all select id, r, 'significado', 1.0 from significado) v
     group by v.id
  )
  select b.id, 'D' || b.numero || '-' || b.orden, b.doc_titulo, b.doc_fuente, b.titulo, b.texto, b.pagina, b.referencia,
         f.puntaje::real, f.vias
    from fusion f join base b on b.id = f.id
   order by f.puntaje desc, b.numero, b.orden
   limit greatest(1, least(p_limite, 20))
$$;
