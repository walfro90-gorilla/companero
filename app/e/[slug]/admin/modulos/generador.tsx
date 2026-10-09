'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { boton, campo, etiqueta } from '@/app/_ui/estilos';
import { generarModulo } from './acciones';

const PASOS = ['Leyendo tu material…', 'Diseñando las lecciones…', 'Escribiendo el test…', 'Preparando situaciones prácticas…', 'Revisando que todo tenga su cita…'];

export function Generador({ slug, documentos, puestos }: { slug: string; documentos: { id: string; numero: number; titulo: string }[]; puestos: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [paso, setPaso] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function generar(d: FormData) {
    setError('');
    setPaso(0);
    const reloj = setInterval(() => setPaso(p => (p === null ? null : Math.min(p + 1, PASOS.length - 1))), 9000);
    try {
      const r = await generarModulo(slug, d);
      if (!r.ok) return setError(r.error);
      router.push(`/e/${slug}/admin/modulos/${r.id}${r.descartadas.length ? `?descartadas=${encodeURIComponent(r.descartadas.join('|'))}` : ''}`);
    } finally {
      clearInterval(reloj);
      setPaso(null);
    }
  }

  if (!documentos.length) return <p className="text-sm text-stone-600">Primero publica al menos un documento en Contenido.</p>;
  return (
    <form action={generar} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={etiqueta}>Tipo</span>
          <select name="tipo" className={campo} defaultValue="induccion">
            <option value="induccion">Inducción (nuevo ingreso)</option>
            <option value="refuerzo">Refuerzo (personal activo)</option>
          </select>
        </label>
        <label className="block">
          <span className={etiqueta}>Puesto</span>
          <select name="puesto" className={campo} defaultValue={puestos[0]?.id ?? ''}>
            <option value="">Todos los puestos</option>
            {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className={etiqueta}>Material</legend>
        <div className="flex flex-wrap gap-3">
          {documentos.map(d => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="documentos" value={d.id} defaultChecked /> D{d.numero} {d.titulo}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className={etiqueta}>Enfoque (opcional)</span>
        <input name="enfoque" className={campo} placeholder="Ej.: cambió el procedimiento de cancelaciones" maxLength={300} />
      </label>
      <button type="submit" disabled={paso !== null} className={boton}>
        <Sparkles className="size-4" /> {paso !== null ? PASOS[paso] : 'Generar módulo'}
      </button>
      {paso !== null && <p className="text-sm text-stone-500">Tarda alrededor de un minuto. Queda como borrador para que lo revises.</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    </form>
  );
}
