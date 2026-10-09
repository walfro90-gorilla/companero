'use server';

import { revalidatePath } from 'next/cache';
import { APROBADO, type Progreso } from '@/lib/juego';
import { progresoDe } from '@/lib/juego-datos';
import { contextoEmpresa } from '@/lib/sesion';

// Lo que hace quien aprende en un módulo. Cada acción devuelve su progreso nuevo para animar puntos y nivel.

async function contexto(slug: string, moduloId: string) {
  const ctx = await contextoEmpresa(slug);
  // La RLS solo deja ver módulos publicados (o todo, a quien gestiona).
  const { data: modulo } = await ctx.supabase.from('modulos').select('id').eq('id', moduloId).eq('empresa_id', ctx.empresa.id).maybeSingle();
  if (!modulo) throw new Error('Módulo no disponible');
  return ctx;
}

export async function marcarLeccion(slug: string, moduloId: string, leccionId: string): Promise<Progreso> {
  const { supabase, empresa, usuario } = await contexto(slug, moduloId);
  await supabase.from('avances').upsert(
    { empresa_id: empresa.id, usuario_id: usuario.id, modulo_id: moduloId, leccion_id: leccionId },
    { onConflict: 'usuario_id,leccion_id', ignoreDuplicates: true },
  );
  revalidatePath(`/e/${slug}`);
  return progresoDe(supabase, empresa.id, usuario.id);
}

export type Calificacion = {
  aciertos: number;
  total: number;
  aprobado: boolean;
  detalle: { pregunta_id: string; elegida: number; correcta: number; acierto: boolean; explicacion: string; seccion: string }[];
  progreso: Progreso;
};

/** Se califica en el servidor y queda en `intentos`, que solo ve quien lo hizo (ADR 0011). */
export async function enviarTest(slug: string, moduloId: string, respuestas: Record<string, number>): Promise<Calificacion> {
  const { supabase, empresa, usuario } = await contexto(slug, moduloId);
  const { data: preguntas } = await supabase.from('preguntas').select('id, orden, correcta, explicacion, seccion').eq('modulo_id', moduloId).order('orden');
  const detalle = (preguntas ?? []).map(p => {
    const elegida = Number.isInteger(respuestas[p.id]) ? respuestas[p.id] : -1;
    return { pregunta_id: p.id, elegida, correcta: p.correcta, acierto: elegida === p.correcta, explicacion: p.explicacion, seccion: p.seccion };
  });
  const aciertos = detalle.filter(d => d.acierto).length;
  const total = detalle.length;
  await supabase.from('intentos').insert({
    empresa_id: empresa.id, usuario_id: usuario.id, modulo_id: moduloId, aciertos, total,
    respuestas: detalle.map(({ pregunta_id, elegida, acierto }) => ({ pregunta_id, elegida, correcta: acierto })),
  });
  revalidatePath(`/e/${slug}`);
  return { aciertos, total, aprobado: total > 0 && aciertos / total >= APROBADO, detalle, progreso: await progresoDe(supabase, empresa.id, usuario.id) };
}

/** La práctica ya la guardó /api/practica al generar la retroalimentación (ADR 0014); aquí solo se refresca el progreso. */
export async function completarPractica(slug: string, moduloId: string): Promise<Progreso> {
  const { supabase, empresa, usuario } = await contexto(slug, moduloId);
  revalidatePath(`/e/${slug}`);
  return progresoDe(supabase, empresa.id, usuario.id);
}
