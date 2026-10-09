import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { configSupabase } from '../config.ts';
import type { Database } from './tipos.ts';

/** Cliente del servidor (Server Components, Server Actions, route handlers) con la sesión de quien navega. */
export async function clienteServidor() {
  // Primero las cookies: eso marca la ruta como dinámica (nunca se prerenderiza nada privado).
  const almacen = await cookies();
  const cfg = configSupabase();
  if (!cfg) throw new Error('Falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
  return createServerClient<Database>(cfg.url, cfg.llave, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // Desde un Server Component no se pueden escribir cookies; proxy.ts ya refrescó la sesión.
        }
      },
    },
  });
}

export type Cliente = Awaited<ReturnType<typeof clienteServidor>>;
