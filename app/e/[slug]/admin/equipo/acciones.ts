'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { altaEmpleado, type RolEmpleado } from '@/lib/empleados';
import { leerLista } from '@/lib/reloj';
import { requerirGestion, type Rol } from '@/lib/sesion';
import { accesoRelojDisponible, clienteAdmin } from '@/lib/supabase/admin';

const ROLES: Rol[] = ['admin', 'rh', 'supervisor', 'colaborador'];
const texto = (d: FormData, k: string) => String(d.get(k) ?? '').trim();
const opcional = (d: FormData, k: string) => texto(d, k) || null;

export type EstadoEquipo = { error?: string; ok?: string; liga?: string };

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
  if (rol !== 'admin' && rol !== 'rh') return { error: 'Por correo solo se invita a administración o RH; los empleados se dan de alta con su número de reloj.' };
  const { error } = await supabase.from('invitaciones').upsert(
    { empresa_id: empresa.id, email, rol, sucursal_id: opcional(d, 'sucursal'), puesto_id: opcional(d, 'puesto'), creada_por: usuario.id, aceptada_en: null },
    { onConflict: 'empresa_id,email' },
  );
  if (error) return { error: 'No se pudo guardar la invitación.' };
  revalidatePath(`/e/${slug}/admin/equipo`);
  // No se manda correo (el SMTP integrado manda muy pocos; ADR 0015): RH comparte la liga y, al crear su cuenta con
  // ese correo, la persona queda en el equipo con el rol elegido (aceptar_invitaciones).
  const h = await headers();
  const liga = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}/entrar/admin?modo=crear`;
  return { ok: `Invitación guardada. No se manda correo: comparte esta liga con ${email}. Al crear su cuenta con ese correo, quedará en el equipo.`, liga };
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

/** Alta de empleados por número de reloj (docs/adr/0014): uno por renglón, "número, nombre" opcional. */
export async function altaEmpleados(slug: string, _: EstadoEquipo, d: FormData): Promise<EstadoEquipo> {
  const { supabase, empresa } = await requerirGestion(slug); // autoriza con la sesión; la llave secreta solo crea
  if (!accesoRelojDisponible()) return { error: 'Falta configurar el acceso por número de reloj (SUPABASE_SECRET_KEY).' };
  const lista = leerLista(texto(d, 'numeros'));
  if ('error' in lista) return { error: lista.error };
  const rol: RolEmpleado = texto(d, 'rol') === 'supervisor' ? 'supervisor' : 'colaborador';
  // La llave secreta se salta la RLS: la sucursal y el puesto del formulario se validan contra esta empresa (y la
  // base lo vuelve a revisar con el trigger validar_misma_empresa).
  const sucursalId = opcional(d, 'sucursal');
  const puestoId = opcional(d, 'puesto');
  const [{ data: suc }, { data: pue }] = await Promise.all([
    sucursalId ? supabase.from('sucursales').select('id').eq('id', sucursalId).eq('empresa_id', empresa.id).maybeSingle() : Promise.resolve({ data: null }),
    puestoId ? supabase.from('puestos').select('id').eq('id', puestoId).eq('empresa_id', empresa.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if ((sucursalId && !suc) || (puestoId && !pue)) return { error: 'La sucursal o el puesto no son de esta empresa.' };
  const admin = clienteAdmin();
  let nuevos = 0;
  const yaExistian: string[] = [];
  for (const e of lista) {
    const r = await altaEmpleado(admin, { empresaId: empresa.id, numero: e.numero, nombre: e.nombre, sucursalId, puestoId, rol });
    if ('error' in r) return { error: `${r.error} (${nuevos} dados de alta antes del error)` };
    if (r.nuevo) nuevos++;
    else yaExistian.push(e.numero);
  }
  revalidatePath(`/e/${slug}/admin/equipo`);
  return { ok: `${nuevos} empleado(s) dado(s) de alta.${yaExistian.length ? ` Ya existían: ${yaExistian.join(', ')}.` : ''} Entran con su número en /acceso/${slug}.` };
}
