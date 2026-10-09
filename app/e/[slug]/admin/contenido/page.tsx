import { FileText } from 'lucide-react';
import { requerirGestion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';
import { AccionesDocumento, Subir } from './subir';

const ESTADO = {
  borrador: { texto: 'Borrador', clase: 'bg-stone-100 text-stone-700' },
  autorizado: { texto: 'Publicado', clase: 'bg-emerald-100 text-emerald-800' },
  archivado: { texto: 'Archivado', clase: 'bg-stone-100 text-stone-400' },
} as const;

// Contenido (docs/adr/0010): RH sube el material, revisa cómo quedó partido en secciones y lo publica. El
// asistente solo usa lo publicado.
export default async function Contenido({ params, searchParams }: PageProps<'/e/[slug]/admin/contenido'>) {
  const { slug } = await params;
  const { supabase, empresa } = await requerirGestion(slug);
  const { data } = await supabase
    .from('documentos')
    .select('id, numero, titulo, fuente, tipo, estado, ejemplo, actualizado_en, secciones(orden, titulo, texto, contexto, pagina, referencia)')
    .eq('empresa_id', empresa.id)
    .order('numero');
  const docs = data ?? [];
  const nueva = (await searchParams).nueva !== undefined;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-semibold">Material de capacitación</h1>
        <p className="text-sm text-stone-600">
          Manuales, guías y procedimientos de {empresa.nombre}. {empresa.avatar.nombre} solo responde con lo que esté publicado aquí,
          y cita el documento y la sección (por ejemplo D1-3).
        </p>
      </header>
      {nueva && (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ¡Listo, tu empresa ya existe! El siguiente paso es subir tu primer manual.
        </p>
      )}
      <Subir slug={slug} />

      <section className="space-y-3">
        {docs.map(d => {
          const secciones = [...d.secciones].sort((a, b) => a.orden - b.orden);
          const conContexto = secciones.filter(s => s.contexto).length;
          return (
            <article key={d.id} className={tarjeta}>
              <div className="flex flex-wrap items-start gap-3">
                <FileText className="mt-0.5 size-5 text-stone-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">D{d.numero}</span>
                    {d.titulo}
                    {d.ejemplo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Ejemplo</span>}
                  </p>
                  <p className="text-xs text-stone-500">
                    {d.fuente} · {secciones.length} secciones · {conContexto} con contexto para la búsqueda
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO[d.estado].clase}`}>{ESTADO[d.estado].texto}</span>
                <AccionesDocumento slug={slug} id={d.id} estado={d.estado} />
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-stone-600 hover:text-stone-900">Revisar secciones</summary>
                <ol className="mt-2 space-y-2">
                  {secciones.map(s => (
                    <li key={s.orden} className="rounded-lg bg-stone-50 p-3 text-sm">
                      <p className="font-medium">
                        <span className="mr-2 font-mono text-xs text-stone-500">D{d.numero}-{s.orden}</span>
                        {s.referencia ?? s.titulo}{s.pagina ? <span className="text-stone-400"> · pág. {s.pagina}</span> : null}
                      </p>
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-stone-700">{s.texto}</p>
                      {s.contexto && <p className="mt-1 text-xs italic text-stone-500">Búsqueda: {s.contexto}</p>}
                    </li>
                  ))}
                </ol>
              </details>
            </article>
          );
        })}
      </section>
    </main>
  );
}
