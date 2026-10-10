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
    colores: {
      camisa: t('color'), fondo: t('fondo'), piel: t('piel'), cabello: t('cabello'),
      detalle: d.get('con_detalle') === 'on' ? t('detalle') : null, acento: d.get('con_acento') === 'on' ? t('acento') : null,
    },
    preguntas: t('preguntas').split('\n'),
  });
  const { error } = await supabase.from('empresas').update({ avatar }).eq('id', empresa.id);
  if (error) return { error: 'No se pudo guardar.' };
  revalidatePath(`/e/${slug}`, 'layout');
  return { ok: true };
}

/** ¿La empresa sale en la lista de "Soy empleado" (/acceso)? Si no, sus empleados entran por el QR o /acceso/{empresa}. */
export async function guardarListado(slug: string, d: FormData) {
  const { supabase, empresa } = await requerirGestion(slug);
  await supabase.from('empresas').update({ en_lista_acceso: d.get('en_lista') === 'on' }).eq('id', empresa.id);
  revalidatePath(`/e/${slug}/admin/ajustes`);
}
