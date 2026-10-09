import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Building2, ChevronRight } from 'lucide-react';
import { PRODUCTO } from '@/lib/marca';
import { empresaDelEmpleado, sesion } from '@/lib/sesion';
import { accesoRelojDisponible, clienteAdmin } from '@/lib/supabase/admin';
import { tarjeta } from '@/app/_ui/estilos';

export const metadata = { title: `Soy empleado · ${PRODUCTO.nombre}` };

// "Soy empleado" (docs/adr/0015): lista de empresas para elegir la tuya y entrar con su número de reloj. La arma
// el servidor y solo trae nombre y slug de las empresas que aceptan aparecer aquí (empresas.en_lista_acceso); la
// tabla de empresas sigue cerrada para quien no tiene sesión. Sin liga a la entrada de administración.
export default async function ElegirEmpresa() {
  if (!accesoRelojDisponible()) notFound();
  const s = await sesion();
  if (s) {
    const slug = await empresaDelEmpleado(s);
    if (slug) redirect(`/e/${slug}`);
  }
  const { data: empresas } = await clienteAdmin().from('empresas').select('nombre, slug').eq('en_lista_acceso', true).order('nombre');
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">¿Dónde trabajas?</h1>
          <p className="text-stone-600">Elige tu empresa para entrar con tu número de reloj.</p>
        </div>
        {(empresas ?? []).map(e => (
          <Link key={e.slug} href={`/acceso/${e.slug}`} className={`${tarjeta} flex items-center gap-3 hover:border-stone-400`}>
            <Building2 className="size-5 text-stone-500" />
            <span className="flex-1 font-medium">{e.nombre}</span>
            <ChevronRight className="size-5 text-stone-400" />
          </Link>
        ))}
        {!empresas?.length && <p className={`${tarjeta} text-sm text-stone-600`}>Escanea el QR de tu sucursal para entrar.</p>}
        <p className="text-center text-xs text-stone-500">¿No ves tu empresa? Escanea el QR de tu sucursal.</p>
      </div>
    </main>
  );
}
