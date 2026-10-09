-- NIP de empleados y entrada separada (docs/adr/0015, decisiones de Wal del 9-oct).
--   1. Los empleados entran con número de reloj + NIP de 6 dígitos. El NIP es la contraseña de Auth de su usuario
--      interno, y la marca "debe cambiar el NIP temporal" va en app_metadata (solo la cambia la llave secreta). Aquí
--      solo hace falta el bloqueo por número: los fallos se cuentan por empresa y número aunque vengan de varias IP,
--      para que nadie pruebe el millón de NIPs repartiendo el ataque.
--   2. "Soy empleado" muestra la lista de empresas (solo nombre y slug, la arma el servidor). Cada empresa decide si
--      aparece en esa lista; si no, sus empleados entran por el QR o por /acceso/{empresa}.

alter table public.accesos_reloj add column numero text;
create index on public.accesos_reloj (empresa_id, numero, creado_en desc) where not exito;

alter table public.empresas add column en_lista_acceso boolean not null default true;
