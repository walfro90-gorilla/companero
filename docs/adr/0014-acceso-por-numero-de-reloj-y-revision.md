# ADR 0014 — Acceso por número de reloj, admin con contraseña y revisión humana de respuestas

- Estado: **aceptado (2026-10-09)**. Decisiones de Wal:
  - "el login de empleados deberá funcionar solamente por número de reloj. Solo los admins entran con email y password. Quita google auth".
  - "crea 4 usuarios: 0001, 0002, 0003 y 0004 para acceder como empleados estudiantes".
  - "el admin panel debe tener un contenedor de las respuestas para revisar y calificar".
- Cambia el ADR 0009 (login), el 0011 (privacidad del test) y el 0012 (la llave secreta ahora va al servidor en Vercel).

## Acceso
| Quién | Cómo entra | Dónde |
|---|---|---|
| **Colaborador y supervisor** | **Solo su número de reloj** (único por empresa: letras, números o guion). Sin correo ni contraseña | `/acceso/{empresa}` (p. ej. `/acceso/del-rio`) o el **QR de su sucursal** (`/unirse/{código}`) |
| **Admin y RH** | Correo y contraseña (mínimo 8). Registrar empresa, recuperar contraseña | `/entrar` |

- **Fuera:** Google y el modo invitado.
- **Cómo se abre la sesión del empleado:** cada empleado es un usuario de Auth con un correo interno que nunca recibe correo (`r-{empresa}-{número}@reloj.companero.invalid`; `.invalid` es un dominio reservado). El servidor, con la llave secreta, crea ese usuario al darlo de alta. Al entrar, genera un enlace mágico y lo verifica en el mismo servidor (`generateLink` + `verifyOtp` con `token_hash`), así que la sesión queda en las cookies sin que el empleado vea ni use correo. Ver `lib/empleados.ts`, `lib/sesion-empleado.ts` y `app/api/acceso-reloj`.
- **Alta de empleados:**
  - **Por RH:** en Equipo, uno por renglón y con nombre opcional ("0005, Ana"), con sucursal, puesto y rol (colaborador o supervisor).
  - **Por QR:** un número nuevo que entra por el QR de una sucursal queda como colaborador de esa sucursal. Así los jueces escanean y entran.
  - **Sin QR:** solo entran números ya registrados.
- **Admin y RH no entran por número de reloj**, aunque tengan uno: su acceso es con contraseña.
- **Contra adivinar números:** máximo 8 intentos fallidos por IP en 10 minutos (tabla `accesos_reloj`, accesible solo con la llave secreta).
- **Condición de la ficha** ("sin contraseñas ni credenciales"): el empleado no tiene contraseña. El número de reloj es un identificador interno, no un dato personal sensible.
- **Riesgo aceptado:** quien conozca el número de reloj de alguien y la dirección de la empresa puede entrar como esa persona. Para una herramienta de capacitación es aceptable, y lo mitigan el límite de intentos y que no hay datos sensibles. En un piloto real se puede agregar un PIN de 4 dígitos sin cambiar el modelo.

## Llave secreta en el servidor (cambia el ADR 0012)
`SUPABASE_SECRET_KEY` **va en Vercel** como variable *sensitive*. Solo la usa el servidor (`lib/supabase/admin.ts`, `server-only`) para:
- dar de alta empleados;
- abrir su sesión;
- leer y escribir el límite de intentos;
- leer el nombre de la empresa en las páginas públicas de acceso.

Los datos de negocio se siguen leyendo con la sesión de cada quien, con RLS. La app sigue rechazando una llave secreta puesta por error como llave pública (`lib/config.ts`).

## Estudiantes de la demo
`npm run sembrar` (y `sembrar:nube`) crea en Del Río a **0001, 0002, 0003 y 0004** ("Estudiante 1–4"), colaboradores de la Sucursal Centro, puesto Cajero. El admin de las demos se crea con contraseña (`SEMBRAR_ADMIN_EMAIL` + `SEMBRAR_ADMIN_PASSWORD`).

## Revisión humana de respuestas (cambia el ADR 0011)
- **Panel "Respuestas"** (admin y RH, `/e/{empresa}/admin/respuestas`), con filtro de pendientes, revisadas y todas. Muestra:
  - **Prácticas:** la conversación con el cliente simulado (ahora se guarda `transcripcion`) y la retroalimentación de la IA, con citas.
  - **Tests:** cada pregunta con lo que eligió el empleado y la respuesta correcta.
- **Calificación de 0 a 10 con comentario.** El empleado la ve en su Inicio ("Retroalimentación de tu instructor") y dentro del módulo.
- **Antes**, el resultado del test solo lo veía quien lo hizo. **Ahora** RH lo ve para revisarlo. Es compatible con la ficha: lo que prohíbe son decisiones *automatizadas* de contratación o desempeño, y esto es revisión humana para aprender.
- **Transparencia:** el módulo avisa "Tu instructor puede revisar tus respuestas para darte retroalimentación. Es para que aprendas, no una evaluación de tu desempeño".
- **Lo que hace cumplir la base:**
  - El empleado crea y ve lo suyo, pero no puede modificarlo, así que no puede calificarse.
  - Admin y RH solo pueden cambiar la calificación y el comentario, no las respuestas ni el puntaje (trigger `solo_revision`).
  - Otra empresa no ve nada.

  Está probado en `supabase/tests/aislamiento.test.sql` (32 comprobaciones) y en `npm run humo`.

## Descartado
- **PIN o contraseña para empleados:** Wal pidió solo el número de reloj; queda como mejora para el piloto.
- **Sesión anónima ligada al número:** cada entrada crearía otro usuario y se perdería el avance.
