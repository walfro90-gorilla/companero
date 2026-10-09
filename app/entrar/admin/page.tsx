import { redirect } from 'next/navigation';
import { PRODUCTO } from '@/lib/marca';
import { empresaDelEmpleado, sesion } from '@/lib/sesion';
import { rutaSegura } from '@/lib/texto';
import { FormularioEntrar } from './formulario';

export const metadata = { title: `Administración · ${PRODUCTO.nombre}` };

// Entrada de administración y RH: correo y contraseña (docs/adr/0014 y 0015). Un empleado con sesión que llegue
// aquí regresa a su empresa: los empleados no usan esta entrada.
export default async function EntrarAdmin({ searchParams }: PageProps<'/entrar/admin'>) {
  const sp = await searchParams;
  const next = rutaSegura(typeof sp.next === 'string' ? sp.next : null);
  const s = await sesion();
  if (s) {
    const slug = await empresaDelEmpleado(s);
    redirect(slug ? `/e/${slug}` : next);
  }
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">{PRODUCTO.nombre}</h1>
        <p className="mb-6 text-stone-600">Administración y Recursos Humanos.</p>
        {sp.error === 'auth' && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">No se pudo completar el acceso. Intenta de nuevo.</p>
        )}
        <FormularioEntrar next={next} crear={sp.modo === 'crear'} />
      </div>
    </main>
  );
}
