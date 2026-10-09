// Reescritura de la consulta (paso previo a la búsqueda del RAG; prueba del 9-oct, ADR 0013). Las preguntas de un
// empleado usan sus palabras ("¿cuánto efectivo puedo tener en la gaveta?") y el manual las suyas ("retiro a
// resguardo", "más de $3,000"). Un modelo rápido traduce la pregunta a palabras clave del vocabulario de un manual
// y se buscan juntas con la pregunta original. Lógica pura aquí (con pruebas).

import type { Peticion } from '../ia/cadena.ts';

export function peticionReescritura(consulta: string, giro?: string | null): Peticion {
  return {
    instructions:
      `Ayudas a buscar en el manual de procedimientos de una empresa${giro ? ` (${giro})` : ''}. Convierte la pregunta de un empleado ` +
      'en 8 a 15 palabras clave como las escribiría el manual: el tema, sustantivos formales y sinónimos ' +
      '(por ejemplo "devolver" → "devolución plazo ventana condiciones"; "cerrar caja" → "cierre corte conciliación"; ' +
      '"cuánto dinero puedo tener" → "límite efectivo gaveta retiro"). Sin explicaciones ni signos: responde solo las palabras separadas por espacios.',
    messages: [{ role: 'user', content: consulta.slice(0, 800) }],
    maxOutputTokens: 1200,
    // Determinista en lo posible: la misma pregunta debe buscar lo mismo (medido en pruebas/busqueda.json).
    temperature: 0,
  };
}

/** Limpia lo que devolvió el modelo: solo palabras, máximo 20. */
export function leerPalabras(texto: string): string {
  return texto
    .replace(/[^\p{L}\p{N}\s$]/gu, ' ')
    .split(/\s+/)
    .filter(p => p.length > 1)
    .slice(0, 20)
    .join(' ');
}
