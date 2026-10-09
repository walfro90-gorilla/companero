/**
 * Proxy de Next 16 (antes "middleware"), docs/adr/0009. Patrón de brotes/ketzal-OS:
 *   - Refresca la sesión de Supabase en cada petición (el JWT caduca cada hora).
 *   - /inicio y /e/* exigen sesión: sin ella → /entrar?next=…
 *   - Lo demás (landing, /entrar, /auth/*, /unirse/*, /api/*) pasa; las APIs responden 401 por su cuenta.
 * La autorización por empresa y rol NO vive aquí: la decide la RLS de Postgres y lib/sesion.ts.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { configSupabase } from './lib/config';

const PRIVADAS = ['/inicio', '/e/'];

/** Copia las cookies que Supabase escribió (JWT refrescado) a otra respuesta (redirect). */
function llevarCookies(de: NextResponse, a: NextResponse): NextResponse {
  for (const c of de.cookies.getAll()) a.cookies.set(c);
  return a;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const privada = PRIVADAS.some(p => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`));

  const cfg = configSupabase();
  if (!cfg) {
    console.error('[proxy] Falta configurar Supabase; se niega', pathname);
    return privada ? NextResponse.redirect(new URL('/entrar', request.url)) : NextResponse.next();
  }

  // Si Supabase refresca el JWT, la cookie nueva va al REQUEST (para que las páginas vean el token fresco) y
  // a la RESPONSE (para que el navegador la guarde).
  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(cfg.url, cfg.llave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getClaims();

  if (privada && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = '';
    url.searchParams.set('next', pathname + search);
    return llevarCookies(respuesta, NextResponse.redirect(url));
  }
  return respuesta;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
