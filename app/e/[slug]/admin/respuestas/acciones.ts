'use server';

import { revalidatePath } from 'next/cache';
import { requerirGestion } from '@/lib/sesion';

export type EstadoCalificar = { error?: string; ok?: boolean };

/** RH/admin califican una práctica o un test (0–10 + comentario). La RLS y un trigger solo dejan cambiar la revisión. */
export async function calificar(slug: string, tipo: 'practica' | 'test', id: string, _: EstadoCalificar, d: FormData): Promise<EstadoCalificar> {
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  const calificacion = Number(d.get('calificacion'));
  if (!Number.isInteger(calificacion) || calificacion < 0 || calificacion > 10) return { error: 'Elige una calificación de 0 a 10.' };
  const comentario = String(d.get('comentario') ?? '').trim().slice(0, 2000) || null;
  const { error } = await supabase
    .from(tipo === 'practica' ? 'practicas' : 'intentos')
    .update({ calificacion, comentario, revisado_por: usuario.id, revisado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', empresa.id);
  if (error) return { error: 'No se pudo guardar la calificación.' };
  revalidatePath(`/e/${slug}/admin/respuestas`);
  return { ok: true };
}
