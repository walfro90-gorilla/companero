// `npm run validar`: corre TODAS las pruebas y escribe docs/validacion.md, el documento de validación para el
// jurado (criterio "Validación" del pitch y "Exactitud y respaldo" de la ficha de Del Río). Cada sección dice
// qué se prueba, por qué importa y el resultado real de esta corrida, con fecha. Nada se escribe a mano.
//
// Requiere el entorno local: `supabase start` + `npm run sembrar`; para la prueba de punta a punta también
// `npm run dev` y HUMO_EMAIL (el mismo correo de SEMBRAR_ADMIN_EMAIL).

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DB = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const ahora = new Date().toLocaleString('es-MX', { timeZone: 'America/Ciudad_Juarez', dateStyle: 'long', timeStyle: 'short' });

function correr(cmd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 300_000 });
  return { ok: r.status === 0, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const celda = (s: string) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const md: string[] = [];
const resumen: { suite: string; resultado: string; ok: boolean | null }[] = [];

// 1) Pruebas de lógica (node --test).
{
  const r = correr('node', ['--test', '--test-reporter=spec', 'lib/**/*.test.ts']);
  const pasan = Number(/ℹ pass (\d+)/.exec(r.salida)?.[1] ?? 0);
  const fallan = Number(/ℹ fail (\d+)/.exec(r.salida)?.[1] ?? 0);
  const casos = [...r.salida.matchAll(/^\s*([✔✖]) (.+?) \(\d/gm)].map(m => `${m[1] === '✔' ? '✅' : '❌'} ${m[2]}`);
  resumen.push({ suite: 'Lógica de la aplicación', resultado: `${pasan} de ${pasan + fallan}`, ok: fallan === 0 && pasan > 0 });
  md.push(
    '## 1. Lógica de la aplicación',
    '',
    'Pruebas automáticas de las piezas que deciden qué ve el usuario: cómo se parte un documento en secciones citables, cómo se detectan y validan las citas `[D1-3]` y las canalizaciones, el paso de búsqueda del RAG, el respaldo entre proveedores de IA (si Anthropic falla, responde Groq sin que se note) y las reglas de la gamificación.',
    '',
    `**Resultado:** ${pasan} pasan, ${fallan} fallan.`,
    '',
    '<details><summary>Ver cada caso</summary>',
    '',
    ...casos.map(c => `- ${c}`),
    '',
    '</details>',
    '',
  );
}

// 2) Aislamiento multiempresa, roles y privacidad (Postgres).
{
  const r = correr('psql', [DB, '-q', '-v', 'ON_ERROR_STOP=1', '-f', 'supabase/tests/aislamiento.test.sql']);
  const oks = [...r.salida.matchAll(/NOTICE:\s+ok: (.+)/g)].map(m => m[1]);
  const falla = /FALLÓ: (.+)/.exec(r.salida)?.[1];
  resumen.push({ suite: 'Aislamiento entre empresas, roles y privacidad', resultado: `${oks.length} comprobaciones${falla ? ' + 1 falla' : ''}`, ok: r.ok && !falla });
  md.push(
    '## 2. Aislamiento entre empresas, roles y privacidad',
    '',
    'Los permisos los hace cumplir la base de datos (Row Level Security de Postgres), no la pantalla: aunque alguien manipule la app, la base no le entrega datos de otra empresa ni le deja subirse de rol. La prueba crea empresas y personas ficticias, intenta lo prohibido y comprueba que la base lo impide. Corre en una transacción que se deshace (no deja datos).',
    '',
    `**Resultado:** ${r.ok && !falla ? 'todo correcto' : `FALLA: ${falla ?? 'ver salida'}`}.`,
    '',
    '| Comprobación | |',
    '|---|---|',
    ...oks.map(o => `| ${celda(o)} | ✅ |`),
    ...(falla ? [`| ${celda(falla)} | ❌ |`] : []),
    '',
  );
}

// 3) Paso de búsqueda del RAG: ¿encuentra la sección correcta?
{
  type C = { id: number; tipo: string; pregunta: string; esperadas?: string[] };
  const { consultas } = JSON.parse(readFileSync('pruebas/consultas.json', 'utf8')) as { consultas: C[] };
  const filas: string[] = [];
  let cubiertas = 0;
  let encontradas = 0;
  for (const c of consultas) {
    const sql = `select coalesce(string_agg(codigo, ', ' order by puntaje desc), '') from public.buscar_secciones((select id from public.empresas where slug = 'del-rio'), $q$${c.pregunta}$q$, 8)`;
    const r = correr('psql', [DB, '-At', '-c', sql]);
    const trajo = r.salida.trim();
    const lista = trajo ? trajo.split(', ') : [];
    let veredicto = '—';
    if (c.esperadas?.length) {
      cubiertas++;
      const ok = c.esperadas.some(e => lista.includes(e));
      if (ok) encontradas++;
      veredicto = ok ? `✅ (posición ${Math.min(...c.esperadas.map(e => lista.indexOf(e)).filter(i => i >= 0)) + 1})` : '❌';
    }
    filas.push(`| ${c.id} | ${celda(c.pregunta)} | ${c.tipo === 'cubierta' ? (c.esperadas ?? []).join(', ') : 'no está en el material'} | ${trajo || '(nada)'} | ${veredicto} |`);
  }
  resumen.push({ suite: 'Búsqueda del RAG (encuentra la sección correcta)', resultado: `${encontradas} de ${cubiertas}`, ok: encontradas === cubiertas });
  md.push(
    '## 3. Búsqueda en el material (paso de recuperación del RAG)',
    '',
    'Antes de responder, el asistente busca en el material publicado de la empresa (texto en español sin acentos, búsqueda aproximada para faltas de ortografía y, cuando se active, búsqueda por significado). Si la búsqueda no trae la sección correcta, la respuesta no puede ser correcta: por eso se mide por separado. Material: el de ejemplo de Del Río (demo).',
    '',
    `**Resultado:** encontró la sección esperada en **${encontradas} de ${cubiertas}** consultas cubiertas por el material.`,
    '',
    '| # | Consulta | Sección esperada | Secciones que trajo (en orden) | ¿La encontró? |',
    '|---|---|---|---|---|',
    ...filas,
    '',
  );
}

// 4) Punta a punta (login real con código, pantallas, QR, permisos desde HTTP).
{
  const email = process.env.HUMO_EMAIL ?? process.env.SEMBRAR_ADMIN_EMAIL;
  const arriba = correr('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:3000/']).salida.trim() === '200';
  if (!email || !arriba) {
    resumen.push({ suite: 'Punta a punta (login, pantallas, QR, permisos)', resultado: 'no se corrió', ok: null });
    md.push('## 4. Punta a punta', '', `_No se corrió: ${!arriba ? 'la app no está arriba (`npm run dev`)' : 'falta HUMO_EMAIL'}._`, '');
  } else {
    const r = correr('node', ['--env-file-if-exists=.env.local', 'scripts/humo.ts'], { HUMO_EMAIL: email });
    const lineas = [...r.salida.matchAll(/^([✓✗]) (.+)$/gm)].map(m => ({ ok: m[1] === '✓', texto: m[2].replace(email, '(correo de prueba)') }));
    const bien = lineas.filter(l => l.ok).length;
    resumen.push({ suite: 'Punta a punta (login, pantallas, QR, permisos)', resultado: `${bien} de ${lineas.length}`, ok: r.ok });
    md.push(
      '## 4. Punta a punta',
      '',
      'Un script usa la app como lo haría una persona: entra con el código que llega por correo (al buzón de pruebas local), recorre las pantallas, se une a una empresa con el QR de una sucursal y comprueba desde la web que un colaborador no puede entrar a la gestión ni a otra empresa.',
      '',
      `**Resultado:** ${bien} de ${lineas.length}.`,
      '',
      '| Paso | |',
      '|---|---|',
      ...lineas.map(l => `| ${celda(l.texto)} | ${l.ok ? '✅' : '❌'} |`),
      '',
    );
  }
}

// 5) Prueba documentada con IA (el entregable de Del Río): se corre aparte porque gasta llamadas a la IA.
{
  let estado = '_Pendiente: requiere las llaves de IA en `.env.local`; se genera con `npm run prueba`._';
  try {
    const doc = readFileSync('docs/prueba-documentada.md', 'utf8');
    const linea = /\*\*Resultado:\*\*.+/.exec(doc)?.[0];
    const fecha = /Generada por .+? el (.+?) \(hora/.exec(doc)?.[1];
    if (linea) estado = `${linea} (corrida del ${fecha ?? '—'}; detalle en [prueba-documentada.md](prueba-documentada.md)).`;
  } catch {
    /* todavía no existe */
  }
  resumen.push({ suite: 'Prueba documentada con IA (≥10 consultas)', resultado: estado.startsWith('_Pendiente') ? 'pendiente' : 'ver detalle', ok: null });
  md.push(
    '## 5. Prueba documentada con IA (entregable de Del Río)',
    '',
    'Diez consultas o más contra el asistente completo (búsqueda + modelo de IA): ocho cubiertas por el material y dos sin respuesta, que deben canalizarse a supervisor o a RH sin inventar. Se reportan las respuestas correctas, los errores y las canalizaciones tal cual.',
    '',
    estado,
    '',
  );
}

const total = [
  '# Validación técnica',
  '',
  `Generado automáticamente por \`npm run validar\` el ${ahora} (hora de Cd. Juárez). Cada resultado es de esta corrida; para reproducirlo basta correr el mismo comando.`,
  '',
  '| Qué se prueba | Resultado | |',
  '|---|---|---|',
  ...resumen.map(r => `| ${r.suite} | ${r.resultado} | ${r.ok === null ? '⏳' : r.ok ? '✅' : '❌'} |`),
  '',
  '> El material de las empresas de demo es **de ejemplo**, escrito por el equipo: no es de Del Río ni de Superette.',
  '',
  ...md,
].join('\n');

writeFileSync('docs/validacion.md', total);
console.log(resumen.map(r => `${r.ok === null ? '⏳' : r.ok ? '✅' : '❌'} ${r.suite}: ${r.resultado}`).join('\n'));
console.log('→ docs/validacion.md');
process.exitCode = resumen.some(r => r.ok === false) ? 1 : 0;
