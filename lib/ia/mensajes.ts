import type { ModelMessage } from 'ai';

// Mensajes del chat (lógica pura): los usa la ruta del asistente, la práctica y la prueba documentada.

export type Mensaje = { rol: 'usuario' | 'avatar'; texto: string };

export const MAX_MENSAJES = 12;
export const MAX_CARACTERES = 2000;

export function aMensajesModelo(mensajes: Mensaje[]): ModelMessage[] {
  return mensajes.slice(-MAX_MENSAJES).map(m => (
    m.rol === 'usuario'
      ? { role: 'user' as const, content: m.texto.slice(0, MAX_CARACTERES) }
      : { role: 'assistant' as const, content: m.texto.slice(0, MAX_CARACTERES) }
  ));
}
