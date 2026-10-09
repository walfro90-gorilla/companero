import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { APROBADO, progreso, type Actividad, type Progreso } from './juego.ts';
import type { Database } from './supabase/tipos.ts';

// La actividad de una persona en una empresa, leída con SU sesión (la RLS solo le deja ver lo propio).

const ZONA = 'America/Ciudad_Juarez';
export const dia = (f: string | Date) => new Date(f).toLocaleDateString('en-CA', { timeZone: ZONA });

export async function actividadDe(supabase: SupabaseClient<Database>, empresaId: string, usuarioId: string): Promise<Actividad> {
  const [av, it, pr, co, mods] = await Promise.all([
    supabase.from('avances').select('leccion_id, completada_en').eq('empresa_id', empresaId).eq('usuario_id', usuarioId),
    supabase.from('intentos').select('modulo_id, aciertos, total, creado_en').eq('empresa_id', empresaId).eq('usuario_id', usuarioId),
    supabase.from('practicas').select('completada_en').eq('empresa_id', empresaId).eq('usuario_id', usuarioId),
    supabase.from('consultas').select('creada_en').eq('empresa_id', empresaId).eq('usuario_id', usuarioId),
    supabase.from('modulos').select('id, lecciones(id), preguntas(id)').eq('empresa_id', empresaId).eq('estado', 'autorizado'),
  ]);
  const vistas = new Set((av.data ?? []).map(a => a.leccion_id));
  const mejor = new Map<string, { aciertos: number; total: number }>();
  for (const i of it.data ?? []) {
    const m = mejor.get(i.modulo_id);
    if (!m || i.aciertos / i.total > m.aciertos / m.total) mejor.set(i.modulo_id, { aciertos: i.aciertos, total: i.total });
  }
  const completos = (mods.data ?? []).filter(m => {
    if (!m.lecciones.length || !m.lecciones.every(l => vistas.has(l.id))) return false;
    if (!m.preguntas.length) return true;
    const t = mejor.get(m.id);
    return Boolean(t && t.aciertos / t.total >= APROBADO);
  }).length;
  const fechas = [
    ...(av.data ?? []).map(a => a.completada_en), ...(it.data ?? []).map(i => i.creado_en),
    ...(pr.data ?? []).map(p => p.completada_en), ...(co.data ?? []).map(c => c.creada_en),
  ];
  return {
    lecciones: vistas.size, tests: [...mejor.values()], practicas: pr.data?.length ?? 0, preguntas: co.data?.length ?? 0,
    modulosCompletos: completos, dias: [...new Set(fechas.map(dia))],
  };
}

export async function progresoDe(supabase: SupabaseClient<Database>, empresaId: string, usuarioId: string): Promise<Progreso> {
  return progreso(await actividadDe(supabase, empresaId, usuarioId), dia(new Date()));
}
