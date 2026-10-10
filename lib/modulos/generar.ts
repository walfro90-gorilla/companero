// "Genera la inducción con IA" (docs/adr/0011): a partir de las secciones publicadas, la IA propone lecciones,
// test y situaciones prácticas, TODO con cita. Lógica pura (con pruebas): armar las peticiones y validar lo
// que devuelve el modelo sin confiar en él. Lo que cite una sección que no se le dio, se descarta.
// RH revisa y publica: nada generado llega al personal sin aprobación humana.

import { z } from 'zod';
import { codigosCitados, normalizarCodigo } from '../conocimiento/citas.ts';
import type { Peticion } from '../ia/cadena.ts';

export type SeccionFuente = { codigo: string; documento: string; titulo: string; texto: string };

export type Encargo = {
  empresa: string;
  puesto: string | null;
  tipo: 'induccion' | 'refuerzo';
  /** Lo que RH quiere enfatizar (p. ej. "cambió el procedimiento de cancelaciones"). */
  enfoque: string | null;
  secciones: SeccionFuente[];
};

const MAX_CARACTERES = 60_000;

function material(secciones: SeccionFuente[]): string {
  let total = 0;
  const partes: string[] = [];
  for (const s of secciones) {
    const bloque = `[${s.codigo}] ${s.documento} › ${s.titulo}\n${s.texto}`;
    if (total + bloque.length > MAX_CARACTERES) break;
    partes.push(bloque);
    total += bloque.length;
  }
  return partes.join('\n\n');
}

const BASE = (e: Encargo) =>
  `Diseñas capacitación para ${e.empresa}${e.puesto ? `, puesto: ${e.puesto}` : ''}. Tipo de módulo: ${
    e.tipo === 'induccion' ? 'inducción para personal de nuevo ingreso' : 'refuerzo breve para personal activo'
  }.${e.enfoque ? ` Enfoque pedido por RH: ${e.enfoque}.` : ''}
Tu única fuente es el material autorizado que viene abajo, dividido en secciones con id entre corchetes. No agregues
procedimientos, cifras ni reglas que no estén ahí. Cada afirmación lleva la cita de su sección con el formato [D1-3].
Español de México, de tú, frases cortas, para leerse en el celular. Responde SOLO con JSON válido, sin texto extra.`;

export function peticionLecciones(e: Encargo): Peticion {
  const n = e.tipo === 'induccion' ? '4 a 6' : '2 a 3';
  return {
    instructions: `${BASE(e)}
Formato: {"titulo":"…","descripcion":"una oración","lecciones":[{"titulo":"…","objetivo":"lo que podrás hacer al terminar","contenido":"explicación paso a paso con citas [D1-3]; listas numeradas para procedimientos; máximo 180 palabras","secciones":["D1-3"]}]}
Arma ${n} lecciones en un orden lógico para aprender (de lo básico a lo que requiere más cuidado).`,
    messages: [{ role: 'user', content: material(e.secciones) }],
    maxOutputTokens: 6000,
  };
}

export function peticionTest(e: Encargo): Peticion {
  const n = e.tipo === 'induccion' ? '6' : '3';
  return {
    instructions: `${BASE(e)}
Formato: {"preguntas":[{"enunciado":"…","opciones":["…","…","…","…"],"correcta":0,"explicacion":"por qué es la correcta, con cita [D1-3]","seccion":"D1-3"}]}
Escribe ${n} preguntas de opción múltiple (4 opciones, una sola correcta) que evalúen comprensión aplicada a situaciones reales del puesto, no memoria literal. Los distractores deben ser errores plausibles de alguien nuevo. Varía la posición de la correcta.`,
    messages: [{ role: 'user', content: material(e.secciones) }],
    maxOutputTokens: 4000,
  };
}

export function peticionEscenarios(e: Encargo): Peticion {
  return {
    instructions: `${BASE(e)}
Formato: {"escenarios":[{"titulo":"…","situacion":"lo que está pasando, en 2 o 3 oraciones","personaje":"la OTRA persona que interpretará el asistente: un cliente o el supervisor, NUNCA la persona en capacitación (p. ej. 'cliente con prisa que quiere cancelar un producto ya cobrado')","objetivo":"qué debe hacer bien la persona según el material, con cita [D1-3]","secciones":["D1-3"]}]}
Propón 3 situaciones prácticas realistas del día a día del puesto en las que la persona tenga que aplicar el material. Al menos una debe requerir llamar al supervisor si el material lo indica.`,
    messages: [{ role: 'user', content: material(e.secciones) }],
    maxOutputTokens: 3000,
  };
}

// ─────────────────── Validación de lo que devuelve el modelo ───────────────────


const Leccion = z.object({
  titulo: z.string().trim().min(2).max(120),
  objetivo: z.string().trim().max(300).optional().default(''),
  contenido: z.string().trim().min(20).max(3000),
  secciones: z.array(z.string()).optional().default([]),
});
const Lecciones = z.object({
  titulo: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(300).optional().default(''),
  lecciones: z.array(z.unknown()),
});
const Pregunta = z.object({
  enunciado: z.string().trim().min(5).max(400),
  opciones: z.array(z.string().trim().min(1).max(200)).min(2).max(5),
  correcta: z.coerce.number().int().min(0),
  explicacion: z.string().trim().min(5).max(800),
  seccion: z.string().trim(),
});
const Escenario = z.object({
  titulo: z.string().trim().min(2).max(120),
  situacion: z.string().trim().min(10).max(800),
  personaje: z.string().trim().min(3).max(200),
  objetivo: z.string().trim().min(5).max(600),
  secciones: z.array(z.string()).optional().default([]),
});

export type LeccionGenerada = z.infer<typeof Leccion>;
export type PreguntaGenerada = z.infer<typeof Pregunta>;
export type EscenarioGenerado = z.infer<typeof Escenario>;

export type Revision = { descartadas: string[] };

/** Las secciones que cita un texto, si TODAS existen; null si cita algo que no se le dio (o nada). */
function citasValidas(texto: string, extra: string[], validos: Set<string>): string[] | null {
  // La misma regla que el chat (lib/conocimiento/citas.ts): cualquier guion, varios códigos, texto corto después.
  const todas = [...new Set([...codigosCitados(texto), ...extra.map(normalizarCodigo)])];
  if (!todas.length || todas.some(c => !validos.has(c))) return null;
  return todas;
}

export function validarLecciones(json: unknown, validos: Set<string>, r: Revision) {
  const base = Lecciones.safeParse(json);
  if (!base.success) return null;
  const lecciones: LeccionGenerada[] = [];
  for (const x of base.data.lecciones) {
    const l = Leccion.safeParse(x);
    if (!l.success) { r.descartadas.push('una lección con formato inválido'); continue; }
    const citas = citasValidas(l.data.contenido, l.data.secciones, validos);
    if (!citas) { r.descartadas.push(`lección "${l.data.titulo}": sin cita o con cita a una sección que no existe`); continue; }
    // "1. Apertura" → "Apertura": la app ya numera las lecciones.
    lecciones.push({ ...l.data, titulo: l.data.titulo.replace(/^\d+[.)]\s*/, ''), secciones: citas });
  }
  return { titulo: base.data.titulo, descripcion: base.data.descripcion, lecciones };
}

export function validarPreguntas(json: unknown, validos: Set<string>, r: Revision): PreguntaGenerada[] {
  const lista = (json as { preguntas?: unknown })?.preguntas;
  if (!Array.isArray(lista)) return [];
  const fuera: PreguntaGenerada[] = [];
  for (const x of lista) {
    const p = Pregunta.safeParse(x);
    if (!p.success) { r.descartadas.push('una pregunta con formato inválido'); continue; }
    const seccion = normalizarCodigo(p.data.seccion.replace(/[[\]【】]/g, ''));
    if (p.data.correcta >= p.data.opciones.length) { r.descartadas.push(`pregunta "${p.data.enunciado}": la respuesta correcta no existe`); continue; }
    if (new Set(p.data.opciones.map(o => o.toLowerCase())).size < p.data.opciones.length) { r.descartadas.push(`pregunta "${p.data.enunciado}": opciones repetidas`); continue; }
    if (!validos.has(seccion) || !citasValidas(p.data.explicacion, [seccion], validos)) {
      r.descartadas.push(`pregunta "${p.data.enunciado}": cita una sección que no existe`); continue;
    }
    fuera.push({ ...p.data, seccion });
  }
  return fuera;
}

export function validarEscenarios(json: unknown, validos: Set<string>, r: Revision): EscenarioGenerado[] {
  const lista = (json as { escenarios?: unknown })?.escenarios;
  if (!Array.isArray(lista)) return [];
  const fuera: EscenarioGenerado[] = [];
  for (const x of lista) {
    const e = Escenario.safeParse(x);
    if (!e.success) { r.descartadas.push('una situación práctica con formato inválido'); continue; }
    const citas = citasValidas(e.data.objetivo, e.data.secciones, validos);
    if (!citas) { r.descartadas.push(`situación "${e.data.titulo}": cita una sección que no existe`); continue; }
    fuera.push({ ...e.data, secciones: citas });
  }
  return fuera;
}
