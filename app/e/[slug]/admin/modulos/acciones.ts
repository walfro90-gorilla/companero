'use server';

import { revalidatePath } from 'next/cache';
import { generarConRespaldo, jsonDe } from '@/lib/ia/cadena';
import { configurados } from '@/lib/ia/proveedores';
import {
  peticionEscenarios, peticionLecciones, peticionTest, validarEscenarios, validarLecciones, validarPreguntas,
  type Encargo, type Revision,
} from '@/lib/modulos/generar';
import { requerirGestion } from '@/lib/sesion';

export type ResultadoGenerar = { ok: true; id: string; descartadas: string[] } | { ok: false; error: string };

export async function generarModulo(slug: string, d: FormData): Promise<ResultadoGenerar> {
  const { supabase, empresa, usuario } = await requerirGestion(slug);
  if (configurados().length === 0) return { ok: false, error: 'Faltan las llaves de IA (ANTHROPIC_API_KEY o GROQ_API_KEY).' };
  const tipo = d.get('tipo') === 'refuerzo' ? 'refuerzo' : 'induccion';
  const puestoId = String(d.get('puesto') ?? '') || null;
  const documentos = d.getAll('documentos').map(String).filter(Boolean);
  const enfoque = String(d.get('enfoque') ?? '').trim().slice(0, 300) || null;

  let consulta = supabase
    .from('secciones')
    .select('orden, titulo, texto, documentos!inner(id, numero, titulo, estado)')
    .eq('empresa_id', empresa.id)
    .eq('documentos.estado', 'autorizado');
  if (documentos.length) consulta = consulta.in('documentos.id', documentos);
  const { data: filas } = await consulta;
  const secciones = (filas ?? [])
    .sort((a, b) => a.documentos.numero - b.documentos.numero || a.orden - b.orden)
    .map(s => ({ codigo: `D${s.documentos.numero}-${s.orden}`, documento: s.documentos.titulo, titulo: s.titulo, texto: s.texto }));
  if (!secciones.length) return { ok: false, error: 'No hay material publicado para generar el módulo. Publica al menos un documento.' };

  const puesto = puestoId ? (await supabase.from('puestos').select('nombre').eq('id', puestoId).maybeSingle()).data?.nombre ?? null : null;
  const encargo: Encargo = { empresa: empresa.nombre, puesto, tipo, enfoque, secciones };
  const validos = new Set(secciones.map(s => s.codigo));
  const revision: Revision = { descartadas: [] };

  // Tres encargos en paralelo: más rápido y cada respuesta cabe holgada en el tope de tokens.
  const cadena = configurados();
  const [l, t, e] = await Promise.all([
    generarConRespaldo(cadena, peticionLecciones(encargo), { plazo: 150_000 }),
    generarConRespaldo(cadena, peticionTest(encargo), { plazo: 150_000 }),
    generarConRespaldo(cadena, peticionEscenarios(encargo), { plazo: 150_000 }),
  ]);
  const lecciones = l.ok ? validarLecciones(jsonDe(l.texto), validos, revision) : null;
  if (!lecciones?.lecciones.length) return { ok: false, error: 'La IA no devolvió lecciones válidas. Intenta de nuevo.' };
  const preguntas = t.ok ? validarPreguntas(jsonDe(t.texto), validos, revision) : [];
  const escenarios = e.ok ? validarEscenarios(jsonDe(e.texto), validos, revision) : [];
  if (!t.ok) revision.descartadas.push('la IA no respondió el test');
  if (!e.ok) revision.descartadas.push('la IA no respondió las situaciones prácticas');

  const { data: modulo, error } = await supabase
    .from('modulos')
    .insert({
      empresa_id: empresa.id, puesto_id: puestoId, tipo, titulo: lecciones.titulo, descripcion: lecciones.descripcion || null,
      generado_por_ia: true, creado_por: usuario.id,
    })
    .select('id')
    .single();
  if (error || !modulo) return { ok: false, error: 'No se pudo guardar el módulo.' };
  const comun = { empresa_id: empresa.id, modulo_id: modulo.id };
  await Promise.all([
    supabase.from('lecciones').insert(lecciones.lecciones.map((x, i) => ({ ...comun, orden: i + 1, titulo: x.titulo, objetivo: x.objetivo || null, contenido: x.contenido, secciones: x.secciones }))),
    preguntas.length
      ? supabase.from('preguntas').insert(preguntas.map((x, i) => ({ ...comun, orden: i + 1, enunciado: x.enunciado, opciones: x.opciones, correcta: x.correcta, explicacion: x.explicacion, seccion: x.seccion })))
      : null,
    escenarios.length
      ? supabase.from('escenarios').insert(escenarios.map((x, i) => ({ ...comun, orden: i + 1, titulo: x.titulo, situacion: x.situacion, personaje: x.personaje, objetivo: x.objetivo, secciones: x.secciones })))
      : null,
  ]);
  revalidatePath(`/e/${slug}/admin/modulos`);
  return { ok: true, id: modulo.id, descartadas: revision.descartadas };
}

export async function estadoModulo(slug: string, id: string, estado: 'borrador' | 'autorizado' | 'archivado') {
  const { supabase, empresa } = await requerirGestion(slug);
  await supabase.from('modulos').update({ estado }).eq('id', id).eq('empresa_id', empresa.id);
  revalidatePath(`/e/${slug}/admin/modulos`);
  revalidatePath(`/e/${slug}/admin/modulos/${id}`);
}

export async function borrarModulo(slug: string, id: string) {
  const { supabase, empresa } = await requerirGestion(slug);
  await supabase.from('modulos').delete().eq('id', id).eq('empresa_id', empresa.id);
  revalidatePath(`/e/${slug}/admin/modulos`);
}

const TABLAS = { leccion: 'lecciones', pregunta: 'preguntas', escenario: 'escenarios' } as const;

export async function borrarElemento(slug: string, moduloId: string, tipo: keyof typeof TABLAS, id: string) {
  const { supabase, empresa } = await requerirGestion(slug);
  await supabase.from(TABLAS[tipo]).delete().eq('id', id).eq('empresa_id', empresa.id);
  revalidatePath(`/e/${slug}/admin/modulos/${moduloId}`);
}

export async function editarLeccion(slug: string, moduloId: string, id: string, d: FormData) {
  const { supabase, empresa } = await requerirGestion(slug);
  const contenido = String(d.get('contenido') ?? '').trim();
  const titulo = String(d.get('titulo') ?? '').trim();
  if (contenido.length < 10 || titulo.length < 2) return;
  await supabase.from('lecciones').update({ titulo, contenido }).eq('id', id).eq('empresa_id', empresa.id);
  revalidatePath(`/e/${slug}/admin/modulos/${moduloId}`);
}
