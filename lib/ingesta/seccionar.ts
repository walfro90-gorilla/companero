// De un documento a secciones citables (docs/adr/0010). Lógica pura, con pruebas.
//
// Una sección es la unidad que el asistente cita (D{n}-{orden}) y que la persona abre para verificar. Se
// respeta la estructura del original: los encabezados de Markdown/Word, o las páginas de un PDF (así la cita
// apunta a la página que se puede revisar). Las secciones demasiado largas se parten por párrafos.

/** `referencia`: cómo la cita el propio documento (p. ej. «sección 5, Si la segunda parte queda incierta»), si se sabe. */
export type SeccionCruda = { titulo: string; texto: string; pagina?: number; referencia?: string };

export const MAX_PALABRAS = 700;

const ENCABEZADO = /^(#{1,4})\s+(.+?)\s*#*\s*$/;

/** Normaliza saltos y espacios; une palabras cortadas con guion al final de línea (típico de PDF). */
export function limpiarTexto(t: string): string {
  return t
    .replace(/\r\n?/g, '\n')
    .replace(/­/g, '')
    .replace(/([a-záéíóúñü])-\n([a-záéíóúñü])/gi, '$1$2')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Quita el encabezado `--- clave: valor ---` (formato de conocimiento/*.md). */
export function sinEncabezado(md: string): { campos: Record<string, string>; cuerpo: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!m) return { campos: {}, cuerpo: md };
  const campos: Record<string, string> = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const i = linea.indexOf(':');
    if (i > 0) campos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return { campos, cuerpo: md.slice(m[0].length) };
}

const palabras = (t: string) => (t.match(/\S+/g) ?? []).length;

/** Parte una sección larga por párrafos: "Cobro", "Cobro (2)"… */
export function trocear(s: SeccionCruda, max = MAX_PALABRAS): SeccionCruda[] {
  if (palabras(s.texto) <= max) return [s];
  const partes: string[] = [];
  let actual: string[] = [];
  let cuenta = 0;
  for (const parrafo of s.texto.split(/\n{2,}/)) {
    const n = palabras(parrafo);
    if (cuenta > 0 && cuenta + n > max) {
      partes.push(actual.join('\n\n'));
      actual = [];
      cuenta = 0;
    }
    actual.push(parrafo);
    cuenta += n;
  }
  if (actual.length) partes.push(actual.join('\n\n'));
  return partes.map((texto, i) => ({ ...s, titulo: i === 0 ? s.titulo : `${s.titulo} (${i + 1})`, texto }));
}

/**
 * Markdown → secciones. Corta en el nivel de encabezado que da más de una sección, prefiriendo ## (el
 * formato de conocimiento/*.md), luego ### y luego #. Lo que va antes del primer encabezado es la
 * introducción; si tiene contenido, también se cita.
 */
export function seccionarMarkdown(md: string, tituloDocumento: string): SeccionCruda[] {
  const { cuerpo } = sinEncabezado(md);
  const lineas = limpiarTexto(cuerpo).split('\n');
  const cuenta = new Map<number, number>();
  for (const l of lineas) {
    const h = ENCABEZADO.exec(l);
    if (h) cuenta.set(h[1].length, (cuenta.get(h[1].length) ?? 0) + 1);
  }
  const nivel = [2, 3, 1, 4].find(n => (cuenta.get(n) ?? 0) >= 2) ?? [2, 3, 1, 4].find(n => (cuenta.get(n) ?? 0) >= 1);

  const secciones: SeccionCruda[] = [];
  let actual: { titulo: string; lineas: string[] } = { titulo: 'Introducción', lineas: [] };
  const cerrar = () => {
    const texto = actual.lineas.join('\n').trim();
    if (texto) secciones.push({ titulo: actual.titulo, texto });
  };
  for (const l of lineas) {
    const h = ENCABEZADO.exec(l);
    if (h && nivel !== undefined && h[1].length === nivel) {
      cerrar();
      actual = { titulo: h[2].replace(/\*\*/g, '').trim(), lineas: [] };
    } else if (h && nivel !== undefined && h[1].length < nivel) {
      // Un título de nivel superior (p. ej. el # del documento) no abre sección ni ensucia el texto.
      continue;
    } else {
      actual.lineas.push(h ? `**${h[2].trim()}**` : l);
    }
  }
  cerrar();
  if (secciones.length === 1 && secciones[0].titulo === 'Introducción') secciones[0].titulo = tituloDocumento;
  return secciones.flatMap(s => trocear(s));
}

/** Título de una página de PDF: su primera línea corta y con letras; si no hay, "Página n". */
function tituloDePagina(texto: string, n: number): string {
  const primera = texto.split('\n').map(l => l.trim()).find(l => /[a-záéíóúñ]/i.test(l));
  return primera && primera.length <= 80 ? primera.replace(/[.:]+$/, '') : `Página ${n}`;
}

/** Páginas de un PDF → una sección por página (la cita lleva la página del original). */
export function seccionarPaginas(paginas: string[]): SeccionCruda[] {
  return paginas.flatMap((crudo, i) => {
    const texto = limpiarTexto(crudo);
    if (palabras(texto) < 5) return [];
    return trocear({ titulo: tituloDePagina(texto, i + 1), texto, pagina: i + 1 });
  });
}
