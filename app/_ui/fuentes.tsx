'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { leerSecciones, type SeccionVisible } from '@/app/e/[slug]/asistente/acciones';

// Citas verificables (docs/adr/0004): un [D1-3] se ve como referencia que abre el texto exacto de la sección
// y, si existe, el documento original en su página. Lo usan el chat, las lecciones y el test.

const MARCA = /(\[(?:D\d+-\d+\s*,\s*)*D\d+-\d+\])/g;

/** Negritas mínimas (**así**); el resto se respeta tal cual con whitespace-pre-wrap. */
export function ConNegritas({ texto }: { texto: string }) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith('**') && t.endsWith('**') ? <strong key={i}>{t.slice(2, -2)}</strong> : <span key={i}>{t}</span>,
  );
}

export function ChipCita({ codigo, onAbrir, titulo }: { codigo: string; onAbrir: (c: string) => void; titulo?: string }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(codigo)}
      title={titulo}
      className="mx-0.5 inline-flex translate-y-[-1px] items-center rounded-md bg-white px-1.5 py-0.5 align-baseline text-xs font-semibold text-[var(--marca)] ring-1 ring-[var(--marca)]/30 hover:bg-[var(--marca-suave)]"
    >
      {codigo}
    </button>
  );
}

/** Texto con citas ya validadas (lecciones, explicaciones del test): cada cita abre su sección. */
export function TextoConCitas({ slug, texto }: { slug: string; texto: string }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <>
      <span className="whitespace-pre-wrap leading-relaxed">
        {/* split con grupo de captura: las posiciones impares son las citas. */}
        {texto.split(MARCA).map((t, i) =>
          i % 2 === 1 ? (
            t.slice(1, -1).split(',').map(c => <ChipCita key={`${i}-${c}`} codigo={c.trim()} onAbrir={setAbierta} />)
          ) : (
            <ConNegritas key={i} texto={t} />
          ),
        )}
      </span>
      {abierta && <PanelSeccion slug={slug} codigo={abierta} onCerrar={() => setAbierta(null)} />}
    </>
  );
}

/** Panel con el texto exacto de la sección. Si no se le pasa, lo carga. */
export function PanelSeccion({ slug, codigo, seccion: dada, onCerrar }: { slug: string; codigo: string; seccion?: SeccionVisible; onCerrar: () => void }) {
  const [cargada, setCargada] = useState<SeccionVisible | null>(null);
  useEffect(() => {
    if (dada) return;
    let vigente = true;
    leerSecciones(slug, [codigo]).then(xs => vigente && setCargada(xs[0] ?? null)).catch(() => {});
    return () => {
      vigente = false;
    };
  }, [slug, codigo, dada]);
  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [onCerrar]);
  const seccion = dada ?? cargada ?? undefined;
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 p-4 md:items-center" onClick={onCerrar}>
      <article
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-seccion"
      >
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-stone-500">
              {seccion ? `${seccion.documento} · ${codigo}${seccion.pagina ? ` · pág. ${seccion.pagina}` : ''}` : codigo}
            </p>
            <h2 id="titulo-seccion" className="text-lg font-semibold">{seccion?.titulo ?? 'Cargando…'}</h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-1 hover:bg-stone-100">
            <X className="size-5" />
          </button>
        </header>
        {seccion && (
          <>
            <div className="whitespace-pre-wrap leading-relaxed text-stone-800">
              <ConNegritas texto={seccion.texto} />
            </div>
            {seccion.original && (
              <a href={seccion.original} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--marca)] hover:underline">
                <ExternalLink className="size-4" /> Ver en el documento original
              </a>
            )}
          </>
        )}
      </article>
    </div>
  );
}
