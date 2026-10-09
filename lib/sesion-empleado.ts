import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteServidor } from './supabase/servidor.ts';
import type { Database } from './supabase/tipos.ts';

// Separado de lib/empleados.ts: usa las cookies de Next (next/headers), que los scripts de Node no tienen.

/**
 * Abre la sesión del empleado en las cookies de esta petición (route handler o server action).
 * 'saturado': Supabase limita las verificaciones por IP y todas salen del servidor (docs/adr/0015); no es culpa del
 * empleado, así que no cuenta como intento fallido.
 */
export async function abrirSesion(admin: SupabaseClient<Database>, usuarioId: string): Promise<'ok' | 'error' | 'saturado'> {
  const { data: u } = await admin.auth.admin.getUserById(usuarioId);
  if (!u.user?.email) return 'error';
  const { data: enlace, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: u.user.email });
  if (error || !enlace.properties?.hashed_token) return error?.status === 429 ? 'saturado' : 'error';
  const supabase = await clienteServidor();
  const { error: e2 } = await supabase.auth.verifyOtp({ type: 'email', token_hash: enlace.properties.hashed_token });
  if (e2?.status === 429) console.error('[acceso] Supabase Auth limitó las verificaciones (rate limit):', e2.code);
  return !e2 ? 'ok' : e2.status === 429 ? 'saturado' : 'error';
}

