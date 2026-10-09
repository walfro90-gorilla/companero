import { notFound } from 'next/navigation';
import { progresoDe } from '@/lib/juego-datos';
import { contextoEmpresa } from '@/lib/sesion';
import { Recorrido } from './recorrido';

// Recorrido de un módulo para quien aprende (docs/adr/0011): lecciones → test → práctica, con puntos.
export default async function Modulo({ params }: PageProps<'/e/[slug]/modulos/[id]'>) {
  const { slug, id } = await params;
  const { supabase, empresa, usuario } = await contextoEmpresa(slug);
  const { data: m } = await supabase
    .from('modulos')
    // Sin la respuesta correcta ni la explicación: el test se califica en el servidor.
    .select('id, titulo, descripcion, tipo, lecciones(id, orden, titulo, objetivo, contenido), preguntas(id, orden, enunciado, opciones), escenarios(id, orden, titulo, situacion, personaje)')
    .eq('id', id).eq('empresa_id', empresa.id).maybeSingle();
  if (!m) notFound();
  const [{ data: avances }, { data: intentos }, { data: practicas }, progreso] = await Promise.all([
    supabase.from('avances').select('leccion_id').eq('usuario_id', usuario.id).eq('modulo_id', id),
    supabase.from('intentos').select('aciertos, total').eq('usuario_id', usuario.id).eq('modulo_id', id),
    supabase.from('practicas').select('escenario_id').eq('usuario_id', usuario.id).eq('modulo_id', id),
    progresoDe(supabase, empresa.id, usuario.id),
  ]);
  const orden = <T extends { orden: number }>(xs: T[]) => [...xs].sort((a, b) => a.orden - b.orden);
  const mejor = (intentos ?? []).reduce<{ aciertos: number; total: number } | null>(
    (b, i) => (!b || i.aciertos / i.total > b.aciertos / b.total ? i : b), null);
  return (
    <Recorrido
      slug={slug}
      asistente={empresa.avatar.nombre}
      modulo={{ id: m.id, titulo: m.titulo, descripcion: m.descripcion, tipo: m.tipo }}
      lecciones={orden(m.lecciones)}
      preguntas={orden(m.preguntas)}
      escenarios={orden(m.escenarios)}
      vistas={(avances ?? []).map(a => a.leccion_id)}
      mejorTest={mejor}
      practicadas={(practicas ?? []).map(p => p.escenario_id)}
      progresoInicial={progreso}
    />
  );
}
