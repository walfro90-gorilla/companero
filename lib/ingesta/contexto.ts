// Contextual Retrieval (Anthropic), docs/adr/0010: antes de indexar, la IA escribe para cada sección de qué
// trata dentro del documento y qué preguntas responde, con las palabras de un empleado nuevo. Eso entra al
// índice de búsqueda con peso B y acerca "me equivoqué al cobrar" a "Cancelaciones". La parte de armar el
// prompt y leer la respuesta es pura (con pruebas); la llamada usa la cadena de proveedores.

import type { Peticion } from '../ia/cadena.ts';

export type ParaContexto = { orden: number; titulo: string; texto: string };

const MAX_CARACTERES_SECCION = 1500;

export function peticionContexto(empresa: string, documento: string, secciones: ParaContexto[]): Peticion {
  const cuerpo = secciones
    .map(s => `<seccion orden="${s.orden}" titulo="${s.titulo.replace(/"/g, "'")}">\n${s.texto.slice(0, MAX_CARACTERES_SECCION)}\n</seccion>`)
    .join('\n\n');
  return {
    instructions:
      'Preparas material de capacitación de una empresa para un buscador. Para cada sección escribes, en español de México:\n' +
      '1. Una oración que diga de qué trata la sección dentro del documento.\n' +
      '2. De 3 a 5 preguntas cortas que esa sección responde, escritas como las haría un empleado nuevo, con palabras cotidianas y sinónimos (no copies el título).\n' +
      'No agregues información que no esté en la sección. Responde SOLO con JSON: {"secciones":[{"orden":1,"contexto":"Oración. ¿Pregunta 1? ¿Pregunta 2?"}]}',
    messages: [{ role: 'user', content: `Empresa: ${empresa}\nDocumento: ${documento}\n\n${cuerpo}` }],
    maxOutputTokens: 4000,
  };
}

/** Lee {"secciones":[{orden, contexto}]} sin confiar en el modelo: ignora lo que no tenga forma. */
export function leerContextos(json: unknown, ordenes: number[]): Map<number, string> {
  const validos = new Set(ordenes);
  const fuera = new Map<number, string>();
  const lista = (json as { secciones?: unknown })?.secciones;
  if (!Array.isArray(lista)) return fuera;
  for (const x of lista) {
    const orden = Number((x as { orden?: unknown })?.orden);
    const contexto = (x as { contexto?: unknown })?.contexto;
    if (validos.has(orden) && typeof contexto === 'string' && contexto.trim()) fuera.set(orden, contexto.trim().slice(0, 800));
  }
  return fuera;
}

/** Lotes para no mandar documentos enormes en una sola llamada. */
export function lotes<T>(xs: T[], tam: number): T[][] {
  const fuera: T[][] = [];
  for (let i = 0; i < xs.length; i += tam) fuera.push(xs.slice(i, i + tam));
  return fuera;
}
