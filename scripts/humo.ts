// `npm run humo`: prueba de humo de punta a punta contra el entorno LOCAL (supabase start + npm run dev).
// Acceso de ADR 0014: el admin entra con correo y contraseña (SEMBRAR_ADMIN_EMAIL / SEMBRAR_ADMIN_PASSWORD de
// .env.local) y los empleados con su número de reloj (estudiantes 0001–0004 de la demo de Del Río; uno nuevo por QR).
// Recorre las pantallas con la cookie de sesión y prueba permisos y aislamiento entre empresas desde HTTP.
// Requiere haber corrido `npm run sembrar`.

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const SITIO = process.env.HUMO_SITIO ?? 'http://localhost:3000';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const llave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const email = (process.env.HUMO_EMAIL || process.env.SEMBRAR_ADMIN_EMAIL || '').toLowerCase();
const password = process.env.HUMO_PASSWORD || process.env.SEMBRAR_ADMIN_PASSWORD || '';
if (!url.includes('127.0.0.1') && !url.includes('localhost')) throw new Error('humo solo corre contra Supabase local');
if (!email || !password) throw new Error('Faltan SEMBRAR_ADMIN_EMAIL y SEMBRAR_ADMIN_PASSWORD en .env.local');

let fallas = 0;
function revisar(ok: boolean, que: string) {
  console.log(`${ok ? '✓' : '✗'} ${que}`);
  if (!ok) fallas++;
}

async function sesionAdmin(correo: string, clave: string) {
  const jarra = new Map<string, string>();
  const supabase = createServerClient(url, llave, {
    cookies: {
      getAll: () => [...jarra].map(([name, value]) => ({ name, value })),
      setAll: lista => lista.forEach(({ name, value }) => (value ? jarra.set(name, value) : jarra.delete(name))),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
  if (error) throw new Error(`signInWithPassword: ${error.message}`);
  return [...jarra].map(([n, v]) => `${n}=${v}`).join('; ');
}

/** Entra con número de reloj por la API, como el formulario; devuelve la cookie de sesión (o el estado si falla). */
async function sesionReloj(cuerpo: { numero: string; empresa?: string; codigo?: string }) {
  const res = await fetch(`${SITIO}/api/acceso-reloj`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const cookie = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  return { status: res.status, cookie, json: (await res.json().catch(() => null)) as { destino?: string; error?: string } | null };
}

const pedir = (ruta: string, cookie: string, init: RequestInit = {}) =>
  fetch(`${SITIO}${ruta}`, { ...init, redirect: 'manual', headers: { cookie, ...(init.headers ?? {}) } });

// 0) Sin sesión: las pantallas de una empresa mandan al acceso por número de reloj; no hay Google ni invitado.
let r = await pedir('/e/del-rio', '');
revisar(r.status === 307 && (r.headers.get('location') ?? '').includes('/acceso/del-rio'), 'sin sesión, /e/del-rio manda a /acceso/del-rio (número de reloj)');
let html = await (await pedir('/entrar', '')).text();
revisar(html.includes('Contraseña') && !html.includes('Google') && !html.includes('invitado'), '/entrar es correo y contraseña, sin Google ni invitado');
html = await (await pedir('/acceso/del-rio', '')).text();
revisar(html.includes('número de reloj'), '/acceso/del-rio pide el número de reloj');

// 1) Admin con correo y contraseña.
const admin = await sesionAdmin(email, password);
revisar(Boolean(admin), `el admin entra con correo y contraseña`);
r = await pedir('/inicio', admin);
html = await r.text();
revisar(r.status === 200 && html.includes('Del Río') && html.includes('Superette (demo)'), '/inicio lista las 2 empresas del admin');
for (const ruta of ['/e/del-rio', '/e/del-rio/asistente', '/e/del-rio/admin/contenido', '/e/del-rio/admin/equipo', '/e/del-rio/admin/ajustes', '/e/del-rio/admin/respuestas', '/e/del-rio/canalizaciones']) {
  r = await pedir(ruta, admin);
  revisar(r.status === 200, `${ruta} → ${r.status}`);
}
html = await (await pedir('/e/del-rio/admin/contenido', admin)).text();
revisar(html.includes('Manual de procedimientos para cajeros') && !html.includes('Manual del colaborador de tienda'), 'Contenido de Del Río no mezcla el material de Superette');
revisar(html.includes('sección 5, Si la segunda parte queda incierta'), 'el manual del reto quedó partido como lo cita el documento («sección 5, Si la segunda parte queda incierta»)');
revisar(html.includes('Contenido ficticio con fines de demostración'), 'la franja de contenido ficticio se ve en Del Río');

// Módulos y métricas (gestión).
html = await (await pedir('/e/del-rio/admin/modulos', admin)).text();
const moduloId = /\/e\/del-rio\/admin\/modulos\/([0-9a-f-]{36})/.exec(html)?.[1];
revisar(html.includes("Inducción del cajero: un turno completo") && Boolean(moduloId), 'Módulos lista el módulo de inducción');
r = await pedir(`/e/del-rio/admin/modulos/${moduloId}`, admin);
html = await r.text();
revisar(r.status === 200 && html.includes('Cancelaciones') && html.includes('Situaciones prácticas'), 'la revisión del módulo muestra lecciones, test y prácticas');
r = await pedir('/e/del-rio/admin/metricas', admin);
revisar(r.status === 200, `/e/del-rio/admin/metricas → ${r.status}`);

// 1b) Estudiante 0001 de Del Río (sembrado): entra solo con su número; ve su ruta, su nivel y el módulo, sin las
// respuestas del test; no entra a la gestión.
html = await (await pedir('/e/del-rio/admin/equipo', admin)).text();
revisar(['0001', '0002', '0003', '0004'].every(n => html.includes(n)), 'Equipo muestra a los estudiantes 0001–0004');
let acceso = await sesionReloj({ empresa: 'del-rio', numero: '0001' });
const cajero = acceso.cookie;
revisar(acceso.status === 200 && acceso.json?.destino === '/e/del-rio' && Boolean(cajero), 'el estudiante 0001 entra con su número de reloj');
html = await (await pedir('/e/del-rio', cajero)).text();
revisar(html.includes('Núm. 0001') && html.includes('Inducción del cajero: un turno completo') && html.includes('Nuevo ingreso'), 'el estudiante ve su número, su ruta de capacitación y su nivel');
r = await pedir(`/e/del-rio/modulos/${moduloId}`, cajero);
html = await r.text();
revisar(r.status === 200 && html.includes("Conoce tu rol y reglas básicas"), 'el estudiante abre el módulo');
revisar(!html.includes("Si el fondo contado no coincide, debes volver"), 'la página del test NO trae las respuestas ni sus explicaciones');
revisar(html.includes('Tu instructor puede revisar tus respuestas'), 'el estudiante ve el aviso de que su instructor revisa sus respuestas');
for (const ruta of ['/e/del-rio/admin/modulos', '/e/del-rio/admin/respuestas']) {
  r = await pedir(ruta, cajero);
  revisar(r.status === 404, `un estudiante NO entra a ${ruta} (${r.status})`);
}
// 1c) Revisión humana (ADR 0014): el estudiante deja un test, aparece en Respuestas, el admin lo califica y el
// estudiante ve la calificación. Se usa el cliente de Supabase con la sesión de cada uno (la RLS decide).
const clienteCon = (cookie: string) => {
  const jarra = new Map(cookie.split('; ').filter(Boolean).map(c => [c.slice(0, c.indexOf('=')), c.slice(c.indexOf('=') + 1)] as [string, string]));
  return createServerClient(url, llave, { cookies: { getAll: () => [...jarra].map(([name, value]) => ({ name, value })), setAll: () => {} } });
};
const sbCajero = clienteCon(cajero);
const { data: yoCajero } = await sbCajero.auth.getUser();
const { data: emp } = await sbCajero.from('empresas').select('id').eq('slug', 'del-rio').single();
const marca = `humo-${Date.now()}`;
const { error: eTest } = await sbCajero.from('intentos').insert({
  empresa_id: emp!.id, usuario_id: yoCajero.user!.id, modulo_id: moduloId!, respuestas: [], aciertos: 4, total: 6,
});
revisar(!eTest, `el estudiante guarda un intento de test${eTest ? `: ${eTest.message}` : ''}`);
html = await (await pedir('/e/del-rio/admin/respuestas', admin)).text();
// React separa con <!-- --> los trozos de texto de una expresión ({a} de {b}): se quitan para comparar.
revisar(html.includes('Núm. 0001') && html.replace(/<!-- -->/g, '').includes('4 de 6 correctas'), 'el test del estudiante 0001 aparece en Respuestas para revisar');
const sbAdmin = clienteCon(admin);
const { data: pendiente } = await sbAdmin.from('intentos').select('id').eq('usuario_id', yoCajero.user!.id).is('calificacion', null).order('creado_en', { ascending: false }).limit(1).single();
const { error: eCal } = await sbAdmin.from('intentos').update({ calificacion: 9, comentario: marca }).eq('id', pendiente!.id);
revisar(!eCal, 'el admin lo califica (9/10 con comentario)');
html = await (await pedir('/e/del-rio', cajero)).text();
revisar(html.includes('Retroalimentación de tu instructor') && html.includes(marca), 'el estudiante ve su calificación y el comentario en su Inicio');
const { data: propio } = await sbCajero.from('intentos').update({ calificacion: 10 }).eq('id', pendiente!.id).select('calificacion');
revisar(!propio?.length, 'el estudiante NO puede cambiar su calificación');

acceso = await sesionReloj({ empresa: 'del-rio', numero: '9999' });
revisar(acceso.status === 404 && !acceso.cookie, `un número no registrado NO entra sin QR (${acceso.status})`);

// 2) Un empleado nuevo que entra con el QR de una sucursal de Superette: queda dado de alta como colaborador.
const qr = /\/unirse\/([A-Z0-9]{8})/.exec(await (await pedir('/e/superette/admin/equipo', admin)).text())?.[1];
revisar(Boolean(qr), `el QR de Superette está en Equipo (${qr})`);
html = await (await pedir(`/unirse/${qr}`, '')).text();
revisar(html.includes('Superette (demo)') && html.includes('número de reloj'), 'la página del QR pide el número de reloj (sin sesión)');
const numeroNuevo = `H${Date.now().toString().slice(-8)}`;
acceso = await sesionReloj({ codigo: qr!, numero: numeroNuevo });
const colaborador = acceso.cookie;
revisar(acceso.status === 200 && acceso.json?.destino === '/e/superette', `un número nuevo por QR queda dado de alta y entra (${numeroNuevo})`);
r = await pedir('/e/superette', colaborador);
revisar(r.status === 200, 'el colaborador ve el inicio de Superette');
r = await pedir('/e/superette/admin/contenido', colaborador);
revisar(r.status === 404, `un colaborador NO entra a Contenido (${r.status})`);
r = await pedir('/e/del-rio', colaborador);
revisar(r.status === 404, `ni a otra empresa (${r.status})`);

// 3) El chat: sin llaves de IA responde 502 con mensaje claro; con llaves, texto con citas.
r = await pedir('/api/chat', colaborador, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ empresa: 'superette', mensajes: [{ rol: 'usuario', texto: '¿Cómo recibo mercancía de un proveedor?' }] }),
});
const consultadas = r.headers.get('x-consultadas');
const cuerpo = await r.text();
if (r.status === 502) revisar(cuerpo.includes('No pude responder'), 'chat sin llaves de IA: 502 con mensaje claro');
else revisar(r.status === 200 && /[\[【]\s*D\d+-\d+/.test(cuerpo) && Boolean(consultadas), `chat responde con citas (${consultadas ? decodeURIComponent(consultadas).slice(0, 80) : ''}…)`);
r = await pedir('/api/chat', colaborador, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ empresa: 'del-rio', mensajes: [{ rol: 'usuario', texto: '¿Cómo hago una cancelación?' }] }),
});
revisar(r.status === 404, `el chat no responde con el material de otra empresa (${r.status})`);

// 4) Pulsar para hablar: el audio llega a Whisper (Groq) y se protege igual que el chat.
function wavTono(segundos: number): Blob {
  const tasa = 16_000;
  const n = Math.floor(tasa * segundos);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const ascii = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ascii(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, tasa, true);
  v.setUint32(28, tasa * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ascii(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * 440 * i) / tasa) * 3000), true);
  return new Blob([buf], { type: 'audio/wav' });
}
const voz = (cookie: string, audio?: Blob) => {
  const d = new FormData();
  if (audio) d.append('audio', audio, 'pregunta.wav');
  d.append('empresa', 'del-rio');
  return fetch(`${SITIO}/api/transcribir`, { method: 'POST', body: d, headers: cookie ? { cookie } : {} });
};
r = await voz('', wavTono(1));
revisar(r.status === 401, `voz sin sesión → 401 (${r.status})`);
r = await voz(admin);
revisar(r.status === 400, `voz sin audio → 400 (${r.status})`);
r = await voz(admin, wavTono(1.5));
revisar(r.status === 422, `un ruido sin voz llega a Whisper y NO se manda como pregunta (${r.status}: 422 "no te escuché")`);

// Limpieza para no ensuciar la demo: intentos fallidos de acceso (si no, varias corridas bloquearían la IP local), el
// test calificado de prueba del estudiante 0001 y los empleados de prueba dados de alta por QR (números H + 8 dígitos).
if (process.env.SUPABASE_SECRET_KEY) {
  const sec = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  await sec.from('accesos_reloj').delete().eq('exito', false);
  await sec.from('intentos').delete().like('comentario', 'humo-%');
  const { data: dePrueba } = await sec.from('miembros').select('usuario_id, numero_reloj').like('numero_reloj', 'H%');
  for (const m of (dePrueba ?? []).filter(x => /^H\d{8}$/.test(x.numero_reloj ?? ''))) await sec.auth.admin.deleteUser(m.usuario_id);
}

console.log(fallas ? `\n${fallas} fallas` : '\nTodo bien.');
process.exitCode = fallas ? 1 : 0;
