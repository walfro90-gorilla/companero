// `npm run generar:modulo [-- --empresa tienda-escuela]`: genera con IA el módulo de inducción desde el material
// publicado (lo mismo que el botón "Generar con IA" de la app) y lo escribe en conocimiento/<empresa>/modulo-induccion.json
// para que el equipo lo REVISE y luego `npm run sembrar` lo cargue publicado (docs/adr/0011 y 0013).

import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { generarConRespaldo, jsonDe } from '../lib/ia/cadena.ts';
import { configurados } from '../lib/ia/proveedores.ts';
import { peticionEscenarios, peticionLecciones, peticionTest, validarEscenarios, validarLecciones, validarPreguntas, type Revision } from '../lib/modulos/generar.ts';
import type { Database } from '../lib/supabase/tipos.ts';

const i = process.argv.indexOf('--empresa');
const slug = i > 0 ? process.argv[i + 1] : 'tienda-escuela';
const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const { data: empresa } = await supabase.from('empresas').select('id, nombre').eq('slug', slug).single();
if (!empresa) throw new Error(`No existe ${slug}`);
const { data: filas } = await supabase
  .from('secciones').select('orden, titulo, texto, referencia, documentos!inner(numero, titulo, estado)')
  .eq('empresa_id', empresa.id).eq('documentos.estado', 'autorizado');
const secciones = (filas ?? [])
  .sort((a, b) => a.documentos.numero - b.documentos.numero || a.orden - b.orden)
  .map(s => ({ codigo: `D${s.documentos.numero}-${s.orden}`, documento: s.documentos.titulo, titulo: s.referencia ?? s.titulo, texto: s.texto }));
const encargo = { empresa: empresa.nombre, puesto: 'Cajero', tipo: 'induccion' as const, enfoque: 'inducción de un cajero nuevo, en el orden de un turno: de la apertura al corte', secciones };
const validos = new Set(secciones.map(s => s.codigo));
const revision: Revision = { descartadas: [] };
const [l, t, e] = await Promise.all([
  generarConRespaldo(configurados(), peticionLecciones(encargo), { plazo: 150_000 }),
  generarConRespaldo(configurados(), peticionTest(encargo), { plazo: 150_000 }),
  generarConRespaldo(configurados(), peticionEscenarios(encargo), { plazo: 150_000 }),
]);
const lecciones = l.ok ? validarLecciones(jsonDe(l.texto), validos, revision) : null;
if (!lecciones?.lecciones.length) throw new Error('La IA no devolvió lecciones válidas');
const modulo = {
  nota: `Generado con IA (${l.ok ? l.eslabon.proveedor : '—'}) desde el material publicado de ${empresa.nombre} el ${new Date().toISOString().slice(0, 10)}. REVISADO por el equipo antes de publicarlo.`,
  titulo: lecciones.titulo, descripcion: lecciones.descripcion, puesto: 'Cajero',
  lecciones: lecciones.lecciones,
  preguntas: t.ok ? validarPreguntas(jsonDe(t.texto), validos, revision) : [],
  escenarios: e.ok ? validarEscenarios(jsonDe(e.texto), validos, revision) : [],
};
const destino = `conocimiento/${slug}/modulo-induccion.json`;
writeFileSync(destino, JSON.stringify(modulo, null, 2) + '\n');
console.log(`${modulo.lecciones.length} lecciones · ${modulo.preguntas.length} preguntas · ${modulo.escenarios.length} prácticas → ${destino}`);
if (revision.descartadas.length) console.log('Descartado:', revision.descartadas.join(' | '));
