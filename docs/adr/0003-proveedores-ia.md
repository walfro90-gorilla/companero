# ADR 0003 — Proveedores de IA: Anthropic primero, Groq de respaldo

- Estado: **aceptado (2026-10-08)**. Hay llaves de **Anthropic** y **Groq**; las captura Wal en `.env.local` y
  en Vercel (secretas). Nunca se imprimen ni se pasan por argumentos de línea de comandos.
- Base reutilizada: la cadena de brotes (`../brotes/lib/ia/cadena.ts`, `proveedores.ts`, `fallos.ts`),
  portada a `lib/ia/`.

## Modelos (verificado 2026-10-08 contra el skill de la API de Claude y `node_modules/@ai-sdk/*/docs`)
| Eslabón | Modelo | Ajustes | Para qué |
|---|---|---|---|
| 1 · Anthropic | `claude-opus-5-5` | `effort: 'low'` (el thinking siempre es adaptativo y no se puede apagar; el esfuerzo es el control de latencia), `fallbacks: 'default'` (si el clasificador de seguridad rechaza, la API reintenta sola con el modelo de respaldo que recomienda Anthropic) y caché del corpus | Chat del avatar, explicaciones, retroalimentación del test |
| 2 · Groq | `openai/gpt-oss-120b` | `reasoningEffort: 'low'`, tope de 4000 tokens (lección de clawbot-orion: con poco tope, el razonamiento se come la respuesta) | Respaldo si Anthropic falla o se tarda |

- `IA_MODELO_ANTHROPIC` e `IA_MODELO_GROQ` cambian el modelo sin tocar código. Si en el ensayo la latencia del
  avatar no convence, se puede probar `claude-sonnet-5-5` o `claude-haiku-5-5` por variable. **La decisión
  es de Wal**; el código no baja de modelo por su cuenta.
- `IA_ORDEN=groq,anthropic` invierte la cadena (útil si Anthropic se satura en el escenario).

## Lecciones que ya pagamos (de brotes/ebooms; siguen vigentes)
1. `streamText` **no lanza**: se espera el primer fragmento; si falla o viene vacío, se pasa al siguiente
   proveedor antes de mandarle nada al navegador.
2. Ante cualquier error se intenta el siguiente; `fallos.ts` solo decide cómo se registra (una llave muerta
   tiene que notarse, no quedar tapada por el respaldo).
3. El respaldo degrada la calidad: la respuesta indica qué proveedor contestó (cabecera `X-Proveedor`).
4. Un respaldo que nunca se probó no existe: `npm run probar:cadena` hace ping a cada eslabón.
5. Los ids de modelo caducan: se verifican al implementar y antes de la demo.

## Caché
El corpus de conocimiento va en un mensaje de sistema propio, **estable byte por byte**, con
`cacheControl: { type: 'ephemeral' }` (Anthropic). Lo variable (pregunta, historial) va después. Así cada
pregunta paga el corpus a precio de lectura de caché. Groq ignora esa opción.

## Costo esperado
Con el corpus completo en caché, cada pregunta cuesta centavos de dólar. Para el fin de semana el costo es
irrelevante; lo que importa es la **latencia** (el avatar tiene que contestar rápido) y la **exactitud**.

## Descartado
- **Fine-tuning**: ni Anthropic ni Groq lo ofrecen sobre sus modelos alojados, es caro y no cita fuentes
  (misma conclusión que cafe57 y brotes ADR 0008).
- **Citations nativas de Anthropic (por ahora)**: la documentación del provider de AI SDK no las menciona para
  documentos, pero la investigación del 8-oct encontró en el código de `@ai-sdk/anthropic` 4.0.78 que sí funcionan
  (partes `file` text/plain con `providerOptions.anthropic.citations.enabled`, emiten `source`). Groq no las
  tiene, así que el esquema propio `[D1-3]` (ADR 0004) se queda para los dos; las nativas son una mejora posible
  solo para el eslabón de Anthropic (`docs/investigacion.md`).
- **Gemini gratis / DeepSeek**: entrenan o retienen datos; los materiales de Del Río no van ahí.
