# ADR 0010 — RAG en Supabase: búsqueda híbrida y Contextual Retrieval

- Estado: **aceptado (2026-10-09)**. Reemplaza la decisión 3 del ADR 0004 ("corpus completo en contexto"):
  con varias empresas y material que sube cada una, el modelo recibe solo lo que encuentra el buscador. El
  formato de citas `[D1-3]`, su validación y la canalización del ADR 0004 se mantienen.
- La ficha de Del Río sugiere RAG (consulta → búsqueda en documentos → respuesta con referencia) y Wal lo
  confirmó.

## Ingesta (desde la app, no desde código)
1. RH sube PDF, Word (.docx), Markdown o texto, o pega texto. El original queda en Storage (bucket privado
   `documentos`, ruta `{empresa}/{documento}/{archivo}`).
2. Se parte en **secciones citables** respetando el original: encabezados (Markdown/Word) o **una por página**
   en PDF (la cita lleva la página). Las largas se parten por párrafos (`lib/ingesta/seccionar.ts`).
3. **Contextual Retrieval** (técnica de Anthropic): la IA escribe por sección de qué trata y 3–5 preguntas
   como las haría un empleado nuevo; eso entra al índice con peso B. Acerca "me equivoqué al cobrar" a
   "Cancelaciones". Anthropic reporta hasta 49 % menos fallos de recuperación con contexto + BM25.
4. Queda en **borrador**; RH revisa las secciones y **publica**. El asistente solo usa lo publicado.

## Búsqueda (`public.buscar_secciones`, Postgres)
Tres vías fusionadas con Reciprocal Rank Fusion (k = 60):
- **texto**: configuración `public.es` (español + `unaccent`), cualquier palabra cuenta (OR), `ts_rank_cd`
  con pesos título A / contexto B / texto C.
- **aproximada**: trigramas sobre título + contexto (aguanta faltas de ortografía).
- **significado**: pgvector (coseno) si hay embeddings. La columna existe (`vector(1024)`); **falta elegir
  proveedor** (Vercel AI Gateway o Voyage). Sin él, funcionan las otras dos vías.

`security invoker`: la RLS decide qué ve quien pregunta. Con el material de ejemplo, la búsqueda trae la
sección esperada en 8 de 8 consultas cubiertas, sin contexto de IA.

## Respuesta
`lib/ia/asistente.ts`: buscar (8 secciones) → instrucciones genéricas para cualquier empresa (reglas con
caché de Anthropic + secciones encontradas) → cadena Anthropic → Groq (ADR 0003). Las preguntas de
seguimiento ("¿y si no está?") se buscan junto con la anterior. Solo son citas válidas las secciones que
trajo el buscador. La UI muestra el paso de búsqueda ("Consulté 3 secciones del material") y cada cita abre
el texto exacto y el documento original en su página.

## Pendiente
- Proveedor de embeddings (y permiso de Del Río para mandar su material a ese proveedor).
- Si un PDF es escaneado (sin texto), hoy se pide la versión con texto; OCR con la visión de Claude es mejora.
