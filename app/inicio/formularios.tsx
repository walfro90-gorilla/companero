'use client';

import { useActionState, useState } from 'react';
import { slugDe } from '@/lib/texto';
import { boton, campo, etiqueta } from '../_ui/estilos';
import { crearEmpresa, type EstadoForm } from './acciones';

const GIROS = ['Comercio / tiendas', 'Maquila / manufactura', 'Restaurantes', 'Servicios', 'Salud', 'Logística', 'Otro'];

export function FormCrearEmpresa() {
  const [estado, accion, pendiente] = useActionState<EstadoForm, FormData>(crearEmpresa, {});
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  return (
    <form action={accion} className="space-y-3">
      <label className="block">
        <span className={etiqueta}>Nombre de la empresa</span>
        <input name="nombre" required value={nombre} onChange={e => setNombre(e.target.value)} className={campo} placeholder="Tiendas del Norte" />
      </label>
      <label className="block">
        <span className={etiqueta}>Dirección</span>
        <div className="flex items-center gap-1 text-sm text-stone-500">
          <span>/e/</span>
          <input name="slug" value={slug || slugDe(nombre)} onChange={e => setSlug(slugDe(e.target.value))} className={campo} />
        </div>
      </label>
      <label className="block">
        <span className={etiqueta}>Giro</span>
        <select name="giro" className={campo} defaultValue="">
          <option value="">Elige uno</option>
          {GIROS.map(g => <option key={g}>{g}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={etiqueta}>Primera sucursal</span>
          <input name="sucursal" className={campo} placeholder="Matriz" />
        </label>
        <label className="block">
          <span className={etiqueta}>Primer puesto</span>
          <input name="puesto" className={campo} placeholder="Cajero" />
        </label>
      </div>
      {estado.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{estado.error}</p>}
      <button type="submit" disabled={pendiente} className={`${boton} w-full`}>{pendiente ? 'Creando…' : 'Crear empresa'}</button>
    </form>
  );
}
