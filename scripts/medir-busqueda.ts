// `npm run medir:busqueda`: mide el paso de búsqueda del RAG con pruebas/busqueda.json (recall@12 y MRR), sin y con
// la reescritura de la consulta. La versión "sin" no usa IA (reproducible); la "con" usa el modelo rápido.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buscar } from '../lib/ia/asistente.ts';
import type { Database } from '../lib/supabase/tipos.ts';

const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const { data: empresa } = await supabase.from('empresas').select('id, giro').eq('slug', 'del-rio').single();
const { preguntas } = JSON.parse(readFileSync('pruebas/busqueda.json', 'utf8')) as { preguntas: { pregunta: string; esperadas: string[] }[] };
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const empata = (r: string, e: string) => norm(r) === norm(e) || (!e.includes(',') && norm(r).startsWith(`${norm(e)},`));

const json = process.argv.includes('--json');
const salida: { modo: string; aciertos: number; total: number; mrr: number; detalle: { pregunta: string; esperada: string; posicion: number | null; primeras: string[] }[] }[] = [];
for (const modo of ['sin reescritura', 'con reescritura'] as const) {
  let aciertos = 0;
  let mrr = 0;
  const fallas: string[] = [];
  const detalle: (typeof salida)[number]['detalle'] = [];
  for (const q of preguntas) {
    const refs = modo === 'con reescritura'
      ? (await buscar(supabase, empresa!.id, q.pregunta, empresa!.giro)).map(x => x.referencia ?? x.titulo)
      : ((await supabase.rpc('buscar_secciones', { p_empresa: empresa!.id, p_consulta: q.pregunta, p_limite: 12 })).data ?? []).map(x => x.referencia ?? x.titulo);
    const pos = refs.findIndex(r => q.esperadas.some(e => empata(r, e)));
    detalle.push({ pregunta: q.pregunta, esperada: q.esperadas.join(' / '), posicion: pos >= 0 ? pos + 1 : null, primeras: refs.slice(0, 3) });
    if (pos >= 0) {
      aciertos++;
      mrr += 1 / (pos + 1);
    } else fallas.push(`${q.pregunta.slice(0, 40)} → ${q.esperadas[0]}`);
  }
  salida.push({ modo, aciertos, total: preguntas.length, mrr: mrr / preguntas.length, detalle });
  if (!json) console.log(`${modo}: recall@12 ${aciertos}/${preguntas.length} · MRR ${(mrr / preguntas.length).toFixed(2)}${fallas.length ? `\n  fallas: ${fallas.join(' | ')}` : ''}`);
}

if (json) console.log(JSON.stringify(salida));
