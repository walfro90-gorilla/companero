// `npm run humo`: prueba de humo de punta a punta contra el entorno LOCAL (supabase start + npm run dev).
// Entra con código por correo leyendo el código de Mailpit (el buzón local; no sale ningún correo real),
// recorre las pantallas con la cookie de sesión y prueba el aislamiento entre empresas desde HTTP.
// Requiere haber corrido `SEMBRAR_ADMIN_EMAIL=<correo> npm run sembrar` con el mismo correo.

import { createServerClient } from '@supabase/ssr';

const SITIO = process.env.HUMO_SITIO ?? 'http://localhost:3000';
const MAILPIT = 'http://127.0.0.1:54324';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const llave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const email = (process.env.HUMO_EMAIL ?? process.env.SEMBRAR_ADMIN_EMAIL ?? '').toLowerCase();
if (!url.includes('127.0.0.1') && !url.includes('localhost')) throw new Error('humo solo corre contra Supabase local');
if (!email) throw new Error('Define HUMO_EMAIL (el mismo que SEMBRAR_ADMIN_EMAIL)');

let fallas = 0;
function revisar(ok: boolean, que: string) {
  console.log(`${ok ? '✓' : '✗'} ${que}`);
  if (!ok) fallas++;
}

async function sesionPorCodigo(correo: string) {
  const jarra = new Map<string, string>();
  const supabase = createServerClient(url, llave, {
    cookies: {
      getAll: () => [...jarra].map(([name, value]) => ({ name, value })),
      setAll: lista => lista.forEach(({ name, value }) => (value ? jarra.set(name, value) : jarra.delete(name))),
    },
  });
  const desde = Date.now();
  const { error } = await supabase.auth.signInWithOtp({ email: correo });
  if (error) throw new Error(`signInWithOtp: ${error.message}`);
  let codigo: string | undefined;
  for (let i = 0; i < 20 && !codigo; i++) {
    await new Promise(r => setTimeout(r, 300));
    const lista = (await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${correo}`)}`)).json()) as {
      messages: { ID: string; Created: string }[];
    };
    const ultimo = lista.messages.find(m => new Date(m.Created).getTime() >= desde - 2000);
    if (ultimo) {
      const m = (await (await fetch(`${MAILPIT}/api/v1/message/${ultimo.ID}`)).json()) as { Text: string };
      codigo = /\b(\d{6})\b/.exec(m.Text)?.[1];
    }
  }
  if (!codigo) throw new Error('No llegó el código a Mailpit');
  const { error: e2 } = await supabase.auth.verifyOtp({ email: correo, token: codigo, type: 'email' });
  if (e2) throw new Error(`verifyOtp: ${e2.message}`);
  return [...jarra].map(([n, v]) => `${n}=${v}`).join('; ');
}

const pedir = (ruta: string, cookie: string, init: RequestInit = {}) =>
  fetch(`${SITIO}${ruta}`, { ...init, redirect: 'manual', headers: { cookie, ...(init.headers ?? {}) } });

// 1) Admin invitado por el script de sembrar.
const admin = await sesionPorCodigo(email);
revisar(Boolean(admin), `entra ${email} con código por correo`);
let r = await pedir('/inicio', admin);
let html = await r.text();
revisar(r.status === 200 && html.includes('Del Río (demo)') && html.includes('Superette (demo)'), '/inicio acepta las invitaciones y lista las 2 empresas');
for (const ruta of ['/e/del-rio', '/e/del-rio/asistente', '/e/del-rio/admin/contenido', '/e/del-rio/admin/equipo', '/e/del-rio/admin/ajustes', '/e/del-rio/canalizaciones']) {
  r = await pedir(ruta, admin);
  revisar(r.status === 200, `${ruta} → ${r.status}`);
}
html = await (await pedir('/e/del-rio/admin/contenido', admin)).text();
revisar(html.includes('Manual de operación de caja') && !html.includes('Manual del colaborador de tienda'), 'Contenido de Del Río no mezcla el material de Superette');

// Módulos y métricas (gestión).
html = await (await pedir('/e/del-rio/admin/modulos', admin)).text();
const moduloId = /\/e\/del-rio\/admin\/modulos\/([0-9a-f-]{36})/.exec(html)?.[1];
revisar(html.includes('Inducción al puesto de cajero') && Boolean(moduloId), 'Módulos lista el módulo de inducción');
r = await pedir(`/e/del-rio/admin/modulos/${moduloId}`, admin);
html = await r.text();
revisar(r.status === 200 && html.includes('Cancelaciones') && html.includes('Situaciones prácticas'), 'la revisión del módulo muestra lecciones, test y prácticas');
r = await pedir('/e/del-rio/admin/metricas', admin);
revisar(r.status === 200, `/e/del-rio/admin/metricas → ${r.status}`);

// 1b) Un cajero nuevo de Del Río: ve su ruta, su nivel y el módulo, sin las respuestas del test.
const cajero = await sesionPorCodigo(`humo+cajero${Date.now()}@ejemplo.mx`);
const qrDelRio = /\/unirse\/([A-Z0-9]{8})/.exec(await (await pedir('/e/del-rio/admin/equipo', admin)).text())?.[1];
await pedir(`/unirse/${qrDelRio}`, cajero);
html = await (await pedir('/e/del-rio', cajero)).text();
revisar(html.includes('Inducción al puesto de cajero') && html.includes('Nuevo ingreso'), 'el cajero ve su ruta de capacitación y su nivel');
r = await pedir(`/e/del-rio/modulos/${moduloId}`, cajero);
html = await r.text();
revisar(r.status === 200 && html.includes('Tu papel y la apertura de caja'), 'el cajero abre el módulo');
revisar(!html.includes('no abres la caja: avisas a tu supervisor antes de cobrar'), 'la página del test NO trae las respuestas ni sus explicaciones');
r = await pedir('/e/del-rio/admin/modulos', cajero);
revisar(r.status === 404, `un cajero NO entra a la gestión de módulos (${r.status})`);

// 2) Una persona nueva que entra con el QR de una sucursal de Superette.
const nuevo = `humo+${Date.now()}@ejemplo.mx`;
const colaborador = await sesionPorCodigo(nuevo);
const qr = /\/unirse\/([A-Z0-9]{8})/.exec(await (await pedir('/e/superette/admin/equipo', admin)).text())?.[1];
revisar(Boolean(qr), `el QR de Superette está en Equipo (${qr})`);
r = await pedir(`/unirse/${qr}`, colaborador);
revisar(r.status === 307 && (r.headers.get('location') ?? '').endsWith('/e/superette'), 'el QR lo une a Superette y lo manda a su inicio');
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
else revisar(r.status === 200 && /\[D\d+-\d+\]/.test(cuerpo) && Boolean(consultadas), `chat responde con citas (${consultadas ? decodeURIComponent(consultadas).slice(0, 80) : ''}…)`);
r = await pedir('/api/chat', colaborador, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ empresa: 'del-rio', mensajes: [{ rol: 'usuario', texto: '¿Cómo hago una cancelación?' }] }),
});
revisar(r.status === 404, `el chat no responde con el material de otra empresa (${r.status})`);

console.log(fallas ? `\n${fallas} fallas` : '\nTodo bien.');
process.exitCode = fallas ? 1 : 0;
