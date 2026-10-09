-- Base multiempresa (docs/adr/0009): empresas → sucursales → puestos → miembros con rol.
-- Patrón de estampida (membresía + helper security definer) con el estilo de brotes ((select helper()) en las
-- políticas para que se evalúe una vez por consulta, no por fila).
-- Regla: TODA tabla de negocio lleva empresa_id y RLS. Las altas sensibles (crear empresa, unirse) van por
-- funciones security definer que validan todo adentro.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists vector with schema extensions;

create type public.rol_miembro as enum ('admin', 'rh', 'supervisor', 'colaborador');

-- ───────────────────────────── Tablas ─────────────────────────────

create table public.empresas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  nombre      text not null check (length(trim(nombre)) between 2 and 80),
  giro        text,                                   -- comercio, maquila, restaurante…
  -- Identidad del asistente: { nombre, saludo, color, color_suave }. La edita admin/RH.
  avatar      jsonb not null default '{}'::jsonb,
  creada_por  uuid references auth.users (id) on delete set null,
  creada_en   timestamptz not null default now()
);

create table public.sucursales (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas (id) on delete cascade,
  nombre       text not null check (length(trim(nombre)) between 2 and 80),
  -- Código del QR de alta: el colaborador lo escanea y queda en esta sucursal.
  codigo_union text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  activa       boolean not null default true,
  creada_en    timestamptz not null default now()
);
create index on public.sucursales (empresa_id);

create table public.puestos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  nombre      text not null check (length(trim(nombre)) between 2 and 80),
  descripcion text,
  creado_en   timestamptz not null default now(),
  unique (empresa_id, nombre)
);

create table public.miembros (
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  rol         public.rol_miembro not null default 'colaborador',
  sucursal_id uuid references public.sucursales (id) on delete set null,
  puesto_id   uuid references public.puestos (id) on delete set null,
  -- Solo un nombre para mostrar (opcional). Nada más de datos personales (docs/adr/0006).
  nombre      text check (nombre is null or length(trim(nombre)) between 1 and 60),
  ingreso     date not null default current_date,
  creado_en   timestamptz not null default now(),
  primary key (empresa_id, usuario_id)
);
create index on public.miembros (usuario_id);

create table public.invitaciones (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  email       text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  rol         public.rol_miembro not null default 'colaborador',
  sucursal_id uuid references public.sucursales (id) on delete set null,
  puesto_id   uuid references public.puestos (id) on delete set null,
  creada_por  uuid references auth.users (id) on delete set null,
  creada_en   timestamptz not null default now(),
  aceptada_en timestamptz,
  unique (empresa_id, email)
);

-- ───────────────────────────── Helpers de RLS ─────────────────────────────
-- security definer: leen miembros sin pasar por su propia RLS (evita recursión). search_path vacío.

create function public.mis_empresas() returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.empresa_id from public.miembros m where m.usuario_id = auth.uid()
$$;

create function public.tengo_rol(p_empresa uuid, p_roles public.rol_miembro[]) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros m
     where m.empresa_id = p_empresa and m.usuario_id = auth.uid() and m.rol = any (p_roles)
  )
$$;

-- Gestiona contenido y equipo: admin y RH.
create function public.gestiono(p_empresa uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select public.tengo_rol(p_empresa, array['admin', 'rh']::public.rol_miembro[]) $$;

-- Ve el avance del equipo y atiende canalizaciones: admin, RH y supervisores.
create function public.superviso(p_empresa uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select public.tengo_rol(p_empresa, array['admin', 'rh', 'supervisor']::public.rol_miembro[]) $$;

-- ───────────────────────────── RLS ─────────────────────────────

alter table public.empresas     enable row level security;
alter table public.sucursales   enable row level security;
alter table public.puestos      enable row level security;
alter table public.miembros     enable row level security;
alter table public.invitaciones enable row level security;

create policy empresas_leer on public.empresas for select to authenticated
  using (id in (select public.mis_empresas()));
create policy empresas_editar on public.empresas for update to authenticated
  using ((select public.tengo_rol(id, array['admin']::public.rol_miembro[])))
  with check ((select public.tengo_rol(id, array['admin']::public.rol_miembro[])));

create policy sucursales_leer on public.sucursales for select to authenticated
  using (empresa_id in (select public.mis_empresas()));
create policy sucursales_gestionar on public.sucursales for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

create policy puestos_leer on public.puestos for select to authenticated
  using (empresa_id in (select public.mis_empresas()));
create policy puestos_gestionar on public.puestos for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

-- Un colaborador solo se ve a sí mismo; quien supervisa ve a todo el equipo de su empresa.
create policy miembros_leer on public.miembros for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.superviso(empresa_id)));
create policy miembros_gestionar on public.miembros for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));
-- Cada quien puede cambiar su nombre para mostrar (la columna se limita con grants abajo).
create policy miembros_mi_nombre on public.miembros for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy invitaciones_gestionar on public.invitaciones for all to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

-- Nada para anon; authenticated pasa por RLS.
revoke all on public.empresas, public.sucursales, public.puestos, public.miembros, public.invitaciones from anon;

-- Una política no distingue columnas: miembros_mi_nombre deja editar la fila propia, y este trigger impide que
-- alguien sin gestiono() se cambie rol, sucursal o puesto (escalada de privilegios).

create function public.miembros_proteger_rol() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (new.rol, new.sucursal_id, new.puesto_id, new.empresa_id, new.usuario_id)
     is distinct from (old.rol, old.sucursal_id, old.puesto_id, old.empresa_id, old.usuario_id)
     and not public.gestiono(old.empresa_id)
     and auth.uid() is not null then
    raise exception 'Solo admin o RH cambian rol, sucursal o puesto' using errcode = '42501';
  end if;
  return new;
end
$$;
create trigger miembros_proteger_rol before update on public.miembros
  for each row execute function public.miembros_proteger_rol();

-- ───────────────────────────── Altas (RPC) ─────────────────────────────

-- Crea la empresa con su primera sucursal y su primer puesto, y deja a quien la crea como admin.
create function public.crear_empresa(p_nombre text, p_slug text, p_giro text default null,
                                     p_sucursal text default 'Matriz', p_puesto text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_empresa uuid;
  v_sucursal uuid;
begin
  if v_usuario is null then
    raise exception 'Necesitas iniciar sesión' using errcode = '42501';
  end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Para crear una empresa entra con Google o con tu correo' using errcode = '42501';
  end if;
  insert into public.empresas (nombre, slug, giro, creada_por)
       values (trim(p_nombre), lower(trim(p_slug)), nullif(trim(p_giro), ''), v_usuario)
    returning id into v_empresa;
  insert into public.sucursales (empresa_id, nombre) values (v_empresa, coalesce(nullif(trim(p_sucursal), ''), 'Matriz'))
    returning id into v_sucursal;
  if nullif(trim(p_puesto), '') is not null then
    insert into public.puestos (empresa_id, nombre) values (v_empresa, trim(p_puesto));
  end if;
  insert into public.miembros (empresa_id, usuario_id, rol, sucursal_id) values (v_empresa, v_usuario, 'admin', v_sucursal);
  return v_empresa;
end
$$;

-- Alta con el QR de una sucursal: entra como colaborador. Si ya era miembro, no cambia su rol.
create function public.unirse_con_codigo(p_codigo text)
returns table (empresa_id uuid, slug text)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_usuario uuid := auth.uid();
  v_sucursal public.sucursales%rowtype;
begin
  if v_usuario is null then
    raise exception 'Necesitas iniciar sesión' using errcode = '42501';
  end if;
  select * into v_sucursal from public.sucursales s where s.codigo_union = upper(trim(p_codigo)) and s.activa;
  if not found then
    raise exception 'Código no válido' using errcode = 'P0002';
  end if;
  insert into public.miembros (empresa_id, usuario_id, rol, sucursal_id)
       values (v_sucursal.empresa_id, v_usuario, 'colaborador', v_sucursal.id)
  on conflict on constraint miembros_pkey do nothing;
  return query select e.id, e.slug from public.empresas e where e.id = v_sucursal.empresa_id;
end
$$;

-- Al entrar: convierte en membresías las invitaciones pendientes a su correo.
create function public.aceptar_invitaciones()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_n integer := 0;
  v_inv public.invitaciones%rowtype;
begin
  if v_usuario is null or v_email is null or v_email = '' then
    return 0;
  end if;
  for v_inv in select * from public.invitaciones i where i.email = v_email and i.aceptada_en is null loop
    insert into public.miembros (empresa_id, usuario_id, rol, sucursal_id, puesto_id)
         values (v_inv.empresa_id, v_usuario, v_inv.rol, v_inv.sucursal_id, v_inv.puesto_id)
    on conflict on constraint miembros_pkey do update
      set rol = excluded.rol, sucursal_id = excluded.sucursal_id, puesto_id = excluded.puesto_id;
    update public.invitaciones set aceptada_en = now() where id = v_inv.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

revoke execute on function public.crear_empresa(text, text, text, text, text) from public, anon;
revoke execute on function public.unirse_con_codigo(text) from public, anon;
revoke execute on function public.aceptar_invitaciones() from public, anon;
grant execute on function public.crear_empresa(text, text, text, text, text) to authenticated;
grant execute on function public.unirse_con_codigo(text) to authenticated;
grant execute on function public.aceptar_invitaciones() to authenticated;
revoke execute on function public.miembros_proteger_rol() from public, anon, authenticated;
