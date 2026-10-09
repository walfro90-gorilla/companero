import { redirect } from 'next/navigation';
import { PRODUCTO } from '@/lib/marca';
import { sesion } from '@/lib/sesion';
import { rutaSegura } from '@/lib/texto';
import { FormularioEntrar } from './formulario';

export const metadata = { title: `Entrar · ${PRODUCTO.nombre}` };

// Entrada de administración y RH (docs/adr/0014). Los empleados entran con su número de reloj en /acceso/{empresa}
// o con el QR de su sucursal.
export default async function Entrar({ searchParams }: PageProps<'/entrar'>) {
  const sp = await searchParams;
  const next = rutaSegura(typeof sp.next === 'string' ? sp.next : null);
  if (await sesion()) redirect(next);
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">{PRODUCTO.nombre}</h1>
        <p className="mb-6 text-stone-600">Administración y Recursos Humanos.</p>
        {sp.error === 'auth' && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">No se pudo completar el acceso. Intenta de nuevo.</p>
        )}
        <FormularioEntrar next={next} />
        <p className="mt-6 rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">
          <strong>¿Eres empleado?</strong> Entra con tu número de reloj escaneando el QR de tu sucursal o en la página de tu empresa
          (por ejemplo, /acceso/del-rio).
        </p>
      </div>
    </main>
  );
}
