import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, ChevronRight } from 'lucide-react';
import { PRODUCTO } from '@/lib/marca';
import { NOMBRE_ROL, requerirSesion } from '@/lib/sesion';
import { tarjeta } from '../_ui/estilos';
import { BotonSalir } from '../_ui/salir';
import { FormCrearEmpresa, FormUnirse } from './formularios';

export const metadata = { title: `Inicio · ${PRODUCTO.nombre}` };

export default async function Inicio({ searchParams }: PageProps<'/inicio'>) {
  const { supabase, usuario } = await requerirSesion();
  // Las invitaciones a su correo se vuelven membresías al entrar.
  if (!usuario.anonimo) await supabase.rpc('aceptar_invitaciones');
  const { data } = await supabase
    .from('miembros').select('rol, empresas(slug, nombre, giro)').eq('usuario_id', usuario.id).order('creado_en');
  const empresas = (data ?? []).flatMap(m => (m.empresas ? [{ ...m.empresas, rol: m.rol }] : []));
  const sp = await searchParams;
  if (empresas.length === 1 && sp.elegir === undefined) redirect(`/e/${empresas[0].slug}`);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 md:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{PRODUCTO.nombre}</h1>
          <p className="text-sm text-stone-500">{usuario.anonimo ? 'Invitado' : usuario.email}</p>
        </div>
        <BotonSalir />
      </header>

      {empresas.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Tus empresas</h2>
          {empresas.map(e => (
            <Link key={e.slug} href={`/e/${e.slug}`} className={`${tarjeta} flex items-center gap-3 hover:border-stone-400`}>
              <Building2 className="size-5 text-stone-500" />
              <span className="flex-1">
                <span className="block font-medium">{e.nombre}</span>
                <span className="text-sm text-stone-500">{NOMBRE_ROL[e.rol]}{e.giro ? ` · ${e.giro}` : ''}</span>
              </span>
              <ChevronRight className="size-5 text-stone-400" />
            </Link>
          ))}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className={tarjeta}>
          <h2 className="mb-1 font-semibold">¿Eres parte de un equipo?</h2>
          <p className="mb-4 text-sm text-stone-600">Escanea el QR de tu sucursal o escribe su código.</p>
          <FormUnirse />
        </section>
        {!usuario.anonimo && (
          <section className={tarjeta}>
            <h2 className="mb-1 font-semibold">Registra tu empresa</h2>
            <p className="mb-4 text-sm text-stone-600">Sube tus manuales y en minutos tu personal tiene un asistente de capacitación.</p>
            <FormCrearEmpresa />
          </section>
        )}
      </div>
    </main>
  );
}
