'use client';

import { useActionState, useState } from 'react';
import { Copy } from 'lucide-react';
import { NOMBRE_ROL, type Rol } from '@/lib/roles';
import { boton, campo, etiqueta } from '@/app/_ui/estilos';
import { actualizarMiembro, altaEmpleados, invitar, type EstadoEquipo } from './acciones';

type Opcion = { id: string; nombre: string };
const ROLES: Rol[] = ['colaborador', 'supervisor', 'rh', 'admin'];

function Aviso({ estado }: { estado: EstadoEquipo }) {
  if (estado.error) return <p className="text-sm text-red-700">{estado.error}</p>;
  if (estado.ok) {
    return (
      <>
        <p className="text-sm text-emerald-700">{estado.ok}</p>
        {estado.liga && <Liga liga={estado.liga} />}
      </>
    );
  }
  return null;
}

/** La liga para que la persona invitada cree su cuenta (no se manda correo), con botón para copiarla. */
function Liga({ liga }: { liga: string }) {
  const [copiada, setCopiada] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl bg-stone-50 p-2 text-sm ring-1 ring-stone-200">
      <code className="min-w-0 flex-1 truncate">{liga}</code>
      <button
        type="button" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1 hover:bg-stone-50"
        onClick={() => navigator.clipboard?.writeText(liga).then(() => setCopiada(true), () => {})}
      >
        <Copy className="size-4" /> {copiada ? 'Copiada' : 'Copiar'}
      </button>
    </div>
  );
}

export function FormNombre({ accion, etiqueta: titulo, placeholder }: { accion: (e: EstadoEquipo, d: FormData) => Promise<EstadoEquipo>; etiqueta: string; placeholder: string }) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  return (
    <form action={enviar} className="space-y-2">
      <label className="block">
        <span className={etiqueta}>{titulo}</span>
        <input name="nombre" required className={campo} placeholder={placeholder} />
      </label>
      <button type="submit" disabled={pendiente} className={boton}>Agregar</button>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormInvitar({ slug, sucursales, puestos }: { slug: string; sucursales: Opcion[]; puestos: Opcion[] }) {
  const [estado, enviar, pendiente] = useActionState(invitar.bind(null, slug), {});
  return (
    <form action={enviar} className="grid gap-3 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className={etiqueta}>Correo</span>
        <input name="email" type="email" required className={campo} placeholder="supervisora@empresa.com" />
      </label>
      <label className="block">
        <span className={etiqueta}>Rol</span>
        <select name="rol" className={campo} defaultValue="rh">
          {(['rh', 'admin'] as const).map(r => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={etiqueta}>Sucursal</span>
        <select name="sucursal" className={campo} defaultValue="">
          <option value="">Todas</option>
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={etiqueta}>Puesto</span>
        <select name="puesto" className={campo} defaultValue="">
          <option value="">Sin puesto</option>
          {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </label>
      <button type="submit" disabled={pendiente} className={`${boton} sm:col-span-2`}>Invitar</button>
      <div className="sm:col-span-2"><Aviso estado={estado} /></div>
    </form>
  );
}

type Miembro = { usuario_id: string; rol: Rol; nombre: string | null; numero_reloj: string | null; sucursal_id: string | null; puesto_id: string | null; ingreso: string };

export function FilaMiembro({ slug, miembro, yo, sucursales, puestos }: { slug: string; miembro: Miembro; yo: boolean; sucursales: Opcion[]; puestos: Opcion[] }) {
  return (
    <form action={actualizarMiembro.bind(null, slug, miembro.usuario_id)} className="flex flex-wrap items-center gap-2 p-3 text-sm">
      <span className="min-w-32 flex-1 font-medium">
        {miembro.numero_reloj ? <span className="mr-1.5 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">{miembro.numero_reloj}</span> : null}
        {miembro.nombre ?? (miembro.numero_reloj ? '' : 'Sin nombre')}{yo ? ' (tú)' : ''}
        <span className="block text-xs font-normal text-stone-500">desde {new Date(miembro.ingreso).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</span>
      </span>
      <select name="rol" defaultValue={miembro.rol} disabled={yo} className="rounded-lg border border-stone-300 px-2 py-1">
        {ROLES.map(r => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
      </select>
      {yo && <input type="hidden" name="rol" value={miembro.rol} />}
      <select name="sucursal" defaultValue={miembro.sucursal_id ?? ''} className="rounded-lg border border-stone-300 px-2 py-1">
        <option value="">Todas</option>
        {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>
      <select name="puesto" defaultValue={miembro.puesto_id ?? ''} className="rounded-lg border border-stone-300 px-2 py-1">
        <option value="">Sin puesto</option>
        {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <button type="submit" className="rounded-lg border border-stone-300 px-3 py-1 hover:bg-stone-50">Guardar</button>
    </form>
  );
}

/** Alta de empleados por número de reloj (docs/adr/0014): uno por renglón, con nombre opcional. */
export function FormAltaEmpleados({ slug, sucursales, puestos }: { slug: string; sucursales: Opcion[]; puestos: Opcion[] }) {
  const [estado, enviar, pendiente] = useActionState(altaEmpleados.bind(null, slug), {});
  return (
    <form action={enviar} className="grid gap-3 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className={etiqueta}>Números de reloj (uno por renglón; puedes agregar el nombre: 0005, Ana)</span>
        <textarea name="numeros" required rows={4} className={`${campo} font-mono`} placeholder={'0005\n0006, Ana López'} />
      </label>
      <label className="block">
        <span className={etiqueta}>Rol</span>
        <select name="rol" className={campo} defaultValue="colaborador">
          <option value="colaborador">{NOMBRE_ROL.colaborador}</option>
          <option value="supervisor">{NOMBRE_ROL.supervisor}</option>
        </select>
      </label>
      <label className="block">
        <span className={etiqueta}>Sucursal</span>
        <select name="sucursal" className={campo} defaultValue={sucursales[0]?.id ?? ''}>
          <option value="">Sin sucursal</option>
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={etiqueta}>Puesto</span>
        <select name="puesto" className={campo} defaultValue={puestos[0]?.id ?? ''}>
          <option value="">Sin puesto</option>
          {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </label>
      <button type="submit" disabled={pendiente} className={`${boton} sm:col-span-2`}>{pendiente ? 'Dando de alta…' : 'Dar de alta'}</button>
      <div className="sm:col-span-2"><Aviso estado={estado} /></div>
    </form>
  );
}
