import 'server-only';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import { htmlAMarkdown } from './html.ts';
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
    const { text } = await extractText(new Uint8Array(bytes), { mergePages: false });
    secciones = seccionarPaginas(text);
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
