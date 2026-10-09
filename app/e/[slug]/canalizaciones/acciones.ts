'use server';

import { revalidatePath } from 'next/cache';
import { requerirSupervision } from '@/lib/sesion';

export type EstadoRespuesta = { error?: string; ok?: boolean };

export async function responderCanalizacion(slug: string, id: string, _: EstadoRespuesta, datos: FormData): Promise<EstadoRespuesta> {
  const { supabase, usuario } = await requerirSupervision(slug);
  const respuesta = String(datos.get('respuesta') ?? '').trim();
  if (respuesta.length < 2) return { error: 'Escribe la respuesta.' };
  // La RLS (atiendo) decide si le toca: un supervisor solo responde lo de su sucursal.
  const { error } = await supabase
    .from('canalizaciones')
    .update({ estado: 'atendida', respuesta: respuesta.slice(0, 2000), atendida_por: usuario.id, atendida_en: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'No se pudo guardar la respuesta.' };
  revalidatePath(`/e/${slug}/canalizaciones`);
  return { ok: true };
}
