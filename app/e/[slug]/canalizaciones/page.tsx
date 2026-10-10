import { Inbox } from 'lucide-react';
import { requerirSupervision } from '@/lib/sesion';
import { tarjeta } from '@/app/_ui/estilos';
import { EnVivo, FormRespuesta } from './en-vivo';

// Bandeja de dudas canalizadas (docs/adr/0011): llegan en vivo (Supabase Realtime, con RLS) y se responden
// aquí; la respuesta le aparece a quien preguntó en su Inicio.
export default async function Canalizaciones({ params }: PageProps<'/e/[slug]/canalizaciones'>) {
  const { slug } = await params;
  const { supabase, empresa } = await requerirSupervision(slug);
  const { data } = await supabase
    .from('canalizaciones')
    .select('id, pregunta, destino, estado, respuesta, creada_en, usuario_id, sucursales(nombre)')
    .eq('empresa_id', empresa.id)
    .order('estado').order('creada_en', { ascending: false })
    .limit(50);
  const lista = data ?? [];
  const ids = [...new Set(lista.map(c => c.usuario_id))];
  const { data: personas } = ids.length
    ? await supabase.from('miembros').select('usuario_id, nombre').eq('empresa_id', empresa.id).in('usuario_id', ids)
    : { data: [] };
  const nombre = new Map((personas ?? []).map(p => [p.usuario_id, p.nombre]));
  const abiertas = lista.filter(c => c.estado === 'abierta').length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 md:p-6">
      <EnVivo empresaId={empresa.id} />
      <header className="flex items-center gap-2">
        <Inbox className="size-5" />
        <h1 className="text-xl font-semibold">Dudas del equipo</h1>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-900">{abiertas} pendientes</span>
      </header>
      <p className="text-sm text-stone-600">
        Lo que {empresa.avatar.nombre} no pudo responder con el material, o lo que le toca decidir a una persona. Si se repite,
        probablemente falta en el material: revísalo en Métricas.
      </p>
      {lista.length === 0 && <p className={`${tarjeta} text-sm text-stone-600`}>No hay dudas canalizadas todavía.</p>}
      {lista.map(c => (
        <article key={c.id} className={`${tarjeta} ${c.estado === 'abierta' ? 'border-amber-300' : ''}`}>
          <p className="text-xs text-stone-500">
            {nombre.get(c.usuario_id) ?? 'Colaborador'}{c.sucursales?.nombre ? ` · ${c.sucursales.nombre}` : ''} · para{' '}
            {c.destino === 'rh' ? 'RH' : 'supervisor'} · {new Date(c.creada_en).toLocaleString('es-MX', { timeZone: 'America/Ciudad_Juarez', dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <p className="mt-1 font-medium">{c.pregunta}</p>
          {c.estado === 'atendida' ? (
            <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><strong>Respondida:</strong> {c.respuesta}</p>
          ) : (
            <FormRespuesta slug={slug} id={c.id} />
          )}
        </article>
      ))}
    </main>
  );
}
