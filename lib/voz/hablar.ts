// La voz del asistente (docs/adr/0016): un RESUMEN hablado de la respuesta (2 o 3 frases), dicho por Azure Speech con
// una voz neural de México; el detalle y las citas se quedan en pantalla. Lógica pura aquí (con pruebas): el SSML, la
// petición del resumen y el resumen de respaldo si el modelo no responde.

import type { Peticion } from '../ia/cadena.ts';
import { textoPlano } from '../conocimiento/citas.ts';

/** Hasta aquí se acepta la respuesta escrita que llega a /api/voz. */
export const MAX_TEXTO_VOZ = 4000;
/** Lo que se dice en voz alta: corto, para que suene a persona y no a lectura. */
export const MAX_RESUMEN = 300;
export const VOZ_POR_OMISION = 'es-MX-DaliaNeural';
/** Las líneas del cliente simulado se dicen tal cual (modo literal), cortas. */
export const MAX_LITERAL = 600;

/** Quién habla: la asistente (coach) o el cliente simulado de la práctica. El servidor elige la voz; el navegador nunca. */
export type Quien = 'asistente' | 'cliente' | 'clienta';
export const VOCES: Record<Quien, { variable: string; omision: string }> = {
  asistente: { variable: 'AZURE_VOZ', omision: VOZ_POR_OMISION },
  cliente: { variable: 'AZURE_VOZ_CLIENTE', omision: 'es-MX-JorgeNeural' },
  clienta: { variable: 'AZURE_VOZ_CLIENTA', omision: 'es-MX-BeatrizNeural' },
};

/** El personaje de la práctica ("señora que quiere cancelar…") decide si su voz es de mujer o de hombre. */
export function quienEs(personaje: string): Quien {
  return /\b(se[ñn]ora|clienta|mujer|ella|muchacha|chica|abuela|mam[aá]|madre|joven madre|estudiante universitaria|supervisora|gerente mujer)\b/i.test(personaje)
    ? 'clienta'
    : 'cliente';
}

export function escaparXml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Frases del resumen separadas por una pausa breve, un poco más despacio que lo normal. */
export function ssml(texto: string, voz: string): string {
  const frases = texto.split(/(?<=[.!?¿¡])\s+/).map(f => f.trim()).filter(Boolean).map(escaparXml);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX">` +
    `<voice name="${escaparXml(voz)}"><prosody rate="-5%">${frases.join('<break time="300ms"/>')}</prosody></voice></speak>`
  );
}

/** El modelo rápido convierte la respuesta escrita en lo que se dice: sin inventar nada (Exactitud, 30 %). */
export function peticionResumen(respuesta: string, canaliza: 'supervisor' | 'rh' | null): Peticion {
  const aviso = canaliza
    ? ` La respuesta canaliza la duda a ${canaliza === 'rh' ? 'Recursos Humanos' : 'su supervisor'}: dilo UNA sola vez, al final ("ya le avisé a ${canaliza === 'rh' ? 'Recursos Humanos' : 'tu supervisor'}").`
    : '';
  return {
    instructions:
      'Conviertes la respuesta escrita de un asistente de capacitación en lo que dirá en voz alta. Escribe 2 o 3 frases ' +
      `naturales en español de México, hablándole de tú a la persona, de máximo ${MAX_RESUMEN - 20} caracteres en total. ` +
      'Di SOLO lo que dice la respuesta: no agregues datos, montos, pasos ni reglas, y no cambies quién hace qué ' +
      '(cliente, cajero, supervisor) ni el orden de los pasos. Sin citas, corchetes, listas, ' +
      'viñetas, emojis ni símbolos. El dinero se escribe así: "160 pesos con 50 centavos". Si es un cálculo, di solo el ' +
      'resultado final y "te dejo el desglose en la pantalla". SOLO si la respuesta trae una lista de pasos o ' +
      `detalles que no caben, termina con "Te dejo los pasos en la pantalla."${aviso} Responde solo el texto que se va a decir.`,
    messages: [{ role: 'user', content: textoPlano(respuesta).slice(0, MAX_TEXTO_VOZ) }],
    maxOutputTokens: 1200,
    temperature: 0,
  };
}

/** Recorta en la última frase completa que quepa. */
function recortar(t: string, max: number): string {
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('? '), corte.lastIndexOf('! '));
  return fin > 40 ? corte.slice(0, fin + 1) : `${corte.slice(0, corte.lastIndexOf(' '))}…`;
}

/** Lo que devolvió el modelo, listo para decirse: sin marcas, viñetas ni símbolos sueltos. */
export function limpiarResumen(t: string): string {
  const limpio = textoPlano(t)
    .replace(/^\s*(?:\d+[.)]|[-•*])\s+/gm, '')
    .replace(/[\[\]【】{}<>|~^_`#*]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
  return recortar(limpio, MAX_RESUMEN);
}

/** Si el modelo no responde: la primera frase y los dos primeros pasos, recortado. */
export function resumenDeRespaldo(respuesta: string, canaliza: 'supervisor' | 'rh' | null): string {
  const lineas = textoPlano(respuesta).split('\n').map(l => l.trim()).filter(Boolean);
  const pasos = lineas.filter(l => /^(?:\d+[.)]|[-•*])\s+/.test(l)).map(l => l.replace(/^(?:\d+[.)]|[-•*])\s+/, ''));
  const primera = (lineas.find(l => !/^(?:\d+[.)]|[-•*])\s+/.test(l)) ?? '').split(/(?<=[.!?])\s/)[0] ?? '';
  const partes = [primera, ...pasos.slice(0, 2)].map(p => p.replace(/[.:;,\s]+$/, '')).filter(Boolean);
  let dicho = partes.join('. ');
  if (dicho) dicho += '.';
  const cierre = canaliza ? ` Ya le avisé a ${canaliza === 'rh' ? 'Recursos Humanos' : 'tu supervisor'}.` : pasos.length > 2 ? ' Te dejo los pasos en la pantalla.' : '';
  return recortar(limpiarResumen(dicho), MAX_RESUMEN - cierre.length) + cierre;
}

/** Mayúscula al empezar el texto y después de cada punto, signo de admiración o de interrogación. */
const mayusculas = (t: string) => t.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, antes: string, letra: string) => antes + letra.toUpperCase());

/** Una oración que dice que la duda ya se canalizó. */
const AVISO = /avis[eé]|te lo paso|le paso|lo paso a|canalic/i;

/** Cuántos pasos en lista trae una respuesta escrita. */
const pasosDe = (respuesta: string) => textoPlano(respuesta).split('\n').filter(l => /^\s*(?:\d+[.)]|[-•*])\s+/.test(l)).length;

/**
 * Lo que dijo el modelo, con lo que NO puede faltar (no se deja al modelo): si la respuesta trae más pasos de los que
 * se dicen, «Te dejo los pasos en la pantalla»; si canaliza, el aviso (una sola vez).
 */
export function completarResumen(resumen: string, respuesta: string, canaliza: 'supervisor' | 'rh' | null): string {
  const destino = canaliza === 'rh' ? 'Recursos Humanos' : 'tu supervisor';
  // Sin pasos (o si canaliza) no hay «pasos en la pantalla», aunque el modelo lo diga (Bart, en producción: «Eso no
  // está en el material. Te dejo los pasos en la pantalla. ya le avisé a Recursos Humanos»).
  if (canaliza || pasosDe(respuesta) <= 2) resumen = resumen.replace(/\s*te dejo los pasos en la pantalla\.?/gi, ' ');
  resumen = mayusculas(resumen.replace(/\s+/g, ' ').trim());
  if (canaliza) {
    // El aviso una sola vez: si el modelo dijo «te lo paso a RH…» y también «ya le avisé a RH», queda el último.
    const frases = resumen.split(/(?<=[.!?])\s+/);
    const avisos = frases.filter(f => AVISO.test(f));
    if (avisos.length > 1) resumen = frases.filter(f => !AVISO.test(f) || f === avisos.at(-1)).join(' ');
  }
  const cierre =
    canaliza && !AVISO.test(resumen) && !/ya sabe/i.test(resumen) ? ` Ya le avisé a ${destino}.`
    : !canaliza && pasosDe(respuesta) > 2 && !/pantalla/i.test(resumen) ? ' Te dejo los pasos en la pantalla.'
    : '';
  return cierre ? recortar(resumen, MAX_RESUMEN - cierre.length) + cierre : resumen;
}

/** Una línea del cliente simulado, para decirse tal cual: sin marcas ni símbolos, corta. */
export function textoLiteral(t: string): string {
  return recortar(
    textoPlano(t).replace(/[\[\]【】{}<>|~^_`#*]/g, ' ').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim(),
    MAX_LITERAL,
  );
}
