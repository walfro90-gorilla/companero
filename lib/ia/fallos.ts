// Por qué falló un proveedor (portado de brotes/lib/ia/fallos.ts, docs/adr/0003). Lógica pura.
//
// OJO: esto NO decide si se prueba el siguiente proveedor: SIEMPRE se prueba. Cada proveedor tiene su
// propia taxonomía (Groq devuelve 401 a una llave inválida; Google, 400 para lo mismo). Esto solo decide
// cómo se registra, para que una llave muerta se note en vez de quedar tapada por el respaldo.

export type Diagnostico = 'clave' | 'proveedor' | 'nuestro';

export function clasificar(error: unknown): Diagnostico {
  const estado = estadoDe(error);
  const texto = mensajeDe(error).toLowerCase();
  if (estado === 401 || estado === 403) return 'clave';
  if (/api key|api_key|unauthorized|invalid.*credential|permission denied/.test(texto)) return 'clave';
  if (estado === undefined) return 'proveedor'; // red, DNS o cortado por plazo
  if (estado === 408 || estado === 429 || estado >= 500) return 'proveedor';
  return 'nuestro';
}

export function comoRegistrar(diagnostico: Diagnostico | 'vacio'): string {
  switch (diagnostico) {
    case 'clave':
      return 'LLAVE INVÁLIDA O REVOCADA: revísala, el respaldo la está tapando';
    case 'proveedor':
      return 'el proveedor no respondió';
    case 'nuestro':
      return 'petición rechazada; probablemente un fallo nuestro';
    case 'vacio':
      return 'respuesta vacía (¿el razonamiento se comió los tokens?)';
  }
}

function estadoDe(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  for (const clave of ['statusCode', 'status'] as const) {
    const valor = (error as Record<string, unknown>)[clave];
    if (typeof valor === 'number') return valor;
  }
  return undefined;
}

function mensajeDe(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return '';
}
