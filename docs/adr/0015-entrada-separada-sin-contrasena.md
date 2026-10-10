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

## Cómo se abre la sesión del empleado: clave interna, no enlace mágico
- **El bug (lo encontró Bart en producción con 40 entradas de 0001, de 8 en 8):** antes la sesión se abría con un enlace mágico (`generateLink` + `verifyOtp`). Cada enlace nuevo del mismo usuario reemplaza al anterior, así que con varios jueces entrando como 0001 a la vez ~1 de cada 4 recibía 500 («One-time token not found»).
- **Ahora:** cada empleado tiene una **clave interna** que calcula el servidor: `HMAC-SHA256(SUPABASE_SECRET_KEY, correo interno)`, con prefijo para cumplir cualquier regla de contraseñas.
  - El empleado no la conoce ni la escribe: sigue entrando solo con su número.
  - Se entra con `signInWithPassword` desde el cliente del servidor, en una llamada y sin tokens de un solo uso, así que las entradas a la vez no se pisan.
  - Sin la llave secreta nadie puede entrar directo contra Supabase Auth (probado con la llave publicable).
- **Cuentas sin esa clave** (las creadas antes, o tras rotar la llave secreta): si la entrada falla, el servidor revisa que la cuenta sea de verdad la interna de ese empleado, le pone la clave y reintenta una vez. Por eso no hubo que volver a sembrar.
- **La condición de la ficha se mantiene:** el empleado entra sin contraseña. La clave es una credencial interna del servidor, como la llave secreta.
- **Rate limit:** todas las entradas salen de la IP de Vercel. En Auth → Rate Limits, *sign-ins and sign-ups* va a 300 o más (en local, `config.toml`). Si aun así se llena, el empleado ve «Hay muchas entradas en este momento» (503), y no cuenta como intento fallido.
- Probado en `npm run humo`: 20 entradas a la vez de 0001 abren las 20 sesiones.

## Más hallazgos de las pruebas en producción (Bart, 9-oct)
- **Citas no reconocidas (Exactitud, 30 %):** Groq escribía a veces `[D1‑51]` con el guion U+2011, o `[D1-53, paso 1]`, y la respuesta salía sin fuentes. Ahora hay **una sola regla** en `lib/conocimiento/citas.ts`, que usan el chat, las lecciones, el test y la generación de módulos:
  - acepta cualquier guion;
  - acepta varios códigos con `,`, `;` o «y»;
  - acepta texto corto después de los códigos;
  - normaliza el código a `D1-53`.

  Las instrucciones piden además citar cada regla que se aplica en un cálculo.
- **El chat se rompía tras una respuesta larga:** se validaba cada mensaje del historial con el límite de 2000 caracteres, así que una respuesta larga de la asistente hacía fallar todas las preguntas siguientes.
  - Ahora solo la pregunta nueva tiene el límite de 2000; el historial se acepta hasta 12 000 caracteres por mensaje y 200 mensajes.
  - El navegador manda solo lo reciente, y al modelo le siguen llegando los últimos 12 mensajes.
  - Lo mismo en la práctica.
- **Lista pública de empresas** (migración `121000`): una empresa nueva **no** aparece en «Soy empleado» hasta que su admin la prende en Ajustes, para que nadie ponga un nombre ofensivo en la pantalla de la demo. Del Río y Superette sí aparecen.
- **Un empleado no crea empresas** (migración `121000`): `crear_empresa` rechaza las cuentas internas de número de reloj.

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
- **`supabase/tests/aislamiento.test.sql`** (42):
  - nadie con sesión lee ni cambia `auth.users`;
  - un anónimo no lee `empresas`;
  - un empleado no crea empresas;
  - una empresa nueva no sale en la lista.
- **`lib/conocimiento/citas.test.ts`:** citas con U+2011, con texto extra y con varios códigos.
- **`npm run humo`** (61), además de lo de abajo: 20 entradas a la vez, nadie entra directo contra Auth, y el historial largo no tumba el chat. También comprueba:
  - el selector;
  - la lista de empresas, con solo nombre y slug;
  - `/acceso/{empresa}` pide solo el número, sin campo de contraseña;
  - ninguna página de empleado lleva a la de administración: acceso, QR y pantallas del estudiante;
  - un empleado que abre `/entrar/admin` regresa a su empresa;
  - al salir regresa a su entrada, y su otra sesión sigue abierta.
