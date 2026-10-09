import { NextResponse } from 'next/server';
import { clienteServidor } from '@/lib/supabase/servidor';

export async function POST(request: Request) {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
