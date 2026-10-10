-- Hallazgo de las pruebas en producción (Bart, 9-oct; docs/adr/0015):
--   1. La lista de «Soy empleado» (/acceso) es pública: una empresa nueva ya no aparece sola ahí (alguien podría
--      registrarse y poner un nombre ofensivo en la pantalla de la demo). Su admin la prende en Ajustes. Del Río y
--      Superette (las demos) sí aparecen.
--   2. Un empleado (cuenta interna de número de reloj) no crea empresas, ni llamando a la RPC directo con su sesión.

alter table public.empresas alter column en_lista_acceso set default false;
update public.empresas set en_lista_acceso = true where slug in ('del-rio', 'superette');

create or replace function public.crear_empresa(p_nombre text, p_slug text, p_giro text default null,
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
    raise exception 'Para crear una empresa entra con tu correo' using errcode = '42501';
  end if;
  if coalesce(auth.jwt() ->> 'email', '') like '%@reloj.companero.invalid' then
    raise exception 'Una cuenta de empleado no crea empresas' using errcode = '42501';
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
