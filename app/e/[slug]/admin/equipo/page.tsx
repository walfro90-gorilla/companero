import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { NOMBRE_ROL, requerirGestion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';
import { FormAltaEmpleados, FormInvitar, FormNombre, FilaMiembro } from './formularios';
import { agregarPuesto, agregarSucursal } from './acciones';

// Equipo (docs/adr/0009): sucursales con su QR de alta, puestos, miembros y sus roles, invitaciones.
export default async function Equipo({ params }: PageProps<'/e/[slug]/admin/equipo'>) {
  const { slug } = await params;
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  const [{ data: sucursales }, { data: puestos }, { data: miembros }, { data: invitaciones }] = await Promise.all([
    supabase.from('sucursales').select('id, nombre, codigo_union, activa').eq('empresa_id', empresa.id).order('creada_en'),
    supabase.from('puestos').select('id, nombre').eq('empresa_id', empresa.id).order('nombre'),
    supabase.from('miembros').select('usuario_id, rol, nombre, numero_reloj, sucursal_id, puesto_id, ingreso').eq('empresa_id', empresa.id).order('numero_reloj', { nullsFirst: true }).order('creado_en'),
    supabase.from('invitaciones').select('id, email, rol, aceptada_en').eq('empresa_id', empresa.id).is('aceptada_en', null).order('creada_en'),
  ]);
  const h = await headers();
  const origen = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const qrs = await Promise.all(
    (sucursales ?? []).map(async s => {
      const url = `${origen}/unirse/${s.codigo_union}`;
      return { ...s, url, svg: await QRCode.toString(url, { type: 'svg', margin: 1, width: 160 }) };
    }),
  );
  const opciones = { sucursales: sucursales ?? [], puestos: puestos ?? [] };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-4 md:p-6">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Sucursales y alta con QR</h1>
        <p className="text-sm text-stone-600">
          Imprime el QR de cada sucursal y ponlo en el área de personal: quien lo escanee entra con su <strong>número de reloj</strong>;
          si es nuevo, queda como colaborador de esa sucursal. Los empleados ya dados de alta también entran en
          /acceso/{slug}.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrs.map(s => (
            <article key={s.id} className={`${tarjeta} flex flex-col items-center gap-2 text-center`}>
              <p className="font-medium">{s.nombre}</p>
              <div className="size-40" dangerouslySetInnerHTML={{ __html: s.svg }} />
              <p className="font-mono text-lg tracking-widest">{s.codigo_union}</p>
              <p className="break-all text-xs text-stone-400">{s.url}</p>
            </article>
          ))}
          <div className={tarjeta}>
            <FormNombre accion={agregarSucursal.bind(null, slug)} etiqueta="Nueva sucursal" placeholder="Sucursal Las Torres" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Puestos</h2>
        <div className="flex flex-wrap gap-2">
          {(puestos ?? []).map(p => <span key={p.id} className="rounded-full bg-stone-100 px-3 py-1 text-sm">{p.nombre}</span>)}
        </div>
        <div className={`${tarjeta} max-w-md`}>
          <FormNombre accion={agregarPuesto.bind(null, slug)} etiqueta="Nuevo puesto" placeholder="Cajero" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Equipo ({miembros?.length ?? 0})</h2>
        <div className={`${tarjeta} divide-y divide-stone-100 p-0`}>
          {(miembros ?? []).map(m => (
            <FilaMiembro key={m.usuario_id} slug={slug} miembro={m} yo={m.usuario_id === usuario.id} {...opciones} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Alta de empleados por número de reloj</h2>
        <p className="text-sm text-stone-600">Colaboradores y supervisores entran solo con su número de reloj: sin correo ni contraseña.</p>
        <div className={`${tarjeta} max-w-xl`}>
          <FormAltaEmpleados slug={slug} {...opciones} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invitar a administración o RH</h2>
        <p className="text-sm text-stone-600">Entran con correo y contraseña: al crear su cuenta en /entrar con ese correo, quedan con el rol que elijas.</p>
        <div className={`${tarjeta} max-w-xl`}>
          <FormInvitar slug={slug} {...opciones} />
        </div>
        {(invitaciones ?? []).length > 0 && (
          <ul className="text-sm text-stone-600">
            {invitaciones!.map(i => <li key={i.id}>{i.email} · {NOMBRE_ROL[i.rol]} · pendiente</li>)}
          </ul>
        )}
      </section>
    </main>
  );
}
