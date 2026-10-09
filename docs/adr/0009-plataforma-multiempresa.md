# ADR 0009 — Plataforma multiempresa y multisucursal con login sin contraseñas

- Estado: **aceptado (2026-10-09)**. Cambia el rumbo de ADR 0001/0002: el prototipo de Del Río pasa a ser el
  primer cliente de un producto general ("Compañero", nombre de trabajo en `lib/marca.ts`).
- Decisión de Wal: "una aplicación general, en blanco, que se pueda adecuar a cualquier negocio que necesite
  automatizar y sistematizar con IA sus capacitaciones a nuevos ingresos y refuerzos a empleados activos",
  multiempresa y multisucursal, con login con Gmail o correo, desplegada en Vercel.

## Modelo
| Tabla | Qué es |
|---|---|
| `empresas` | Inquilino. `slug` para la URL (`/e/del-rio`), giro y `avatar` (identidad del asistente, jsonb). |
| `sucursales` | Con `codigo_union`: el QR de alta de esa sucursal. |
| `puestos` | Cajero, colaborador de tienda… Los módulos se asignan por puesto. |
| `miembros` | Usuario ↔ empresa con `rol` (`admin`, `rh`, `supervisor`, `colaborador`), sucursal y puesto. Un usuario puede estar en varias empresas. |
| `invitaciones` | Por correo; se vuelven membresía al entrar (`aceptar_invitaciones()`). |

**La autorización vive en Postgres (RLS), no en el código.** Patrón de estampida (membresía + helpers
`security definer`: `mis_empresas()`, `gestiono()`, `superviso()`, `atiendo()`) con el estilo de brotes
(`(select helper())` en las políticas). Las altas sensibles van por RPC que validan adentro (`crear_empresa`,
`unirse_con_codigo`). Un trigger impide que alguien sin `gestiono()` se cambie rol/sucursal/puesto.
Probado en `supabase/tests/aislamiento.test.sql` (25 comprobaciones) y desde HTTP en `npm run humo`.

## Login (Supabase Auth)
- **Sin contraseñas**: Google, o correo con **código de 6 dígitos** (no enlace mágico: el enlace con PKCE falla
  si el correo se abre en otro dispositivo, y ketzal-OS ya pagó esa lección con WhatsApp quemando tokens).
- **Invitado** (sesión anónima) solo al llegar por un QR: para jueces y demos. Un anónimo no crea empresas.
- Google necesita un *OAuth Client* en Google Cloud Console (gratis, sin servidores): es el registro que Google
  exige a cualquier app con "Entrar con Google". Sin él, la app funciona con correo e invitado.
- El correo integrado de Supabase manda pocos por hora: para la demo, Google/invitado o un SMTP (Resend).

## Alta del personal
QR por sucursal (`/unirse/{codigo}`) → entra con Gmail o correo → queda como colaborador de esa sucursal;
RH le asigna el puesto. Para RH/supervisores/admin: invitación por correo con rol.

## Condición de Del Río "sin datos personales, contraseñas o credenciales"
Se guarda solo el correo (lo maneja Supabase Auth) y un nombre para mostrar opcional. No hay contraseñas. El
modelo de IA **nunca** recibe quién pregunta. Lo que ve RH de las consultas es agregado (ADR 0011).
**Pendiente:** confirmarlo con Del Río en el taller del viernes.

## Detalles técnicos
- `cacheComponents` apagado: casi todo depende de la sesión y ningún proyecto del equipo lo usa.
- `proxy.ts` refresca la sesión y exige sesión en `/inicio` y `/e/*`; `lib/sesion.ts` es la capa de acceso
  (`contextoEmpresa(slug)` → 404 si no es miembro: no se revela que la empresa existe).
- La app solo usa la llave **publicable**; la secreta es solo para scripts locales (`sembrar`, `prueba`).
- Los archivos suben del navegador directo a Storage (Vercel limita el cuerpo de una función a 4.5 MB).

## Descartado
- Subdominio por empresa (estampida): DNS/certificados por inquilino no aportan a la demo; `/e/{slug}` basta.
- Tabla pública de posiciones entre personas (ver ADR 0011).
