# Compañero — inducción y capacitación de personal con IA

Hack Knights IA Challenge 2026 · reto **Del Río**: avatar de IA para la inducción de cajeros.

**Problema.** Capacitar a cada persona nueva consume tiempo operativo y, con la rotación, se repiten las
mismas explicaciones una y otra vez.

**Solución.** Una plataforma multiempresa y multisucursal: cada empresa sube sus manuales y su personal tiene
un asistente con avatar que da la inducción, responde **citando el documento y la sección** del material
autorizado, pone test y situaciones prácticas, y **canaliza al supervisor o a RH** lo que el material no
cubre, sin inventar procedimientos. Del Río es el primer cliente; Superette, la segunda empresa de la demo.

> El material de las demos (`conocimiento/`) es **de ejemplo**, escrito por el equipo; no es de Del Río ni
> de Superette. El material real se sube desde la app.

## Cómo correrlo (local)

```bash
npm install
supabase start -x edge-runtime,logflare,vector,imgproxy,supavisor   # requiere Docker
cp .env.example .env.local     # URL y llaves que imprime `supabase start`; llaves de IA (Anthropic, Groq)
SEMBRAR_ADMIN_EMAIL=tu@correo npm run sembrar
npm run dev                    # http://localhost:3000 → Entrar con tu correo (el código llega a http://127.0.0.1:54324)
```

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas de lógica (secciones, búsqueda, citas, cadena de proveedores) |
| `npm run test:sql` | Aislamiento entre empresas, roles y búsqueda en Postgres |
| `npm run humo` | Punta a punta: entrada (selector, número de reloj, admin con contraseña), pantallas, QR, permisos |
| `npm run prueba` | Prueba documentada (≥10 consultas) → `docs/prueba-documentada.md` |

## Arquitectura

1. **Datos y permisos**: Supabase (Postgres). Cada tabla tiene RLS: una empresa nunca ve lo de otra, y cada
   rol (admin, RH, supervisor, colaborador) ve solo lo suyo.
2. **Ingesta**: RH sube PDF/Word/texto → secciones citables (`D1-3`) → la IA agrega contexto para la búsqueda
   → RH revisa y publica.
3. **RAG**: búsqueda híbrida en Postgres (texto en español sin acentos + aproximada + vectores) → el modelo
   responde solo con esas secciones y cita; la app valida cada cita.
4. **Modelos**: Claude (`claude-opus-5-5`) con Groq (`gpt-oss-120b`) de respaldo automático.
5. **Canalización** en vivo a la bandeja del supervisor (Realtime).

Decisiones y su porqué: [`docs/adr/`](docs/adr/). Despliegue (Supabase + Vercel): [`docs/despliegue.md`](docs/despliegue.md).

## Validación

`npm run validar` corre todas las pruebas y genera [`docs/validacion.md`](docs/validacion.md): lógica,
aislamiento entre empresas en Postgres, búsqueda del RAG, recorrido de punta a punta y la
[prueba documentada](docs/prueba-documentada.md) con IA (10 de 10 con Groq sobre el material de ejemplo).

## Limitaciones conocidas

- Responde solo con el material publicado por la empresa; no se conecta a sistemas de caja.
- No ejecuta ni autoriza operaciones; explica el procedimiento y quién lo autoriza.
- Requiere internet (los modelos corren en la nube).
- PDF escaneados (sin texto) todavía no se leen: se pide la versión con texto.
