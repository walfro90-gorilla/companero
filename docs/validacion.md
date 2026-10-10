# Validación técnica

Generado automáticamente por `npm run validar` el 9 de octubre de 2026 a las 8:45 p.m. (hora de Cd. Juárez). Cada resultado es de esta corrida; para reproducirlo basta correr el mismo comando.

| Qué se prueba | Resultado | |
|---|---|---|
| Lógica de la aplicación | 77 de 77 | ✅ |
| Aislamiento entre empresas, roles y privacidad | 42 comprobaciones | ✅ |
| Búsqueda del RAG (encuentra la sección correcta) | 18 de 18 (sin reescritura: 16) | ✅ |
| Punta a punta (login, pantallas, QR, permisos) | 69 de 69 | ✅ |
| Prueba documentada con IA (≥10 consultas) | 10 de 10 (groq) | ✅ |

> Material: el manual oficial del reto («Manual de procedimientos para cajeros — Tienda Escuela»), **ficticio** y con fines educativos, cargado en la empresa «Del Río» de la demo; no describe políticas reales de Del Río ni de Superette. La empresa «Superette (demo)» usa contenido de ejemplo escrito por el equipo.

## 1. Lógica de la aplicación

Pruebas automáticas de las piezas que deciden qué ve el usuario: cómo se parte un documento en secciones citables, cómo se detectan y validan las citas `[D1-3]` y las canalizaciones, el paso de búsqueda del RAG, el respaldo entre proveedores de IA (si Anthropic falla, responde Groq sin que se note) y las reglas de la gamificación.

**Resultado:** 77 pasan, 0 fallan.

<details><summary>Ver cada caso</summary>

- ✅ el uniforme con cuello, vivos y estrella (Del Río) se lee del jsonb
- ✅ sin detalle ni acento, el uniforme de siempre; un color inválido cae a la base
- ✅ separa texto y citas, sin repetir fuentes
- ✅ una cita a una sección inexistente nunca se muestra como fuente
- ✅ detecta la canalización y la quita del texto
- ✅ el texto para la voz va sin marcas ni markdown
- ✅ tolera espacios dentro de los corchetes (lo hace gpt-oss en Groq)
- ✅ acepta los corchetes 【】 de gpt-oss
- ✅ reconoce las citas como de verdad las escribe Groq: guion U+2011, varios códigos y texto extra (Bart, 9-oct)
- ✅ otros guiones y separadores también cuentan; el código se normaliza
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
- ✅ normalizarNumero acepta letras, números y guion
- ✅ correo interno por empresa y número
- ✅ leerLista: números con nombre opcional, sin repetidos
- ✅ slugDe quita acentos, espacios y símbolos
- ✅ rutaSegura solo acepta rutas internas
- ✅ elige el primer formato que soporta el navegador
- ✅ extensión según el formato
- ✅ descarta silencios y frases fantasma de Whisper
- ✅ descarta las frases fantasma típicas de Whisper con ruido o música
- ✅ el SSML escapa el texto y separa las frases con una pausa
- ✅ el resumen hablado no lleva citas, viñetas ni símbolos y no pasa del máximo
- ✅ el resumen de respaldo dice la primera frase y dos pasos, y avisa si canaliza
- ✅ la voz de respaldo es femenina y en español; nunca una de hombre ni eSpeak
- ✅ la voz del cliente simulado sale del personaje: de mujer o de hombre
- ✅ lo que no puede faltar en el resumen: los pasos en pantalla o el aviso, una sola vez
- ✅ una línea del cliente se dice tal cual, sin marcas y corta
- ✅ la voz del cliente en el navegador es distinta de la de la asistente y nunca eSpeak
- ✅ sin pasos (o si canaliza) no dice «pasos en la pantalla», y cada oración empieza con mayúscula

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
| ya no existe unirse_con_codigo | ✅ |
| ni la llave secreta mete a un miembro en la sucursal de otra empresa | ✅ |
| Ana (admin de Uno) no invita con el puesto de otra empresa | ✅ |
| ni se pone el puesto de otra empresa | ✅ |
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
| Caro ve su intento | ✅ |
| Caro NO puede ponerse calificación | ✅ |
| Caro no puede crear un intento ya calificado | ✅ |
| Caro no puede guardar una práctica con retroalimentación inventada | ✅ |
| Ana (admin) califica el intento | ✅ |
| quien califica no puede cambiar las respuestas ni el puntaje | ✅ |
| Beto (otra empresa) no ve intentos de Uno | ✅ |
| nadie con sesión lee los intentos de acceso por número de reloj | ✅ |
| nadie con sesión lee auth.users | ✅ |
| ni cambia la cuenta de nadie | ✅ |
| sin sesión no se lee la tabla de empresas | ✅ |
| una cuenta de empleado no crea empresas | ✅ |
| una empresa nueva NO aparece en la lista de «Soy empleado» hasta que su admin la prenda | ✅ |
| un anónimo no crea empresas | ✅ |
| todas las tablas de public tienen RLS | ✅ |

## 3. Búsqueda en el material (paso de recuperación del RAG)

Antes de responder, el asistente busca en el material publicado: un modelo rápido reescribe la pregunta con el vocabulario de un manual (por ejemplo, "¿cuánto efectivo puedo tener en la gaveta?" → "límite efectivo gaveta retiro") y se busca con la pregunta original y con la reescrita. La búsqueda es texto en español sin acentos con peso por rareza de la palabra (tipo BM25) y prefijo de raíz, más una vía aproximada para faltas de ortografía. Si la búsqueda no trae la sección correcta, la respuesta no puede ser correcta: por eso se mide por separado, con un banco de preguntas (`pruebas/busqueda.json`) contra el manual oficial del reto (96 secciones citables).

**Resultado:** con reescritura, la sección esperada llegó entre las 12 que recibe la IA en **18 de 18** preguntas; sin reescritura, 16 de 18.

| Pregunta | Sección esperada | Sin reescritura | Con reescritura |
|---|---|---|---|
| ¿Cómo hago una cancelación? | sección 8 | ✅ posición 1 | ✅ posición 6 |
| ¿Qué hago si un producto no tiene precio? | sección 3, Producto sin precio o diferencia con la etiqueta | ✅ posición 1 | ✅ posición 1 |
| ¿Cómo aplico una promoción? | sección 6 / sección 7 | ✅ posición 1 | ✅ posición 1 |
| ¿Qué debo revisar al cerrar caja? | sección 12 | ✅ posición 2 | ✅ posición 1 |
| ¿Cuándo debo llamar al supervisor? | Referencia rápida, Cuándo llamar al supervisor | ✅ posición 1 | ✅ posición 1 |
| Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro? | sección 7, Ejemplo con varias promociones | ✅ posición 1 | ✅ posición 1 |
| El cliente me pagó $70 en efectivo y la terminal se quedó sin respuesta con los $50 de la tarjeta | sección 5, Si la segunda parte queda incierta | ✅ posición 1 | ✅ posición 1 |
| ¿Hasta cuándo puede devolver un cliente unas pilas que compró? | sección 9, Condiciones de atención | ❌ | ✅ posición 7 |
| ¿Hasta cuándo puede devolver un cliente unas pilas que compró? | sección 6, Catálogo | ✅ posición 2 | ✅ posición 4 |
| ¿Qué reviso cuando cierro mi caja? | sección 12 | ✅ posición 1 | ✅ posición 1 |
| ¿Cómo cancelo un ticket que ya cobré? | sección 8, Ticket liquidado / sección 9 | ❌ | ✅ posición 12 |
| Me sobran 50 pesos en el corte | sección 12 | ✅ posición 12 | ✅ posición 7 |
| ¿Puedo devolver un yogur abierto? | sección 9, Condiciones de atención | ✅ posición 2 | ✅ posición 1 |
| ¿Qué hago si no tengo cambio? | sección 4, Si no hay cambio suficiente | ✅ posición 1 | ✅ posición 5 |
| ¿Cuánto cuesta el café? | sección 6, Catálogo | ✅ posición 1 | ✅ posición 1 |
| ¿Cuánto efectivo puedo tener en la gaveta? | sección 10, Solicitar un retiro a resguardo | ✅ posición 5 | ✅ posición 4 |
| ¿Qué pasa si la terminal no responde? | sección 4, Terminal sin respuesta o con registros diferentes | ✅ posición 4 | ✅ posición 7 |
| ¿De cuánto es el fondo de caja? | sección 2, Fondo objetivo | ✅ posición 1 | ✅ posición 1 |

## 4. Punta a punta

Un script usa la app como lo haría una persona: el admin entra con correo y contraseña; el estudiante 0001 entra solo con su número de reloj; un empleado nuevo se da de alta con el QR de una sucursal; el estudiante deja un test, el admin lo califica en Respuestas y el estudiante ve su calificación. Comprueba desde la web que un empleado no entra a la gestión ni a otra empresa, que un número no registrado no entra sin QR y que no hay Google ni modo invitado.

**Resultado:** 69 de 69.

| Paso | |
|---|---|
| sin sesión, /e/del-rio manda a /acceso/del-rio (número de reloj) | ✅ |
| /entrar es el selector: «Soy empleado» y «Administración» | ✅ |
| /entrar/admin es correo y contraseña, sin Google ni invitado | ✅ |
| «Soy empleado» lista las empresas solo con nombre y slug | ✅ |
| /acceso/del-rio pide solo el número de reloj, sin contraseña | ✅ |
| la entrada de empleados NO lleva a la de administración | ✅ |
| el admin entra con correo y contraseña | ✅ |
| /inicio lista las 2 empresas del admin | ✅ |
| /e/del-rio → 200 | ✅ |
| /e/del-rio/asistente → 200 | ✅ |
| /e/del-rio/admin/contenido → 200 | ✅ |
| /e/del-rio/admin/equipo → 200 | ✅ |
| /e/del-rio/admin/ajustes → 200 | ✅ |
| /e/del-rio/admin/respuestas → 200 | ✅ |
| /e/del-rio/canalizaciones → 200 | ✅ |
| Contenido de Del Río no mezcla el material de Superette | ✅ |
| el manual del reto quedó partido como lo cita el documento («sección 5, Si la segunda parte queda incierta») | ✅ |
| la franja de contenido ficticio se ve en Del Río | ✅ |
| Módulos lista el módulo de inducción | ✅ |
| la revisión del módulo muestra lecciones, test y prácticas | ✅ |
| /e/del-rio/admin/metricas → 200 | ✅ |
| Equipo muestra a los estudiantes 0001–0004 | ✅ |
| el estudiante 0001 entra con su número de reloj | ✅ |
| 20 entradas a la vez con el mismo número (0001): 20 de 20 abren sesión | ✅ |
| nadie entra como 0001 directo contra Supabase Auth con la llave pública | ✅ |
| si el estudiante abre la entrada de administración, regresa a su empresa | ✅ |
| las pantallas del estudiante no llevan a la entrada de administración | ✅ |
| el estudiante ve su número, su ruta de capacitación y su nivel | ✅ |
| el estudiante abre el módulo | ✅ |
| la asistente guía la lección como coach (presentación, «Escúchala» y botón de voz) | ✅ |
| la página del test NO trae las respuestas ni sus explicaciones | ✅ |
| el estudiante ve el aviso de que su instructor revisa sus respuestas | ✅ |
| un estudiante NO entra a /e/del-rio/admin/modulos (404) | ✅ |
| un estudiante NO entra a /e/del-rio/admin/respuestas (404) | ✅ |
| el estudiante guarda un intento de test | ✅ |
| el test del estudiante 0001 aparece en Respuestas para revisar | ✅ |
| el admin lo califica (9/10 con comentario) | ✅ |
| el estudiante ve su calificación y el comentario en su Inicio | ✅ |
| el estudiante NO puede cambiar su calificación | ✅ |
| el estudiante NO puede guardar una práctica con retroalimentación inventada | ✅ |
| al evaluar la práctica, el servidor guarda la retroalimentación que generó la IA y la conversación | ✅ |
| la práctica aparece en Respuestas para revisar | ✅ |
| un número no registrado NO entra sin QR (404) | ✅ |
| el QR de Superette está en Equipo (69BA724A) | ✅ |
| la página del QR pide el número de reloj (sin sesión) | ✅ |
| la página del QR NO lleva a la entrada de administración | ✅ |
| un número nuevo por QR queda dado de alta y entra (H00388778) | ✅ |
| el colaborador ve el inicio de Superette | ✅ |
| después de 20 altas desde la misma red, un número nuevo espera (429) | ✅ |
| pero quien ya está dado de alta sí entra desde esa red (200) | ✅ |
| un colaborador NO entra a Contenido (404) | ✅ |
| ni a otra empresa (404) | ✅ |
| chat responde con citas ([{"codigo":"D1-2","documento":"Manual del colaborador de tienda (EJEMPLO)","titu…) | ✅ |
| el chat no responde con el material de otra empresa (404) | ✅ |
| después de una respuesta de 2 600 caracteres, la pregunta siguiente sí se atiende (200) | ✅ |
| y con 60 mensajes en la conversación también (200) | ✅ |
| pero una pregunta de más de 2000 caracteres no (400) | ✅ |
| al salir, el empleado regresa a la entrada de SU empresa | ✅ |
| y su otra sesión sigue abierta (salir no saca a quien comparte el número) | ✅ |
| voz del asistente sin sesión → 401 (401) | ✅ |
| un texto de más de 4000 caracteres no se dice (400) | ✅ |
| ni con el material de otra empresa (404) | ✅ |
| sin llave de Azure → 503 con el resumen hablado para la voz del navegador («Para cancelar un artículo ya cobrado, primero llama al super…») | ✅ |
| la línea del cliente se dice tal cual, sin pasar por el modelo («¡Oiga! Me cobró dos veces el refresco.») | ✅ |
| el navegador no elige el nombre de la voz (400) | ✅ |
| una línea literal de más de 600 caracteres no se dice (400) | ✅ |
| voz sin sesión → 401 (401) | ✅ |
| voz sin audio → 400 (400) | ✅ |
| un ruido sin voz llega a Whisper y NO se manda como pregunta (422: 422 "no te escuché") | ✅ |

## 5. Prueba documentada con IA (entregable de Del Río)

Diez consultas o más contra el asistente completo (búsqueda + modelo de IA): ocho cubiertas por el material y dos sin respuesta, que deben canalizarse a supervisor o a RH sin inventar. Se reportan las respuestas correctas, los errores y las canalizaciones tal cual.

**Resultado:** 8 correctas · 2 canalizadas correctamente · 0 errores, de 10 consultas (8 cubiertas por el material y 2 sin respuesta disponible). Respondió: groq. Corrida del 9/10/2026, 3:01:15 p.m.; respuestas completas en [prueba-documentada.md](prueba-documentada.md).
