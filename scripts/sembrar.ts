// `npm run sembrar`: crea las empresas de demostración con su material de EJEMPLO (docs/adr/0009).
//   - tienda-escuela → el reto (cajeros) con el manual OFICIAL del reto: «Manual de procedimientos para cajeros —
//                      Tienda Escuela», ficticio (docs/adr/0013). Se carga el PDF por el mismo camino que la app.
//   - superette      → segunda empresa del mismo grupo (la ficha dice "Del Río y Superette"): prueba de que
//                      cada empresa ve solo lo suyo y tiene su propio asistente.
// Usa la llave SECRETA (solo en .env.local; la app nunca la usa) y es idempotente: lo que ya existe no se
// duplica. Con `--reiniciar` borra y vuelve a crear esas dos empresas.
// SEMBRAR_ADMIN_EMAIL=correo deja una invitación de admin: al entrar con ese correo, queda en ambas.

import { readdirSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { extraer } from '../lib/ingesta/extraer.ts';
import { guardarSecciones } from '../lib/ingesta/ingerir.ts';
import { seccionarMarkdown, sinEncabezado } from '../lib/ingesta/seccionar.ts';
import type { Database } from '../lib/supabase/tipos.ts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
if (!url || !secreta) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local');
  process.exit(1);
}
const supabase = createClient<Database>(url, secreta, { auth: { persistSession: false } });
const reiniciar = process.argv.includes('--reiniciar');
const adminEmail = process.env.SEMBRAR_ADMIN_EMAIL?.trim().toLowerCase();

type Demo = {
  slug: string; nombre: string; giro: string; sucursales: string[]; puestos: string[]; carpeta: string;
  avatar: Record<string, unknown>;
};

const DEMOS: Demo[] = [
  {
    slug: 'tienda-escuela', nombre: 'Tienda Escuela', giro: 'Comercio / tiendas', carpeta: 'conocimiento/tienda-escuela',
    sucursales: ['Sucursal Centro', 'Sucursal Las Torres'], puestos: ['Cajero'],
    // Escenario ficticio del reto; identidad provisional, sin marca de Del Río ni de Superette (docs/adr/0005 y 0013).
    avatar: {
      nombre: 'Rosa', rol: 'tu compañera de capacitación',
      preguntas: ['¿Cómo hago una cancelación?', '¿Qué hago si un producto no tiene precio?', '¿Cómo aplico una promoción?',
        '¿Qué debo revisar al cerrar caja?', '¿Cuándo debo llamar al supervisor?'],
    },
  },
  {
    slug: 'superette', nombre: 'Superette (demo)', giro: 'Comercio / tiendas', carpeta: 'conocimiento/superette',
    sucursales: ['Superette Centro'], puestos: ['Colaborador de tienda'],
    // Identidad provisional: sin la marca de Superette hasta que la autorice (docs/adr/0005).
    avatar: {
      nombre: 'Sofi', rol: 'tu compañera de inducción',
      colores: { piel: '#e0ac69', cabello: '#2b1a10', camisa: '#0f766e', fondo: '#ccfbf1' },
      preguntas: ['¿Qué hago al iniciar mi turno?', '¿Cómo recibo mercancía de un proveedor?', '¿Cómo acomodo el producto nuevo?',
        '¿Cuándo llamo al encargado de turno?'],
    },
  },
];

async function sembrar(d: Demo) {
  const { data: existe } = await supabase.from('empresas').select('id').eq('slug', d.slug).maybeSingle();
  if (existe && reiniciar) {
    await supabase.from('empresas').delete().eq('id', existe.id);
    console.log(`↺ ${d.slug}: borrada`);
  } else if (existe) {
    console.log(`= ${d.slug}: ya existe (usa --reiniciar para recrearla)`);
    return;
  }
  const { data: empresa, error } = await supabase
    .from('empresas').insert({ slug: d.slug, nombre: d.nombre, giro: d.giro, avatar: d.avatar as never }).select('id').single();
  if (error || !empresa) throw new Error(`${d.slug}: ${error?.message}`);
  await supabase.from('sucursales').insert(d.sucursales.map(nombre => ({ empresa_id: empresa.id, nombre })));
  await supabase.from('puestos').insert(d.puestos.map(nombre => ({ empresa_id: empresa.id, nombre })));
  if (adminEmail) await supabase.from('invitaciones').insert({ empresa_id: empresa.id, email: adminEmail, rol: 'admin' });

  for (const archivo of readdirSync(d.carpeta).filter(a => a.endsWith('.pdf')).sort()) await sembrarPdf(empresa.id, d.nombre, d.carpeta, archivo);
  for (const archivo of readdirSync(d.carpeta).filter(a => a.endsWith('.md')).sort()) {
    const md = readFileSync(`${d.carpeta}/${archivo}`, 'utf8');
    const { campos, cuerpo } = sinEncabezado(md);
    // En los ejemplos, lo que va antes del primer ## es una nota para el equipo, no material: no se cita.
    const desde = cuerpo.indexOf('\n## ');
    const secciones = seccionarMarkdown(desde >= 0 ? cuerpo.slice(desde) : cuerpo, campos.titulo ?? archivo);
    const { data: doc, error: e } = await supabase
      .from('documentos')
      .insert({
        empresa_id: empresa.id, titulo: campos.titulo ?? archivo, fuente: campos.fuente ?? archivo, tipo: 'markdown',
        estado: 'autorizado', ejemplo: campos.estado !== 'autorizado',
      })
      .select('id, numero')
      .single();
    if (e || !doc) throw new Error(`${archivo}: ${e?.message}`);
    const r = await guardarSecciones(supabase, { documentoId: doc.id, empresaId: empresa.id, empresa: d.nombre, documento: campos.titulo ?? archivo, secciones });
    console.log(`  D${doc.numero} ${archivo}: ${r.secciones} secciones, ${r.conContexto} con contexto${r.avisos.length ? ` (${r.avisos.join(' ')})` : ''}`);
  }
  await sembrarModulo(empresa.id, d.carpeta);
  const { data: s } = await supabase.from('sucursales').select('nombre, codigo_union').eq('empresa_id', empresa.id);
  console.log(`✓ ${d.slug}: /e/${d.slug} · QR: ${(s ?? []).map(x => `${x.nombre} → /unirse/${x.codigo_union}`).join(' · ')}`);
}

/** Un PDF por el mismo camino que la app: original a Storage, secciones por títulos, contexto con IA. */
async function sembrarPdf(empresaId: string, empresa: string, carpeta: string, archivo: string) {
  const bytes = new Uint8Array(readFileSync(`${carpeta}/${archivo}`));
  const titulo = archivo === 'manual-cajeros-tienda-escuela.pdf' ? 'Manual de procedimientos para cajeros' : archivo.replace(/\.pdf$/i, '');
  const { data: doc, error } = await supabase
    .from('documentos')
    .insert({
      empresa_id: empresaId, titulo, tipo: 'pdf', estado: 'autorizado',
      // El manual del reto es ficticio: la franja de contenido ficticio se muestra en toda la empresa.
      ejemplo: true, fuente: `${archivo} (documento ficticio con fines educativos)`,
    })
    .select('id, numero')
    .single();
  if (error || !doc) throw new Error(`${archivo}: ${error?.message}`);
  const ruta = `${empresaId}/${doc.id}/${archivo}`;
  const { error: e2 } = await supabase.storage.from('documentos').upload(ruta, bytes, { contentType: 'application/pdf', upsert: true });
  if (e2) throw new Error(`${archivo} (Storage): ${e2.message}`);
  await supabase.from('documentos').update({ archivo: ruta }).eq('id', doc.id);
  const secciones = await extraer('pdf', bytes, titulo);
  const r = await guardarSecciones(supabase, { documentoId: doc.id, empresaId, empresa, documento: titulo, secciones });
  console.log(`  D${doc.numero} ${archivo}: ${r.secciones} secciones, ${r.conContexto} con contexto${r.avisos.length ? ` (${r.avisos.join(' ')})` : ''}`);
}

type ModuloEjemplo = {
  titulo: string; descripcion: string; puesto: string;
  lecciones: { titulo: string; objetivo: string; contenido: string; secciones: string[] }[];
  preguntas: { enunciado: string; opciones: string[]; correcta: number; explicacion: string; seccion: string }[];
  escenarios: { titulo: string; situacion: string; personaje: string; objetivo: string; secciones: string[] }[];
};

/** Módulo de ejemplo escrito a mano (respaldo de la demo y prueba sin llaves de IA), publicado. */
async function sembrarModulo(empresaId: string, carpeta: string) {
  let m: ModuloEjemplo;
  try {
    m = JSON.parse(readFileSync(`${carpeta}/modulo-induccion.json`, 'utf8')) as ModuloEjemplo;
  } catch {
    return;
  }
  const { data: puesto } = await supabase.from('puestos').select('id').eq('empresa_id', empresaId).eq('nombre', m.puesto).maybeSingle();
  const { data: modulo, error } = await supabase
    .from('modulos').insert({ empresa_id: empresaId, puesto_id: puesto?.id ?? null, titulo: m.titulo, descripcion: m.descripcion, estado: 'autorizado' })
    .select('id').single();
  if (error || !modulo) throw new Error(`módulo: ${error?.message}`);
  const comun = { empresa_id: empresaId, modulo_id: modulo.id };
  await supabase.from('lecciones').insert(m.lecciones.map((x, i) => ({ ...comun, orden: i + 1, ...x })));
  await supabase.from('preguntas').insert(m.preguntas.map((x, i) => ({ ...comun, orden: i + 1, ...x })));
  await supabase.from('escenarios').insert(m.escenarios.map((x, i) => ({ ...comun, orden: i + 1, ...x })));
  console.log(`  módulo "${m.titulo}": ${m.lecciones.length} lecciones, ${m.preguntas.length} preguntas, ${m.escenarios.length} prácticas`);
}

for (const d of DEMOS) await sembrar(d);
if (!adminEmail) console.log('\nTip: SEMBRAR_ADMIN_EMAIL=tu@correo npm run sembrar -- --reiniciar  → quedas como admin de las demos al entrar.');
