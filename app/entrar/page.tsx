import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BadgeCheck, ChevronRight } from 'lucide-react';
import { PRODUCTO } from '@/lib/marca';
import { empresaDelEmpleado, sesion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';

export const metadata = { title: `Entrar · ${PRODUCTO.nombre}` };

// Selector de entrada (docs/adr/0015, decisión de Wal): "Soy empleado" grande y principal; "Administración", discreto.
// Los empleados no pasan por aquí: el QR y /e/{empresa} los llevan directo a la entrada de su empresa.
export default async function Entrar() {
  const s = await sesion();
  if (s) {
    const slug = await empresaDelEmpleado(s);
    redirect(slug ? `/e/${slug}` : '/inicio');
  }
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{PRODUCTO.nombre}</h1>
          <p className="text-stone-600">¿Cómo quieres entrar?</p>
        </div>
        <Link href="/acceso" className={`${tarjeta} flex items-center gap-4 border-2 border-[var(--marca,#c81e5b)] hover:opacity-90`}>
          <BadgeCheck className="size-8 shrink-0 text-[var(--marca,#c81e5b)]" />
          <span className="flex-1">
            <span className="block text-lg font-semibold">Soy empleado</span>
            <span className="text-sm text-stone-600">Solo con tu número de reloj</span>
          </span>
          <ChevronRight className="size-5 text-stone-400" />
        </Link>
        <p className="pt-6 text-center">
          <Link href="/entrar/admin" className="text-sm text-stone-500 underline hover:text-stone-800">Administración</Link>
        </p>
      </div>
    </main>
  );
}
