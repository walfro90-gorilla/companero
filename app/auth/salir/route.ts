import { NextResponse } from 'next/server';
import { empresaDelEmpleado, sesion } from '@/lib/sesion';
import { clienteServidor } from '@/lib/supabase/servidor';

// Al salir, un empleado regresa a la entrada de SU empresa (número de reloj), nunca al selector ni a la de
// administración (docs/adr/0015). Administración regresa a la portada.
export async function POST(request: Request) {
  const s = await sesion();
  const slug = s ? await empresaDelEmpleado(s) : null;
  const supabase = await clienteServidor();
  // Solo esta sesión: los estudiantes de la demo comparten número, y salir no debe sacar a los demás jueces.
  await supabase.auth.signOut({ scope: 'local' });
  return NextResponse.redirect(new URL(slug ? `/acceso/${slug}` : '/', request.url), { status: 303 });
}
