import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, MessagesSquare, XCircle } from 'lucide-react';
import { analizar } from '@/lib/conocimiento/citas';
import { requerirGestion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';
import { ProveedorEtiquetas, TextoConCitas } from '@/app/_ui/fuentes';
import { etiquetasDe } from '../../asistente/acciones';
import { FormCalificar } from './formulario';

// Respuestas para revisar y calificar (docs/adr/0014, pedido de Wal): las prácticas (conversación con el cliente
// simulado + retroalimentación de la IA) y los tests de cada empleado. Calificación humana de 0 a 10 con comentario,
// que el empleado ve. Es retroalimentación de aprendizaje, no una decisión automatizada (condición de la ficha).

type Turno = { rol: 'usuario' | 'avatar'; texto: string };
type Respuesta = { pregunta_id: string; elegida: number; correcta: boolean };

const FILTROS = { pendientes: 'Pendientes', revisadas: 'Revisadas', todas: 'Todas' } as const;

export default async function Respuestas({ params, searchParams }: PageProps<'/e/[slug]/admin/respuestas'>) {
  const { slug } = await params;
  const sp = await searchParams;
  const ver = (typeof sp.ver === 'string' && sp.ver in FILTROS ? sp.ver : 'pendientes') as keyof typeof FILTROS;
  const { supabase, empresa } = await requerirGestion(slug);

  let qPracticas = supabase
    .from('practicas')
    .select('id, usuario_id, completada_en, transcripcion, retroalimentacion, calificacion, comentario, revisado_en, modulos(titulo), escenarios(titulo, situacion, personaje)')
    .eq('empresa_id', empresa.id).order('completada_en', { ascending: false }).limit(40);
  let qIntentos = supabase
    .from('intentos')
    .select('id, usuario_id, creado_en, modulo_id, respuestas, aciertos, total, calificacion, comentario, revisado_en, modulos(titulo)')
    .eq('empresa_id', empresa.id).order('creado_en', { ascending: false }).limit(40);
  if (ver === 'pendientes') {
    qPracticas = qPracticas.is('calificacion', null);
    qIntentos = qIntentos.is('calificacion', null);
  } else if (ver === 'revisadas') {
    qPracticas = qPracticas.not('calificacion', 'is', null);
    qIntentos = qIntentos.not('calificacion', 'is', null);
  }
  const [{ data: practicas }, { data: intentos }, { count: pendientes }, { count: pendientesTest }] = await Promise.all([
    qPracticas, qIntentos,
    supabase.from('practicas').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa.id).is('calificacion', null),
    supabase.from('intentos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa.id).is('calificacion', null),
  ]);

  // Quién es quién (número de reloj y nombre) y las preguntas de los tests.
  const usuarios = [...new Set([...(practicas ?? []), ...(intentos ?? [])].map(x => x.usuario_id))];
  const modulos = [...new Set((intentos ?? []).map(x => x.modulo_id))];
  const [{ data: personas }, { data: preguntas }] = await Promise.all([
    usuarios.length
      ? supabase.from('miembros').select('usuario_id, numero_reloj, nombre, sucursales(nombre)').eq('empresa_id', empresa.id).in('usuario_id', usuarios)
      : Promise.resolve({ data: [] }),
    modulos.length
      ? supabase.from('preguntas').select('id, orden, enunciado, opciones, correcta').in('modulo_id', modulos)
      : Promise.resolve({ data: [] }),
  ]);
  const persona = new Map((personas ?? []).map(p => [p.usuario_id, p]));
  const pregunta = new Map((preguntas ?? []).map(p => [p.id, p]));
  const quien = (id: string) => {
    const p = persona.get(id);
    if (!p) return 'Empleado';
    return [p.numero_reloj ? `Núm. ${p.numero_reloj}` : null, p.nombre, p.sucursales?.nombre].filter(Boolean).join(' · ');
  };
  const etiquetas = await etiquetasDe(slug, (practicas ?? []).flatMap(p => analizar(p.retroalimentacion ?? '', () => true).citas));

  const elementos = [
    ...(practicas ?? []).map(p => ({ tipo: 'practica' as const, fecha: p.completada_en, p })),
    ...(intentos ?? []).map(t => ({ tipo: 'test' as const, fecha: t.creado_en, t })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const fecha = (f: string) => new Date(f).toLocaleString('es-MX', { timeZone: 'America/Ciudad_Juarez', dateStyle: 'medium', timeStyle: 'short' });

  return (
    <ProveedorEtiquetas etiquetas={etiquetas}>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-5 p-4 md:p-6">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-xl font-semibold"><ClipboardCheck className="size-5" /> Respuestas para revisar</h1>
          <p className="text-sm text-stone-600">
            Prácticas con el cliente simulado y tests de tu equipo. Tu calificación y tu comentario los ve el empleado. Es retroalimentación de
            aprendizaje: no se usa para decisiones de contratación ni de desempeño.
          </p>
          <nav className="flex gap-2">
            {Object.entries(FILTROS).map(([k, t]) => (
              <Link key={k} href={`?ver=${k}`} className={`rounded-full border px-3 py-1 text-sm ${ver === k ? 'border-[var(--marca)] bg-[var(--marca-suave)] font-medium' : 'border-stone-300 bg-white'}`}>
                {t}{k === 'pendientes' ? ` (${(pendientes ?? 0) + (pendientesTest ?? 0)})` : ''}
              </Link>
            ))}
          </nav>
        </header>

        {elementos.length === 0 && <p className={`${tarjeta} text-sm text-stone-600`}>{ver === 'pendientes' ? 'No hay respuestas pendientes de revisar.' : 'Todavía no hay respuestas.'}</p>}

        {elementos.map(e =>
          e.tipo === 'practica' ? (
            <article key={`p-${e.p.id}`} className={tarjeta}>
              <p className="text-xs text-stone-500">{quien(e.p.usuario_id)} · {fecha(e.p.completada_en)}</p>
              <h2 className="flex items-center gap-2 font-semibold"><MessagesSquare className="size-4" /> Práctica: {e.p.escenarios?.titulo}</h2>
              <p className="text-sm text-stone-500">{e.p.modulos?.titulo} · {e.p.escenarios?.situacion}</p>
              <div className="mt-3 space-y-2">
                {((e.p.transcripcion ?? []) as Turno[]).map((t, i) => (
                  <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${t.rol === 'usuario' ? 'ml-auto rounded-br-sm bg-stone-800 text-white' : 'rounded-bl-sm bg-amber-50 ring-1 ring-amber-200'}`}>
                    <span className="mb-0.5 block text-xs opacity-70">{t.rol === 'usuario' ? 'Empleado' : e.p.escenarios?.personaje}</span>
                    {t.texto}
                  </p>
                ))}
                {!(e.p.transcripcion as Turno[] | null)?.length && <p className="text-sm text-stone-400">(Práctica anterior a que se guardara la conversación.)</p>}
              </div>
              {e.p.retroalimentacion && (
                <div className="mt-3 rounded-xl bg-stone-50 p-3 text-sm ring-1 ring-stone-200">
                  <p className="mb-1 text-xs font-medium text-stone-500">Retroalimentación de la IA</p>
                  <TextoConCitas slug={slug} texto={e.p.retroalimentacion} />
                </div>
              )}
              <FormCalificar slug={slug} tipo="practica" id={e.p.id} calificacion={e.p.calificacion} comentario={e.p.comentario} />
            </article>
          ) : (
            <article key={`t-${e.t.id}`} className={tarjeta}>
              <p className="text-xs text-stone-500">{quien(e.t.usuario_id)} · {fecha(e.t.creado_en)}</p>
              <h2 className="flex items-center gap-2 font-semibold"><ClipboardCheck className="size-4" /> Test: {e.t.modulos?.titulo}</h2>
              <p className="text-sm text-stone-500">{e.t.aciertos} de {e.t.total} correctas (calificación automática del test)</p>
              <ol className="mt-2 space-y-1.5 text-sm">
                {((e.t.respuestas ?? []) as Respuesta[]).map(r => {
                  const q = pregunta.get(r.pregunta_id);
                  return (
                    <li key={r.pregunta_id} className="flex gap-2">
                      {r.correcta ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />}
                      <span>
                        {q?.enunciado ?? 'Pregunta eliminada'}
                        <span className="block text-xs text-stone-500">
                          Respondió: {q?.opciones[r.elegida] ?? 'sin respuesta'}{!r.correcta && q ? ` · Correcta: ${q.opciones[q.correcta]}` : ''}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <FormCalificar slug={slug} tipo="test" id={e.t.id} calificacion={e.t.calificacion} comentario={e.t.comentario} />
            </article>
          ),
        )}
      </main>
    </ProveedorEtiquetas>
  );
}
