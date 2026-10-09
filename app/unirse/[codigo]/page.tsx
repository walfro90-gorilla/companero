import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesion } from '@/lib/sesion';

// Destino del QR de una sucursal: sin sesión → entrar (con opción de invitado); con sesión → se une como
// colaborador y entra a su empresa.
export default async function Unirse({ params }: PageProps<'/unirse/[codigo]'>) {
  const { codigo } = await params;
  const s = await sesion();
  if (!s) redirect(`/entrar?next=${encodeURIComponent(`/unirse/${codigo}`)}`);
  const { data, error } = await s.supabase.rpc('unirse_con_codigo', { p_codigo: codigo });
  if (!error && data?.[0]) redirect(`/e/${data[0].slug}`);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">Ese código no es válido</h1>
      <p className="text-stone-600">Pídele a tu supervisor el QR o el código de tu sucursal.</p>
      <Link href="/inicio" className="underline">Ir al inicio</Link>
    </main>
  );
}
