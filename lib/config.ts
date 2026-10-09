// Configuración de Supabase (docs/adr/0009). Portado de brotes: la app solo usa la llave PUBLICABLE; lo que
// protege los datos es la RLS. Si alguien pone por error una llave secreta, se rechaza (fail-closed).

export type ConfigSupabase = { url: string; llave: string };

export function configSupabase(): ConfigSupabase | null {
  // Acceso directo a process.env.NEXT_PUBLIC_*: así Next las incrusta también en el bundle del cliente.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !llave) return null;
  if (llave.startsWith('sb_secret_') || llave.includes('service_role')) {
    console.error('[supabase] La llave configurada es SECRETA; se rechaza. Usa la publicable (sb_publishable_…).');
    return null;
  }
  return { url, llave };
}
