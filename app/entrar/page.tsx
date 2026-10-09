import { redirect } from 'next/navigation';
import { PRODUCTO } from '@/lib/marca';
import { sesion } from '@/lib/sesion';
import { rutaSegura } from '@/lib/texto';
import { FormularioEntrar } from './formulario';

export const metadata = { title: `Entrar · ${PRODUCTO.nombre}` };

export default async function Entrar({ searchParams }: PageProps<'/entrar'>) {
  const sp = await searchParams;
  const next = rutaSegura(typeof sp.next === 'string' ? sp.next : null);
  if (await sesion()) redirect(next);
  // El modo invitado solo se ofrece al llegar por el QR de una sucursal (jueces, demos, prueba rápida).
  const invitado = next.startsWith('/unirse/');
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">{PRODUCTO.nombre}</h1>
        <p className="mb-6 text-stone-600">{PRODUCTO.lema}</p>
        {sp.error === 'auth' && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">No se pudo completar el acceso. Intenta de nuevo.</p>
        )}
        <FormularioEntrar next={next} invitado={invitado} />
        <p className="mt-6 text-xs text-stone-500">
          Sin contraseñas: entras con Google o con un código que te llega por correo. Solo guardamos tu correo; el
          asistente nunca sabe quién pregunta.
        </p>
      </div>
    </main>
  );
}
