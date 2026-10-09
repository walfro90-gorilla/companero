import Link from 'next/link';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { requerirGestion } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';
import { Generador } from './generador';

// La generación tarda: tres encargos a la IA en paralelo sobre todo el material.
export const maxDuration = 300;

const ESTADO = {
  borrador: 'bg-stone-100 text-stone-700',
  autorizado: 'bg-emerald-100 text-emerald-800',
  archivado: 'bg-stone-100 text-stone-400',
} as const;
const NOMBRE_ESTADO = { borrador: 'Borrador', autorizado: 'Publicado', archivado: 'Archivado' } as const;

export default async function Modulos({ params }: PageProps<'/e/[slug]/admin/modulos'>) {
  const { slug } = await params;
  const { supabase, empresa } = await requerirGestion(slug);
  const [{ data: modulos }, { data: documentos }, { data: puestos }] = await Promise.all([
    supabase.from('modulos')
      .select('id, titulo, descripcion, tipo, estado, generado_por_ia, puestos(nombre), lecciones(id), preguntas(id), escenarios(id)')
      .eq('empresa_id', empresa.id).order('creado_en', { ascending: false }),
    supabase.from('documentos').select('id, numero, titulo').eq('empresa_id', empresa.id).eq('estado', 'autorizado').order('numero'),
    supabase.from('puestos').select('id, nombre').eq('empresa_id', empresa.id).order('nombre'),
  ]);
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 md:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="size-5" /> Módulos de capacitación</h1>
        <p className="text-sm text-stone-600">
          Inducción para quien llega y refuerzos para el personal activo. La IA los arma con tu material publicado, todo con su
          cita; tú revisas y publicas.
        </p>
      </header>
      <section className={tarjeta}>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-[var(--marca)]" /> Generar con IA</h2>
        <Generador slug={slug} documentos={documentos ?? []} puestos={puestos ?? []} />
      </section>
      <section className="space-y-3">
        {(modulos ?? []).map(m => (
          <Link key={m.id} href={`/e/${slug}/admin/modulos/${m.id}`} className={`${tarjeta} flex items-center gap-4 hover:border-stone-400`}>
            <span className="flex-1">
              <span className="block font-medium">{m.titulo}</span>
              <span className="text-sm text-stone-500">
                {m.tipo === 'induccion' ? 'Inducción' : 'Refuerzo'}{m.puestos?.nombre ? ` · ${m.puestos.nombre}` : ' · todos los puestos'} ·{' '}
                {m.lecciones.length} lecciones · {m.preguntas.length} preguntas · {m.escenarios.length} prácticas
                {m.generado_por_ia ? ' · generado con IA' : ''}
              </span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO[m.estado]}`}>{NOMBRE_ESTADO[m.estado]}</span>
            <ChevronRight className="size-5 text-stone-400" />
          </Link>
        ))}
      </section>
    </main>
  );
}
