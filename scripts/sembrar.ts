// `npm run sembrar`: crea las empresas de demostración con su material de EJEMPLO (docs/adr/0009).
//   - del-rio        → el reto (cajeros) con el manual OFICIAL del reto: «Manual de procedimientos para cajeros —
//                      Tienda Escuela», ficticio (docs/adr/0013); Wal decidió que la empresa de la demo se llame
//                      Del Río, con la franja de contenido ficticio. Se carga el PDF por el mismo camino que la app.
//   - superette      → segunda empresa del mismo grupo (la ficha dice "Del Río y Superette"): prueba de que
//                      cada empresa ve solo lo suyo y tiene su propio asistente.
// Usa la llave SECRETA (solo en .env.local; la app nunca la usa) y es idempotente: lo que ya existe no se
// duplica. Con `--reiniciar` borra y vuelve a crear esas dos empresas.
// Admin: SEMBRAR_ADMIN_EMAIL + SEMBRAR_ADMIN_PASSWORD crea (o actualiza) la cuenta de admin con contraseña y la deja
// como admin de las demos (docs/adr/0014). Solo con el correo, deja una invitación.
// Empleados: los de `empleados` de cada demo entran con su número de reloj (Del Río: estudiantes 0001–0004).

import { readdirSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { extraer } from '../lib/ingesta/extraer.ts';
import { guardarSecciones } from '../lib/ingesta/ingerir.ts';
import { altaEmpleado, borrarEmpleados } from '../lib/empleados.ts';
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
const adminPassword = process.env.SEMBRAR_ADMIN_PASSWORD;

/** La cuenta de admin con contraseña (se crea o se le pone la contraseña si ya existía). */
async function cuentaAdmin(): Promise<string | null> {
  if (!adminEmail || !adminPassword) return null;
  const c = await supabase.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true });
  if (c.data.user) return c.data.user.id;
  for (let pagina = 1; pagina < 50; pagina++) {
    const { data } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
    const u = data.users.find(x => x.email?.toLowerCase() === adminEmail);
    if (u) {
      await supabase.auth.admin.updateUserById(u.id, { password: adminPassword });
      return u.id;
    }
    if (data.users.length < 200) break;
  }
  throw new Error(`No se pudo crear ni encontrar la cuenta de admin: ${c.error?.message}`);
}
const adminId = await cuentaAdmin();

type Demo = {
  slug: string; nombre: string; giro: string; sucursales: string[]; puestos: string[]; carpeta: string;
  avatar: Record<string, unknown>;
  /** Empleados de la demo (número de reloj y nombre), en la primera sucursal y el primer puesto. */
  empleados?: { numero: string; nombre: string }[];
};

const DEMOS: Demo[] = [
  {
    slug: 'del-rio', nombre: 'Del Río', giro: 'Comercio / tiendas', carpeta: 'conocimiento/del-rio',
    sucursales: ['Sucursal Centro', 'Sucursal Las Torres'], puestos: ['Cajero'],
    // Estudiantes para la demo (decisión de Wal, 9-oct): entran en /acceso/del-rio con su número.
    empleados: [1, 2, 3, 4].map(n => ({ numero: `000${n}`, nombre: `Estudiante ${n}` })),
    // Material ficticio del reto (manual de Tienda Escuela); identidad del asistente provisional, sin logotipo ni
    // colores de Del Río hasta que los autorice (docs/adr/0005 y 0013).
    // Uniforme de Del Río (decisión de Wal, 9-oct): playera azul con cuello y vivos rojos y la estrella amarilla del
    // logo; colores exactos del logo (#1C54A5, #DA2027, #F8DA08). Piel y cabello tomados de la foto del uniforme.
    avatar: {
      nombre: 'Rosa', rol: 'tu compañera de capacitación',
      colores: { piel: '#e8b08e', cabello: '#583a2a', camisa: '#1c54a5', fondo: '#fff5cc', detalle: '#da2027', acento: '#f8da08' },
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
    await borrarEmpleados(supabase, existe.id);
    await supabase.from('empresas').delete().eq('id', existe.id);
    console.log(`↺ ${d.slug}: borrada`);
  } else if (existe) {
    console.log(`= ${d.slug}: ya existe (usa --reiniciar para recrearla)`);
    return;
  }
  const { data: empresa, error } = await supabase
    // Las demos sí salen en la lista de «Soy empleado» (una empresa nueva no, hasta que su admin la prenda; ADR 0015).
    .from('empresas').insert({ slug: d.slug, nombre: d.nombre, giro: d.giro, avatar: d.avatar as never, en_lista_acceso: true }).select('id').single();
  if (error || !empresa) throw new Error(`${d.slug}: ${error?.message}`);
  await supabase.from('sucursales').insert(d.sucursales.map(nombre => ({ empresa_id: empresa.id, nombre })));
  await supabase.from('puestos').insert(d.puestos.map(nombre => ({ empresa_id: empresa.id, nombre })));
  const { data: sucursales } = await supabase.from('sucursales').select('id').eq('empresa_id', empresa.id).order('creada_en');
  const { data: puestos } = await supabase.from('puestos').select('id').eq('empresa_id', empresa.id);
  if (adminId) await supabase.from('miembros').insert({ empresa_id: empresa.id, usuario_id: adminId, rol: 'admin', sucursal_id: sucursales?.[0]?.id ?? null });
  else if (adminEmail) await supabase.from('invitaciones').insert({ empresa_id: empresa.id, email: adminEmail, rol: 'admin' });
  for (const e of d.empleados ?? []) {
    const r = await altaEmpleado(supabase, { empresaId: empresa.id, numero: e.numero, nombre: e.nombre, sucursalId: sucursales?.[0]?.id, puestoId: puestos?.[0]?.id });
    if ('error' in r) throw new Error(`empleado ${e.numero}: ${r.error}`);
  }
  if (d.empleados?.length) console.log(`  empleados: ${d.empleados.map(e => e.numero).join(', ')} (entran en /acceso/${d.slug})`);

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
if (!adminId) console.log('\nTip: SEMBRAR_ADMIN_EMAIL y SEMBRAR_ADMIN_PASSWORD en el .env → cuenta de admin con contraseña en las demos.');
