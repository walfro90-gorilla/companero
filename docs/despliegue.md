# Despliegue de Compañero (Supabase + Vercel)

Runbook del [ADR 0012](adr/0012-despliegue-supabase-propio-y-vercel.md). Marca cada paso al hacerlo.
Estado al 9-oct-2026 (madrugada): **paso 1 pendiente** (el proyecto que se pasó era el de la app de repartos;
no se usa).

## 1. Proyecto de Supabase (Wal)
- [ ] Crear un proyecto **nuevo y vacío** llamado `companero`, región **`us-east-1`**. Guardar la contraseña
      de la base en el gestor de contraseñas (no se comparte en el chat).
- [ ] Pasar la URL (`https://<ref>.supabase.co`) a Claude. Con el MCP de Supabase conectado, Claude hace el
      paso 2.

## 2. Base de datos (Claude, por MCP)
- [ ] Revisar que el proyecto esté vacío (`list_tables`). **Si tiene tablas de otra app, se detiene.**
- [ ] Aplicar en orden cada archivo de `supabase/migrations/` con `apply_migration` (mismo nombre):
      `base_multiempresa` → `contenido_y_busqueda` → `aprendizaje_y_canalizaciones` → `practicas`.
- [ ] `get_advisors` (security y performance) y corregir lo que salga.
- [ ] Sacar la llave publicable (`get_publishable_keys`, formato `sb_publishable_…`).

Alternativa por CLI: `! supabase login`, luego `supabase link --project-ref <ref>` y `supabase db push`.

## 3. Autenticación (Wal, en el panel de Supabase)
- [ ] **URL Configuration** → Site URL = la URL de producción de Vercel. Redirect URLs:
      `https://<dominio-vercel>/**`, `https://*-walfro90-gorilla.vercel.app/**` (previews) y `http://localhost:3000/**`.
- [ ] **Sign In / Providers** → **Anonymous sign-ins: ON** (modo invitado por QR para jueces).
- [ ] **Email Templates** → en *Confirm signup* y en *Magic Link* pegar el contenido de
      `supabase/templates/codigo.html` (asunto: "Tu código para entrar"). Así llega el **código de 6
      dígitos** (`{{ .Token }}`) en vez de un enlace.
- [ ] El correo integrado de Supabase manda muy pocos por hora: para la demo los jueces entran con Google o
      como invitados. Si se necesitan muchos correos: **SMTP propio** (p. ej. Resend) en *SMTP Settings*.
- [ ] (Opcional) **Google**: en Google Cloud Console crear un *OAuth client* (Web) con redirect URI
      `https://<ref>.supabase.co/auth/v1/callback`; pegar Client ID y Secret en *Providers → Google*.
      Gratis y sin servidores: es el registro que Google exige para "Entrar con Google".

## 4. Vercel
- [ ] Importar el repo `walfro90-gorilla/companero` (framework Next.js; sin cambios de build).
- [ ] Variables de entorno (Production y Preview):
      | Variable | Valor | Quién |
      |---|---|---|
      | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Claude |
      | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Claude |
      | `ANTHROPIC_API_KEY` | llave de Anthropic (secreta) | **Wal** |
      | `GROQ_API_KEY` | llave de Groq (secreta) | **Wal** |
      | `IA_ESFUERZO_GROQ` | `medium` (opcional; es el valor por omisión) | — |
      **No** poner `SUPABASE_SECRET_KEY` en Vercel.
- [ ] Desplegar y regresar al paso 3 a poner la URL final en Site URL y Redirect URLs.

## 5. Datos de demo en la nube (Wal, desde su laptop)
- [ ] Crear `.env.nube` (lo ignora git) con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
      `SUPABASE_SECRET_KEY` del proyecto nuevo y las llaves de IA.
- [ ] `SEMBRAR_ADMIN_EMAIL=<tu correo> npm run sembrar:nube` → crea Del Río (demo) y Superette (demo) con el
      material de ejemplo, el módulo de ejemplo y te deja como admin.
- [ ] El material **real** de Del Río se sube desde la app (Contenido), no con scripts.

## 6. Verificación antes de la demo
- [ ] Entrar con Google o con código en la URL de Vercel, en incógnito y en el celular.
- [ ] Escanear el QR de una sucursal desde otro teléfono y entrar como invitado.
- [ ] Preguntar a la asistente: una pregunta cubierta (con cita) y una que canalice; ver la canalización
      llegar en vivo a "Dudas del equipo".
- [ ] `npm run validar` en local y adjuntar `docs/validacion.md` y `docs/prueba-documentada.md` a la entrega.
- [ ] Respaldo: video corto de la demo por si falla la red del evento.
