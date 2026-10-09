// Un PDF con títulos con estilo → secciones citables como las cita el propio documento (docs/adr/0013).
// Lógica pura, con pruebas: recibe los fragmentos de texto de cada página (con posición y tamaño de letra, lo que
// da unpdf) y devuelve secciones con su referencia, p. ej. «sección 5, Si la segunda parte queda incierta».
//
// La jerarquía se deduce del tamaño de letra: el texto normal es el tamaño más usado; los títulos son tamaños
// mayores que se repiten (los de una sola vez, como "Aviso", se quedan como texto). El mayor que solo aparece en
// la portada se ignora. El más grande que queda es el nivel 1 (secciones) y el siguiente el nivel 2 (subtítulos).
// Si el PDF no tiene jerarquía visible, se devuelve null y se parte por páginas.

import { limpiarTexto, trocear, type SeccionCruda } from './seccionar.ts';

export type Fragmento = { str: string; x: number; y: number; width: number; fontSize: number; hasEOL?: boolean };
export type Linea = { texto: string; tamano: number; pagina: number };

const redondear = (n: number) => Math.round(n * 10) / 10;

/** Agrupa fragmentos en líneas por su altura en la página. Un hueco ancho entre fragmentos (columnas de una tabla) se marca con " · ". */
export function lineasDeFragmentos(paginas: Fragmento[][]): Linea[] {
  const lineas: Linea[] = [];
  paginas.forEach((frags, i) => {
    let actual: Fragmento[] = [];
    const cerrar = () => {
      if (!actual.length) return;
      let texto = '';
      actual.forEach((f, j) => {
        const previo = actual[j - 1];
        if (previo) {
          const hueco = f.x - (previo.x + previo.width);
          texto += hueco > Math.max(previo.fontSize, f.fontSize) * 1.5 ? ' · ' : hueco > 1 && !texto.endsWith(' ') && !f.str.startsWith(' ') ? ' ' : '';
        }
        texto += f.str;
      });
      const limpio = texto.replace(/\s+/g, ' ').trim();
      if (limpio) lineas.push({ texto: limpio, tamano: redondear(Math.max(...actual.map(a => a.fontSize))), pagina: i + 1 });
      actual = [];
    };
    // Orden visual (de arriba abajo y de izquierda a derecha): el orden interno del PDF no siempre lo es, y los
    // pasos de un procedimiento podían quedar después del subtítulo siguiente. En PDF la y crece hacia arriba.
    const ordenados = frags.filter(f => f.str.trim()).sort((a, b) => (Math.abs(a.y - b.y) > 2 ? b.y - a.y : a.x - b.x));
    for (const f of ordenados) {
      if (actual.length && Math.abs(f.y - actual[actual.length - 1].y) > 2) cerrar();
      actual.push(f);
    }
    cerrar();
  });
  return lineas;
}

/** Quita encabezados y pies de página: líneas que se repiten (ignorando números) en al menos 40 % de las páginas. */
export function quitarRepetidas(lineas: Linea[]): Linea[] {
  const paginas = new Set(lineas.map(l => l.pagina)).size;
  if (paginas < 3) return lineas;
  const clave = (t: string) => t.replace(/\d+/g, '#').toLowerCase();
  const enPaginas = new Map<string, Set<number>>();
  for (const l of lineas) {
    const k = clave(l.texto);
    if (!enPaginas.has(k)) enPaginas.set(k, new Set());
    enPaginas.get(k)!.add(l.pagina);
  }
  const repetidas = new Set([...enPaginas].filter(([k, p]) => p.size >= Math.max(3, paginas * 0.4) && k.replace(/[#\s·.,-]/g, '').length > 3).map(([k]) => k));
  return lineas.filter(l => !repetidas.has(clave(l.texto)));
}

export type Niveles = { cuerpo: number; n1: number; n2: number | null };

export function nivelesDeTitulo(lineas: Linea[]): Niveles | null {
  const porTamano = new Map<number, { caracteres: number; lineas: number; paginas: Set<number> }>();
  for (const l of lineas) {
    const t = porTamano.get(l.tamano) ?? { caracteres: 0, lineas: 0, paginas: new Set<number>() };
    t.caracteres += l.texto.length;
    t.lineas += 1;
    t.paginas.add(l.pagina);
    porTamano.set(l.tamano, t);
  }
  const cuerpo = [...porTamano].sort((a, b) => b[1].caracteres - a[1].caracteres)[0]?.[0];
  if (cuerpo === undefined) return null;
  const primera = Math.min(...lineas.map(l => l.pagina));
  const titulos = [...porTamano]
    .filter(([tam, t]) => tam > cuerpo + 0.5 && t.lineas >= 3 && !(t.paginas.size === 1 && t.paginas.has(primera)))
    .map(([tam]) => tam)
    .sort((a, b) => b - a);
  if (!titulos.length) return null;
  return { cuerpo, n1: titulos[0], n2: titulos[1] ?? null };
}

/** "5 Pagos mixtos y ventas pendientes" → { numero: '5', nombre: 'Pagos mixtos y ventas pendientes' } */
function partirCapitulo(t: string): { numero: string | null; nombre: string } {
  const m = /^(\d{1,3})\s+(\S.*)$/.exec(t);
  return m ? { numero: m[1], nombre: m[2] } : { numero: null, nombre: t };
}

export function seccionarPorTitulos(entrada: Linea[], tituloDocumento: string): SeccionCruda[] | null {
  const lineas = quitarRepetidas(entrada);
  const niveles = nivelesDeTitulo(lineas);
  if (!niveles) return null;
  const nivel = (l: Linea) => (Math.abs(l.tamano - niveles.n1) < 0.3 ? 1 : niveles.n2 !== null && Math.abs(l.tamano - niveles.n2) < 0.3 ? 2 : 0);

  // Une títulos partidos en varias líneas del mismo nivel. El número grande de una sección ("6") puede quedar en
  // su propia línea, a media altura entre las dos líneas del título: se le pega al título de nivel 1.
  const unidas: (Linea & { nivel: number })[] = [];
  let numeroPendiente: string | null = null;
  for (const l of lineas) {
    const n = nivel(l);
    const previa = unidas[unidas.length - 1];
    if (n === 0 && /^\d{1,3}$/.test(l.texto) && l.tamano > niveles.cuerpo + 0.5) {
      if (previa?.nivel === 1 && previa.pagina === l.pagina && !/^\d/.test(previa.texto)) previa.texto = `${l.texto} ${previa.texto}`;
      else numeroPendiente = l.texto;
      continue;
    }
    if (n > 0 && previa && previa.nivel === n && previa.pagina === l.pagina) previa.texto = `${previa.texto} ${l.texto}`;
    else unidas.push({ ...l, texto: n === 1 && numeroPendiente ? `${numeroPendiente} ${l.texto}` : l.texto, nivel: n });
    if (n === 1) numeroPendiente = null;
  }

  const secciones: SeccionCruda[] = [];
  let capitulo: { numero: string | null; nombre: string } | null = null;
  let actual: { titulo: string; referencia: string; pagina: number; lineas: string[] } = {
    titulo: 'Presentación', referencia: `${tituloDocumento}, presentación`, pagina: unidas[0]?.pagina ?? 1, lineas: [],
  };
  const cerrar = () => {
    const texto = limpiarTexto(actual.lineas.join('\n'));
    if (texto.split(/\s+/).length >= 4) secciones.push({ titulo: actual.titulo, texto, pagina: actual.pagina, referencia: actual.referencia });
  };
  for (const l of unidas) {
    if (l.nivel === 1) {
      cerrar();
      capitulo = partirCapitulo(l.texto);
      actual = {
        titulo: capitulo.nombre,
        referencia: capitulo.numero ? `sección ${capitulo.numero}` : capitulo.nombre,
        pagina: l.pagina, lineas: [],
      };
    } else if (l.nivel === 2) {
      cerrar();
      actual = {
        titulo: l.texto,
        referencia: capitulo ? `${capitulo.numero ? `sección ${capitulo.numero}` : capitulo.nombre}, ${l.texto}` : l.texto,
        pagina: l.pagina, lineas: [],
      };
    } else {
      actual.lineas.push(l.texto);
    }
  }
  cerrar();
  if (secciones.length < 2) return null;
  return secciones.flatMap(s => trocear(s));
}
