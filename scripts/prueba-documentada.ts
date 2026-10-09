// `npm run prueba [-- --empresa del-rio]`: corre pruebas/consultas.json contra el mismo cerebro que usa la
// app (búsqueda en Supabase + cadena de IA) y escribe docs/prueba-documentada.md (docs/adr/0007). Los errores
// se reportan tal cual: es lo que pide Del Río. Usa la llave secreta de .env.local (solo para scripts).

import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { analizar, type Destino } from '../lib/conocimiento/citas.ts';
import { avatarDe } from '../lib/avatar.ts';
import { responder } from '../lib/ia/asistente.ts';
import type { Database } from '../lib/supabase/tipos.ts';

type Consulta = {
  id: number;
  tipo: 'cubierta' | 'sin_respuesta';
  pregunta: string;
  esperadas?: string[];
  canaliza?: Destino | 'opcional';
};

type Fila = Consulta & {
  respuesta: string;
  consultadas: string[];
  /** ¿El buscador trajo al menos una de las secciones esperadas? (recall del paso de búsqueda) */
  encontro: boolean | null;
  citas: string[];
  invalidas: string[];
  canalizo: Destino | null;
  proveedor: string;
  ms: number;
  resultado: '✅ correcta' | '↪️ canalizada' | '❌ error';
  motivo: string;
};

function evaluar(c: Consulta, citas: string[], invalidas: string[], canalizo: Destino | null): Pick<Fila, 'resultado' | 'motivo'> {
  const problemas: string[] = [];
  if (invalidas.length) problemas.push(`citó secciones inexistentes (${invalidas.join(', ')})`);
  if (c.tipo === 'sin_respuesta') {
    if (!canalizo) problemas.push('no canalizó una pregunta sin respuesta en el material');
    else if (c.canaliza && c.canaliza !== 'opcional' && canalizo !== c.canaliza) problemas.push(`canalizó a ${canalizo}, se esperaba ${c.canaliza}`);
    if (citas.length) problemas.push(`presentó fuentes (${citas.join(', ')}) para algo que no está en el material`);
    return problemas.length ? { resultado: '❌ error', motivo: problemas.join('; ') } : { resultado: '↪️ canalizada', motivo: '' };
  }
  const esperadas = c.esperadas ?? [];
  if (!citas.some(id => esperadas.includes(id))) problemas.push(`no citó ninguna sección esperada (${esperadas.join(', ')})`);
  if (c.canaliza === 'supervisor' || c.canaliza === 'rh') {
    if (canalizo !== c.canaliza) problemas.push(`debía canalizar a ${c.canaliza}`);
  } else if (c.canaliza !== 'opcional' && canalizo) {
    problemas.push(`canalizó (${canalizo}) una pregunta cubierta`);
  }
  return problemas.length ? { resultado: '❌ error', motivo: problemas.join('; ') } : { resultado: '✅ correcta', motivo: '' };
}

const i = process.argv.indexOf('--empresa');
const slug = i > 0 ? process.argv[i + 1] : 'del-rio';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
if (!url || !secreta) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local');
const supabase = createClient<Database>(url, secreta, { auth: { persistSession: false } });
const { data: empresa } = await supabase.from('empresas').select('id, nombre, giro, avatar').eq('slug', slug).single();
if (!empresa) throw new Error(`No existe la empresa ${slug} (¿corriste npm run sembrar?)`);
const { data: docs } = await supabase.from('documentos').select('numero, titulo, ejemplo').eq('empresa_id', empresa.id).eq('estado', 'autorizado').order('numero');
const hayEjemplo = (docs ?? []).some(d => d.ejemplo);
const avatar = avatarDe(empresa.avatar);

const { consultas } = JSON.parse(readFileSync('pruebas/consultas.json', 'utf8')) as { consultas: Consulta[] };
const filas: Fila[] = [];

for (const c of consultas) {
  const inicio = Date.now();
  const { conmutacion: r, recuperadas } = await responder(
    { supabase, empresaId: empresa.id, mensajes: [{ rol: 'usuario', texto: c.pregunta }], persona: { asistente: avatar.nombre, empresa: empresa.nombre, giro: empresa.giro } },
    { registrar: () => {} },
  );
  const consultadas = recuperadas.map(x => x.codigo);
  const existe = (id: string) => consultadas.includes(id);
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
  } else {
    respuesta = `(ningún proveedor respondió: ${r.intentos.map(i => `${i.proveedor}=${i.clase}`).join(', ')})`;
  }
  const a = analizar(respuesta, existe);
  const fila: Fila = {
    ...c, respuesta, consultadas, encontro: c.esperadas?.length ? c.esperadas.some(e => consultadas.includes(e)) : null, citas: a.citas, invalidas: a.invalidas, canalizo: a.canalizar, proveedor, ms: Date.now() - inicio,
    ...evaluar(c, a.citas, a.invalidas, a.canalizar),
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
  `Empresa: ${empresa.nombre} (\`${slug}\`). Material publicado: ${(docs ?? []).map(d => `D${d.numero} "${d.titulo}"`).join('; ')}.`,
  `Búsqueda (paso de recuperación del RAG): encontró una sección esperada en ${filas.filter(f => f.encontro).length} de ${filas.filter(f => f.encontro !== null).length} consultas cubiertas.`,
  hayEjemplo ? '\n> **Atención:** se corrió contra contenido de EJEMPLO, no contra el material autorizado de Del Río.\n' : '',
  `**Resultado:** ${cuenta('✅ correcta')} correctas · ${cuenta('↪️ canalizada')} canalizadas correctamente · ${cuenta('❌ error')} errores, de ${filas.length} consultas ` +
    `(${filas.filter(f => f.tipo === 'cubierta').length} cubiertas por el material y ${filas.filter(f => f.tipo === 'sin_respuesta').length} sin respuesta disponible).`,
  '',
  '| # | Consulta | Tipo | Esperado | Consultó | Citó | Canalizó | Proveedor | Tiempo | Resultado |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...filas.map(f => `| ${f.id} | ${celda(f.pregunta)} | ${f.tipo === 'cubierta' ? 'cubierta' : 'sin respuesta'} | ` +
    `${f.tipo === 'cubierta' ? (f.esperadas ?? []).join(', ') : `canalizar a ${f.canaliza}`}${f.tipo === 'cubierta' && f.canaliza && f.canaliza !== 'opcional' ? ` + canalizar a ${f.canaliza}` : ''} | ` +
    `${f.consultadas.join(', ') || '—'} | ${f.citas.join(', ') || '—'}${f.invalidas.length ? ` (inválidas: ${f.invalidas.join(', ')})` : ''} | ${f.canalizo ?? '—'} | ${f.proveedor} | ${(f.ms / 1000).toFixed(1)} s | ` +
    `${f.resultado}${f.motivo ? `: ${celda(f.motivo)}` : ''} |`),
  '',
  '## Respuestas completas',
  '',
  ...filas.flatMap(f => [`### ${f.id}. ${f.pregunta}`, '', `${f.resultado}${f.motivo ? ` — ${f.motivo}` : ''}`, '', '```text', f.respuesta.trim(), '```', '']),
].join('\n');

writeFileSync('docs/prueba-documentada.md', md);
console.log(`\n${cuenta('✅ correcta')} correctas · ${cuenta('↪️ canalizada')} canalizadas · ${cuenta('❌ error')} errores → docs/prueba-documentada.md`);
process.exitCode = cuenta('❌ error') ? 1 : 0;
