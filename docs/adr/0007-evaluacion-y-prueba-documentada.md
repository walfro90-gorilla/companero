# ADR 0007 — Test de comprensión y prueba documentada

- Estado: **aceptado (2026-10-08)**.
- Entregables que atiende: "Test de comprensión de al menos cinco preguntas, con explicación de las
  respuestas" y "Prueba documentada con al menos diez consultas: ocho cubiertas por los materiales y dos sin
  respuesta disponible. Mostrar respuestas correctas, errores y canalizaciones".

## Test de comprensión
- **Preguntas fijas, revisadas por el equipo** a partir del módulo (`conocimiento/test.json`), no generadas
  al vuelo: así ninguna pregunta ni respuesta "correcta" puede salir inventada. La ficha permite que "la IA
  genere ejercicios a partir del módulo" (ADR 0008): la IA escribe el **borrador** con su cita, el equipo lo
  revisa y lo fija. Cada pregunta trae
  opciones, la correcta, la **explicación** y la **sección que la sustenta** (`D1-3`).
- **Situaciones prácticas** (función 04): casos abiertos ("Un cliente pide cancelar un artículo que ya
  cobraste…"). La IA da retroalimentación comparando la respuesta del cajero con la sección citada; no califica
  a la persona (ADR 0006).
- Mínimo 5 preguntas; meta 6–8 para cubrir todas las secciones del módulo.

## Prueba documentada
- `pruebas/consultas.json`: ≥10 consultas con lo esperado: 8 **cubiertas** (con la sección que debe citarse) y
  2 **sin respuesta** (deben canalizarse). Incluye las 5 preguntas de ejemplo de Del Río.
- `npm run prueba` corre todas contra la misma cadena que usa la app y escribe `docs/prueba-documentada.md`
  con una tabla: consulta · esperado · respuesta · citas · proveedor · resultado (✅ correcta, ❌ error,
  ↪️ canalizada correctamente).
- **Se reportan los errores tal cual** (es lo que pide Del Río); si algo falla, se documenta la causa y la
  corrección, no se esconde la fila.
- Se corre al menos: al tener el material real, después de cada cambio de instrucciones y antes de entregar.

## Con el manual del reto (9-oct, ADR 0013)
- `pruebas/consultas.json` se reescribe contra el manual de Tienda Escuela:
  - las 5 preguntas de la ficha;
  - 3 con casos especiales o con cálculo (promoción con horario, cupón con mínimo, pago mixto incierto);
  - 2 sin respuesta, tomadas de su tabla "Lo que este manual no define": una a RH y otra al supervisor.
- Las secciones esperadas se escriben como las cita el manual ("sección 7, Procedimiento de cálculo").
- El módulo, el test y las prácticas se generan desde el manual y el equipo los revisa antes de publicarlos.

## Criterios de acierto
- Cubierta: cita al menos una sección esperada, no cita secciones inexistentes y no canaliza.
- Sin respuesta: canaliza (`[CANALIZAR:…]`) y no presenta un procedimiento.
