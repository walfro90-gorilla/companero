# Validación técnica

Generado automáticamente por `npm run validar` el 9 de octubre de 2026 a las 12:36 p.m. (hora de Cd. Juárez). Cada resultado es de esta corrida; para reproducirlo basta correr el mismo comando.

| Qué se prueba | Resultado | |
|---|---|---|
| Lógica de la aplicación | 57 de 57 | ✅ |
| Aislamiento entre empresas, roles y privacidad | 25 comprobaciones | ✅ |
| Búsqueda del RAG (encuentra la sección correcta) | 18 de 18 (sin reescritura: 15) | ✅ |
| Punta a punta (login, pantallas, QR, permisos) | 25 de 25 | ✅ |
| Prueba documentada con IA (≥10 consultas) | 10 de 10 (groq) | ✅ |

> Material: el manual oficial del reto («Manual de procedimientos para cajeros — Tienda Escuela»), **ficticio** y con fines educativos; no describe políticas reales de Del Río ni de Superette. La empresa «Superette (demo)» usa contenido de ejemplo escrito por el equipo.

## 1. Lógica de la aplicación

Pruebas automáticas de las piezas que deciden qué ve el usuario: cómo se parte un documento en secciones citables, cómo se detectan y validan las citas `[D1-3]` y las canalizaciones, el paso de búsqueda del RAG, el respaldo entre proveedores de IA (si Anthropic falla, responde Groq sin que se note) y las reglas de la gamificación.

**Resultado:** 57 pasan, 0 fallan.

<details><summary>Ver cada caso</summary>

- ✅ separa texto y citas, sin repetir fuentes
- ✅ una cita a una sección inexistente nunca se muestra como fuente
- ✅ detecta la canalización y la quita del texto
- ✅ el texto para la voz va sin marcas ni markdown
- ✅ tolera espacios dentro de los corchetes (lo hace gpt-oss en Groq)
- ✅ acepta los corchetes 【】 de gpt-oss
- ✅ responde el primero si funciona
- ✅ una llave muerta pasa al siguiente y queda registrada como "clave"
- ✅ una respuesta vacía también es fallo (el caso de gpt-oss sin tokens)
- ✅ un 400 tampoco corta la cadena (Google responde 400 a una llave inválida)
- ✅ si todos fallan, lo dice con todos los intentos
- ✅ ordenar respeta IA_ORDEN y deja al final a los no mencionados
- ✅ clasificar
- ✅ generarConRespaldo: vacío o error pasan al siguiente
- ✅ jsonDe saca el JSON aunque venga envuelto
- ✅ solo se revisa si menciona al supervisor y no trae marca
- ✅ lee SI/NO aunque venga con signos o mayúsculas
- ✅ la petición lleva la pregunta y la respuesta
- ✅ la fecha y hora van en Cd. Juárez (UTC−6 en octubre) y fuera del bloque en caché
- ✅ el personaje abre la escena cuando no hay mensajes
- ✅ en la conversación, lo del personaje va como assistant y lo del colaborador como user
- ✅ la retroalimentación lleva el material, el objetivo y la transcripción, y pide no calificar
- ✅ leerContextos solo acepta órdenes que existen y textos no vacíos
- ✅ leerContextos tolera basura
- ✅ peticionContexto incluye cada sección y pide JSON
- ✅ lotes
- ✅ arma "sección N, Subtítulo" en orden visual y quita encabezados y pies repetidos
- ✅ columnas separadas por un hueco ancho se marcan con " · "
- ✅ un PDF sin títulos con estilo devuelve null (se parte por páginas)
- ✅ markdown: corta en ## y omite el # del documento
- ✅ markdown sin encabezados: una sección con el título del documento
- ✅ markdown con un solo nivel #: usa ese nivel
- ✅ trocear parte por párrafos y numera los títulos
- ✅ PDF: una sección por página, con su número; las vacías se saltan
- ✅ limpiarTexto une palabras cortadas por guion y normaliza espacios
- ✅ htmlAMarkdown conserva encabezados, listas y negritas
- ✅ sin actividad: nivel 1, sin insignias
- ✅ puntos: lecciones, test aprobado, prácticas, preguntas con tope y módulo completo
- ✅ un módulo completo típico lleva a "Listo para operar"
- ✅ racha: cuenta hacia atrás desde hoy o ayer
- ✅ lecciones: se quedan las que citan secciones existentes; se descartan las inventadas
- ✅ preguntas: la correcta debe existir y la explicación citar una sección real
- ✅ escenarios: el objetivo debe citar el material
- ✅ basura del modelo no truena
- ✅ la petición de lecciones lleva el material con sus ids
- ✅ descarta preguntas con opciones repetidas y quita la numeración de las lecciones
- ✅ lo que aparece en ambas listas sube; no se repite; respeta el límite
- ✅ con una sola lista conserva el orden
- ✅ materialParaPrompt pone el código, el documento, la página y el texto
- ✅ sin resultados, el modelo lo sabe explícitamente
- ✅ una pregunta completa se busca sola
- ✅ una de seguimiento se busca junto con la anterior
- ✅ con referencia del documento, el prompt y la cita usan «sección N, Subtítulo»
- ✅ leerPalabras deja solo palabras y corta en 20
- ✅ la petición lleva la pregunta y pide solo palabras
- ✅ slugDe quita acentos, espacios y símbolos
- ✅ rutaSegura solo acepta rutas internas

</details>

## 2. Aislamiento entre empresas, roles y privacidad

Los permisos los hace cumplir la base de datos (Row Level Security de Postgres), no la pantalla: aunque alguien manipule la app, la base no le entrega datos de otra empresa ni le deja subirse de rol. La prueba crea empresas y personas ficticias, intenta lo prohibido y comprueba que la base lo impide. Corre en una transacción que se deshace (no deja datos).

**Resultado:** todo correcto.

| Comprobación | |
|---|---|
| Beto ve solo 1 empresa | ✅ |
| y es la suya | ✅ |
| el primer documento es D1 | ✅ |
| el segundo es D2 | ✅ |
| Beto no ve documentos de Uno | ✅ |
| Beto no ve secciones de Uno | ✅ |
| la búsqueda tampoco le devuelve nada de Uno | ✅ |
| Beto no puede hacerse miembro de Uno | ✅ |
| Caro entra como colaboradora | ✅ |
| Caro ve solo el documento autorizado | ✅ |
| y solo su sección | ✅ |
| búsqueda: "cómo cancelo algo que ya cobre" → D1-1 | ✅ |
| búsqueda por el contexto generado: "me equivoque al cobrar" → D1-1 | ✅ |
| búsqueda aproximada con falta de ortografía: "cancelasiones" → D1-1 | ✅ |
| pedir borradores no le sirve a una colaboradora | ✅ |
| Caro no puede subirse de rol | ✅ |
| Caro cambia su nombre | ✅ |
| Caro solo se ve a sí misma en miembros | ✅ |
| Ana ve la canalización | ✅ |
| Ana NO ve las consultas de Caro una por una | ✅ |
| pero sí el hueco agregado, sin quién preguntó | ✅ |
| Beto no ve canalizaciones de Uno | ✅ |
| ni los huecos de Uno | ✅ |
| un anónimo no crea empresas | ✅ |
| todas las tablas de public tienen RLS | ✅ |

## 3. Búsqueda en el material (paso de recuperación del RAG)

Antes de responder, el asistente busca en el material publicado: un modelo rápido reescribe la pregunta con el vocabulario de un manual (por ejemplo, "¿cuánto efectivo puedo tener en la gaveta?" → "límite efectivo gaveta retiro") y se busca con la pregunta original y con la reescrita. La búsqueda es texto en español sin acentos con peso por rareza de la palabra (tipo BM25) y prefijo de raíz, más una vía aproximada para faltas de ortografía. Si la búsqueda no trae la sección correcta, la respuesta no puede ser correcta: por eso se mide por separado, con un banco de preguntas (`pruebas/busqueda.json`) contra el manual oficial del reto (96 secciones citables).

**Resultado:** con reescritura, la sección esperada llegó entre las 12 que recibe la IA en **18 de 18** preguntas; sin reescritura, 15 de 18.

| Pregunta | Sección esperada | Sin reescritura | Con reescritura |
|---|---|---|---|
| ¿Cómo hago una cancelación? | sección 8 | ✅ posición 1 | ✅ posición 2 |
| ¿Qué hago si un producto no tiene precio? | sección 3, Producto sin precio o diferencia con la etiqueta | ✅ posición 1 | ✅ posición 2 |
| ¿Cómo aplico una promoción? | sección 6 / sección 7 | ✅ posición 1 | ✅ posición 1 |
| ¿Qué debo revisar al cerrar caja? | sección 12 | ✅ posición 2 | ✅ posición 1 |
| ¿Cuándo debo llamar al supervisor? | Referencia rápida, Cuándo llamar al supervisor | ✅ posición 1 | ✅ posición 1 |
| Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro? | sección 7, Ejemplo con varias promociones | ✅ posición 1 | ✅ posición 1 |
| El cliente me pagó $70 en efectivo y la terminal se quedó sin respuesta con los $50 de la tarjeta | sección 5, Si la segunda parte queda incierta | ✅ posición 1 | ✅ posición 1 |
| ¿Hasta cuándo puede devolver un cliente unas pilas que compró? | sección 9, Condiciones de atención | ❌ | ✅ posición 7 |
| ¿Hasta cuándo puede devolver un cliente unas pilas que compró? | sección 6, Catálogo | ✅ posición 3 | ✅ posición 3 |
| ¿Qué reviso cuando cierro mi caja? | sección 12 | ✅ posición 1 | ✅ posición 1 |
| ¿Cómo cancelo un ticket que ya cobré? | sección 8, Ticket liquidado / sección 9 | ❌ | ✅ posición 7 |
| Me sobran 50 pesos en el corte | sección 12 | ✅ posición 12 | ✅ posición 5 |
| ¿Puedo devolver un yogur abierto? | sección 9, Condiciones de atención | ✅ posición 2 | ✅ posición 2 |
| ¿Qué hago si no tengo cambio? | sección 4, Si no hay cambio suficiente | ✅ posición 1 | ✅ posición 3 |
| ¿Cuánto cuesta el café? | sección 6, Catálogo | ✅ posición 5 | ✅ posición 3 |
| ¿Cuánto efectivo puedo tener en la gaveta? | sección 10, Solicitar un retiro a resguardo | ❌ | ✅ posición 7 |
| ¿Qué pasa si la terminal no responde? | sección 4, Terminal sin respuesta o con registros diferentes | ✅ posición 2 | ✅ posición 3 |
| ¿De cuánto es el fondo de caja? | sección 2, Fondo objetivo | ✅ posición 1 | ✅ posición 2 |

## 4. Punta a punta

Un script usa la app como lo haría una persona: entra con el código que llega por correo (al buzón de pruebas local), recorre las pantallas, se une a una empresa con el QR de una sucursal y comprueba desde la web que un colaborador no puede entrar a la gestión ni a otra empresa.

**Resultado:** 25 de 25.

| Paso | |
|---|---|
| entra (correo de prueba) con código por correo | ✅ |
| /inicio acepta las invitaciones y lista las 2 empresas | ✅ |
| /e/tienda-escuela → 200 | ✅ |
| /e/tienda-escuela/asistente → 200 | ✅ |
| /e/tienda-escuela/admin/contenido → 200 | ✅ |
| /e/tienda-escuela/admin/equipo → 200 | ✅ |
| /e/tienda-escuela/admin/ajustes → 200 | ✅ |
| /e/tienda-escuela/canalizaciones → 200 | ✅ |
| Contenido de Tienda Escuela no mezcla el material de Superette | ✅ |
| el manual del reto quedó partido como lo cita el documento («sección 5, Si la segunda parte queda incierta») | ✅ |
| la franja de contenido ficticio se ve en Tienda Escuela | ✅ |
| Módulos lista el módulo de inducción | ✅ |
| la revisión del módulo muestra lecciones, test y prácticas | ✅ |
| /e/tienda-escuela/admin/metricas → 200 | ✅ |
| el cajero ve su ruta de capacitación y su nivel | ✅ |
| el cajero abre el módulo | ✅ |
| la página del test NO trae las respuestas ni sus explicaciones | ✅ |
| un cajero NO entra a la gestión de módulos (404) | ✅ |
| el QR de Superette está en Equipo (54205654) | ✅ |
| el QR lo une a Superette y lo manda a su inicio | ✅ |
| el colaborador ve el inicio de Superette | ✅ |
| un colaborador NO entra a Contenido (404) | ✅ |
| ni a otra empresa (404) | ✅ |
| chat responde con citas ([{"codigo":"D1-2","documento":"Manual del colaborador de tienda (EJEMPLO)","titu…) | ✅ |
| el chat no responde con el material de otra empresa (404) | ✅ |

## 5. Prueba documentada con IA (entregable de Del Río)

Diez consultas o más contra el asistente completo (búsqueda + modelo de IA): ocho cubiertas por el material y dos sin respuesta, que deben canalizarse a supervisor o a RH sin inventar. Se reportan las respuestas correctas, los errores y las canalizaciones tal cual.

**Resultado:** 8 correctas · 2 canalizadas correctamente · 0 errores, de 10 consultas (8 cubiertas por el material y 2 sin respuesta disponible). Respondió: groq. Corrida del 9/10/2026, 12:35:39 p.m.; respuestas completas en [prueba-documentada.md](prueba-documentada.md).
