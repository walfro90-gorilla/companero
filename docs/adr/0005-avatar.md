# ADR 0005 — Avatar: personaje 2D con estados, voz opcional

- Estado: **aceptado (2026-10-08)**; la identidad visual queda **pendiente de autorización de Del Río**.

## Decisión
- **Personaje 2D en SVG** con estados: `reposo`, `pensando`, `hablando`, `canalizando`. Animación con CSS
  (parpadeo, boca que se mueve mientras sale el texto o la voz). Sin dependencias pesadas.
- **Conversación por texto** (lo mínimo que pide el reto) con el avatar al lado del chat.
- **Voz opcional** con la Web Speech API del navegador (`speechSynthesis`, voz `es-MX` si existe): gratis, sin
  proveedor nuevo, se apaga con un botón. Si una voz suena mal en el equipo de la demo, se apaga y no pasa nada.
- **Entrada por voz: pulsar para hablar (hecho el 9-oct, a pedido de Wal):**
  - **Cómo se usa:** se mantiene presionado el micrófono del chat (mouse, dedo o la tecla Espacio); al soltar, el audio se transcribe con **Whisper en Groq** (`whisper-large-v3-turbo`, español) en `/api/transcribir` y se envía como pregunta. Mientras graba, el avatar está en "Te escucho…".
  - **Por qué Whisper y no el reconocimiento de voz del navegador:** funciona en Chrome, Firefox y Safari del celular, y transcribe bien el español de México.
  - **Privacidad:** el audio no se guarda. Va a Groq, se transcribe y se descarta; lo que queda es texto, igual que si se hubiera escrito. Exige sesión y ser miembro de la empresa.
  - **Límites:** de 0.5 a 30 s por pregunta y menos de 4 MB, por el límite del cuerpo de una función en Vercel.
  - **Frases fantasma:** Whisper inventa texto con silencio o ruido ("Gracias.", "¿Qué?") y, si se le da una pista de contexto, la repite. Por eso:
    - no se usa pista;
    - el navegador mide el volumen y no envía si no hubo voz;
    - el servidor descarta las frases fantasma conocidas y las palabras sueltas muy cortas.

    Está probado en `npm run humo`: un ruido sin voz no se manda como pregunta.
- **Identidad**: mientras Del Río no autorice una, se usa un personaje genérico con nombre y colores
  configurables en un solo lugar (`lib/avatar.ts`). **No** se usan el logotipo ni la marca de Del Río/Superette
  sin autorización.

## Descartado (para este fin de semana)
- Avatares de video con lip-sync realista (HeyGen, D-ID, etc.): costo, latencia, otra cuenta y otro proveedor
  con datos de Del Río, por una mejora que el reto marca como opcional.
- 3D (three.js): más tiempo en la apariencia que en lo que se evalúa (exactitud, citas, canalización).

## Con el manual del reto (9-oct, ADR 0013)
El escenario es **Tienda Escuela** (ficticia). La identidad del asistente sigue siendo provisional y sin marca de
Del Río ni de Superette.

## Pendiente
Preguntar en `#reto-del-rio` o en el taller del viernes 10:00 (Ramsés Salinas): ¿tienen mascota o personaje?
¿Colores y logotipo autorizados? ¿Nombre preferido para el asistente?
