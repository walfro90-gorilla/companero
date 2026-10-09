# Validación técnica

Generado automáticamente por `npm run validar` el 9 de octubre de 2026 a las 1:32 a.m. (hora de Cd. Juárez). Cada resultado es de esta corrida; para reproducirlo basta correr el mismo comando.

| Qué se prueba | Resultado | |
|---|---|---|
| Lógica de la aplicación | 42 de 42 | ✅ |
| Aislamiento entre empresas, roles y privacidad | 25 comprobaciones | ✅ |
| Búsqueda del RAG (encuentra la sección correcta) | 8 de 8 | ✅ |
| Punta a punta (login, pantallas, QR, permisos) | 23 de 23 | ✅ |
| Prueba documentada con IA (≥10 consultas) | pendiente | ⏳ |

> El material de las empresas de demo es **de ejemplo**, escrito por el equipo: no es de Del Río ni de Superette.

## 1. Lógica de la aplicación

Pruebas automáticas de las piezas que deciden qué ve el usuario: cómo se parte un documento en secciones citables, cómo se detectan y validan las citas `[D1-3]` y las canalizaciones, el paso de búsqueda del RAG, el respaldo entre proveedores de IA (si Anthropic falla, responde Groq sin que se note) y las reglas de la gamificación.

**Resultado:** 42 pasan, 0 fallan.

<details><summary>Ver cada caso</summary>

- ✅ separa texto y citas, sin repetir fuentes
- ✅ una cita a una sección inexistente nunca se muestra como fuente
- ✅ detecta la canalización y la quita del texto
- ✅ el texto para la voz va sin marcas ni markdown
- ✅ responde el primero si funciona
- ✅ una llave muerta pasa al siguiente y queda registrada como "clave"
- ✅ una respuesta vacía también es fallo (el caso de gpt-oss sin tokens)
- ✅ un 400 tampoco corta la cadena (Google responde 400 a una llave inválida)
- ✅ si todos fallan, lo dice con todos los intentos
- ✅ ordenar respeta IA_ORDEN y deja al final a los no mencionados
- ✅ clasificar
- ✅ generarConRespaldo: vacío o error pasan al siguiente
- ✅ jsonDe saca el JSON aunque venga envuelto
- ✅ el personaje abre la escena cuando no hay mensajes
- ✅ en la conversación, lo del personaje va como assistant y lo del colaborador como user
- ✅ la retroalimentación lleva el material, el objetivo y la transcripción, y pide no calificar
- ✅ leerContextos solo acepta órdenes que existen y textos no vacíos
- ✅ leerContextos tolera basura
- ✅ peticionContexto incluye cada sección y pide JSON
- ✅ lotes
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
- ✅ materialParaPrompt pone el código, el documento, la página y el texto
- ✅ sin resultados, el modelo lo sabe explícitamente
- ✅ una pregunta completa se busca sola
- ✅ una de seguimiento se busca junto con la anterior
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

Antes de responder, el asistente busca en el material publicado de la empresa (texto en español sin acentos, búsqueda aproximada para faltas de ortografía y, cuando se active, búsqueda por significado). Si la búsqueda no trae la sección correcta, la respuesta no puede ser correcta: por eso se mide por separado. Material: el de ejemplo de Del Río (demo).

**Resultado:** encontró la sección esperada en **8 de 8** consultas cubiertas por el material.

| # | Consulta | Sección esperada | Secciones que trajo (en orden) | ¿La encontró? |
|---|---|---|---|---|
| 1 | ¿Cómo hago una cancelación? | D1-5 | D1-5 | ✅ (posición 1) |
| 2 | ¿Qué hago si un producto no tiene precio? | D1-3 | D1-3, D1-4, D1-7, D2-3, D2-1, D1-2, D1-1, D1-6 | ✅ (posición 1) |
| 3 | ¿Cómo aplico una promoción? | D1-4 | D1-4, D1-7, D2-1 | ✅ (posición 1) |
| 4 | ¿Qué debo revisar al cerrar caja? | D1-6 | D1-1, D1-6, D1-5, D1-4, D2-1, D1-7, D1-2, D2-2 | ✅ (posición 2) |
| 5 | ¿Cuándo debo llamar al supervisor? | D1-7 | D1-7, D1-1, D1-5, D1-6, D2-1, D1-4, D1-3, D2-3 | ✅ (posición 1) |
| 6 | Al hacer mi corte me faltan 50 pesos, ¿qué hago? | D1-6, D1-7 | D1-6, D2-1, D1-7, D2-2 | ✅ (posición 1) |
| 7 | ¿Cómo cobro si el cliente paga con tarjeta? | D1-2 | D1-2, D2-3, D1-3, D2-4, D1-4, D1-1, D1-6, D2-2 | ✅ (posición 1) |
| 8 | ¿Le puedo pasar mi contraseña de la terminal a una compañera para que me cubra? | D2-4, D1-1 | D2-4, D1-7, D1-6, D1-5, D1-1, D1-2 | ✅ (posición 1) |
| 9 | ¿Cómo acepto un pago con vales de despensa? | no está en el material | D1-2, D2-1 | — |
| 10 | ¿Cuántos días de vacaciones me tocan al año? | no está en el material | (nada) | — |

## 4. Punta a punta

Un script usa la app como lo haría una persona: entra con el código que llega por correo (al buzón de pruebas local), recorre las pantallas, se une a una empresa con el QR de una sucursal y comprueba desde la web que un colaborador no puede entrar a la gestión ni a otra empresa.

**Resultado:** 23 de 23.

| Paso | |
|---|---|
| entra (correo de prueba) con código por correo | ✅ |
| /inicio acepta las invitaciones y lista las 2 empresas | ✅ |
| /e/del-rio → 200 | ✅ |
| /e/del-rio/asistente → 200 | ✅ |
| /e/del-rio/admin/contenido → 200 | ✅ |
| /e/del-rio/admin/equipo → 200 | ✅ |
| /e/del-rio/admin/ajustes → 200 | ✅ |
| /e/del-rio/canalizaciones → 200 | ✅ |
| Contenido de Del Río no mezcla el material de Superette | ✅ |
| Módulos lista el módulo de inducción | ✅ |
| la revisión del módulo muestra lecciones, test y prácticas | ✅ |
| /e/del-rio/admin/metricas → 200 | ✅ |
| el cajero ve su ruta de capacitación y su nivel | ✅ |
| el cajero abre el módulo | ✅ |
| la página del test NO trae las respuestas ni sus explicaciones | ✅ |
| un cajero NO entra a la gestión de módulos (404) | ✅ |
| el QR de Superette está en Equipo (28981796) | ✅ |
| el QR lo une a Superette y lo manda a su inicio | ✅ |
| el colaborador ve el inicio de Superette | ✅ |
| un colaborador NO entra a Contenido (404) | ✅ |
| ni a otra empresa (404) | ✅ |
| chat sin llaves de IA: 502 con mensaje claro | ✅ |
| el chat no responde con el material de otra empresa (404) | ✅ |

## 5. Prueba documentada con IA (entregable de Del Río)

Diez consultas o más contra el asistente completo (búsqueda + modelo de IA): ocho cubiertas por el material y dos sin respuesta, que deben canalizarse a supervisor o a RH sin inventar. Se reportan las respuestas correctas, los errores y las canalizaciones tal cual.

_Pendiente: requiere las llaves de IA en `.env.local`; se genera con `npm run prueba`._
