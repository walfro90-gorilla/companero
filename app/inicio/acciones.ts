'use server';

import { redirect } from 'next/navigation';
import { requerirSesion } from '@/lib/sesion';
import { slugDe } from '@/lib/texto';
import { esCorreoDeEmpleado } from '@/lib/reloj';

export type EstadoForm = { error?: string };

export async function crearEmpresa(_: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, usuario } = await requerirSesion();
  if (usuario.anonimo || esCorreoDeEmpleado(usuario.email)) return { error: 'Para registrar una empresa entra con una cuenta de administración (correo y contraseña).' };
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
