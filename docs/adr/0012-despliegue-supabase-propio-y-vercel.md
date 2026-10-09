# ADR 0012 — Despliegue: proyecto de Supabase propio + Vercel

- Estado: **aceptado (2026-10-09)**. Pasos concretos en [`docs/despliegue.md`](../despliegue.md).

## Decisión
1. **Compañero vive en un proyecto de Supabase propio, nuevo y vacío**, en `us-east-1` (la misma zona que la
   región por omisión de las funciones de Vercel, `iad1`). Nunca compartido con otra aplicación.
2. **Front y API en Vercel**, conectado al repo `walfro90-gorilla/companero` (rama `main`).
3. Las migraciones se aplican en orden (`supabase/migrations/`), por el MCP de Supabase (`apply_migration`)
   o por la CLI (`supabase link` + `supabase db push`). Después de cada cambio de esquema se revisan los
   avisos de seguridad (`get_advisors`).

## Por qué un proyecto propio (lo que pasó el 9-oct)
Wal conectó el MCP de Supabase a `cncvxfjsyrntilcbbcfi` ("asistenteIA_RH", creado en ago-2025 con
Dreamflow). Antes de aplicar nada se inspeccionó: **es la base de una app de repartos a domicilio con datos
reales** (restaurantes, pedidos, pagos, repartidores con 4,494 ubicaciones, 3,305 mensajes de WhatsApp,
20 usuarios, 48 migraciones propias). Muy probablemente es **Donna Repartos** (no se encontró el nombre en
la base; lo confirma Wal en el panel). **No se aplicó nada.** Compartir esa base habría:
- mezclado el login: sus triggers de registro de usuarios se dispararían con cada cajero o juez de Compañero;
- compartido Storage y políticas;
- puesto en riesgo sus datos con cualquier limpieza o `reset` de la demo.

Además, Supabase marcó en ese proyecto **9 tablas sin RLS** (`users`, `platform_settings`, bitácoras de
depuración…): cualquiera con su llave pública puede leerlas o modificarlas. Se le reportó a Wal con el SQL
de remedio; **no se ejecutó** (prender RLS sin políticas tumbaría esa app). Es decisión de Wal.

## Llaves
- En Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pública por diseño; la
  protección es la RLS), `ANTHROPIC_API_KEY` y `GROQ_API_KEY` (secretas; las captura Wal).
- `SUPABASE_SECRET_KEY` **nunca** va a Vercel: solo la usan los scripts locales (sembrar) y la app la
  rechaza si se configura por error (`lib/config.ts`).

## Descartado
- Reutilizar un proyecto existente (ver arriba).
- Separar por esquema dentro de la base de otra app: el login (`auth.users`) y Storage siguen compartidos.
