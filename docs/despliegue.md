# Despliegue de Compañero (Supabase + Vercel)

Runbook del [ADR 0012](adr/0012-despliegue-supabase-propio-y-vercel.md). Marca cada paso al hacerlo.

**Estado al 9-oct-2026, 14:50:** la base y la app ya están en línea. Faltan la llave de Groq en Vercel (paso 4),
la configuración de Auth en el panel (paso 3) y sembrar los datos de demo (paso 5).

| | |
|---|---|
| App (producción) | **https://companero-ten.vercel.app** (proyecto Vercel `companero`, equipo `wals-projects-a7eafbb2`, región `iad1`) |
| Supabase | proyecto `del_rio_hackathon`, ref **`bavkhusmzyyswtfksosk`**, `us-east-1` → `https://bavkhusmzyyswtfksosk.supabase.co` |
| Repo | `walfro90-gorilla/companero`, rama `main`, conectado a Vercel: cada push a `main` despliega a producción |

## 1. Proyecto de Supabase (Wal)
- [x] Proyecto nuevo y vacío en `us-east-1`: `del_rio_hackathon` (`bavkhusmzyyswtfksosk`), creado el 9-oct.
- [x] URL entregada a Claude; MCP de Supabase conectado a ese proyecto.

## 2. Base de datos (Claude, por MCP) — hecho el 9-oct
- [x] Proyecto revisado antes de tocarlo: `public` sin tablas, 0 usuarios, sin buckets, sin migraciones.
- [x] Aplicadas en orden las 8 migraciones de `supabase/migrations/` (de `20261009120000_base_multiempresa` a
      `20261009120650_permisos_de_funciones`). El historial remoto usa las mismas versiones que los archivos, así
      que `supabase db push` sirve para las siguientes.
- [x] `get_advisors`: 16 tablas, todas con RLS. Se cerró EXECUTE de helpers y triggers a `anon` (migración 120650).
      Quedan avisos a propósito: las RPC que usa la app y los helpers de RLS para `authenticated` (solo responden
      sobre el propio usuario); y avisos informativos de rendimiento (índices de FK, políticas que se traslapan)
      sin efecto con datos de demo.
- [x] `supabase/tests/aislamiento.test.sql` corrido en la nube dentro de una transacción con `rollback`:
      **25/25**; la base quedó en 0 usuarios y 0 empresas.
- [x] Llave publicable: `sb_publishable_0yIhQ3WBZAs-o9AiwTrFWA_ouXuOnPE` (pública por diseño; protege la RLS).

Siguientes migraciones: archivo `20261009120700_…` o mayor; aplicarlas por MCP (`apply_migration` con el mismo
nombre y luego alinear la versión) o por CLI: `! supabase login`, `supabase link --project-ref bavkhusmzyyswtfksosk`,
`supabase db push`.

## 3. Autenticación (Wal, en el panel de Supabase) — pendiente
Panel: https://supabase.com/dashboard/project/bavkhusmzyyswtfksosk/auth/url-configuration
- [ ] **URL Configuration** → Site URL = `https://companero-ten.vercel.app`. Redirect URLs:
      `https://companero-ten.vercel.app/**`, `https://*-wals-projects-a7eafbb2.vercel.app/**` (previews) y
      `http://localhost:3000/**`.
- [ ] **Sign In / Providers** → **Anonymous sign-ins: ON** (modo invitado por QR para jueces).
- [ ] **Email Templates** → en *Confirm signup* y en *Magic Link* pegar el contenido de
      `supabase/templates/codigo.html` (asunto: "Tu código para entrar"). Así llega el **código de 6
      dígitos** (`{{ .Token }}`) en vez de un enlace.
- [ ] El correo integrado de Supabase manda muy pocos por hora: para la demo los jueces entran con Google o
      como invitados. Si se necesitan muchos correos: **SMTP propio** (p. ej. Resend) en *SMTP Settings*.
- [ ] (Opcional) **Google**: en Google Cloud Console crear un *OAuth client* (Web) con redirect URI
      `https://bavkhusmzyyswtfksosk.supabase.co/auth/v1/callback`; pegar Client ID y Secret en
      *Providers → Google*.

## 4. Vercel
- [x] Proyecto `companero` creado y vinculado (`vercel link`), repo de GitHub conectado (rama `main`).
- [x] Variables públicas en Production, Preview y Development: `NEXT_PUBLIC_SUPABASE_URL` y
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [x] Primer despliegue a producción (9-oct, 14:47; build de 38 s) desde una copia limpia del commit `3825193`
      (`git archive`, sin `.env.local`). Prueba de humo: `/` 200, `/entrar` 200, `POST /api/transcribir` 401.
- [ ] **`GROQ_API_KEY` (obligatoria: chat, reescritura de consulta y voz) — la captura Wal.** Desde
      `../hackKnights`, sin imprimir la llave:
      `grep '^GROQ_API_KEY=' .env.local | cut -d= -f2- | tr -d '\n' | vercel env add GROQ_API_KEY production --sensitive --yes`
      (repetir con `preview`). Después, volver a desplegar (las variables solo aplican a despliegues nuevos).
- [ ] `ANTHROPIC_API_KEY` (opcional, eslabón principal cuando exista), igual que la de Groq.
- **No** poner `SUPABASE_SECRET_KEY` en Vercel.

## 5. Datos de demo en la nube (Wal, desde su laptop) — pendiente
- [ ] Crear `.env.nube` (lo ignora git) con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
      `SUPABASE_SECRET_KEY` (Settings → API Keys de `bavkhusmzyyswtfksosk`) y `GROQ_API_KEY`.
- [ ] `SEMBRAR_ADMIN_EMAIL=<tu correo> npm run sembrar:nube` → crea **Tienda Escuela** (sube el PDF del manual a
      Storage, 96 secciones con contexto de IA y el módulo revisado) y **Superette (demo)**, y te deja como admin.

## 6. Verificación antes de la demo
- [ ] Entrar con Google o con código en la URL de Vercel, en incógnito y en el celular.
- [ ] Escanear el QR de una sucursal desde otro teléfono y entrar como invitado.
- [ ] Preguntar a la asistente: una pregunta cubierta (con cita) y una que canalice; ver la canalización
      llegar en vivo a "Dudas del equipo".
- [ ] `npm run validar` en local y adjuntar `docs/validacion.md` y `docs/prueba-documentada.md` a la entrega.
- [ ] Respaldo: video corto de la demo por si falla la red del evento.

## Si `git push` se cuelga
En la laptop de Wal, `gcr-ssh-agent` deja procesos `ssh-add` girando y los push por SSH no terminan. Alternativa
por HTTPS con la sesión de `gh`, sin cambiar la configuración de git:
`git -c url."https://github.com/".insteadOf="git@github.com:" -c credential.helper= -c credential.helper='!gh auth git-credential' push origin main`
