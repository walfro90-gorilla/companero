# ADR 0008 — Criterios de evaluación de Del Río y orden de trabajo

- Estado: **aceptado (2026-10-08)**.
- Fuente: *Ficha técnica del reto — "Tu compañero Del Río: avatar de IA para la inducción de cajeros"*,
  `~/Downloads/Fichas Técnicas Hack Knights 2026.pdf` (2 páginas, llegó el 8-oct por la noche). Confirma lo de
  las láminas (ADR 0001) y agrega los **criterios de evaluación con peso**. La ficha dice "Estatus: propuesta
  para validación por Del Río" y llama a los pesos "criterios de evaluación **propuestos**": si en el evento
  publican otra rúbrica, manda la publicada y este ADR se actualiza.

## Criterios (sección 9 de la ficha) contra lo que ya hay
| Criterio | Peso | Qué evalúan | Ya está | Falta |
|---|---|---|---|---|
| **Exactitud y respaldo** | **30 %** | Respuestas fieles a los materiales y fuentes verificables | Módulo completo en contexto, citas `[D1-3]` validadas contra el índice, canalización `[CANALIZAR:…]`, `npm run prueba` | Correrla con llaves y con el material real; reportar **% de citas válidas** y **% de canalizaciones correctas**; resaltar el pasaje exacto citado |
| **Utilidad para la inducción** | **25 %** | Guía clara, dudas concretas y ejercicios pertinentes | Bienvenida, chat, "Explícamelo de otra forma", preguntas sugeridas | **Módulo guiado por lecciones con "siguiente paso"**, test ≥5 con explicación y cita, situaciones prácticas. **Es el hueco más grande.** |
| **Uso efectivo de IA** | **20 %** | Consulta de documentos y respuestas contextualizadas | Responde con el módulo, reformula y cita | Que se **vea** la consulta ("Consultando: Manual de caja › 3"); situaciones prácticas generadas y retroalimentadas por la IA con cita validada |
| **Experiencia de uso** | **15 %** | Interacción sencilla, legible y comprensible | Avatar con estados, chips de cita, tarjeta de canalización | Revisar en celular y en laptop: letra grande, pocas pantallas, lenguaje de cajero; voz opcional al final |
| **Viabilidad de prueba piloto** | **10 %** | Requisitos claros y facilidad para actualizar contenidos | Contenido en `conocimiento/*.md` con `estado: ejemplo/autorizado`; modelos por variable de entorno | Guía de una página para RH ("cómo actualizar el contenido"), requisitos de uso y costo por consulta medido, propuesta de piloto |

## Decisión: orden de trabajo (peso × tamaño del hueco)
1. **Utilidad para la inducción (25 %)**: módulo guiado + test + situaciones prácticas. Es lo siguiente que se
   construye.
2. **Exactitud (30 %)**: ya está casi todo en código; falta medirla. En cuanto Wal capture las llaves:
   `npm run probar:cadena` y `npm run prueba`. Cuando llegue el material real, se reingiere y se vuelve a correr.
3. **Uso efectivo de IA (20 %)**: consulta visible y práctica generada por la IA.
4. **Viabilidad (10 %)**: casi pura documentación, barata. No se deja para el sábado.
5. **Experiencia (15 %)**: pulido en celular. Voz y visemas solo si sobra tiempo (la ficha los marca como
   mejora opcional).

Las ideas WOW de `docs/investigacion.md` entran solo si suben un criterio. Las que más suben son el ticket en
vivo a supervisor/RH (exactitud + utilidad), el quiz con insignia (utilidad) y el tablero de validación con
% de citas y canalizaciones correctas (exactitud + viabilidad).

## Cómo contestamos "¿usan RAG?"
La ficha **sugiere** RAG: consulta → búsqueda en documentos → respuesta con referencia a la fuente. Lo que
hacemos es RAG en su variante de contexto largo (ADR 0004): la recuperación trae el **módulo autorizado
completo** porque cabe en contexto, y así el modelo no puede perder una sección que sí existe. La respuesta
cita documento y sección, y el servidor valida cada cita. Con más módulos o puestos se agrega búsqueda de texto
completo sin cambiar el formato de las citas.

Frase para el pitch: *"Recupera el módulo autorizado, responde citando la sección exacta y, si no hay sustento,
te manda con tu supervisor o con RH."*

## Detalles de la ficha que ajustan otros ADRs
- **Sección 5, "la IA también podrá adaptar explicaciones y generar ejercicios a partir del módulo"**
  (ADR 0007): la IA genera el **borrador** del test y las situaciones prácticas. El test que se aplica queda
  fijo y revisado por el equipo, por exactitud. Las situaciones prácticas sí se generan en vivo, con cita
  validada.
- **Sección 6, materiales**: Del Río aportaría "manuales, presentaciones, guías, videos o documentos
  existentes", la identidad gráfica autorizada y **un enlace de RH u Operación** que valida el contenido y
  resuelve dudas. Eso amplía la ingesta a presentaciones y videos (ADR 0004). También queda pendiente saber
  **quién es el enlace** y pedirle que valide las consultas de la prueba documentada.
- **Sección 6, "Los equipos elaborarán sus preguntas de prueba a partir de estos materiales. No se requieren
  encuestas, entrevistas ni recopilación de nueva información de colaboradores"**: la prueba documentada se arma
  solo con el material. No se encuesta a cajeros.
- **Sección 3**: voz, animación, cápsulas narradas y seguimiento de varios módulos son **mejoras opcionales**.
  No van antes que lo de la lista de arriba.
- **Nombre oficial del reto: "Tu compañero Del Río"**. Sirve como título en el pitch. El nombre y la imagen
  del avatar siguen pendientes de autorización (ADR 0005).

## Propuesta de prueba piloto (borrador para la presentación; también es entregable)
- **Quién**: un grupo pequeño de cajeros de nuevo ingreso en 1–2 tiendas, durante 2 semanas, con el enlace de
  RH u Operación como validador.
- **Qué se mide**, siempre agregado y anónimo (ADR 0006):
  - % de respuestas con cita correcta, revisadas por el enlace.
  - % de canalizaciones correctas.
  - Dudas no cubiertas por el material, que pasan a ser pendientes de RH para actualizarlo.
  - Comprensión en el test.
  - Tiempo de supervisor que se dejó de usar en explicar lo mismo (autorreportado).
- **Requisitos de uso**: navegador moderno e internet. El costo por consulta se mide con la prueba documentada
  y se reporta.
- **Actualizar contenido**: RH entrega el documento → se convierte a `conocimiento/*.md` respetando sus
  secciones → el enlace lo revisa → `estado: autorizado` → se publica. Ningún cambio de código.
