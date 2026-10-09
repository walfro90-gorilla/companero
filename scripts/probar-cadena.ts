// `npm run probar:cadena`: ping a cada proveedor de la cadena (docs/adr/0003, lección 4: un respaldo que
// nunca se probó no existe). Nunca imprime llaves: solo si están configuradas.

import { generarConRespaldo } from '../lib/ia/cadena.ts';
import { CADENA } from '../lib/ia/proveedores.ts';

let fallas = 0;
for (const p of CADENA) {
  if (!process.env[p.variable]) {
    console.log(`– ${p.nombre} (${p.modelo}): sin ${p.variable} en .env.local, se salta`);
    continue;
  }
  const inicio = Date.now();
  const r = await generarConRespaldo(
    [p],
    { instructions: 'Responde exactamente con la palabra: listo', messages: [{ role: 'user', content: '¿Estás ahí?' }], maxOutputTokens: 2000 },
    { registrar: () => {} },
  );
  const ms = Date.now() - inicio;
  if (r.ok) {
    console.log(`✔ ${p.nombre} (${p.modelo}): "${r.texto.slice(0, 40)}" en ${ms} ms`);
  } else {
    fallas++;
    console.log(`✖ ${p.nombre} (${p.modelo}): ${r.intentos.map(i => i.clase).join(', ')} en ${ms} ms`);
  }
}
process.exitCode = fallas ? 1 : 0;
