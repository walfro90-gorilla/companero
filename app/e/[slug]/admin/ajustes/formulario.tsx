'use client';

import { useActionState, useState } from 'react';
import type { Avatar as DatosAvatar } from '@/lib/avatar';
import { Avatar } from '@/app/_ui/avatar';
import { boton, campo, etiqueta, tarjeta } from '@/app/_ui/estilos';
import { guardarAvatar, type EstadoAjustes } from './acciones';

export function FormAvatar({ slug, avatar }: { slug: string; avatar: DatosAvatar }) {
  const [estado, enviar, pendiente] = useActionState<EstadoAjustes, FormData>(guardarAvatar.bind(null, slug), {});
  const [vista, setVista] = useState(avatar);
  const color = (k: keyof DatosAvatar['colores']) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setVista(v => ({ ...v, colores: { ...v.colores, [k]: e.target.value } }));
  return (
    <form action={enviar} className={`${tarjeta} grid gap-4 md:grid-cols-[200px_1fr]`}>
      <Avatar avatar={vista} estado="reposo" />
      <div className="space-y-3">
        <label className="block">
          <span className={etiqueta}>Nombre</span>
          <input name="nombre" defaultValue={avatar.nombre} onChange={e => setVista(v => ({ ...v, nombre: e.target.value }))} className={campo} maxLength={30} />
        </label>
        <label className="block">
          <span className={etiqueta}>Cómo se presenta</span>
          <input name="rol" defaultValue={avatar.rol} className={campo} maxLength={60} />
        </label>
        <label className="block">
          <span className={etiqueta}>Saludo (opcional; si lo dejas vacío se arma solo)</span>
          <textarea name="saludo" defaultValue={avatar.saludo ?? ''} rows={3} className={campo} maxLength={600} />
        </label>
        <div className="grid grid-cols-4 gap-2">
          {([['color', 'camisa', 'Uniforme'], ['fondo', 'fondo', 'Fondo'], ['piel', 'piel', 'Piel'], ['cabello', 'cabello', 'Cabello']] as const).map(([n, k, t]) => (
            <label key={n} className="block text-center text-xs text-stone-600">
              <input type="color" name={n} defaultValue={avatar.colores[k]} onChange={color(k)} className="h-10 w-full cursor-pointer rounded-lg" />
              {t}
            </label>
          ))}
        </div>
        <label className="block">
          <span className={etiqueta}>Preguntas sugeridas (una por línea, hasta 6)</span>
          <textarea name="preguntas" defaultValue={avatar.preguntas.join('\n')} rows={5} className={campo} />
        </label>
        <button type="submit" disabled={pendiente} className={boton}>{pendiente ? 'Guardando…' : 'Guardar'}</button>
        {estado.ok && <p className="text-sm text-emerald-700">Guardado.</p>}
        {estado.error && <p className="text-sm text-red-700">{estado.error}</p>}
      </div>
    </form>
  );
}
