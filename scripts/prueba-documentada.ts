// `npm run prueba [-- --empresa tienda-escuela]`: corre pruebas/consultas.json contra el mismo cerebro que usa la
// app (búsqueda en Supabase + cadena de IA) y escribe docs/prueba-documentada.md (docs/adr/0007 y 0013). Los
// errores se reportan tal cual: es lo que pide Del Río. Usa la llave secreta de .env.local (solo para scripts).

import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { analizar, type Destino } from '../lib/conocimiento/citas.ts';
import { avatarDe } from '../lib/avatar.ts';
import { canalizacionFaltante, responder } from '../lib/ia/asistente.ts';
import { fechaHora } from '../lib/ia/instrucciones.ts';
import type { Database } from '../lib/supabase/tipos.ts';

type Consulta = {
  id: number;
  tipo: 'cubierta' | 'sin_respuesta';
  pregunta: string;
  /** Referencias del documento («sección 5, Subtítulo» o «sección 5»); basta citar una. */
  esperadas?: string[];
  /** Textos que deben aparecer en la respuesta (resultados de cálculos). */
  contiene?: string[];
  canaliza?: Destino | 'opcional';
};

type Fila = Consulta & {
  respuesta: string;
  consultadas: string[];
  citadas: string[];
  invalidas: string[];
  canalizo: Destino | null;
  /** ¿El buscador trajo al menos una sección esperada? (recall del paso de búsqueda) */
  encontro: boolean | null;
  proveedor: string;
  ms: number;
  resultado: '✅ correcta' | '↪️ canalizada' | '❌ error';
  motivo: string;
};

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
/** «sección 5» empata con «sección 5, Si la segunda…»; una referencia completa empata solo consigo misma. */
const empata = (referencia: string, esperada: string) => {
  const r = norm(referencia);
  const e = norm(esperada);
  return r === e || (!e.includes(',') && r.startsWith(`${e},`));
};

function evaluar(c: Consulta, citadas: string[], invalidas: string[], canalizo: Destino | null, respuesta: string): Pick<Fila, 'resultado' | 'motivo'> {
  const problemas: string[] = [];
  if (invalidas.length) problemas.push(`citó secciones que no trajo el buscador (${invalidas.join(', ')})`);
  if (c.tipo === 'sin_respuesta') {
    if (!canalizo) problemas.push('no canalizó una pregunta que el manual no resuelve');
    else if (c.canaliza && c.canaliza !== 'opcional' && canalizo !== c.canaliza) problemas.push(`canalizó a ${canalizo}, se esperaba ${c.canaliza}`);
    return problemas.length ? { resultado: '❌ error', motivo: problemas.join('; ') } : { resultado: '↪️ canalizada', motivo: '' };
  }
  const esperadas = c.esperadas ?? [];
  if (!citadas.some(r => esperadas.some(e => empata(r, e)))) problemas.push(`no citó ninguna sección esperada (${esperadas.join(' / ')})`);
  for (const t of c.contiene ?? []) if (!respuesta.replace(/,/g, '').includes(t.replace(/,/g, ''))) problemas.push(`no dio el resultado esperado (${t})`);
  if (c.canaliza === 'supervisor' || c.canaliza === 'rh') {
    if (canalizo !== c.canaliza) problemas.push(`debía canalizar a ${c.canaliza}`);
  } else if (c.canaliza !== 'opcional' && canalizo) {
    problemas.push(`canalizó (${canalizo}) una pregunta cubierta`);
  }
  return problemas.length ? { resultado: '❌ error', motivo: problemas.join('; ') } : { resultado: '✅ correcta', motivo: '' };
}

const i = process.argv.indexOf('--empresa');
const slug = i > 0 ? process.argv[i + 1] : 'tienda-escuela';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
if (!url || !secreta) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local');
const supabase = createClient<Database>(url, secreta, { auth: { persistSession: false } });
const { data: empresa } = await supabase.from('empresas').select('id, nombre, giro, avatar').eq('slug', slug).single();
if (!empresa) throw new Error(`No existe la empresa ${slug} (¿corriste npm run sembrar?)`);
const { data: docs } = await supabase.from('documentos').select('numero, titulo, fuente, ejemplo').eq('empresa_id', empresa.id).eq('estado', 'autorizado').order('numero');
const avatar = avatarDe(empresa.avatar);

const archivo = JSON.parse(readFileSync('pruebas/consultas.json', 'utf8')) as { ahora?: string; consultas: Consulta[] };
const ahora = archivo.ahora ? new Date(archivo.ahora) : new Date();
const filas: Fila[] = [];

for (const c of archivo.consultas) {
  const inicio = Date.now();
  const { conmutacion: r, recuperadas } = await responder(
    { supabase, empresaId: empresa.id, mensajes: [{ rol: 'usuario', texto: c.pregunta }], persona: { asistente: avatar.nombre, empresa: empresa.nombre, giro: empresa.giro }, ahora },
    { registrar: () => {} },
  );
  const referencia = new Map(recuperadas.map(x => [x.codigo, x.referencia ?? `${x.documento} › ${x.titulo}`]));
  let respuesta = '';
  let proveedor = '—';
  if (r.ok) {
    proveedor = `${r.eslabon.proveedor}${r.intentos.length ? ' (respaldo)' : ''}`;
    respuesta = r.primero;
    for (;;) {
      const s = await r.resto.next();
      if (s.done) break;
      respuesta += s.value;
    }
    // El mismo paso que el chat: red de seguridad de la canalización.
    respuesta += await canalizacionFaltante(c.pregunta, respuesta);
  } else {
    respuesta = `(ningún proveedor respondió: ${r.intentos.map(x => `${x.proveedor}=${x.clase}`).join(', ')})`;
  }
  const a = analizar(respuesta, id => referencia.has(id));
  const citadas = a.citas.map(x => referencia.get(x)!);
  const consultadas = recuperadas.map(x => referencia.get(x.codigo)!);
  const fila: Fila = {
    ...c, respuesta, consultadas, citadas, invalidas: a.invalidas, canalizo: a.canalizar, proveedor, ms: Date.now() - inicio,
    encontro: c.esperadas?.length ? consultadas.some(x => c.esperadas!.some(e => empata(x, e))) : null,
    ...evaluar(c, citadas, a.invalidas, a.canalizar, respuesta),
  };
  filas.push(fila);
  console.log(`${fila.resultado}  #${c.id} ${c.pregunta}${fila.motivo ? `  → ${fila.motivo}` : ''}`);
}

const cuenta = (r: Fila['resultado']) => filas.filter(f => f.resultado === r).length;
const celda = (s: string) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const md = [
  '# Prueba documentada',
  '',
  `Generada por \`npm run prueba\` el ${new Date().toLocaleString('es-MX', { timeZone: 'America/Ciudad_Juarez' })} (hora de Cd. Juárez).`,
  `Empresa: ${empresa.nombre} (\`${slug}\`). Material: ${(docs ?? []).map(d => `D${d.numero} "${d.titulo}" — ${d.fuente ?? ''}`).join('; ')}.`,
  `Hora simulada de la consulta (afecta promociones con horario): ${fechaHora(ahora)}.`,
  `Búsqueda (paso de recuperación del RAG): trajo una sección esperada en ${filas.filter(f => f.encontro).length} de ${filas.filter(f => f.encontro !== null).length} consultas cubiertas.`,
  (docs ?? []).some(d => d.ejemplo) ? '\n> El material es **ficticio** (manual de Tienda Escuela entregado para el reto): no describe políticas reales de Del Río ni de Superette.\n' : '',
  `**Resultado:** ${cuenta('✅ correcta')} correctas · ${cuenta('↪️ canalizada')} canalizadas correctamente · ${cuenta('❌ error')} errores, de ${filas.length} consultas ` +
    `(${filas.filter(f => f.tipo === 'cubierta').length} cubiertas por el material y ${filas.filter(f => f.tipo === 'sin_respuesta').length} sin respuesta disponible).`,
  '',
  '| # | Consulta | Tipo | Esperado | Citó | Canalizó | Proveedor | Tiempo | Resultado |',
  '|---|---|---|---|---|---|---|---|---|',
  ...filas.map(f => `| ${f.id} | ${celda(f.pregunta)} | ${f.tipo === 'cubierta' ? 'cubierta' : 'sin respuesta'} | ` +
    `${f.tipo === 'cubierta' ? (f.esperadas ?? []).join(' / ') : `canalizar a ${f.canaliza}`}${f.contiene?.length ? ` · debe decir ${f.contiene.join(', ')}` : ''}${f.tipo === 'cubierta' && f.canaliza && f.canaliza !== 'opcional' ? ` · canalizar a ${f.canaliza}` : ''} | ` +
    `${celda(f.citadas.join('; ')) || '—'}${f.invalidas.length ? ` (inválidas: ${f.invalidas.join(', ')})` : ''} | ${f.canalizo ?? '—'} | ${f.proveedor} | ${(f.ms / 1000).toFixed(1)} s | ` +
    `${f.resultado}${f.motivo ? `: ${celda(f.motivo)}` : ''} |`),
  '',
  '## Respuestas completas',
  '',
  ...filas.flatMap(f => [
    `### ${f.id}. ${f.pregunta}`, '', `${f.resultado}${f.motivo ? ` — ${f.motivo}` : ''}`, '',
    `Secciones que trajo el buscador: ${f.consultadas.join('; ') || '(ninguna)'}`, '',
    '```text', f.respuesta.trim(), '```', '',
  ]),
].join('\n');

writeFileSync('docs/prueba-documentada.md', md);
console.log(`\n${cuenta('✅ correcta')} correctas · ${cuenta('↪️ canalizada')} canalizadas · ${cuenta('❌ error')} errores → docs/prueba-documentada.md`);
process.exitCode = cuenta('❌ error') ? 1 : 0;
