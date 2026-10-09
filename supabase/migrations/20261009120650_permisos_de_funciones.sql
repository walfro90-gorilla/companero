-- Permisos de las funciones (avisos de seguridad de Supabase al desplegar en la nube, 9-oct, ADR 0012).
-- Postgres da EXECUTE a PUBLIC por omisión, así que los helpers de RLS y las funciones de trigger se podían llamar
-- por /rest/v1/rpc/* también sin sesión. No filtraban nada (sin sesión auth.uid() es nulo), pero se cierran:
--   - helpers de RLS: solo authenticated (las políticas se evalúan con el rol de quien consulta y los necesitan);
--   - funciones de trigger: nadie (al dispararse, un trigger no revisa EXECUTE; igual que miembros_proteger_rol).
-- Los avisos que quedan para authenticated son a propósito: las RPC que usa la app y los helpers de RLS, que solo
-- responden sobre el propio usuario (mis empresas, mi rol).

revoke execute on function public.mis_empresas() from public, anon;
revoke execute on function public.tengo_rol(uuid, public.rol_miembro[]) from public, anon;
revoke execute on function public.gestiono(uuid) from public, anon;
revoke execute on function public.superviso(uuid) from public, anon;
revoke execute on function public.atiendo(uuid, uuid) from public, anon;
revoke execute on function public.a_uuid(text) from public, anon;

grant execute on function public.mis_empresas() to authenticated;
grant execute on function public.tengo_rol(uuid, public.rol_miembro[]) to authenticated;
grant execute on function public.gestiono(uuid) to authenticated;
grant execute on function public.superviso(uuid) to authenticated;
grant execute on function public.atiendo(uuid, uuid) to authenticated;
grant execute on function public.a_uuid(text) to authenticated;

revoke execute on function public.documentos_numerar() from public, anon, authenticated;
revoke execute on function public.secciones_empresa() from public, anon, authenticated;
revoke execute on function public.hijo_de_modulo_empresa() from public, anon, authenticated;
revoke execute on function public.tocar_actualizado() from public, anon, authenticated;
