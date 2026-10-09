-- Pruebas de aislamiento multiempresa y de búsqueda (docs/adr/0009 y 0010).
-- Corre dentro de una transacción que se deshace: no deja nada en la base.
--   npm run test:sql   (supabase local encendido)
\set ON_ERROR_STOP on
begin;

-- Usuarios de prueba.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'beto@dos.mx', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'caro@uno.mx', 'authenticated', 'authenticated');

-- Actuar como un usuario: rol authenticated + claims del JWT.
create function pg_temp.como(p_id uuid, p_email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', 'authenticated', 'is_anonymous', false)::text, true);
end $$;
create function pg_temp.root() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;
create function pg_temp.esperar(p_ok boolean, p_que text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FALLÓ: %', p_que; end if;
  raise notice 'ok: %', p_que;
end $$;

-- Ana crea "Uno" y Beto crea "Dos".
select pg_temp.como('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx');
select public.crear_empresa('Empresa Uno', 'uno', 'comercio', 'Centro', 'Cajero');
select pg_temp.como('00000000-0000-4000-8000-0000000000b2', 'beto@dos.mx');
select public.crear_empresa('Empresa Dos', 'dos', 'maquila', 'Planta 1', 'Operador');

-- Beto solo ve su empresa.
select pg_temp.esperar((select count(*) from public.empresas) = 1, 'Beto ve solo 1 empresa');
select pg_temp.esperar((select slug from public.empresas) = 'dos', 'y es la suya');

-- Ana sube un documento autorizado y uno en borrador.
select pg_temp.como('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx');
insert into public.documentos (empresa_id, titulo, estado)
  select id, 'Manual de caja', 'autorizado' from public.empresas where slug = 'uno';
insert into public.documentos (empresa_id, titulo, estado)
  select id, 'Borrador de políticas', 'borrador' from public.empresas where slug = 'uno';
insert into public.secciones (documento_id, orden, titulo, texto, contexto)
  select d.id, 1, 'Cancelaciones', 'Para cancelar un artículo ya cobrado, llama al supervisor; él autoriza la cancelación con su clave.',
         'Cómo cancelar una venta o un artículo; me equivoqué al cobrar'
    from public.documentos d where d.titulo = 'Manual de caja';
insert into public.secciones (documento_id, orden, titulo, texto)
  select d.id, 1, 'Secreto', 'Contenido en revisión que nadie debe ver todavía.'
    from public.documentos d where d.titulo = 'Borrador de políticas';
select pg_temp.esperar((select numero from public.documentos where titulo = 'Manual de caja') = 1, 'el primer documento es D1');
select pg_temp.esperar((select numero from public.documentos where titulo = 'Borrador de políticas') = 2, 'el segundo es D2');

-- Beto (otra empresa) no ve nada de Uno, ni siquiera llamando a la búsqueda con el id de Uno.
select pg_temp.como('00000000-0000-4000-8000-0000000000b2', 'beto@dos.mx');
select pg_temp.esperar((select count(*) from public.documentos) = 0, 'Beto no ve documentos de Uno');
select pg_temp.esperar((select count(*) from public.secciones) = 0, 'Beto no ve secciones de Uno');
select pg_temp.esperar(
  (select count(*) from public.buscar_secciones((select id from public.empresas e where e.slug = 'uno'), 'cancelar')) = 0,
  'la búsqueda tampoco le devuelve nada de Uno');
-- Ni puede meterse a Uno escribiendo directo en miembros.
select pg_temp.root();
do $$ declare v_uno uuid := (select id from public.empresas where slug = 'uno'); begin
  perform pg_temp.como('00000000-0000-4000-8000-0000000000b2', 'beto@dos.mx');
  begin
    insert into public.miembros (empresa_id, usuario_id, rol) values (v_uno, '00000000-0000-4000-8000-0000000000b2', 'admin');
    raise exception 'FALLÓ: Beto se coló como admin de Uno';
  exception when insufficient_privilege then raise notice 'ok: Beto no puede hacerse miembro de Uno'; end;
end $$;

-- Ya no hay atajo para unirse con solo el código del QR: el alta por QR la hace el servidor (ADR 0014).
select pg_temp.esperar(to_regprocedure('public.unirse_con_codigo(text)') is null, 'ya no existe unirse_con_codigo');

-- Nadie apunta a una sucursal o un puesto de OTRA empresa (trigger validar_misma_empresa), ni con la llave secreta.
select pg_temp.root();
do $$
declare
  v_uno uuid := (select id from public.empresas where slug = 'uno');
  v_suc_dos uuid := (select s.id from public.sucursales s join public.empresas e on e.id = s.empresa_id where e.slug = 'dos');
  v_pue_dos uuid := (select p.id from public.puestos p join public.empresas e on e.id = p.empresa_id where e.slug = 'dos');
begin
  begin
    insert into public.miembros (empresa_id, usuario_id, rol, sucursal_id)
      values (v_uno, '00000000-0000-4000-8000-0000000000c3', 'colaborador', v_suc_dos);
    raise exception 'FALLÓ: la llave secreta metió a alguien de Uno en una sucursal de Dos';
  exception when check_violation then raise notice 'ok: ni la llave secreta mete a un miembro en la sucursal de otra empresa'; end;
  perform pg_temp.como('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx');
  begin
    insert into public.invitaciones (empresa_id, email, rol, puesto_id) values (v_uno, 'rh@uno.mx', 'rh', v_pue_dos);
    raise exception 'FALLÓ: Ana invitó con un puesto de Dos';
  exception when check_violation then raise notice 'ok: Ana (admin de Uno) no invita con el puesto de otra empresa'; end;
  begin
    update public.miembros set puesto_id = v_pue_dos where usuario_id = auth.uid();
    raise exception 'FALLÓ: Ana se puso un puesto de Dos';
  exception when check_violation then raise notice 'ok: ni se pone el puesto de otra empresa'; end;
end $$;

-- Caro entra a Uno por el QR de la sucursal: el servidor (llave secreta) la da de alta como colaboradora.
select pg_temp.root();
insert into public.miembros (empresa_id, usuario_id, rol, sucursal_id, numero_reloj)
  select e.id, '00000000-0000-4000-8000-0000000000c3', 'colaborador', s.id, '0042'
    from public.empresas e join public.sucursales s on s.empresa_id = e.id where e.slug = 'uno';
select pg_temp.como('00000000-0000-4000-8000-0000000000c3', 'caro@uno.mx');
select pg_temp.esperar((select rol from public.miembros where usuario_id = auth.uid()) = 'colaborador', 'Caro entra como colaboradora');

-- Caro ve lo autorizado, no el borrador; y la búsqueda encuentra con otras palabras y sin acentos.
select pg_temp.esperar((select count(*) from public.documentos) = 1, 'Caro ve solo el documento autorizado');
select pg_temp.esperar((select count(*) from public.secciones) = 1, 'y solo su sección');
select pg_temp.esperar(
  (select codigo from public.buscar_secciones((select id from public.empresas where slug = 'uno'), '¿cómo cancelo algo que ya cobre?') limit 1) = 'D1-1',
  'búsqueda: "cómo cancelo algo que ya cobre" → D1-1');
select pg_temp.esperar(
  (select codigo from public.buscar_secciones((select id from public.empresas where slug = 'uno'), 'me equivoque al cobrar') limit 1) = 'D1-1',
  'búsqueda por el contexto generado: "me equivoque al cobrar" → D1-1');
select pg_temp.esperar(
  (select codigo from public.buscar_secciones((select id from public.empresas where slug = 'uno'), 'cancelasiones') limit 1) = 'D1-1',
  'búsqueda aproximada con falta de ortografía: "cancelasiones" → D1-1');
select pg_temp.esperar(
  (select count(*) from public.buscar_secciones((select id from public.empresas where slug = 'uno'), 'secreto en revisión', 8, null, true)) = 0,
  'pedir borradores no le sirve a una colaboradora');

-- Caro no puede subirse de rol.
do $$ begin
  update public.miembros set rol = 'admin' where usuario_id = auth.uid();
  raise exception 'FALLÓ: Caro se subió a admin';
exception when insufficient_privilege then raise notice 'ok: Caro no puede subirse de rol'; end $$;
-- Pero sí cambiar su nombre para mostrar.
update public.miembros set nombre = 'Caro' where usuario_id = auth.uid();
select pg_temp.esperar((select nombre from public.miembros where usuario_id = auth.uid()) = 'Caro', 'Caro cambia su nombre');
-- Y no ve a Ana (un colaborador solo se ve a sí mismo).
select pg_temp.esperar((select count(*) from public.miembros) = 1, 'Caro solo se ve a sí misma en miembros');

-- Caro canaliza una duda; Ana (admin) la ve; Beto no.
insert into public.canalizaciones (empresa_id, usuario_id, destino, pregunta)
  select id, auth.uid(), 'supervisor', '¿Puedo fiarle a un cliente?' from public.empresas where slug = 'uno';
insert into public.consultas (empresa_id, usuario_id, pregunta, canalizada)
  select id, auth.uid(), '¿Puedo fiarle a un cliente?', 'supervisor' from public.empresas where slug = 'uno';
select pg_temp.como('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx');
select pg_temp.esperar((select count(*) from public.canalizaciones where estado = 'abierta') = 1, 'Ana ve la canalización');
select pg_temp.esperar((select count(*) from public.consultas) = 0, 'Ana NO ve las consultas de Caro una por una');
select pg_temp.esperar((select veces from public.huecos_del_material((select id from public.empresas where slug = 'uno'))) = 1,
  'pero sí el hueco agregado, sin quién preguntó');
update public.canalizaciones set estado = 'atendida', respuesta = 'No, no se fía.', atendida_por = auth.uid(), atendida_en = now();
select pg_temp.como('00000000-0000-4000-8000-0000000000b2', 'beto@dos.mx');
select pg_temp.esperar((select count(*) from public.canalizaciones) = 0, 'Beto no ve canalizaciones de Uno');
select pg_temp.esperar((select count(*) from public.huecos_del_material((select id from public.empresas where slug = 'uno'))) = 0,
  'ni los huecos de Uno');

-- Revisión de respuestas (ADR 0014): Caro hace un test; no puede calificarse; Ana (admin) sí, pero sin tocar respuestas.
select pg_temp.como('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx');
insert into public.modulos (empresa_id, titulo, estado) select id, 'Módulo de prueba', 'autorizado' from public.empresas where slug = 'uno';
select pg_temp.como('00000000-0000-4000-8000-0000000000c3', 'caro@uno.mx');
insert into public.intentos (empresa_id, usuario_id, modulo_id, respuestas, aciertos, total)
  select m.empresa_id, auth.uid(), m.id, '[]'::jsonb, 3, 5 from public.modulos m where m.titulo = 'Módulo de prueba';
select pg_temp.esperar((select count(*) from public.intentos) = 1, 'Caro ve su intento');
update public.intentos set calificacion = 10;
select pg_temp.esperar((select calificacion from public.intentos) is null, 'Caro NO puede ponerse calificación');
do $$ begin
  insert into public.intentos (empresa_id, usuario_id, modulo_id, respuestas, aciertos, total, calificacion)
    select m.empresa_id, auth.uid(), m.id, '[]'::jsonb, 5, 5, 10 from public.modulos m where m.titulo = 'Módulo de prueba';
  raise exception 'FALLÓ: Caro creó un intento ya calificado';
exception when insufficient_privilege then raise notice 'ok: Caro no puede crear un intento ya calificado'; end $$;
-- La práctica la guarda el servidor con la retroalimentación que generó la IA: Caro no puede insertar una propia.
do $$ begin
  insert into public.practicas (empresa_id, usuario_id, modulo_id, escenario_id, retroalimentacion)
    select m.empresa_id, auth.uid(), m.id, gen_random_uuid(), '¡Excelente! 10/10' from public.modulos m where m.titulo = 'Módulo de prueba';
  raise exception 'FALLÓ: Caro guardó una práctica con retroalimentación inventada';
exception when insufficient_privilege then raise notice 'ok: Caro no puede guardar una práctica con retroalimentación inventada'; end $$;
select pg_temp.como('00000000-0000-4000-8000-0000000000a1', 'ana@uno.mx');
update public.intentos set calificacion = 8, comentario = 'Repasa cancelaciones', revisado_por = auth.uid(), revisado_en = now();
select pg_temp.esperar((select calificacion from public.intentos) = 8, 'Ana (admin) califica el intento');
do $$ begin
  update public.intentos set aciertos = 5;
  raise exception 'FALLÓ: Ana cambió el puntaje automático';
exception when insufficient_privilege then raise notice 'ok: quien califica no puede cambiar las respuestas ni el puntaje'; end $$;
select pg_temp.como('00000000-0000-4000-8000-0000000000b2', 'beto@dos.mx');
select pg_temp.esperar((select count(*) from public.intentos) = 0, 'Beto (otra empresa) no ve intentos de Uno');
do $$ begin
  perform count(*) from public.accesos_reloj;
  raise exception 'FALLÓ: un usuario leyó accesos_reloj';
exception when insufficient_privilege then raise notice 'ok: nadie con sesión lee los intentos de acceso por número de reloj'; end $$;

-- Un usuario anónimo (modo invitado) no puede crear empresas.
select pg_temp.root();
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000c3', 'role', 'authenticated', 'is_anonymous', true)::text, true);
do $$ begin
  perform public.crear_empresa('Pirata', 'pirata');
  raise exception 'FALLÓ: un anónimo creó una empresa';
exception when insufficient_privilege then raise notice 'ok: un anónimo no crea empresas'; end $$;

-- Todas las tablas de public tienen RLS.
select pg_temp.root();
select pg_temp.esperar(
  not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity),
  'todas las tablas de public tienen RLS');

rollback;
