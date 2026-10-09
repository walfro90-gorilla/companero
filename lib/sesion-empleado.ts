import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteServidor } from './supabase/servidor.ts';
import type { Database } from './supabase/tipos.ts';

// Separado de lib/empleados.ts: usa las cookies de Next (next/headers), que los scripts de Node no tienen.

/** Abre la sesión del empleado en las cookies de esta petición (route handler o server action). */
export async function abrirSesion(admin: SupabaseClient<Database>, usuarioId: string): Promise<boolean> {
  const { data: u } = await admin.auth.admin.getUserById(usuarioId);
  if (!u.user?.email) return false;
  const { data: enlace, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: u.user.email });
  if (error || !enlace.properties?.hashed_token) return false;
  const supabase = await clienteServidor();
  const { error: e2 } = await supabase.auth.verifyOtp({ type: 'email', token_hash: enlace.properties.hashed_token });
  return !e2;
}

