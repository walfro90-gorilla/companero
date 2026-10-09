import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './tipos.ts';

// Cliente con la llave SECRETA (docs/adr/0014). Solo para lo que la llave pública no puede hacer:
//   - dar de alta empleados (usuario de Auth con correo interno) y abrirles sesión por número de reloj;
//   - el límite de intentos de acceso.
// Nunca llega al navegador (server-only) y no se usa para leer datos de negocio: eso sigue pasando por la RLS.
export function clienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secreta) throw new Error('Falta SUPABASE_SECRET_KEY: el acceso por número de reloj no está disponible.');
  return createClient<Database>(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const accesoRelojDisponible = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
