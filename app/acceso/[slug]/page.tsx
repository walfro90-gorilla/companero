import Link from 'next/link';
import { notFound } from 'next/navigation';
import { avatarDe } from '@/lib/avatar';
import { accesoRelojDisponible, clienteAdmin } from '@/lib/supabase/admin';
import { Avatar } from '@/app/_ui/avatar';
import { AccesoEmpleado } from '@/app/_ui/acceso-empleado';

// Página de acceso de los empleados de una empresa (docs/adr/0014 y 0015): solo el número de reloj. Sin liga a la
// entrada de administración: los empleados nunca la ven.
export default async function Acceso({ params, searchParams }: PageProps<'/acceso/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!accesoRelojDisponible()) notFound();
  // Solo datos públicos de la empresa: nombre e identidad del asistente.
  const { data: empresa } = await clienteAdmin().from('empresas').select('nombre, avatar').eq('slug', slug).maybeSingle();
  if (!empresa) notFound();
  const avatar = avatarDe(empresa.avatar);
  return (
    <main className="flex flex-1 items-center justify-center p-4" style={{ '--marca': avatar.colores.camisa } as React.CSSProperties}>
      <div className="w-full max-w-sm space-y-4 text-center">
        <Avatar avatar={avatar} estado="reposo" chico />
        <div>
          <h1 className="text-2xl font-semibold">{empresa.nombre}</h1>
          <p className="text-stone-600">Entra para hablar con {avatar.nombre} y seguir tu capacitación.</p>
        </div>
        <div className="text-left">
          <AccesoEmpleado empresa={slug} next={typeof sp.next === 'string' ? sp.next : undefined} />
        </div>
        <Link href="/acceso" className="block text-sm text-stone-500 hover:text-stone-800">← Elegir otra empresa</Link>
      </div>
    </main>
  );
}
