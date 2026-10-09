-- Acceso por número de reloj y revisión humana de respuestas (docs/adr/0014, decisiones de Wal del 9-oct).
--   1. Los empleados (colaborador, supervisor) entran solo con su número de reloj, único por empresa. Admin y RH
--      entran con correo y contraseña. La sesión del empleado la abre el servidor con la llave secreta.
--   2. Límite de intentos por IP para que no se puedan adivinar números (tabla solo para la llave secreta).
--   3. RH/admin revisan y califican prácticas y tests (0–10 + comentario). El empleado ve su revisión. Es
--      retroalimentación de aprendizaje hecha por una persona, no una decisión automatizada (condición de la ficha).

alter table public.miembros
  add column numero_reloj text check (numero_reloj is null or numero_reloj ~ '^[A-Z0-9-]{1,20}$');
create unique index miembros_numero_reloj on public.miembros (empresa_id, numero_reloj) where numero_reloj is not null;

create table public.accesos_reloj (
  id         bigserial primary key,
  ip         text not null,
  empresa_id uuid references public.empresas (id) on delete cascade,
  exito      boolean not null,
  creado_en  timestamptz not null default now()
);
create index on public.accesos_reloj (ip, creado_en desc);
alter table public.accesos_reloj enable row level security;  -- sin políticas: solo la llave secreta
revoke all on public.accesos_reloj from public, anon, authenticated;

-- Lo que se revisa: la conversación de la práctica y la retroalimentación de la IA; y la calificación humana.
alter table public.practicas
  add column transcripcion     jsonb not null default '[]'::jsonb,
  add column retroalimentacion text,
  add column calificacion      smallint check (calificacion between 0 and 10),
  add column comentario        text check (comentario is null or length(comentario) <= 2000),
  add column revisado_por      uuid references auth.users (id) on delete set null,
  add column revisado_en       timestamptz;
alter table public.intentos
  add column calificacion smallint check (calificacion between 0 and 10),
  add column comentario   text check (comentario is null or length(comentario) <= 2000),
  add column revisado_por uuid references auth.users (id) on delete set null,
  add column revisado_en  timestamptz;

-- RLS: el empleado crea y ve lo suyo, pero ya no puede modificarlo (si no, se pondría su propia calificación).
-- Admin/RH ven y califican lo de su empresa.
drop policy intentos_mios on public.intentos;
drop policy practicas_mias on public.practicas;
create policy intentos_ver_mios on public.intentos for select to authenticated using (usuario_id = (select auth.uid()));
create policy intentos_crear_mios on public.intentos for insert to authenticated
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()) and calificacion is null and revisado_por is null);
create policy practicas_ver_mias on public.practicas for select to authenticated using (usuario_id = (select auth.uid()));
create policy practicas_crear_mias on public.practicas for insert to authenticated
  with check (usuario_id = (select auth.uid()) and empresa_id in (select public.mis_empresas()) and calificacion is null and revisado_por is null);
create policy intentos_revisar_ver on public.intentos for select to authenticated using ((select public.gestiono(empresa_id)));
create policy intentos_revisar on public.intentos for update to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));
create policy practicas_revisar_ver on public.practicas for select to authenticated using ((select public.gestiono(empresa_id)));
create policy practicas_revisar on public.practicas for update to authenticated
  using ((select public.gestiono(empresa_id))) with check ((select public.gestiono(empresa_id)));

-- Quien califica solo cambia la revisión: no las respuestas ni el puntaje automático.
create function public.solo_revision() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if to_jsonb(new) - array['calificacion', 'comentario', 'revisado_por', 'revisado_en']
     is distinct from to_jsonb(old) - array['calificacion', 'comentario', 'revisado_por', 'revisado_en'] then
    raise exception 'Solo se puede cambiar la calificación y el comentario' using errcode = '42501';
  end if;
  return new;
end
$$;
create trigger intentos_solo_revision before update on public.intentos for each row execute function public.solo_revision();
create trigger practicas_solo_revision before update on public.practicas for each row execute function public.solo_revision();
revoke execute on function public.solo_revision() from public, anon, authenticated;
