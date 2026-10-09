'use client';

import { Award, X } from 'lucide-react';

// Festejo al terminar un módulo o subir de nivel (docs/adr/0011). Confeti con CSS; respeta reduced-motion.
const COLORES = ['#c81e5b', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export function Festejo({ titulo, texto, onCerrar }: { titulo: string; texto: string; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar} role="dialog" aria-modal="true">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 60 }, (_, i) => (
          <span
            key={i}
            className="confeti"
            style={{ left: `${(i * 37) % 100}%`, background: COLORES[i % COLORES.length], animationDelay: `${(i % 12) * 0.12}s`, animationDuration: `${2.2 + (i % 5) * 0.3}s` }}
          />
        ))}
      </div>
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute right-3 top-3 rounded-full p-1 hover:bg-stone-100"><X className="size-5" /></button>
        <Award className="mx-auto mb-3 size-16 text-[var(--marca)]" />
        <h2 className="text-2xl font-semibold">{titulo}</h2>
        <p className="mt-2 text-stone-600">{texto}</p>
      </div>
    </div>
  );
}
