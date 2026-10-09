import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2, MessagesSquare } from 'lucide-react';
import { requerirGestion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';
import { ProveedorEtiquetas, TextoConCitas } from '@/app/_ui/fuentes';
import { analizar } from '@/lib/conocimiento/citas';
import { etiquetasDe } from '../../../asistente/acciones';
import { AccionesModulo, BorrarElemento, EditarLeccion } from './controles';

// Revisión de un módulo antes de publicarlo (docs/adr/0011): RH ve cada lección, pregunta y situación con sus
// citas, edita o quita lo que no le convenza y publica.
export default async function RevisarModulo({ params, searchParams }: PageProps<'/e/[slug]/admin/modulos/[id]'>) {
  const { slug, id } = await params;
  const { supabase, empresa } = await requerirGestion(slug);
  const { data: m } = await supabase
    .from('modulos')
    .select('id, titulo, descripcion, tipo, estado, generado_por_ia, puestos(nombre), lecciones(id, orden, titulo, objetivo, contenido), preguntas(id, orden, enunciado, opciones, correcta, explicacion, seccion), escenarios(id, orden, titulo, situacion, personaje, objetivo)')
    .eq('id', id).eq('empresa_id', empresa.id).maybeSingle();
  if (!m) notFound();
  const sp = await searchParams;
  const descartadas = typeof sp.descartadas === 'string' ? sp.descartadas.split('|') : [];
  const orden = <T extends { orden: number }>(xs: T[]) => [...xs].sort((a, b) => a.orden - b.orden);
  const etiquetas = await etiquetasDe(slug, [m.lecciones.map(l => l.contenido), m.preguntas.map(p => p.explicacion), m.escenarios.map(e => e.objetivo)]
    .flat().flatMap(t => analizar(t, () => true).citas));

  return (
    <ProveedorEtiquetas etiquetas={etiquetas}>
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{m.tipo === 'induccion' ? 'Inducción' : 'Refuerzo'}{m.puestos?.nombre ? ` · ${m.puestos.nombre}` : ''}{m.generado_por_ia ? ' · generado con IA' : ''}</p>
          <h1 className="text-xl font-semibold">{m.titulo}</h1>
          {m.descripcion && <p className="text-stone-600">{m.descripcion}</p>}
        </div>
        <AccionesModulo slug={slug} id={m.id} estado={m.estado} />
      </header>

      {descartadas.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="size-4" /> Se descartó lo que no tenía sustento en tu material:</p>
          <ul className="ml-5 list-disc">{descartadas.map(d => <li key={d}>{d}</li>)}</ul>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lecciones</h2>
        {orden(m.lecciones).map(l => (
          <article key={l.id} className={tarjeta}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{l.orden}. {l.titulo}</p>
                {l.objetivo && <p className="text-sm text-stone-500">Al terminar: {l.objetivo}</p>}
              </div>
              <BorrarElemento slug={slug} moduloId={m.id} tipo="leccion" id={l.id} />
            </div>
            <TextoConCitas slug={slug} texto={l.contenido} />
            <EditarLeccion slug={slug} moduloId={m.id} id={l.id} titulo={l.titulo} contenido={l.contenido} />
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Test ({m.preguntas.length} preguntas)</h2>
        {orden(m.preguntas).map(p => (
          <article key={p.id} className={tarjeta}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{p.orden}. {p.enunciado}</p>
              <BorrarElemento slug={slug} moduloId={m.id} tipo="pregunta" id={p.id} />
            </div>
            <ol className="my-2 space-y-1 text-sm">
              {p.opciones.map((o, i) => (
                <li key={i} className={`flex items-center gap-2 ${i === p.correcta ? 'font-medium text-emerald-700' : 'text-stone-600'}`}>
                  {i === p.correcta ? <CheckCircle2 className="size-4" /> : <span className="inline-block size-4" />} {o}
                </li>
              ))}
            </ol>
            <p className="text-sm text-stone-700"><TextoConCitas slug={slug} texto={p.explicacion} /></p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Situaciones prácticas</h2>
        {orden(m.escenarios).map(e => (
          <article key={e.id} className={tarjeta}>
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-medium"><MessagesSquare className="size-4" /> {e.titulo}</p>
              <BorrarElemento slug={slug} moduloId={m.id} tipo="escenario" id={e.id} />
            </div>
            <p className="mt-1 text-sm text-stone-700">{e.situacion}</p>
            <p className="mt-1 text-sm text-stone-500">El asistente interpreta: {e.personaje}</p>
            <p className="mt-1 text-sm"><strong>Lo que debe hacer:</strong> <TextoConCitas slug={slug} texto={e.objetivo} /></p>
          </article>
        ))}
      </section>
    </main>
    </ProveedorEtiquetas>
  );
}
