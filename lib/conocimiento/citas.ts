// Citas y canalizaciones en el texto del modelo (docs/adr/0004). Lógica pura; corre en el servidor (prueba
// documentada) y en el navegador (mostrar referencias).
//
// El modelo escribe `[D1-3]` (o `[D1-3, D2-1]`) para citar y termina con `[CANALIZAR:supervisor]` o
// `[CANALIZAR:rh]` cuando no hay sustento o el tema no le toca. Una cita a una sección inexistente NUNCA se
// muestra como fuente: se reporta como inválida.

export type Destino = 'supervisor' | 'rh';

export type Trozo = { tipo: 'texto'; texto: string } | { tipo: 'cita'; ids: string[] };

export type Analisis = {
  trozos: Trozo[];
  /** Citas a secciones que existen, en orden de aparición y sin repetir. */
  citas: string[];
  /** Citas a secciones que NO existen (error del modelo: se registra, no se muestra). */
  invalidas: string[];
  canalizar: Destino | null;
};

// Lo que de verdad escriben los modelos (pruebas del 9-oct), y que tiene que reconocerse como cita:
//   - corchetes 【】 de gpt-oss en Groq y espacios dentro ("[ D1-7 ]");
//   - cualquier guion: Groq usa a veces el guion que no se corta (U+2011: "[D1‑51]"), y sin reconocerlo la respuesta
//     salía SIN fuentes (lo encontró Bart en producción: «¿Cómo hago una cancelación?» con 12 citas y 0 reconocidas);
//   - varios códigos ("[D1‑6, D1‑36]", "[D1-6; D1-7]", "[D1-6 y D1-7]") y un texto corto después ("[D1‑53, paso 1]").
// El código se normaliza a "D1-53" (guion ASCII, mayúsculas) antes de validarlo contra lo consultado.
const GUION = '[-\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]';
const CODIGO = `D\\d+\\s*${GUION}\\s*\\d+`;
const SEPARADOR = '\\s*(?:[,;/]|\\by\\b)\\s*';
const CITAS = `[\\[【]\\s*(${CODIGO}(?:${SEPARADOR}${CODIGO})*)(?:\\s*[,;:(][^\\]】\\n]{0,40})?\\s*[\\]】]`;
const MARCA = new RegExp(`${CITAS}|[\\[【]\\s*CANALIZAR:\\s*(supervisor|rh)\\s*[\\]】]`, 'gi');

/** "d1‑53 " → "D1-53". */
export const normalizarCodigo = (c: string) => c.replace(new RegExp(GUION, 'g'), '-').replace(/\s+/g, '').toUpperCase();
const codigosDe = (grupo: string) => [...grupo.matchAll(new RegExp(CODIGO, 'gi'))].map(m => normalizarCodigo(m[0]));

/** Todos los códigos citados en un texto, normalizados y en orden (con repetidos). */
export const codigosCitados = (texto: string) => [...texto.matchAll(MARCA)].flatMap(m => (m[1] ? codigosDe(m[1]) : []));

export function analizar(texto: string, existe: (id: string) => boolean): Analisis {
  const trozos: Trozo[] = [];
  const citas: string[] = [];
  const invalidas: string[] = [];
  let canalizar: Destino | null = null;
  let desde = 0;

  for (const m of texto.matchAll(MARCA)) {
    if (m.index > desde) trozos.push({ tipo: 'texto', texto: texto.slice(desde, m.index) });
    desde = m.index + m[0].length;
    if (m[2]) {
      canalizar = m[2].toLowerCase() as Destino;
      continue;
    }
    const ids = codigosDe(m[1]);
    const validos = ids.filter(existe);
    for (const id of ids) {
      if (!existe(id)) {
        if (!invalidas.includes(id)) invalidas.push(id);
      } else if (!citas.includes(id)) {
        citas.push(id);
      }
    }
    if (validos.length) trozos.push({ tipo: 'cita', ids: validos });
  }
  if (desde < texto.length) trozos.push({ tipo: 'texto', texto: texto.slice(desde) });

  // Espacios y saltos que quedan colgando al quitar la marca de canalización del final.
  for (let ultimo = trozos.at(-1); ultimo?.tipo === 'texto'; ultimo = trozos.at(-1)) {
    ultimo.texto = ultimo.texto.trimEnd();
    if (ultimo.texto) break;
    trozos.pop();
  }
  return { trozos, citas, invalidas, canalizar };
}

/** Texto sin marcas, para la voz del avatar. */
export function textoPlano(texto: string): string {
  return texto.replace(MARCA, '').replace(/[*_`#>]/g, '').replace(/\s+\n/g, '\n').trim();
}
