import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, ChevronRight, Circle, Inbox, MessageCircle, RotateCcw } from 'lucide-react';
import { bienvenida } from '@/lib/avatar';
import { progresoDe } from '@/lib/juego-datos';
import { contextoEmpresa } from '@/lib/sesion';
import { Avatar } from '@/app/_ui/avatar';
import { boton, tarjeta } from '@/app/_ui/estilos';
import { BarraNivel } from './modulos/[id]/recorrido';
import { EnVivo } from './canalizaciones/en-vivo';

// Inicio de cada persona en su empresa: su ruta de capacitación (inducción y refuerzos), sus dudas
// canalizadas con la respuesta del supervisor/RH y, si gestiona, los pasos para dejar lista la empresa.
export default async function InicioEmpresa({ params }: PageProps<'/e/[slug]'>) {
  const { slug } = await params;
  const { supabase, empresa, miembro, usuario, gestiona } = await contextoEmpresa(slug);
  const base = `/e/${slug}`;

  const [{ data: modulos }, { data: avances }, { data: dudas }, progreso, { data: revPracticas }, { data: revTests }] = await Promise.all([
    supabase
      .from('modulos').select('id, titulo, descripcion, tipo, puesto_id, lecciones(id)')
      .eq('empresa_id', empresa.id).eq('estado', 'autorizado').order('tipo').order('orden'),
    supabase.from('avances').select('leccion_id').eq('usuario_id', usuario.id).eq('empresa_id', empresa.id),
    supabase
      .from('canalizaciones').select('id, pregunta, destino, estado, respuesta, creada_en')
      .eq('usuario_id', usuario.id).eq('empresa_id', empresa.id).order('creada_en', { ascending: false }).limit(5),
    progresoDe(supabase, empresa.id, usuario.id),
    supabase.from('practicas').select('id, calificacion, comentario, revisado_en, escenarios(titulo)')
      .eq('usuario_id', usuario.id).eq('empresa_id', empresa.id).not('calificacion', 'is', null).order('revisado_en', { ascending: false }).limit(5),
    supabase.from('intentos').select('id, calificacion, comentario, revisado_en, modulos(titulo)')
      .eq('usuario_id', usuario.id).eq('empresa_id', empresa.id).not('calificacion', 'is', null).order('revisado_en', { ascending: false }).limit(5),
  ]);
  const revisiones = [
    ...(revPracticas ?? []).map(r => ({ ...r, id: `p-${r.id}`, que: `Práctica: ${r.escenarios?.titulo ?? ''}` })),
    ...(revTests ?? []).map(r => ({ ...r, id: `t-${r.id}`, que: `Test: ${r.modulos?.titulo ?? ''}` })),
  ].sort((a, b) => (b.revisado_en ?? '').localeCompare(a.revisado_en ?? '')).slice(0, 5);
  const hechas = new Set((avances ?? []).map(a => a.leccion_id));
  // Quien entró por QR aún no tiene puesto: ve todos los módulos hasta que RH se lo asigne.
  const mios = (modulos ?? []).filter(m => !m.puesto_id || !miembro.puesto_id || m.puesto_id === miembro.puesto_id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 md:p-6">
      <section className="flex items-center gap-4">
        <Avatar avatar={empresa.avatar} estado="reposo" chico />
        <div className="flex-1">
          <p className="text-stone-700">{bienvenida(empresa.avatar, empresa.nombre, miembro.puesto).split('. ').slice(0, 2).join('. ')}.</p>
          <Link href={`${base}/asistente`} className={`${boton} mt-2`}>
            <MessageCircle className="size-4" /> Pregúntale a {empresa.avatar.nombre}
          </Link>
        </div>
      </section>

      {/* La respuesta del supervisor a una duda canalizada aparece sola (Realtime). */}
      <EnVivo empresaId={empresa.id} />
      {gestiona && <PasosGestion slug={slug} empresaId={empresa.id} />}

      <section className="space-y-3">
        <BarraNivel progreso={progreso} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {progreso.insignias.map(i => (
            <div key={i.id} title={i.descripcion} className={`rounded-xl p-2 text-center text-xs ${i.ganada ? 'bg-[var(--marca-suave)] text-stone-900' : 'bg-stone-100 text-stone-400'}`}>
              <Award className={`mx-auto mb-1 size-6 ${i.ganada ? 'text-[var(--marca)]' : ''}`} />
              {i.nombre}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="size-5" /> Tu ruta de capacitación</h2>
        {mios.length === 0 && (
          <p className={`${tarjeta} text-sm text-stone-600`}>
            Todavía no hay módulos publicados para ti. Mientras, puedes preguntarle a {empresa.avatar.nombre} sobre tu trabajo.
          </p>
        )}
        {mios.map(m => {
          const total = m.lecciones.length;
          const listas = m.lecciones.filter(l => hechas.has(l.id)).length;
          const completo = total > 0 && listas === total;
          return (
            <Link key={m.id} href={`${base}/modulos/${m.id}`} className={`${tarjeta} flex items-center gap-4 hover:border-stone-400`}>
              {completo ? <CheckCircle2 className="size-6 text-emerald-600" /> : m.tipo === 'refuerzo' ? <RotateCcw className="size-6 text-[var(--marca)]" /> : <Circle className="size-6 text-stone-300" />}
              <span className="flex-1">
                <span className="block font-medium">
                  {m.titulo}
                  {m.tipo === 'refuerzo' && <span className="ml-2 rounded-full bg-[var(--marca-suave)] px-2 py-0.5 text-xs text-[var(--marca)]">Refuerzo</span>}
                </span>
                {m.descripcion && <span className="block text-sm text-stone-500">{m.descripcion}</span>}
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <span className="block h-full bg-[var(--marca)]" style={{ width: `${total ? (listas / total) * 100 : 0}%` }} />
                </span>
              </span>
              <span className="text-sm text-stone-500">{listas}/{total}</span>
              <ChevronRight className="size-5 text-stone-400" />
            </Link>
          );
        })}
      </section>

      {revisiones.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold"><Award className="size-5" /> Retroalimentación de tu instructor</h2>
          {revisiones.map(r => (
            <div key={r.id} className={`${tarjeta} flex items-start gap-3`}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--marca-suave)] text-lg font-bold text-[var(--marca)]">{r.calificacion}</span>
              <div>
                <p className="font-medium">{r.que}</p>
                {r.comentario && <p className="text-sm text-stone-700">{r.comentario}</p>}
              </div>
            </div>
          ))}
        </section>
      )}

      {(dudas ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold"><Inbox className="size-5" /> Tus dudas canalizadas</h2>
          {dudas!.map(d => (
            <div key={d.id} className={tarjeta}>
              <p className="text-sm text-stone-500">{d.destino === 'rh' ? 'Recursos Humanos' : 'Tu supervisor'} · {new Date(d.creada_en).toLocaleDateString('es-MX', { timeZone: 'America/Ciudad_Juarez' })}</p>
              <p className="font-medium">{d.pregunta}</p>
              {d.estado === 'atendida' && d.respuesta ? (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><strong>Respuesta:</strong> {d.respuesta}</p>
              ) : (
                <p className="mt-2 text-sm text-amber-700">Pendiente de respuesta</p>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

/** Lista de arranque para admin/RH: lo mínimo para que el personal empiece. */
async function PasosGestion({ slug, empresaId }: { slug: string; empresaId: string }) {
  const { supabase } = await contextoEmpresa(slug);
  const [docs, mods, miembros] = await Promise.all([
    supabase.from('documentos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('estado', 'autorizado'),
    supabase.from('modulos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('estado', 'autorizado'),
    supabase.from('miembros').select('usuario_id', { count: 'exact', head: true }).eq('empresa_id', empresaId),
  ]);
  const pasos = [
    { hecho: (docs.count ?? 0) > 0, texto: 'Sube y publica tu material de capacitación', href: `/e/${slug}/admin/contenido` },
    { hecho: (mods.count ?? 0) > 0, texto: 'Genera con IA y publica tu primer módulo de inducción', href: `/e/${slug}/admin/modulos` },
    { hecho: (miembros.count ?? 0) > 1, texto: 'Invita a tu equipo con el QR de cada sucursal', href: `/e/${slug}/admin/equipo` },
  ];
  if (pasos.every(p => p.hecho)) return null;
  return (
    <section className={`${tarjeta} space-y-2`}>
      <h2 className="font-semibold">Deja lista tu empresa</h2>
      {pasos.map(p => (
        <Link key={p.texto} href={p.href} className="flex items-center gap-2 text-sm hover:underline">
          {p.hecho ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-stone-300" />}
          <span className={p.hecho ? 'text-stone-400 line-through' : ''}>{p.texto}</span>
        </Link>
      ))}
    </section>
  );
}
