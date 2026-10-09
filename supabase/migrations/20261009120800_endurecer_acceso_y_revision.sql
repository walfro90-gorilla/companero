-- Endurecimiento tras la revisión de 7ccbba1 (docs/adr/0014; observaciones de la otra sesión de Wal, 9-oct):
--   1. Altas por QR con límite por IP: se marca cada alta en accesos_reloj (columna `alta`).
--   2. Una fila no puede apuntar a una sucursal o a un puesto de OTRA empresa (lo valida la base, para cualquier
--      camino: llave secreta, sesión de RH o la API directa). Aplica a miembros, invitaciones, módulos, documentos,
--      consultas y canalizaciones.
--   3. La práctica (conversación + retroalimentación de la IA) la guarda el servidor con la llave secreta en cuanto
--      termina de generar la retroalimentación (/api/practica). El empleado ya no inserta directo: si pudiera, pondría
--      una "retroalimentación de la IA" inventada y RH la revisaría como real.
--   4. Fuera unirse_con_codigo: el alta por QR ahora pasa por el servidor con número de reloj (ADR 0014) y esta
--      función dejaba que cualquier usuario con sesión se uniera como colaborador con solo el código.

alter table public.accesos_reloj add column alta boolean not null default false;
create index on public.accesos_reloj (ip, alta, creado_en desc);

create function public.validar_misma_empresa() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v jsonb := to_jsonb(new);
  v_sucursal uuid := (v ->> 'sucursal_id')::uuid;
  v_puesto uuid := (v ->> 'puesto_id')::uuid;
begin
  if v_sucursal is not null and not exists (
    select 1 from public.sucursales s where s.id = v_sucursal and s.empresa_id = new.empresa_id
  ) then
    raise exception 'La sucursal no es de esta empresa' using errcode = '23514';
  end if;
  if v_puesto is not null and not exists (
    select 1 from public.puestos p where p.id = v_puesto and p.empresa_id = new.empresa_id
  ) then
    raise exception 'El puesto no es de esta empresa' using errcode = '23514';
  end if;
  return new;
end
$$;
revoke execute on function public.validar_misma_empresa() from public, anon, authenticated;

create trigger miembros_misma_empresa before insert or update on public.miembros
  for each row execute function public.validar_misma_empresa();
create trigger invitaciones_misma_empresa before insert or update on public.invitaciones
  for each row execute function public.validar_misma_empresa();
create trigger modulos_misma_empresa before insert or update on public.modulos
  for each row execute function public.validar_misma_empresa();
create trigger documentos_misma_empresa before insert or update on public.documentos
  for each row execute function public.validar_misma_empresa();
create trigger consultas_misma_empresa before insert or update on public.consultas
  for each row execute function public.validar_misma_empresa();
create trigger canalizaciones_misma_empresa before insert or update on public.canalizaciones
  for each row execute function public.validar_misma_empresa();

drop policy practicas_crear_mias on public.practicas;
revoke insert on public.practicas from anon, authenticated;

drop function public.unirse_con_codigo(text);
