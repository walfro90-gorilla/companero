# ADR 0004 — Base de conocimiento y citas verificables

- Estado: **aceptado (2026-10-08)**; **puntos 1 y 3 reemplazados por el ADR 0010 (2026-10-09)**: el conocimiento
  ya no vive en `conocimiento/*.md` sino en Supabase (lo sube cada empresa desde la app) y el modelo recibe lo que
  encuentra el buscador (RAG), no el corpus completo. Citas, validación y canalización siguen igual.
- Entregable que atiende: "Base de conocimiento con materiales autorizados y respuestas con referencias
  verificables" y la función 03 del avatar (citar documento y sección).

## Decisión
1. **El conocimiento vive en el repo**, en `conocimiento/*.md`, un archivo por documento de Del Río. Cada
   archivo trae un encabezado con `id` (D1, D2…), `titulo`, `fuente` (nombre del documento original) y
   `estado` (`ejemplo` | `autorizado`). Git deja constancia de **qué contenido exacto** estaba autorizado en
   cada versión: es el argumento de "materiales autorizados".
2. **Secciones con id estable**: cada `## ` es una sección con id `D1-3` (documento + número). Es la unidad que
   se cita y la que se muestra al usuario como referencia ("Manual del cajero › 3. Cancelaciones").
3. **Corpus completo en contexto (con caché)**, no búsqueda por fragmentos. Un módulo de inducción para un
   solo puesto cabe holgado en el contexto de los dos modelos (Claude: 1M; `gpt-oss-120b`: 131K). Con todo
   el módulo a la vista, el modelo no puede "no encontrar" algo que sí está —la falla típica de un RAG con
   búsqueda— y distingue mejor lo que **no** está cubierto, que es justo lo que evalúan las 2 consultas sin
   respuesta.
4. **Citas propias**: el modelo cita con marcas `[D1-3]`. El servidor y la UI **validan** cada marca contra el
   índice de secciones: una cita a una sección que no existe se descarta y se registra como error (nunca se
   muestra como fuente). La UI convierte las válidas en referencias que abren el texto exacto de la sección.
5. **Canalización explícita**: cuando no hay sustento en el corpus, o el tema es de supervisor/RH, el modelo
   termina con `[CANALIZAR:supervisor]` o `[CANALIZAR:rh]`. La UI lo muestra como tarjeta de "pregúntale a tu
   supervisor / RH" y (si hay Supabase) lo registra para el panel del supervisor.
6. **Paso de "búsqueda en documentos" visible**: en la respuesta se ven las secciones consultadas, que es el
   paso 2 de la arquitectura sugerida por Del Río.

## Cuándo cambia
Si el corpus pasa de ~60K tokens (varios módulos o puestos), se agrega búsqueda de texto completo en español
(Postgres FTS en Supabase, como la biblioteca de brotes) para mandar solo las secciones relevantes. El formato
de ids y de citas no cambia.

## Contenido de ejemplo
Mientras Del Río entrega su módulo, `conocimiento/` tiene documentos **de ejemplo** escritos por el equipo,
marcados `estado: ejemplo`. La UI muestra una franja "Contenido de ejemplo, no oficial" mientras exista al
menos uno. **Antes de la entrega se reemplazan por el material autorizado**; el contenido de ejemplo nunca se
presenta como política de Del Río.

## Ingesta del material real
La ficha técnica dice que Del Río aportaría "manuales, presentaciones, guías, videos o documentos" (ADR 0008).
- **PDF/Word**: se extrae el texto, se respeta la estructura del original (títulos → secciones) y se anota en
  `fuente` el nombre del documento y la página. Sin OCR: si un PDF es imagen, se pide la versión con texto.
- **Presentaciones**: una lámina o un grupo de láminas con el mismo título forman una sección. En `fuente` va
  el número de lámina.
- **Videos**: se transcriben con Whisper en Groq (`whisper-large-v3-turbo`; `docs/investigacion.md`), **solo
  con permiso** de mandar ese material a Groq (ADR 0006). Cada tema del video es una sección, y en `fuente`
  va el minuto, para que la cita sea verificable.
- En todos los casos hay revisión humana antes de marcarlo `autorizado`. Si es posible, la hace el enlace de
  RH u Operación de Del Río.
