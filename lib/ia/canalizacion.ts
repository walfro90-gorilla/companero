// Red de seguridad de la canalización (prueba documentada del 9-oct, ADR 0013). El modelo a veces explica bien
// "avisa a tu supervisor" pero no escribe la marca [CANALIZAR:supervisor], y entonces la duda no le llega al
// supervisor. Si la respuesta menciona al supervisor sin marca, una pregunta corta a la IA decide si la persona
// está atendiendo una situación en ese momento. Lógica pura aquí (con pruebas); la llamada está en asistente.ts.

import type { Peticion } from './cadena.ts';

const MARCA = /[[【]\s*CANALIZAR:/i;

/** ¿Vale la pena preguntar? Solo si menciona al supervisor y no trae ya una marca de canalización. */
export function revisarCanalizacion(respuesta: string): boolean {
  return !MARCA.test(respuesta) && /supervisor/i.test(respuesta);
}

export function peticionClasificar(pregunta: string, respuesta: string): Peticion {
  return {
    instructions:
      'Eres un verificador. Responde solo SI o NO. Responde SI únicamente si se cumplen las dos condiciones: ' +
      '(1) la persona describe una situación concreta que está atendiendo ahora (un cliente, un cobro, su caja), no una pregunta general ni hipotética; ' +
      'y (2) la respuesta le indica avisar, llamar, consultar o pedir autorización a su supervisor para esa situación.',
    messages: [{ role: 'user', content: `Pregunta de la persona:\n${pregunta.slice(0, 1500)}\n\nRespuesta que recibió:\n${respuesta.slice(0, 3000)}` }],
    maxOutputTokens: 800,
  };
}

export function leerSiNo(texto: string): boolean {
  // Sin \b: en JavaScript la "í" no cuenta como letra para \b y "Sí." no empataba.
  return /^[^a-záéíóúñ]*s[ií](?![a-záéíóúñ])/i.test(texto.trim());
}

export const MARCA_SUPERVISOR = '\n[CANALIZAR:supervisor]';
