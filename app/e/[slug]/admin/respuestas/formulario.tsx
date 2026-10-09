'use client';

import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { boton, campo } from '@/app/_ui/estilos';
import { calificar, type EstadoCalificar } from './acciones';

export function FormCalificar({ slug, tipo, id, calificacion, comentario }: { slug: string; tipo: 'practica' | 'test'; id: string; calificacion: number | null; comentario: string | null }) {
  const [estado, enviar, pendiente] = useActionState<EstadoCalificar, FormData>(calificar.bind(null, slug, tipo, id), {});
  return (
    <form action={enviar} className="mt-3 flex flex-wrap items-start gap-2 border-t border-stone-100 pt-3">
      <label className="text-sm">
        <span className="mb-1 block font-medium text-stone-700">Calificación</span>
        <select name="calificacion" defaultValue={calificacion ?? ''} required className="rounded-xl border border-stone-300 px-3 py-2.5">
          <option value="" disabled>—</option>
          {Array.from({ length: 11 }, (_, i) => 10 - i).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label className="min-w-56 flex-1 text-sm">
        <span className="mb-1 block font-medium text-stone-700">Comentario para el empleado</span>
        <textarea name="comentario" defaultValue={comentario ?? ''} rows={2} maxLength={2000} className={campo} placeholder="Qué hizo bien y qué repasar…" />
      </label>
      <button type="submit" disabled={pendiente} className={`${boton} self-end`}>{pendiente ? 'Guardando…' : calificacion === null ? 'Calificar' : 'Actualizar'}</button>
      {estado.ok && <p className="flex w-full items-center gap-1 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> Guardado: el empleado ya lo ve.</p>}
      {estado.error && <p className="w-full text-sm text-red-700">{estado.error}</p>}
    </form>
  );
}
