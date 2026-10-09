# ADR 0005 — Avatar: personaje 2D con estados, voz opcional

- Estado: **aceptado (2026-10-08)**; la identidad visual queda **pendiente de autorización de Del Río**.

## Decisión
- **Personaje 2D en SVG** con estados: `reposo`, `pensando`, `hablando`, `canalizando`. Animación con CSS
  (parpadeo, boca que se mueve mientras sale el texto o la voz). Sin dependencias pesadas.
- **Conversación por texto** (lo mínimo que pide el reto) con el avatar al lado del chat.
- **Voz opcional** con la Web Speech API del navegador (`speechSynthesis`, voz `es-MX` si existe): gratis, sin
  proveedor nuevo, se apaga con un botón. Si una voz suena mal en el equipo de la demo, se apaga y no pasa nada.
- **Entrada por voz (opcional, después)**: Whisper en Groq (`groq.transcription('whisper-large-v3')`), ya
  disponible en el SDK.
- **Identidad**: mientras Del Río no autorice una, se usa un personaje genérico con nombre y colores
  configurables en un solo lugar (`lib/avatar.ts`). **No** se usan el logotipo ni la marca de Del Río/Superette
  sin autorización.

## Descartado (para este fin de semana)
- Avatares de video con lip-sync realista (HeyGen, D-ID, etc.): costo, latencia, otra cuenta y otro proveedor
  con datos de Del Río, por una mejora que el reto marca como opcional.
- 3D (three.js): más tiempo en la apariencia que en lo que se evalúa (exactitud, citas, canalización).

## Pendiente
Preguntar en `#reto-del-rio` o en el taller del viernes 10:00 (Ramsés Salinas): ¿tienen mascota o personaje?
¿Colores y logotipo autorizados? ¿Nombre preferido para el asistente?
