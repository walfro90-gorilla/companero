import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { claveDeEmpleado } from './empleados.ts';
import { clienteServidor } from './supabase/servidor.ts';
import type { Database } from './supabase/tipos.ts';

// Separado de lib/empleados.ts: usa las cookies de Next (next/headers), que los scripts de Node no tienen.

/**
 * Abre la sesión del empleado en las cookies de esta petición (route handler o server action), con la clave interna
 * que calcula el servidor (lib/empleados.ts; docs/adr/0015). Antes era un enlace mágico (generateLink + verifyOtp),
 * pero cada enlace nuevo reemplaza al anterior y, con varios jueces entrando como 0001 a la vez, ~1 de cada 4 fallaba.
 * Si la cuenta aún no tiene esa clave (creada antes, o tras rotar la llave secreta), se le pone y se reintenta una vez.
 * 'saturado': Supabase limita las entradas por IP y todas salen del servidor; no es culpa del empleado, así que no
 * cuenta como intento fallido.
 */
export async function abrirSesion(admin: SupabaseClient<Database>, usuarioId: string, correo: string): Promise<'ok' | 'error' | 'saturado'> {
  const supabase = await clienteServidor();
  const clave = claveDeEmpleado(correo);
  let { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
  if (error && error.status !== 429) {
    // Solo a la cuenta interna de ESTE empleado (nunca a la de un admin con correo real).
    const { data: u } = await admin.auth.admin.getUserById(usuarioId);
    if (u.user?.email !== correo) return 'error';
    const { error: e2 } = await admin.auth.admin.updateUserById(usuarioId, { password: clave });
    if (e2) return e2.status === 429 ? 'saturado' : 'error';
    ({ error } = await supabase.auth.signInWithPassword({ email: correo, password: clave }));
  }
  if (!error) return 'ok';
  if (error.status === 429) console.error('[acceso] Supabase Auth limitó las entradas (rate limit):', error.code);
  else console.error('[acceso] no se pudo abrir la sesión del empleado:', error.code ?? error.status);
  return error.status === 429 ? 'saturado' : 'error';
}
