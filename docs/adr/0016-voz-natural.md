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

## Datos
- **Lo que va a Azure:** solo el resumen hablado de una respuesta, que sale del material del reto. El material es el manual ficticio de la Tienda Escuela que dio la organización (ADR 0013), y Wal decidió usar Azure.
- **Lo que no va:** ni datos personales ni la pregunta del empleado.

## Configuración
- `AZURE_SPEECH_KEY`: secreta, en `.env.local` y en Vercel como *sensitive*.
- `AZURE_SPEECH_REGION`: `eastus` por omisión.
- `AZURE_VOZ`: opcional, para probar otra voz neural de es-MX sin tocar código.
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
  - con llave → MP3 de más de 1 KB; sin llave → 503 con un resumen limpio.

## Siguiente paso (pitch)
- **Visemas de Azure:** mover la boca con cada sonido.
- **Otra voz en la práctica:** el cliente simulado con otra voz, por ejemplo `es-MX-JorgeNeural`.
