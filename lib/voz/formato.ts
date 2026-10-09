// Pulsar para hablar (docs/adr/0005): reglas puras del audio que sube el navegador. Con pruebas.

/** Menos que esto es un toque accidental; más, se corta (preguntas cortas, y el cuerpo de una función en Vercel no pasa de 4.5 MB). */
export const MIN_MS = 500;
export const MAX_MS = 30_000;
export const MAX_BYTES = 4 * 1024 * 1024;

const PREFERIDOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];

/** El primer formato que el navegador sabe grabar (Chrome/Firefox: webm u ogg; Safari: mp4). */
export function elegirFormato(soporta: (tipo: string) => boolean): string | null {
  return PREFERIDOS.find(t => soporta(t)) ?? null;
}

/** Extensión para el archivo que se manda a Whisper (la usa para reconocer el formato). */
export function extensionDe(tipo: string): string {
  const base = tipo.split(';')[0];
  return base === 'audio/mp4' ? 'm4a' : base === 'audio/ogg' ? 'ogg' : base === 'audio/mpeg' ? 'mp3' : base === 'audio/wav' ? 'wav' : 'webm';
}

// Frases que Whisper inventa con silencio, ruido o música (vienen de subtítulos de video con los que se entrenó).
const FANTASMAS = new Set([
  'gracias', 'muchas gracias', 'gracias por ver', 'gracias por ver el video', 'gracias por su atencion', 'musica',
  'hasta la proxima', 'adios', 'chao', 'y', 'eh', 'mm', 'ah', 'ok',
]);
const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Whisper a veces "oye" frases fantasma en el silencio o el ruido; si no queda texto útil, no se manda nada. */
export function textoUtil(texto: string): string | null {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  const n = normalizar(limpio);
  // Una sola palabra muy corta ("¿Qué?" con un ruido) no es una pregunta; "¿Devoluciones?" sí.
  if (n.length < 3 || FANTASMAS.has(n) || (!n.includes(' ') && n.length < 8)) return null;
  if (/amara org|suscribete|subtitulos (realizados|por)|\[?musica\]?$/.test(n)) return null;
  return limpio;
}

/** Nivel de voz (RMS 0–1) por debajo del cual se considera que no se habló. */
export const VOLUMEN_MINIMO = 0.015;
