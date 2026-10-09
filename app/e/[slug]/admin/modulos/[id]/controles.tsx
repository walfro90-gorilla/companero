'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { boton, botonSecundario, campo } from '@/app/_ui/estilos';
import { borrarElemento, borrarModulo, editarLeccion, estadoModulo } from '../acciones';

export function AccionesModulo({ slug, id, estado }: { slug: string; id: string; estado: 'borrador' | 'autorizado' | 'archivado' }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {estado !== 'autorizado' ? (
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => estadoModulo(slug, id, 'autorizado'))} className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
          Publicar
        </button>
      ) : (
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => estadoModulo(slug, id, 'borrador'))} className={botonSecundario}>
          Despublicar
        </button>
      )}
      {confirmar ? (
        <button type="button" disabled={pendiente} onClick={() => iniciar(async () => { await borrarModulo(slug, id); router.push(`/e/${slug}/admin/modulos`); })} className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white">
          ¿Borrar módulo?
        </button>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)} className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-red-600" title="Borrar módulo">
          <Trash2 className="size-5" />
        </button>
      )}
    </div>
  );
}

export function BorrarElemento({ slug, moduloId, tipo, id }: { slug: string; moduloId: string; tipo: 'leccion' | 'pregunta' | 'escenario'; id: string }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button type="button" disabled={pendiente} onClick={() => iniciar(() => borrarElemento(slug, moduloId, tipo, id))} title="Quitar" className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600">
      <Trash2 className="size-4" />
    </button>
  );
}

export function EditarLeccion({ slug, moduloId, id, titulo, contenido }: { slug: string; moduloId: string; id: string; titulo: string; contenido: string }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900">
        <Pencil className="size-3.5" /> Editar
      </button>
    );
  }
  return (
    <form action={async d => { await editarLeccion(slug, moduloId, id, d); setAbierto(false); }} className="mt-3 space-y-2">
      <input name="titulo" defaultValue={titulo} className={campo} />
      <textarea name="contenido" defaultValue={contenido} rows={8} className={campo} />
      <p className="text-xs text-stone-500">Conserva las citas [D1-3]: son las que permiten verificar cada paso.</p>
      <div className="flex gap-2">
        <button type="submit" className={boton}>Guardar</button>
        <button type="button" onClick={() => setAbierto(false)} className={botonSecundario}>Cancelar</button>
      </div>
    </form>
  );
}
