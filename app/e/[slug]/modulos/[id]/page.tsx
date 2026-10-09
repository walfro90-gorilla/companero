import { notFound } from 'next/navigation';
import { progresoDe } from '@/lib/juego-datos';
import { analizar } from '@/lib/conocimiento/citas';
import { contextoEmpresa } from '@/lib/sesion';
import { ProveedorEtiquetas } from '@/app/_ui/fuentes';
import { etiquetasDe } from '../../asistente/acciones';
import { Recorrido } from './recorrido';

// Recorrido de un módulo para quien aprende (docs/adr/0011): lecciones → test → práctica, con puntos.
export default async function Modulo({ params }: PageProps<'/e/[slug]/modulos/[id]'>) {
  const { slug, id } = await params;
  const { supabase, empresa, usuario } = await contextoEmpresa(slug);
  const { data: m } = await supabase
    .from('modulos')
    // Sin la respuesta correcta ni la explicación: el test se califica en el servidor.
    .select('id, titulo, descripcion, tipo, lecciones(id, orden, titulo, objetivo, contenido), preguntas(id, orden, enunciado, opciones), escenarios(id, orden, titulo, situacion, personaje, secciones)')
    .eq('id', id).eq('empresa_id', empresa.id).maybeSingle();
  if (!m) notFound();
  const [{ data: avances }, { data: intentos }, { data: practicas }, progreso] = await Promise.all([
    supabase.from('avances').select('leccion_id').eq('usuario_id', usuario.id).eq('modulo_id', id),
    supabase.from('intentos').select('aciertos, total, calificacion, comentario, revisado_en').eq('usuario_id', usuario.id).eq('modulo_id', id),
    supabase.from('practicas').select('escenario_id, calificacion, comentario, revisado_en').eq('usuario_id', usuario.id).eq('modulo_id', id),
    progresoDe(supabase, empresa.id, usuario.id),
  ]);
  const orden = <T extends { orden: number }>(xs: T[]) => [...xs].sort((a, b) => a.orden - b.orden);
  // Las citas se muestran como las pide el documento («sección 5»). Las del test se resuelven aquí sin mandar
  // al navegador ni la respuesta correcta ni la explicación.
  const { data: delTest } = await supabase.from('preguntas').select('seccion').eq('modulo_id', id);
  const etiquetas = await etiquetasDe(slug, [
    ...m.lecciones.flatMap(l => analizar(l.contenido, () => true).citas),
    ...m.escenarios.flatMap(e => e.secciones),
    ...(delTest ?? []).map(p => p.seccion),
  ]);
  const mejor = (intentos ?? []).reduce<{ aciertos: number; total: number } | null>(
    (b, i) => (!b || i.aciertos / i.total > b.aciertos / b.total ? i : b), null);
  return (
    <ProveedorEtiquetas etiquetas={etiquetas}>
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
      revisionTest={(intentos ?? []).filter(i => i.calificacion !== null).sort((a, b) => (b.revisado_en ?? '').localeCompare(a.revisado_en ?? ''))[0] ?? null}
      revisionesPractica={Object.fromEntries((practicas ?? []).filter(p => p.calificacion !== null).map(p => [p.escenario_id, { calificacion: p.calificacion!, comentario: p.comentario }]))}
      progresoInicial={progreso}
    />
    </ProveedorEtiquetas>
  );
}
