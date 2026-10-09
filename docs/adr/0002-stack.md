# ADR 0002 — Stack: el que ya dominamos

- Estado: **aceptado (2026-10-08)**.
- Regla del hackatón: decisiones rápidas y reversibles; nada que haya que aprender el fin de semana.

## Decisión
| Capa | Elección | Por qué |
|---|---|---|
| App | **Next.js 16 (App Router) + React 19 + TypeScript** | Mismo stack que brotes, cafe57, ketzal-OS. |
| Estilos | **Tailwind CSS 4** + `lucide-react` | Igual que los demás proyectos. shadcn/ui solo si hace falta un componente. |
| IA | **Vercel AI SDK 7** con `@ai-sdk/anthropic` y `@ai-sdk/groq` | Cadena de respaldo ya probada en brotes/ebooms (ADR 0003). |
| Datos | **Supabase** (Postgres) | Solo para lo que se genera en uso: canalizaciones, resultados del test y la retroalimentación. El conocimiento vive en el repo (ADR 0004). |
| Deploy | **Vercel** | Previews por push; producción el viernes para no descubrir nada el sábado. |
| Paquetes | **npm** | Igual que brotes. |
| Pruebas | `node --test` sobre `lib/**/*.test.ts` | Node 24 ejecuta TypeScript sin compilar; igual que brotes. |

## Consecuencias
- Next 16 **no es el Next que conoce el modelo**: antes de escribir código de Next se lee
  `node_modules/next/dist/docs/` (lo recuerda `AGENTS.md`). Ejemplos ya confirmados: el middleware es
  `proxy.ts` con `export function proxy()`, y `cacheComponents` viene activado por omisión.
- AI SDK 7 cambió APIs respecto a v5/v6 (`instructions`, `result.stream`, `toUIMessageStream`): se verifica
  contra `node_modules/ai/docs/` y `node_modules/@ai-sdk/*/docs/`, no de memoria.
- **Sin autenticación**: no hay datos personales que proteger (ADR 0006). Si el piloto lo pide, se agrega
  después.
- La app tiene que poder hacer la demo **aunque Supabase no responda**: lo que se guarda en Supabase es
  accesorio; el avatar, el módulo, el test y el chat funcionan sin base de datos.
