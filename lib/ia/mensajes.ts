import type { ModelMessage } from 'ai';

// Mensajes del chat (lógica pura): los usa la ruta del asistente, la práctica y la prueba documentada.

export type Mensaje = { rol: 'usuario' | 'avatar'; texto: string };

export const MAX_MENSAJES = 12;
/** Lo que puede escribir la persona en UNA pregunta (o turno de práctica). */
export const MAX_CARACTERES = 2000;
/**
 * El historial que llega del navegador se valida con holgura: las respuestas de la asistente pueden pasar de 2000
 * caracteres (un corte de caja con cálculo), y si el historial se rechazara, TODAS las preguntas siguientes de esa
 * conversación fallarían (lo encontró Bart en producción). Al modelo solo le llegan los últimos MAX_MENSAJES, recortados.
 */
export const MAX_CARACTERES_HISTORIAL = 12_000;
export const MAX_MENSAJES_HISTORIAL = 200;

export function aMensajesModelo(mensajes: Mensaje[]): ModelMessage[] {
  return mensajes.slice(-MAX_MENSAJES).map(m => (
    m.rol === 'usuario'
      ? { role: 'user' as const, content: m.texto.slice(0, MAX_CARACTERES) }
      : { role: 'assistant' as const, content: m.texto.slice(0, MAX_CARACTERES) }
  ));
}
