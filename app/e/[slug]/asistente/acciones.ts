'use server';

import { contextoEmpresa } from '@/lib/sesion';

export type SeccionVisible = {
  codigo: string;
  documento: string;
  fuente: string | null;
  titulo: string;
  texto: string;
  pagina: number | null;
  /** Cómo la cita el documento («sección 5, Si la segunda parte queda incierta»), si se sabe. */
  referencia: string | null;
  /** Enlace temporal al archivo original (PDF/Word), para verificar la cita contra el documento real. */
  original: string | null;
};

const CODIGO = /^D(\d+)-(\d+)$/;

/** Código → referencia legible («sección 5, …»), para mostrar las citas de lecciones y explicaciones. */
export async function etiquetasDe(slug: string, codigos: string[]): Promise<Record<string, string>> {
  const xs = await leerSecciones(slug, [...new Set(codigos)]);
  return Object.fromEntries(xs.filter(x => x.referencia).map(x => [x.codigo, x.referencia!]));
}

/** Texto de las secciones citadas. La RLS decide qué puede ver (un colaborador, solo lo autorizado). */
export async function leerSecciones(slug: string, codigos: string[]): Promise<SeccionVisible[]> {
  const { supabase, empresa } = await contextoEmpresa(slug);
  const pares = codigos.slice(0, 80).map(c => CODIGO.exec(c)).filter((m): m is RegExpExecArray => Boolean(m));
  if (!pares.length) return [];
  const numeros = [...new Set(pares.map(m => Number(m[1])))];
  const { data } = await supabase
    .from('secciones')
    .select('orden, titulo, texto, pagina, referencia, documentos!inner(numero, titulo, fuente, archivo)')
    .eq('empresa_id', empresa.id)
    .in('documentos.numero', numeros);
  const buscadas = new Set(pares.map(m => `D${m[1]}-${m[2]}`));
  const filas = (data ?? []).filter(s => buscadas.has(`D${s.documentos.numero}-${s.orden}`));

  const urls = new Map<string, string>();
  for (const archivo of new Set(filas.map(s => s.documentos.archivo).filter((a): a is string => Boolean(a)))) {
    const { data: firmada } = await supabase.storage.from('documentos').createSignedUrl(archivo, 600);
    if (firmada?.signedUrl) urls.set(archivo, firmada.signedUrl);
  }
  return filas.map(s => {
    const url = s.documentos.archivo ? urls.get(s.documentos.archivo) : undefined;
    return {
      codigo: `D${s.documentos.numero}-${s.orden}`,
      documento: s.documentos.titulo,
      fuente: s.documentos.fuente,
      titulo: s.titulo,
      texto: s.texto,
      pagina: s.pagina,
      referencia: s.referencia,
      original: url ? (s.pagina ? `${url}#page=${s.pagina}` : url) : null,
    };
  });
}
