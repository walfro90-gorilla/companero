import 'server-only';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { avatarDe, type Avatar } from './avatar.ts';
import { clienteServidor, type Cliente } from './supabase/servidor.ts';
import type { Rol } from './roles.ts';

// Capa de acceso (docs/adr/0009): quién es y qué puede en cada empresa. La RLS es la que de verdad protege
// los datos; esto solo decide qué pantallas mostrar y a dónde mandar a quien no tiene sesión.

export { NOMBRE_ROL, type Rol } from './roles.ts';

export type Usuario = { id: string; email: string | null; anonimo: boolean };

/** La sesión de esta petición (una sola lectura por render gracias a cache). */
export const sesion = cache(async (): Promise<{ supabase: Cliente; usuario: Usuario } | null> => {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  return {
    supabase,
    usuario: { id: c.sub, email: typeof c.email === 'string' && c.email ? c.email : null, anonimo: c.is_anonymous === true },
  };
});

/** La empresa de un empleado (número de reloj): para mandarlo a SU app o a SU entrada, nunca a la de administración. */
export async function empresaDelEmpleado(s: { supabase: Cliente; usuario: Usuario }): Promise<string | null> {
  if (!s.usuario.email?.endsWith('@reloj.companero.invalid')) return null;
  const { data } = await s.supabase.from('miembros').select('empresas(slug)').eq('usuario_id', s.usuario.id).limit(1).maybeSingle();
  return data?.empresas?.slug ?? null;
}

export async function requerirSesion(next = '/inicio') {
  const s = await sesion();
  if (!s) redirect(`/entrar/admin?next=${encodeURIComponent(next)}`);
  return s;
}

export type Empresa = { id: string; slug: string; nombre: string; giro: string | null; avatar: Avatar };

export type Contexto = {
  supabase: Cliente;
  usuario: Usuario;
  empresa: Empresa;
  miembro: { rol: Rol; sucursal_id: string | null; puesto_id: string | null; nombre: string | null; puesto: string | null; numero_reloj: string | null };
  /** Admin o RH: contenido, módulos, equipo, métricas. */
  gestiona: boolean;
  /** Admin, RH o supervisor: avance del equipo y canalizaciones. */
  supervisa: boolean;
};

/** Empresa + membresía de quien navega. Si no es miembro, 404 (no se revela que la empresa existe). */
export const contextoEmpresa = cache(async (slug: string): Promise<Contexto> => {
  const s = await sesion();
  if (!s) redirect(`/acceso/${slug}`);
  const { supabase, usuario } = s;
  const { data: empresa } = await supabase
    .from('empresas').select('id, slug, nombre, giro, avatar').eq('slug', slug).maybeSingle();
  if (!empresa) notFound();
  const { data: miembro } = await supabase
    .from('miembros').select('rol, sucursal_id, puesto_id, nombre, numero_reloj, puestos(nombre)')
    .eq('empresa_id', empresa.id).eq('usuario_id', usuario.id).maybeSingle();
  if (!miembro) notFound();
  const rol = miembro.rol;
  return {
    supabase,
    usuario,
    empresa: { ...empresa, avatar: avatarDe(empresa.avatar) },
    miembro: {
      rol, sucursal_id: miembro.sucursal_id, puesto_id: miembro.puesto_id, nombre: miembro.nombre, numero_reloj: miembro.numero_reloj,
      puesto: miembro.puestos?.nombre ?? null,
    },
    gestiona: rol === 'admin' || rol === 'rh',
    supervisa: rol !== 'colaborador',
  };
});

/** Para páginas de gestión: si no le toca, 404. */
export async function requerirGestion(slug: string) {
  const ctx = await contextoEmpresa(slug);
  if (!ctx.gestiona) notFound();
  return ctx;
}

export async function requerirSupervision(slug: string) {
  const ctx = await contextoEmpresa(slug);
  if (!ctx.supervisa) notFound();
  return ctx;
}
