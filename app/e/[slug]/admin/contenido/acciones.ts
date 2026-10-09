'use server';

import { revalidatePath } from 'next/cache';
import { DocumentoSinTexto, extraer, tipoDe, type Tipo } from '@/lib/ingesta/extraer';
import { guardarSecciones, type ResultadoIngesta } from '@/lib/ingesta/ingerir';
import { requerirGestion } from '@/lib/sesion';

// Contenido de la empresa (docs/adr/0010). Los archivos suben directo del navegador a Storage (en Vercel una
// función no acepta más de 4.5 MB); aquí solo se crea el registro y luego se procesa desde Storage.

export type Resultado = ({ ok: true } & ResultadoIngesta) | { ok: false; error: string };

const limpiarNombre = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);

export async function crearDocumento(slug: string, titulo: string, nombreArchivo: string): Promise<{ id: string; ruta: string } | { error: string }> {
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  const tipo = tipoDe(nombreArchivo);
  if (!tipo) return { error: 'Sube un PDF, un Word (.docx), un .md o un .txt.' };
  const { data, error } = await supabase
    .from('documentos')
    .insert({ empresa_id: empresa.id, titulo: titulo.trim().slice(0, 160) || nombreArchivo, fuente: nombreArchivo, tipo, creado_por: usuario.id })
    .select('id')
    .single();
  if (error || !data) return { error: 'No se pudo registrar el documento.' };
  const ruta = `${empresa.id}/${data.id}/${limpiarNombre(nombreArchivo)}`;
  await supabase.from('documentos').update({ archivo: ruta }).eq('id', data.id);
  return { id: data.id, ruta };
}

export async function procesarDocumento(slug: string, id: string): Promise<Resultado> {
  const { supabase, empresa } = await requerirGestion(slug);
  const { data: doc } = await supabase.from('documentos').select('id, titulo, tipo, archivo').eq('id', id).eq('empresa_id', empresa.id).maybeSingle();
  if (!doc?.archivo) return { ok: false, error: 'No encontré el archivo del documento.' };
  const { data: archivo, error } = await supabase.storage.from('documentos').download(doc.archivo);
  if (error || !archivo) return { ok: false, error: 'No se pudo leer el archivo subido.' };
  return procesar(slug, doc.id, doc.titulo, doc.tipo as Tipo, new Uint8Array(await archivo.arrayBuffer()));
}

/** Texto pegado (p. ej. un procedimiento que llegó por chat): se trata como Markdown. */
export async function crearDesdeTexto(slug: string, titulo: string, texto: string): Promise<Resultado> {
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  if (titulo.trim().length < 2) return { ok: false, error: 'Ponle un título.' };
  if (texto.trim().length < 20) return { ok: false, error: 'El texto es muy corto.' };
  const { data, error } = await supabase
    .from('documentos')
    .insert({ empresa_id: empresa.id, titulo: titulo.trim().slice(0, 160), fuente: 'Texto pegado', tipo: 'markdown', creado_por: usuario.id })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: 'No se pudo registrar el documento.' };
  return procesar(slug, data.id, titulo, 'markdown', new TextEncoder().encode(texto));
}

async function procesar(slug: string, id: string, titulo: string, tipo: Tipo, bytes: Uint8Array): Promise<Resultado> {
  const { supabase, empresa } = await requerirGestion(slug);
  try {
    const secciones = await extraer(tipo, bytes, titulo);
    const r = await guardarSecciones(supabase, { documentoId: id, empresaId: empresa.id, empresa: empresa.nombre, documento: titulo, secciones });
    revalidatePath(`/e/${slug}/admin/contenido`);
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof DocumentoSinTexto) return { ok: false, error: e.message };
    console.error('[contenido] procesar:', e);
    return { ok: false, error: 'No se pudo procesar el documento.' };
  }
}

export async function cambiarEstado(slug: string, id: string, estado: 'borrador' | 'autorizado' | 'archivado') {
  const { supabase, empresa } = await requerirGestion(slug);
  await supabase.from('documentos').update({ estado }).eq('id', id).eq('empresa_id', empresa.id);
  revalidatePath(`/e/${slug}/admin/contenido`);
}

export async function borrarDocumento(slug: string, id: string) {
  const { supabase, empresa } = await requerirGestion(slug);
  const { data: doc } = await supabase.from('documentos').select('archivo').eq('id', id).eq('empresa_id', empresa.id).maybeSingle();
  if (doc?.archivo) await supabase.storage.from('documentos').remove([doc.archivo]);
  await supabase.from('documentos').delete().eq('id', id).eq('empresa_id', empresa.id);
  revalidatePath(`/e/${slug}/admin/contenido`);
}
