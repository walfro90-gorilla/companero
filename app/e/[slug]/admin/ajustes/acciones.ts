'use server';

import { revalidatePath } from 'next/cache';
import { avatarDe } from '@/lib/avatar';
import { requerirGestion } from '@/lib/sesion';

export type EstadoAjustes = { error?: string; ok?: boolean };

export async function guardarAvatar(slug: string, _: EstadoAjustes, d: FormData): Promise<EstadoAjustes> {
  const { supabase, empresa } = await requerirGestion(slug);
  const t = (k: string) => String(d.get(k) ?? '').trim();
  // avatarDe valida y recorta: lo que no sirva cae a la base.
  const avatar = avatarDe({
    nombre: t('nombre'), rol: t('rol'), saludo: t('saludo'),
    colores: { camisa: t('color'), fondo: t('fondo'), piel: t('piel'), cabello: t('cabello') },
    preguntas: t('preguntas').split('\n'),
  });
  const { error } = await supabase.from('empresas').update({ avatar }).eq('id', empresa.id);
  if (error) return { error: 'No se pudo guardar.' };
  revalidatePath(`/e/${slug}`, 'layout');
  return { ok: true };
}
