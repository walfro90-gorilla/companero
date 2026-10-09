import Link from 'next/link';
import { avatarDe } from '@/lib/avatar';
import { accesoRelojDisponible, clienteAdmin } from '@/lib/supabase/admin';
import { Avatar } from '@/app/_ui/avatar';
import { AccesoEmpleado } from '@/app/_ui/acceso-empleado';

// Destino del QR de una sucursal (docs/adr/0014): el empleado escribe su número de reloj; si es nuevo, queda dado de
// alta como colaborador de esta sucursal.
export default async function Unirse({ params }: PageProps<'/unirse/[codigo]'>) {
  const { codigo } = await params;
  const { data: s } = accesoRelojDisponible()
    ? await clienteAdmin()
        .from('sucursales').select('nombre, empresas!inner(nombre, avatar)').eq('codigo_union', codigo.toUpperCase()).eq('activa', true).maybeSingle()
    : { data: null };
  if (!s) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Ese código no es válido</h1>
        <p className="text-stone-600">Pídele a tu supervisor el QR de tu sucursal.</p>
        <Link href="/" className="underline">Ir al inicio</Link>
      </main>
    );
  }
  const avatar = avatarDe(s.empresas.avatar);
  return (
    <main className="flex flex-1 items-center justify-center p-4" style={{ '--marca': avatar.colores.camisa } as React.CSSProperties}>
      <div className="w-full max-w-sm space-y-4 text-center">
        <Avatar avatar={avatar} estado="reposo" chico />
        <div>
          <h1 className="text-2xl font-semibold">{s.empresas.nombre}</h1>
          <p className="text-stone-600">{s.nombre}</p>
        </div>
        <div className="text-left">
          <AccesoEmpleado codigo={codigo} />
        </div>
      </div>
    </main>
  );
}
