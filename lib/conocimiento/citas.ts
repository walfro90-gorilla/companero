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

// Tolera espacios dentro de los corchetes ("[ D1-7 ]") y los corchetes 【】 que usa gpt-oss en Groq (prueba
// documentada del 9-oct): el contenido era correcto y la cita no se reconocía.
const MARCA = /[\[【]\s*((?:D\d+-\d+\s*,\s*)*D\d+-\d+)\s*[\]】]|[\[【]\s*CANALIZAR:\s*(supervisor|rh)\s*[\]】]/gi;

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
    const ids = m[1].split(',').map(x => x.trim().toUpperCase());
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
