import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/tipos.ts';
import { correoDeEmpleado } from './reloj.ts';

// Empleados por número de reloj (docs/adr/0014). Usa el cliente con llave secreta para lo que la pública no puede:
// crear el usuario de Auth del empleado y abrirle sesión. Quien llama ya autorizó (RH en Equipo, o el QR de una
// sucursal); aquí no se decide quién puede.

type Admin = SupabaseClient<Database>;
export type RolEmpleado = 'colaborador' | 'supervisor';

export async function altaEmpleado(
  admin: Admin,
  e: { empresaId: string; numero: string; nombre?: string | null; sucursalId?: string | null; puestoId?: string | null; rol?: RolEmpleado },
): Promise<{ usuarioId: string; nuevo: boolean } | { error: string }> {
  const { data: existente } = await admin
    .from('miembros').select('usuario_id').eq('empresa_id', e.empresaId).eq('numero_reloj', e.numero).maybeSingle();
  if (existente) return { usuarioId: existente.usuario_id, nuevo: false };

  const { data, error } = await admin.auth.admin.createUser({
    email: correoDeEmpleado(e.empresaId, e.numero), email_confirm: true, user_metadata: { tipo: 'empleado' },
  });
  if (error || !data.user) return { error: 'No se pudo dar de alta al empleado.' };
  const { error: e2 } = await admin.from('miembros').insert({
    empresa_id: e.empresaId, usuario_id: data.user.id, rol: e.rol ?? 'colaborador', numero_reloj: e.numero,
    nombre: e.nombre ?? null, sucursal_id: e.sucursalId ?? null, puesto_id: e.puestoId ?? null,
  });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: e2.code === '23505' ? `El número ${e.numero} ya existe.` : 'No se pudo dar de alta al empleado.' };
  }
  return { usuarioId: data.user.id, nuevo: true };
}

/** Borra los usuarios de Auth de los empleados de una empresa (al recrear demos; las membresías caen en cascada). */
export async function borrarEmpleados(admin: Admin, empresaId: string) {
  const { data } = await admin.from('miembros').select('usuario_id').eq('empresa_id', empresaId).not('numero_reloj', 'is', null);
  for (const m of data ?? []) await admin.auth.admin.deleteUser(m.usuario_id);
}
