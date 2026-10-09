// Número de reloj (docs/adr/0014): el empleado entra solo con él. Lógica pura, con pruebas.

/** " 12-ab " → "12-AB". Solo letras, números y guion; hasta 20. */
export function normalizarNumero(entrada: string): string | null {
  const n = entrada.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-Z0-9-]{1,20}$/.test(n) ? n : null;
}

/**
 * Correo interno del usuario de Auth de un empleado. Nunca recibe correos (dominio .invalid, reservado): solo
 * le da a Supabase un identificador único por empresa y número.
 */
export function correoDeEmpleado(empresaId: string, numero: string): string {
  return `r-${empresaId}-${numero.toLowerCase()}@reloj.companero.invalid`;
}

export const esCorreoDeEmpleado = (email: string | null | undefined) => Boolean(email?.endsWith('@reloj.companero.invalid'));

/** Intentos fallidos permitidos por IP en la ventana; luego se bloquea un rato (para que no adivinen números). */
export const LIMITE_FALLOS = 8;
export const VENTANA_MIN = 10;

/** "0001\n0002, Ana\n0003" → [{ numero: '0001' }, { numero: '0002', nombre: 'Ana' }, …] (alta en lote de RH). */
export function leerLista(texto: string): { numero: string; nombre: string | null }[] | { error: string } {
  const filas: { numero: string; nombre: string | null }[] = [];
  for (const [i, linea] of texto.split(/\r?\n/).entries()) {
    if (!linea.trim()) continue;
    const [crudo, ...resto] = linea.split(/[,;\t]/);
    const numero = normalizarNumero(crudo);
    if (!numero) return { error: `Renglón ${i + 1}: "${crudo.trim()}" no es un número de reloj válido (letras, números o guion).` };
    if (filas.some(f => f.numero === numero)) return { error: `El número ${numero} está repetido.` };
    filas.push({ numero, nombre: resto.join(',').trim().slice(0, 60) || null });
  }
  if (!filas.length) return { error: 'Escribe al menos un número de reloj.' };
  if (filas.length > 200) return { error: 'Máximo 200 empleados por lote.' };
  return filas;
}
