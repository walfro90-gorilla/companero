'use server';

import { revalidatePath } from 'next/cache';
import { requerirGestion, type Rol } from '@/lib/sesion';

const ROLES: Rol[] = ['admin', 'rh', 'supervisor', 'colaborador'];
const texto = (d: FormData, k: string) => String(d.get(k) ?? '').trim();
const opcional = (d: FormData, k: string) => texto(d, k) || null;

export type EstadoEquipo = { error?: string; ok?: string };

export async function agregarSucursal(slug: string, _: EstadoEquipo, d: FormData): Promise<EstadoEquipo> {
  const { supabase, empresa } = await requerirGestion(slug);
  const nombre = texto(d, 'nombre');
  if (nombre.length < 2) return { error: 'Escribe el nombre de la sucursal.' };
  const { error } = await supabase.from('sucursales').insert({ empresa_id: empresa.id, nombre });
  if (error) return { error: 'No se pudo agregar la sucursal.' };
  revalidatePath(`/e/${slug}/admin/equipo`);
  return { ok: 'Sucursal agregada.' };
}

export async function agregarPuesto(slug: string, _: EstadoEquipo, d: FormData): Promise<EstadoEquipo> {
  const { supabase, empresa } = await requerirGestion(slug);
  const nombre = texto(d, 'nombre');
  if (nombre.length < 2) return { error: 'Escribe el nombre del puesto.' };
  const { error } = await supabase.from('puestos').insert({ empresa_id: empresa.id, nombre });
  if (error) return { error: error.code === '23505' ? 'Ese puesto ya existe.' : 'No se pudo agregar el puesto.' };
  revalidatePath(`/e/${slug}/admin/equipo`);
  return { ok: 'Puesto agregado.' };
}

export async function invitar(slug: string, _: EstadoEquipo, d: FormData): Promise<EstadoEquipo> {
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  const email = texto(d, 'email').toLowerCase();
  const rol = texto(d, 'rol') as Rol;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Revisa el correo.' };
  if (!ROLES.includes(rol)) return { error: 'Elige un rol.' };
  const { error } = await supabase.from('invitaciones').upsert(
    { empresa_id: empresa.id, email, rol, sucursal_id: opcional(d, 'sucursal'), puesto_id: opcional(d, 'puesto'), creada_por: usuario.id, aceptada_en: null },
    { onConflict: 'empresa_id,email' },
  );
  if (error) return { error: 'No se pudo guardar la invitación.' };
  revalidatePath(`/e/${slug}/admin/equipo`);
  return { ok: `Listo: cuando ${email} entre con ese correo, quedará en el equipo.` };
}

export async function actualizarMiembro(slug: string, usuarioId: string, d: FormData) {
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  const rol = texto(d, 'rol') as Rol;
  if (!ROLES.includes(rol)) return;
  // Nadie se quita a sí mismo el rol de admin por accidente (la empresa podría quedarse sin administrador).
  if (usuarioId === usuario.id && rol !== 'admin') return;
  await supabase
    .from('miembros')
    .update({ rol, sucursal_id: opcional(d, 'sucursal'), puesto_id: opcional(d, 'puesto') })
    .eq('empresa_id', empresa.id).eq('usuario_id', usuarioId);
  revalidatePath(`/e/${slug}/admin/equipo`);
}
