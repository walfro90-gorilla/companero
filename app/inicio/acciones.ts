'use server';

import { redirect } from 'next/navigation';
import { requerirSesion } from '@/lib/sesion';
import { slugDe } from '@/lib/texto';

export type EstadoForm = { error?: string };

export async function crearEmpresa(_: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, usuario } = await requerirSesion();
  if (usuario.anonimo) return { error: 'Para crear una empresa entra con Google o con tu correo.' };
  const nombre = String(datos.get('nombre') ?? '').trim();
  const slug = slugDe(String(datos.get('slug') ?? '') || nombre);
  if (nombre.length < 2) return { error: 'Escribe el nombre de la empresa.' };
  if (slug.length < 3) return { error: 'La dirección necesita al menos 3 letras o números.' };
  const { error } = await supabase.rpc('crear_empresa', {
    p_nombre: nombre, p_slug: slug,
    p_giro: String(datos.get('giro') ?? '').trim() || undefined,
    p_sucursal: String(datos.get('sucursal') ?? '').trim() || undefined,
    p_puesto: String(datos.get('puesto') ?? '').trim() || undefined,
  });
  if (error) {
    if (error.code === '23505') return { error: `Ya existe una empresa con la dirección "${slug}". Elige otra.` };
    console.error('[inicio] crear empresa:', error.message);
    return { error: 'No se pudo crear la empresa.' };
  }
  // Siguiente paso natural: subir el material de capacitación.
  redirect(`/e/${slug}/admin/contenido?nueva=1`);
}

export async function unirseConCodigo(_: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase } = await requerirSesion();
  const codigo = String(datos.get('codigo') ?? '').trim();
  if (!/^[a-z0-9]{6,12}$/i.test(codigo)) return { error: 'El código tiene 8 letras y números.' };
  const { data, error } = await supabase.rpc('unirse_con_codigo', { p_codigo: codigo });
  if (error || !data?.[0]) return { error: 'Ese código no es válido. Pídele a tu supervisor el de tu sucursal.' };
  redirect(`/e/${data[0].slug}`);
}
