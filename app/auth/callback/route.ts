import { NextResponse } from 'next/server';
import { clienteServidor } from '@/lib/supabase/servidor';
import { rutaSegura } from '@/lib/texto';

// Regreso de Google (OAuth con PKCE): cambia el código por la sesión y sigue a `next` (solo rutas internas).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = rutaSegura(searchParams.get('next'));
  if (code) {
    const supabase = await clienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth] no se pudo cambiar el código por sesión:', error.message);
  }
  return NextResponse.redirect(`${origin}/entrar?error=auth&next=${encodeURIComponent(next)}`);
}
