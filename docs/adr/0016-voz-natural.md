# ADR 0016 — Voz natural del asistente: resumen hablado con Azure Speech (ElevenLabs opcional)

- Estado: **aceptado (2026-10-09, noche)**. Wal quiere que la voz del avatar sea más femenina y más humana, y decidió (respondiendo a la otra sesión, Bart):
  - **Azure Speech** con `es-MX-DaliaNeural`;
  - la voz del navegador **bien elegida** como respaldo;
  - un **resumen hablado** en vez de leer toda la respuesta.
- Enmienda la parte de voz del ADR 0005. La voz es una mejora opcional según la ficha; aporta a «Experiencia de uso» (15 %).

## Enmienda (10-oct, madrugada): ElevenLabs es la voz principal
Wal **no** quiere Azure como voz principal: decidió **ElevenLabs**, y para la demo presentar desde **Edge**, donde el respaldo del navegador ya elige «Microsoft Dalia Online (Natural)».
- **Orden** (`lib/voz/proveedor.ts`):
  1. ElevenLabs, si hay `ELEVENLABS_API_KEY` y voz para ese personaje.
  2. Azure, si hay `AZURE_SPEECH_KEY`. El código de Azure se queda.
  3. Si no, 503 con el resumen y la voz del navegador.
  - Si falta la voz del cliente en ElevenLabs, el cliente no habla con la voz de Rio: usa Azure o el navegador, que elige otra voz.
- **Variables de ElevenLabs:**

  | Variable | Para qué |
  |---|---|
  | `ELEVENLABS_API_KEY` | La llave |
  | `ELEVENLABS_VOZ` | voice_id de Rio |
  | `ELEVENLABS_VOZ_CLIENTE` y `ELEVENLABS_VOZ_CLIENTA` | voice_id del cliente y de la clienta |
  | `ELEVENLABS_MODELO` | `eleven_flash_v2_5` por omisión: el rápido, a mitad de precio por carácter; o `eleven_multilingual_v2` |

  Los voice_id deben ser alfanuméricos y el modelo `eleven_…`.
- **Llamada** (revisada contra la documentación oficial el 9-oct):
  - `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_64`, con `xi-api-key`.
  - Cuerpo: `text`, `model_id` y `voice_settings` (stability 0.45, similarity_boost 0.8, style 0.1, use_speaker_boost).
  - `language_code: "es"` **solo** con Flash/Turbo v2.5: la documentación dice que `multilingual_v2` no lo acepta.
  - Timeout de 12 s.
- **Si ElevenLabs falla** (401, 402, cuota agotada, 429 o red): 502 con el resumen, y el navegador lo dice. Solo se registra el código de error, nunca el texto ni la llave.
- **Caché para cuidar los créditos** (el plan gratis trae 10 000 al mes):
  - En memoria del proceso, con los 200 más recientes. Guarda el resumen y el audio.
  - Llave: `sha256(proveedor, voz, modelo, modo, quién, texto)`.
  - Si 10 jueces oyen la misma lección, se gasta una sola síntesis y una sola llamada al resumen.
  - Un fallo no se guarda, para reintentar.
  - La cabecera `X-Cache` (hit o miss) deja comprobarlo; está probado en el humo.
- **Pendiente opcional:** un tope diario por usuario.

## Enmienda (10-oct, mediodía): en producción la voz es Azure
- **ElevenLabs no quedó:** con la cuenta gratis, las voces mexicanas de la biblioteca responden **402 `payment_required`**. Solo las voces predeterminadas funcionan gratis, y ninguna es mexicana. El plan Starter cuesta unos 5 USD al mes. Wal eligió **Azure F0 (gratis)**. El código de ElevenLabs se queda; en Vercel no hay variables `ELEVENLABS_*`, así que el proveedor es Azure.
  - **Ojo en local:** `.env.local` todavía tiene las `ELEVENLABS_*`. Con ellas, en local se intenta ElevenLabs primero, da 502 y cae al respaldo. Para probar Azure en local, hay que comentar esas líneas.
- **Recurso de Azure:**
  - Es de Wal, creado con su cuenta universitaria, plan **F0**: 500 000 caracteres al mes de voz neural, gratis.
  - La región es **`northcentralus`**, no `eastus`. La llave solo vale en la región de su recurso; con otra región, Azure responde 401. Se encontró probando la llave contra `https://{región}.api.cognitive.microsoft.com/sts/v1.0/issueToken` en 25 regiones.
- **Voces en producción** (variables en Production y Preview desde el 10-oct):

  | Personaje | Variable | Voz |
  |---|---|---|
  | Rio | `AZURE_VOZ` | `es-MX-DaliaMultilingualNeural` |
  | Cliente | `AZURE_VOZ_CLIENTE` | `es-MX-JorgeNeural` |
  | Clienta | `AZURE_VOZ_CLIENTA` | `es-MX-BeatrizNeural` |

  - Para Rio, Wal pidió «la mejor para alguien que explica temas». Se escucharon las 9 voces femeninas es-MX de la cuenta (Dalia, Dalia multilingüe, Renata, Marina, Candela, Beatriz, Carlota, Larissa y Nuria), y Bart eligió **Dalia multilingüe**: es la versión más nueva de Dalia, más natural y expresiva.
  - Para cambiarla basta la variable y un redespliegue, sin tocar código.
- **El navegador no siempre deja sonar el audio** (commit `5967920`):
  - Wal no oía nada en su laptop con Brave, aunque `/api/voz` respondía 200 con `audio/mpeg`.
  - Causa 1: Brave y Safari bloquean el audio que arranca segundos después del clic.
  - Causa 2: el respaldo del navegador calla en Linux, porque solo hay eSpeak.
  - Causa 3: el WAV de desbloqueo no tenía muestras, así que su `play()` se quedaba colgado sin desbloquear nada.
  - Causa 4: un `play()` colgado dejaba al avatar en «Respondiendo» para siempre.
  - **Ahora:**
    - El desbloqueo usa 0.05 s de silencio válido.
    - `play()` tiene un límite de 3.5 s.
    - Si el audio se bloquea o no arranca, aparece **«▶ Escuchar a Rio»** (chat) o **«▶ Escuchar»** (inducción, fijo en la esquina), y un toque lo reproduce. Dentro de un clic, ningún navegador lo bloquea.
    - Si el audio no se puede decodificar, se usa la voz del navegador, como antes.
- **Carga:** en la prueba de estrés en producción (`docs/prueba-de-estres.md`) se pidieron 12 voces a la vez y salieron 12/12, en 3.4 s típicos. La misma voz pedida por 10 personas a la vez salió del caché en 1 s.

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
- **Botón de voz** del módulo: «Voz de Rio activada».
- **Lecciones:** Rio (así se llama la asistente de Del Río), con su avatar y el uniforme de la empresa, presenta cada lección a partir de su objetivo («En esta lección vas a aprender a…»). **«Escúchala»** dice el resumen hablado de la lección.
- **Test:** Rio anima al empezar y comenta el resultado al calificar. Es texto fijo, sin IA nueva: el puntaje es automático (ADR 0011).
- **Práctica:**
  - El cliente simulado es **otro personaje**: su propio avatar genérico, «Cliente» o «Clienta» según el personaje, y **otra voz**.
  - Sus líneas se dicen tal cual (modo `literal`), sin pasar por el modelo.
  - El cajero le responde escribiendo o **con el micrófono** (pulsar para hablar con Whisper, igual que en el chat).
  - Al terminar, **Rio** da la retroalimentación con su voz.

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
- ElevenLabs: opcional y sin configurar en producción (ver las enmiendas de arriba).
- `AZURE_SPEECH_KEY`: secreta, en `.env.local` y en Vercel como *sensitive*.
- `AZURE_SPEECH_REGION`: `eastus` por omisión. **En producción es `northcentralus`**, la región del recurso de Wal.
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
