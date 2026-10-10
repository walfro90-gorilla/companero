# ADR 0016 — Voz natural del asistente: resumen hablado con Azure Speech

- Estado: **aceptado (2026-10-09, noche)**. Wal quiere que la voz del avatar sea más femenina y más humana, y decidió (respondiendo a la otra sesión, Bart):
  - **Azure Speech** con `es-MX-DaliaNeural`;
  - la voz del navegador **bien elegida** como respaldo;
  - un **resumen hablado** en vez de leer toda la respuesta.
- Enmienda la parte de voz del ADR 0005. La voz es una mejora opcional según la ficha; aporta a «Experiencia de uso» (15 %).

## Por qué
- **Antes, la voz cambiaba con cada equipo:** el chat tomaba la primera voz en español del navegador. En Linux suele ser eSpeak, que suena robótica, y en Windows a veces una voz de hombre («Raúl»). Además leía la respuesta completa, con listas y montos, y sonaba a lectura.
- **Azure Speech es de Microsoft**, que patrocina el evento. El plan F0 es gratis, con 500 000 caracteres al mes.

## Cómo funciona
1. **El navegador** (`app/e/[slug]/asistente/chat.tsx`): con «Voz activada», al terminar la respuesta la manda a `/api/voz`.
2. **El servidor** (`/api/voz`): exige sesión y ser miembro de la empresa; acepta respuestas de hasta 4000 caracteres.
   - **Resumen hablado:** un modelo rápido (la cadena de la reescritura, `gpt-oss-20b`) lo escribe en 2 o 3 frases naturales, de tú, de 280 caracteres o menos.
     - Di **solo** lo que dice la respuesta (Exactitud): sin citas, listas ni símbolos.
     - El dinero se dice «160 pesos con 50 centavos». En un cálculo, solo el resultado.
     - Si hay más pasos: «Te dejo los pasos en la pantalla».
     - Si canaliza: «ya le avisé a tu supervisor».
     - Si el modelo no responde, se usa la primera frase y los dos primeros pasos.
   - **Azure** dice el resumen con SSML: el texto va escapado, con una pausa de 300 ms entre frases y un 5 % más despacio. La respuesta es MP3 y el resumen va en la cabecera `X-Resumen`.
   - **Registros:** ni el texto ni la llave se registran.
3. **Celular y Safari:** el audio solo suena si nació en un clic. El clic de «Voz activada» reproduce un audio vacío, y ese mismo elemento `Audio` se reutiliza después.
4. **Mientras habla:** la boca del avatar se mueve. Si llega otra pregunta, o se presiona el micrófono, la voz se calla. Ya se puede preguntar mientras el avatar habla.
5. **Respaldo:** sin `AZURE_SPEECH_KEY` (503, con el resumen) o si Azure falla, el navegador dice el mismo resumen con una voz **femenina** elegida por nombre:
   - Dalia, Paulina, Sabina, Mónica, Paloma, Elvira, Helena o Google español; primero es-MX, luego es-US, luego es-ES.
   - Nunca Raúl, Jorge, Juan, Pablo, Diego ni eSpeak. Si solo hay voces de esas, calla: mejor eso que sonar mal.
   - Ver `lib/voz/elegir-voz.ts`.

## La asistente guía la inducción (9-oct, noche; pedido de Wal)
La ficha pide que el avatar guíe la inducción (criterios de Utilidad, 25 %, y Experiencia, 15 %). En `/e/{empresa}/modulos/{id}`:
- **Botón de voz** del módulo: «Voz de Rosa activada».
- **Lecciones:** Rosa, con su avatar y el uniforme de la empresa, presenta cada lección a partir de su objetivo («En esta lección vas a aprender a…»). **«Escúchala»** dice el resumen hablado de la lección.
- **Test:** Rosa anima al empezar y comenta el resultado al calificar. Es texto fijo, sin IA nueva: el puntaje es automático (ADR 0011).
- **Práctica:**
  - El cliente simulado es **otro personaje**: su propio avatar genérico, «Cliente» o «Clienta» según el personaje, y **otra voz**.
  - Sus líneas se dicen tal cual (modo `literal`), sin pasar por el modelo.
  - El cajero le responde escribiendo o **con el micrófono** (pulsar para hablar con Whisper, igual que en el chat).
  - Al terminar, **Rosa** da la retroalimentación con su voz.

### Cambios en `/api/voz`
- **`modo`:**
  - `resumen` (por omisión): la asistente resume una respuesta.
  - `literal`: las líneas del cliente y las frases fijas del coach se dicen tal cual, hasta 600 caracteres.
- **`quien`:** `asistente`, `cliente` o `clienta`. El **servidor** elige la voz; el navegador nunca manda el nombre de la voz.

  | Quién | Variable | Por omisión |
  |---|---|---|
  | Asistente | `AZURE_VOZ` | `es-MX-DaliaNeural` |
  | Cliente | `AZURE_VOZ_CLIENTE` | `es-MX-JorgeNeural` |
  | Clienta | `AZURE_VOZ_CLIENTA` | `es-MX-BeatrizNeural` |

  Si el personaje dice «señora», «clienta», «mujer», etc., la voz es de clienta (`quienEs`).
- **Respaldo en el navegador para el cliente:** una voz distinta de la de la asistente. Si no hay otra, la misma con otro tono, y el cambio de personaje se ve en pantalla. Nunca eSpeak.

### Exactitud del resumen (lo encontró Bart en producción)
- **«Quién hace qué»:** el resumen de la cancelación decía que el supervisor decide si se cancela todo o una línea, y eso lo decide el cliente. Ahora las instrucciones piden no cambiar quién hace qué (cliente, cajero, supervisor) ni el orden de los pasos.
- **Lo que no puede faltar se agrega en código, no se deja al modelo** (`completarResumen`): «Te dejo los pasos en la pantalla» si hay más pasos de los que se dicen, y el aviso de canalización una sola vez.

El hook `app/_ui/usar-voz.ts` tiene la voz del navegador y lo usan el chat y la inducción.

## Datos
- **Lo que va a Azure:** solo el resumen hablado de una respuesta, que sale del material del reto. El material es el manual ficticio de la Tienda Escuela que dio la organización (ADR 0013), y Wal decidió usar Azure.
- **Lo que no va:** ni datos personales ni la pregunta del empleado.

## Configuración
- `AZURE_SPEECH_KEY`: secreta, en `.env.local` y en Vercel como *sensitive*.
- `AZURE_SPEECH_REGION`: `eastus` por omisión.
- `AZURE_VOZ`, `AZURE_VOZ_CLIENTE` y `AZURE_VOZ_CLIENTA`: opcionales, para probar otras voces neurales de es-MX sin tocar código.
- Sin la llave todo funciona con el respaldo, así que se puede desplegar antes de tenerla.

## Pruebas
- **`lib/voz/hablar.test.ts`:**
  - el SSML escapa `& < > " '`;
  - el resumen no lleva marcas, no pasa de 300 caracteres y avisa cuando canaliza;
  - la voz de respaldo nunca es de hombre ni eSpeak.
- **`npm run humo`:**
  - `/api/voz` sin sesión → 401;
  - más de 4000 caracteres → 400;
  - otra empresa → 404;
  - con llave → MP3 de más de 1 KB; sin llave → 503 con un resumen limpio;
  - modo literal: la línea del cliente se dice tal cual; un `quien` que no es válido → 400; más de 600 caracteres → 400;
  - la lección muestra al coach, «Escúchala» y el botón de voz.

## Siguiente paso (pitch)
- **Visemas de Azure:** mover la boca con cada sonido.
- **Avatar del cliente:** ahora tiene el mismo peinado que la asistente; podría tener otro.
