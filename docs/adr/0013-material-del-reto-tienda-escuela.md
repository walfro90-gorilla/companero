# ADR 0013 — Material del reto: "Manual de procedimientos para cajeros — Tienda Escuela"

- Estado: **aceptado (2026-10-09)**. Decisiones de Wal (9-oct): empresa principal de la demo **"Tienda Escuela"**; la
  segunda se queda como **"Superette (demo)" con una franja muy visible** de contenido ficticio.
- Fuente: `~/Downloads/Manual_cajeros_Tienda_Escuela_Hack_Knights (1).pdf` (34 páginas, 15 secciones), recibido el
  viernes 9-oct a las 11:30. Es **el material oficial del reto**, el que entregó la organización a los equipos.

## Qué es
- Un manual **ficticio y con fines educativos** de **Tienda Escuela**, una tienda de conveniencia simulada.
  Advierte de forma explícita que **no** describe políticas, precios ni sistemas de Del Río ni de Superette, y que
  no sirve para operar una tienda real.
- La organización lo entrega como "la documentación de la empresa simulada" y dice textualmente: "Cada equipo
  decide cómo utilizarla en el desarrollo de su solución de inteligencia artificial".
- Sigue el orden de un turno: puesto (1), apertura (2), venta y cobro (3–5), precios y promociones (6–7),
  cancelaciones y devoluciones (8–9), efectivo y servicios (10–11), corte (12), incidencias (13), registros (14)
  y origen (15). Cada sección trae qué cubre, reglas, procedimiento, casos especiales y ejemplos.
- Trae tablas pensadas justo para nuestro asistente:
  - **Referencia rápida** de parámetros.
  - **Estados y qué hacer**.
  - **Cuándo llamar al supervisor**: 17 situaciones con su sección.
  - **Lo que este manual no define**, con a quién se canaliza cada tema.

## Qué cambia en nuestras decisiones
| Tema | Antes | Ahora | ADR afectado |
|---|---|---|---|
| Material autorizado | Pendiente; usábamos contenido de ejemplo escrito por nosotros | **Este manual.** El contenido de ejemplo de Del Río se retira | 0001, 0004 |
| Permiso para mandarlo a Anthropic/Groq | Pendiente de confirmar | **Resuelto para este material**: es ficticio y la organización deja a cada equipo decidir cómo usarlo con IA. Con el material real de una empresa (piloto) se vuelve a pedir permiso | 0006 |
| **Cómo se cita** | `[D1-3]` (documento y número de sección) | El manual pide citar con **"sección N, Subtítulo"**, por ejemplo «sección 5, Si la segunda parte queda incierta». La marca interna sigue siendo `[D1-n]` (se valida igual), pero **la UI y el texto muestran "sección 5 · Si la segunda parte queda incierta"**, con la página | 0004, 0010 |
| Cómo se parte un PDF | Una sección por página | **Por títulos y subtítulos**, detectados por el tamaño de letra: en este PDF las secciones van en 19 pt y los subtítulos en 12.5 pt. Cada subtítulo es una unidad citable, con la sección y la página de origen. Sigue sirviendo para cualquier PDF con títulos con estilo; si no hay jerarquía, se parte por páginas | 0010 |
| A quién se canaliza | Supervisor o RH | Se mantienen esos dos destinos. **Soporte** siempre es "mediante el supervisor" (sección 1), así que va al supervisor. La "inducción específica de la sucursal" (equipo de emergencia, sección 13) también va al supervisor. La tabla "Lo que este manual no define" se vuelve parte de las pruebas | 0006 |
| Fecha y hora | No se usaban | **Necesarias**: COMBO42 y DESC10 solo valen del 8 al 10 de octubre de 2026, COMBO42 de 08:00 a 10:30, y "la hora aplicable es la de inicio del cobro". El asistente recibe la fecha y hora de Cd. Juárez en la parte que no va a caché del prompt, y pregunta la hora de inicio del cobro cuando importa | 0010 |
| Cálculos | No había | El manual define cómo se calculan promociones, cupón (con redondeo), cambio, pagos mixtos, reembolsos (primero a tarjeta) y el efectivo esperado del corte, con ejemplos numéricos. El asistente debe calcular **siguiendo el procedimiento citado** y mostrar el desglose; la prueba documentada incluye al menos un cálculo | 0007 |
| Prueba documentada | 10 consultas contra el contenido de ejemplo | Se reescribe contra el manual: las 5 preguntas de la ficha, 3 más con casos especiales o cálculo, y **2 sin respuesta**, tomadas de "Lo que este manual no define" (una a RH y otra al supervisor) | 0007 |
| Módulo, test y prácticas | Módulo de ejemplo escrito a mano | Se **genera con IA desde el manual** y el equipo lo revisa; el test fijo cita "sección N, Subtítulo". El manual trae casos ideales para practicar: pago mixto incierto, terminal sin respuesta, fila larga, devolución fuera de plazo y cupón que deja de aplicar | 0007, 0011 |
| Empresa de la demo **[decidido: Tienda Escuela]** | "Del Río (demo)" | **Se renombra a "Tienda Escuela"** (slug `tienda-escuela`). El manual insiste en que no son políticas de Del Río; presentarlo bajo la marca de Del Río frente a su gente las contradice. El reto sigue siendo "Tu compañero Del Río"; la tienda es el escenario | 0009 |
| Segunda empresa **[decidido: Superette con franja]** | "Superette (demo)" con un manual que escribimos nosotros | Se queda, con una **franja en todas sus pantallas**: contenido ficticio que no describe políticas reales. La misma franja aparece en Tienda Escuela, como pide el manual | 0009 |
| Identidad del asistente | Provisional, sin marca | Igual: sin logotipo ni colores de Del Río/Superette. Para Tienda Escuela se usa la identidad provisional | 0005 |

## Reglas del manual que el asistente debe respetar (además del ADR 0006)
- **Conducta del cajero:**
  - No repetir un cargo incierto ni tratar un "sin respuesta" como rechazo.
  - No borrar ventas para ocultar un reembolso.
  - No ajustar el corte para que cuadre.
  - No completar faltantes con dinero personal.
  - No usar las credenciales del supervisor.
- **Si el supervisor no está disponible:** se suspende la operación y se espera. Nunca se resuelve por cuenta propia (sección 1).
- **Lo que no se promete:**
  - Fechas de abono bancario.
  - Derechos legales del cliente.
  - Plazos de notificación al comercio externo ni reversas del proveedor.
- **Datos que no se guardan:** NIP, contraseñas ni números completos de tarjeta. Coincide con el ADR 0006.

## Implementación (orden)
1. Ingesta de PDF por títulos y subtítulos (tamaño de letra), con prueba.
2. Mostrar la cita como "sección N · Subtítulo", con la página y el original.
3. Fecha y hora en el prompt.
4. Empresa demo con el manual: sembrar sube el PDF por el mismo camino que la app.
5. Nueva `pruebas/consultas.json`, luego `npm run prueba` y `npm run validar`.
6. Generar el módulo de inducción desde el manual y revisarlo.
