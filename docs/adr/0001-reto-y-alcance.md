# ADR 0001 — Reto Del Río: avatar de inducción para cajeros

- Estado: **aceptado (2026-10-08)**. Reto elegido el día 1 del Hack Knights IA Challenge 2026.
- Fuente: presentación del reto (fotos en `~/Documents/hackKingth_hackaton/photos/`, 16:11–16:12) y la
  explicación en sala: el área usuaria es **RH**; hoy la capacitación de la operación básica de tienda
  consume tiempo operativo y hay mucha rotación.
- **Ficha técnica oficial** (llegó el 8-oct por la noche): `~/Downloads/Fichas Técnicas Hack Knights 2026.pdf`.
  Confirma todo lo de abajo, le pone nombre al reto, **"Tu compañero Del Río"**, y trae los **criterios de
  evaluación con peso**, que están en el [ADR 0008](0008-criterios-de-evaluacion.md). Datos de la ficha:
  empresa Del Río y Superette; área RH / Capacitación / Operación de tiendas; usuarios iniciales, cajeros de
  nuevo ingreso; estatus "propuesta para validación por Del Río".

## Pregunta del reto
> ¿Cómo desarrollar un avatar con inteligencia artificial que guíe la inducción de cajeros de nuevo ingreso
> y responda preguntas concretas sobre su trabajo, utilizando los materiales internos que Del Río ya tiene?

**Objetivo:** prototipo funcional que presente un módulo de inducción, responda dudas específicas con base en
documentos autorizados y ayude al colaborador a practicar lo aprendido.

## Alcance mínimo (lo que pide Del Río)
| Bloque | Qué es |
|---|---|
| Un puesto, un módulo | **Cajero.** Un módulo de inducción seleccionado y validado por Del Río. |
| Avatar sencillo | Identidad visual **autorizada por la empresa** y conversación funcional por texto. |
| Contenido y evaluación | Un contenido breve de inducción y una evaluación de comprensión con retroalimentación. |
| Demostración | Preguntas concretas, incluyendo una que **deba canalizarse al supervisor**. |

Mejoras opcionales: voz, animación, cápsulas audiovisuales narradas (pueden generarse con los materiales
existentes; Del Río no grabará contenido nuevo) y seguimiento de varios módulos.

## Funciones del avatar
1. **Dar la bienvenida**, explicar qué se aprenderá e indicar el siguiente paso de la capacitación.
2. **Explicar procedimientos** de forma clara, paso a paso, y reformularlos cuando el usuario tenga dudas.
3. **Responder consultas concretas** indicando el documento y la sección que sustentan la respuesta.
4. **Plantear situaciones prácticas** y aplicar un test breve basado en el contenido autorizado.
5. **Reconocer información ausente o ambigua** y orientar hacia RH o el supervisor.

Arquitectura sugerida por Del Río: consulta → búsqueda en documentos → respuesta con referencia a la fuente.
La elección de herramientas es libre. **No** se requiere visión por computadora **ni** conexión a los sistemas
de caja.

## Entregables y validación (criterio de "terminado")
- [ ] **Aplicación funcional** con avatar, conversación por texto y un módulo de inducción completo.
- [ ] **Base de conocimiento** con materiales autorizados y respuestas con referencias verificables.
- [ ] **Test de comprensión** de al menos 5 preguntas, con explicación de las respuestas.
- [ ] **Prueba documentada** con al menos 10 consultas: 8 cubiertas por los materiales y 2 sin respuesta
      disponible. Mostrar respuestas correctas, errores y canalizaciones.
- [ ] **Presentación breve**: funcionamiento, requisitos de uso, limitaciones y propuesta de prueba inicial con
      cajeros.

Preguntas de ejemplo para la demo: "¿Cómo hago una cancelación?", "¿Qué hago si un producto no tiene precio?",
"¿Cómo aplico una promoción?", "¿Qué debo revisar al cerrar caja?", "¿Cuándo debo llamar al supervisor?".
Se seleccionarán solo preguntas cubiertas por el módulo; las demás deben canalizarse **sin inventar
procedimientos**.

## Materiales que aportaría Del Río (sección 6 de la ficha)
Una muestra de manuales, presentaciones, guías, videos o documentos existentes del módulo elegido; la identidad
gráfica autorizada; y **un enlace de RH u Operación** para validar contenido y resolver dudas. Los equipos
arman sus preguntas de prueba a partir de esos materiales. **No** se requieren encuestas, entrevistas ni
recopilar información nueva de colaboradores.

## Condiciones de uso (detalle en ADR 0006)
Solo materiales autorizados; sin datos personales, contraseñas ni credenciales. El avatar no inventa políticas
ni ejecuta operaciones de caja. La evaluación es de aprendizaje, sin decisiones automatizadas de contratación o
desempeño.

## Siguiente paso que propone Del Río
Validar el contenido y probar el prototipo con un pequeño grupo de cajeros, revisando precisión, facilidad de
uso y comprensión. Participación, premios y piloto quedan sujetos a acuerdo con la empresa.

## Fuera de alcance
Otros puestos; integración con caja o sistemas internos; login con datos personales; calificar a personas.

## Material del reto (9-oct): resuelto
La organización entregó el **"Manual de procedimientos para cajeros — Tienda Escuela"** (ficticio, con fines
educativos; 15 secciones). Es el material autorizado del reto. Qué cambia: [ADR 0013](0013-material-del-reto-tienda-escuela.md).

## Pendiente de Del Río
- ~~El **módulo y los materiales autorizados**~~ → resuelto con el manual de Tienda Escuela (ADR 0013). Texto original: (hasta que lleguen se trabaja con contenido de ejemplo, marcado
  como tal en la UI; ver ADR 0004).
- La **identidad visual autorizada** del avatar (ADR 0005).
- Confirmar que los materiales pueden enviarse a proveedores de IA externos (ADR 0006).
- **Quién es el enlace de RH u Operación**, para que valide el contenido y las consultas de la prueba
  documentada.
