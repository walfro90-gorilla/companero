-- Prácticas con cliente simulado (docs/adr/0011): cada práctica terminada suma a la gamificación personal.
-- Igual que el test, es privada de quien la hizo (sin calificación: solo que la completó).

create table public.practicas (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas (id) on delete cascade,
  usuario_id   uuid not null references auth.users (id) on delete cascade,
  modulo_id    uuid not null references public.modulos (id) on delete cascade,
  escenario_id uuid not null references public.escenarios (id) on delete cascade,
  completada_en timestamptz not null default now()
);
create index on public.practicas (usuario_id, empresa_id);

alter table public.practicas enable row level security;
create policy practicas_mias on public.practicas for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()));
revoke all on public.practicas from anon;

-- Reto de equipo (gamificación en agregado): por sucursal, cuántas personas terminaron todas las lecciones de
-- los módulos de inducción publicados. Sin nombres.
create function public.avance_por_sucursal(p_empresa uuid)
returns table (sucursal text, personas bigint, listas bigint)
language sql stable security definer set search_path = ''
as $$
  with lecciones as (
    select l.id from public.lecciones l join public.modulos m on m.id = l.modulo_id
     where m.empresa_id = p_empresa and m.estado = 'autorizado' and m.tipo = 'induccion'
  ),
  por_persona as (
    select mi.usuario_id, mi.sucursal_id,
           (select count(*) from public.avances a where a.usuario_id = mi.usuario_id and a.leccion_id in (select id from lecciones)) as hechas
      from public.miembros mi
     where mi.empresa_id = p_empresa and mi.rol = 'colaborador'
  )
  select coalesce(s.nombre, 'Sin sucursal'), count(*), count(*) filter (where p.hechas > 0 and p.hechas >= (select count(*) from lecciones))
    from por_persona p left join public.sucursales s on s.id = p.sucursal_id
   where public.superviso(p_empresa)
   group by s.nombre
   order by s.nombre
$$;
revoke execute on function public.avance_por_sucursal(uuid) from public, anon;
grant execute on function public.avance_por_sucursal(uuid) to authenticated;
