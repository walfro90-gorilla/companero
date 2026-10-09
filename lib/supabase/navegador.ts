import { createBrowserClient } from '@supabase/ssr';
import { configSupabase } from '../config.ts';
import type { Database } from './tipos.ts';

let cliente: ReturnType<typeof crear> | null = null;

function crear() {
  const cfg = configSupabase();
  if (!cfg) throw new Error('Falta configurar Supabase en el navegador.');
  return createBrowserClient<Database>(cfg.url, cfg.llave);
}

/** Cliente del navegador: entrar, subir archivos a Storage y escuchar en vivo (Realtime). */
export function clienteNavegador() {
  if (!cliente) cliente = crear();
  return cliente;
}
