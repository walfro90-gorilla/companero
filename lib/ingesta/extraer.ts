import 'server-only';
import mammoth from 'mammoth';
import { extractTextItems } from 'unpdf';
import { htmlAMarkdown } from './html.ts';
import { lineasDeFragmentos, seccionarPorTitulos, type Fragmento } from './pdf.ts';
import { seccionarMarkdown, seccionarPaginas, type SeccionCruda } from './seccionar.ts';

// Del archivo original a secciones (docs/adr/0010). Sin OCR: un PDF escaneado (imagen) no trae texto y se
// pide la versión con texto o pegar el contenido.

export type Tipo = 'pdf' | 'docx' | 'markdown' | 'texto';

export function tipoDe(nombre: string): Tipo | null {
  const ext = nombre.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (ext === 'txt') return 'texto';
  return null;
}

export class DocumentoSinTexto extends Error {}

export async function extraer(tipo: Tipo, bytes: Uint8Array, titulo: string): Promise<SeccionCruda[]> {
  let secciones: SeccionCruda[];
  if (tipo === 'pdf') {
    // Primero por títulos y subtítulos (la cita queda como la pide el documento: «sección 5, Subtítulo»);
    // si el PDF no tiene jerarquía visible, una sección por página (ADR 0013).
    const { items } = await extractTextItems(new Uint8Array(bytes));
    const lineas = lineasDeFragmentos(items as Fragmento[][]);
    secciones = seccionarPorTitulos(lineas, titulo)
      ?? seccionarPaginas(items.map((_, i) => lineas.filter(l => l.pagina === i + 1).map(l => l.texto).join('\n')));
  } else if (tipo === 'docx') {
    const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    secciones = seccionarMarkdown(htmlAMarkdown(value), titulo);
  } else {
    secciones = seccionarMarkdown(new TextDecoder().decode(bytes), titulo);
  }
  if (secciones.length === 0) {
    throw new DocumentoSinTexto(
      tipo === 'pdf'
        ? 'Este PDF no trae texto (parece escaneado). Sube la versión con texto o pega el contenido.'
        : 'El documento está vacío.',
    );
  }
  return secciones;
}
