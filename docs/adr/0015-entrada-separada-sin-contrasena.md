# ADR 0015 — Entrada separada para empleados y administración, sin contraseña para empleados

- Estado: **aceptado (2026-10-09, noche)**. Decisiones de Wal:
  - Un login para empleados y otro para admins, fáciles de encontrar desde un botón. **Los empleados jamás verán el login de admins.**
  - «Los requerimientos piden acceso sin password, apeguémonos a los criterios de evaluación»: los empleados siguen entrando **solo con su número de reloj** (ADR 0014), sin NIP ni contraseña.
- Complementa el ADR 0014. Migración `20261009120900_nip_y_entrada` (ver «Lo que quedó del NIP»).

## Entrada separada
| Ruta | Qué es | Quién la ve |
|---|---|---|
| `/entrar` | Selector: **«Soy empleado»** grande y principal; **«Administración»** discreto abajo. La landing lleva aquí | Todos |
| `/acceso` | Lista de empresas (solo nombre y slug, la arma el servidor). Cada una → `/acceso/{empresa}` | Empleados |
| `/acceso/{empresa}` y `/unirse/{código}` (QR) | Solo el número de reloj; por QR, un número nuevo queda dado de alta | Empleados |
| `/entrar/admin` | Correo y contraseña (8 o más); crear cuenta; recuperar contraseña | Admin y RH |

- **Lista de empresas:** la tabla `empresas` sigue cerrada para quien no tiene sesión (probado). Cada empresa decide en Ajustes si aparece en la lista (`empresas.en_lista_acceso`); si no, sus empleados entran por el QR o por `/acceso/{empresa}`.
- **Los empleados nunca ven la entrada de administración:**
  - Ninguna página de empleado tiene liga a ella ni su formulario: las de acceso, la del QR y las de `/e/{empresa}`. El encabezado del empleado ya no lleva a `/inicio`.
  - El QR y `/e/{empresa}` sin sesión llevan directo a la entrada de empleados.
  - Si un empleado con sesión abre `/entrar`, `/entrar/admin` o `/acceso`, regresa a su empresa.
  - Al salir, el empleado regresa a `/acceso/{su empresa}` y no al selector.
  - `/e/{empresa}/admin/*` sigue dando 404 a empleados.
- **Salir cierra solo esa sesión** (`scope: 'local'`). Antes se cerraban todas las del usuario, y como los jueces comparten 0001, uno que saliera sacaba a los demás.
- **Invitar a admin o RH** (Equipo): no se manda correo, porque el SMTP integrado manda muy pocos. La pantalla lo dice y da la liga `/entrar/admin?modo=crear` con un botón para copiarla. Cuando esa persona crea su cuenta con el correo invitado, queda en el equipo.

## Rate limit de Supabase Auth
- La sesión del empleado la abre el servidor (`generateLink` + `verifyOtp`), así que para Supabase todas las verificaciones vienen de la IP de Vercel. El límite por omisión de *token verifications* es de unas 30 cada 5 minutos por IP.
- **Wal lo sube en la nube:** Auth → Rate Limits, a 300 o más (`docs/despliegue.md`).
- **Si aun así se llena:** el empleado ve «Hay muchas entradas en este momento. Intenta de nuevo en un minuto.» (503), y eso no cuenta como intento fallido.

## NIP: se hizo y se descartó el mismo día
Wal pidió primero número de reloj + NIP de 6 dígitos, y se construyó y validó en local. Antes de desplegarlo, Wal decidió quitarlo: la ficha pide **acceso sin contraseña** para el personal. Gana el criterio de evaluación.
- **Riesgo que se queda (el del ADR 0014):** quien conozca el número de reloj de alguien y la dirección de la empresa puede entrar como esa persona.
  - Lo mitigan el límite de 8 intentos fallidos por IP y que la app no guarda datos sensibles.
  - En un piloto real se puede agregar un NIP sin cambiar el modelo, con el NIP como contraseña de Auth.
  - **Ojo para ese piloto:** con el NIP como contraseña, la llave publicable permite probarlo directo contra Supabase Auth, saltándose nuestros límites. Hay que ponerle pimienta en el servidor (HMAC con un secreto) para que solo funcione por nuestra API. Lo encontró Bart al revisar.

### Lo que quedó del NIP
La migración `120900` ya estaba aplicada en la nube cuando se descartó el NIP, y una migración aplicada no se edita. Deja dos columnas:
- **`empresas.en_lista_acceso`:** se usa para la lista de «Soy empleado».
- **`accesos_reloj.numero`:** ahora solo anota qué número se intentó, para auditoría. Ya no hay bloqueo por número.

## Pruebas
- **`supabase/tests/aislamiento.test.sql`** (40):
  - nadie con sesión lee ni cambia `auth.users`;
  - un anónimo no lee `empresas`.
- **`npm run humo`** (56):
  - el selector;
  - la lista de empresas, con solo nombre y slug;
  - `/acceso/{empresa}` pide solo el número, sin campo de contraseña;
  - ninguna página de empleado lleva a la de administración: acceso, QR y pantallas del estudiante;
  - un empleado que abre `/entrar/admin` regresa a su empresa;
  - al salir regresa a su entrada, y su otra sesión sigue abierta.
