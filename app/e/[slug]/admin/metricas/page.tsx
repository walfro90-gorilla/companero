import { BarChart3, FileQuestion, ShieldCheck, Users } from 'lucide-react';
import { requerirGestion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';

// Métricas para RH (docs/adr/0011). Todo agregado y sin nombres: qué le falta al material, qué tan exacto es
// el asistente, qué preguntas del test cuestan trabajo y cuánto del equipo va listo por sucursal.
export default async function Metricas({ params }: PageProps<'/e/[slug]/admin/metricas'>) {
  const { slug } = await params;
  const { supabase, empresa } = await requerirGestion(slug);
  const [{ data: metricas }, { data: huecos }, { data: sucursales }, { data: modulos }] = await Promise.all([
    supabase.rpc('metricas_asistente', { p_empresa: empresa.id, p_dias: 30 }),
    supabase.rpc('huecos_del_material', { p_empresa: empresa.id, p_dias: 30 }),
    supabase.rpc('avance_por_sucursal', { p_empresa: empresa.id }),
    supabase.from('modulos').select('id, titulo').eq('empresa_id', empresa.id).eq('estado', 'autorizado'),
  ]);
  const dificultad = await Promise.all((modulos ?? []).map(async m => ({ modulo: m.titulo, preguntas: (await supabase.rpc('dificultad_del_test', { p_modulo: m.id })).data ?? [] })));
  const x = metricas?.[0];
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold"><BarChart3 className="size-5" /> Métricas (últimos 30 días)</h1>
      <p className="text-sm text-stone-600">Todo es agregado: aquí no se ve quién preguntó ni la calificación de nadie.</p>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ['Preguntas al asistente', String(x?.consultas ?? 0)],
          ['Respondidas con cita', pct(x?.con_cita ?? 0, x?.consultas ?? 0)],
          ['Canalizadas a una persona', pct(x?.canalizadas ?? 0, x?.consultas ?? 0)],
          ['Citas inválidas (error del modelo)', String(x?.citas_invalidas ?? 0)],
        ].map(([t, v]) => (
          <div key={t} className={tarjeta}>
            <p className="text-3xl font-semibold">{v}</p>
            <p className="text-sm text-stone-500">{t}</p>
          </div>
        ))}
      </section>

      <section className={tarjeta}>
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><FileQuestion className="size-5" /> Lo que tu material no cubre</h2>
        <p className="mb-3 text-sm text-stone-600">Preguntas que el asistente no pudo responder con el material o que tuvo que canalizar. Si se repiten, conviene documentarlas.</p>
        {(huecos ?? []).length === 0 ? <p className="text-sm text-stone-500">Nada por ahora.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-stone-500"><th className="py-1">Pregunta</th><th>Veces</th><th>Se canalizó a</th></tr></thead>
            <tbody>{huecos!.map(h => <tr key={h.pregunta} className="border-t border-stone-100"><td className="py-1.5">{h.pregunta}</td><td>{h.veces}</td><td>{h.destino === 'rh' ? 'RH' : h.destino === 'supervisor' ? 'Supervisor' : '—'}</td></tr>)}</tbody>
          </table>
        )}
      </section>

      <section className={tarjeta}>
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><Users className="size-5" /> Reto por sucursal: equipo listo</h2>
        <p className="mb-3 text-sm text-stone-600">Colaboradores que terminaron todas las lecciones de inducción publicadas.</p>
        <div className="space-y-2">
          {(sucursales ?? []).map(s => (
            <div key={s.sucursal}>
              <p className="flex justify-between text-sm"><span>{s.sucursal}</span><span className="text-stone-500">{s.listas} de {s.personas}</span></p>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-stone-100"><span className="block h-full bg-[var(--marca)]" style={{ width: pct(s.listas, s.personas).replace(' ', '').replace('—', '0%') }} /></span>
            </div>
          ))}
          {(sucursales ?? []).length === 0 && <p className="text-sm text-stone-500">Todavía no hay colaboradores.</p>}
        </div>
      </section>

      <section className={tarjeta}>
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="size-5" /> Preguntas del test que cuestan trabajo</h2>
        {dificultad.every(d => d.preguntas.every(p => !p.respuestas)) ? <p className="text-sm text-stone-500">Todavía no hay intentos.</p> : dificultad.map(d => (
          <div key={d.modulo} className="mb-3">
            <p className="text-sm font-medium">{d.modulo}</p>
            <ul className="text-sm">
              {d.preguntas.map(p => <li key={p.pregunta_id} className="flex justify-between border-t border-stone-100 py-1"><span>{p.enunciado}</span><span className="text-stone-500">{pct(p.aciertos, p.respuestas)} de acierto</span></li>)}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
