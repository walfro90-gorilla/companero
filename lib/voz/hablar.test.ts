import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirVoz } from './elegir-voz.ts';
import { MAX_RESUMEN, escaparXml, limpiarResumen, resumenDeRespaldo, ssml } from './hablar.ts';

test('el SSML escapa el texto y separa las frases con una pausa', () => {
  assert.equal(escaparXml(`& < > " '`), '&amp; &lt; &gt; &quot; &apos;');
  const s = ssml('Pide la autorización. <b>Luego</b> cobra & entrega.', 'es-MX-DaliaNeural');
  assert.ok(s.includes('<voice name="es-MX-DaliaNeural"><prosody rate="-5%">'));
  assert.ok(s.includes('Pide la autorización.<break time="300ms"/>&lt;b&gt;Luego&lt;/b&gt; cobra &amp; entrega.'));
  assert.ok(!/<b>/.test(s));
});

test('el resumen hablado no lleva citas, viñetas ni símbolos y no pasa del máximo', () => {
  const r = limpiarResumen('Llama a tu supervisor [D1-5]. **Importante:**\n- Pide el ticket 【D1-6】\n- Cancela # todo ' + 'x '.repeat(300));
  assert.ok(!/[\[\]【】*#]/.test(r), r);
  assert.ok(r.length <= MAX_RESUMEN, String(r.length));
  assert.ok(r.startsWith('Llama a tu supervisor.'));
});

test('el resumen de respaldo dice la primera frase y dos pasos, y avisa si canaliza', () => {
  const respuesta = 'Para cancelar, pide autorización [D1-8]. Luego sigue esto:\n1. Llama al supervisor [D1-8].\n2. Muestra el ticket.\n3. Espera su clave.\n4. Entrega el comprobante.';
  const r = resumenDeRespaldo(respuesta, null);
  assert.ok(r.startsWith('Para cancelar, pide autorización. Llama al supervisor. Muestra el ticket.'), r);
  assert.ok(r.endsWith('Te dejo los pasos en la pantalla.'));
  assert.ok(resumenDeRespaldo('Eso no viene en tu material. [CANALIZAR:supervisor]', 'supervisor').endsWith('Ya le avisé a tu supervisor.'));
});

test('la voz de respaldo es femenina y en español; nunca una de hombre ni eSpeak', () => {
  const v = (name: string, lang: string) => ({ name, lang });
  assert.equal(elegirVoz([v('Microsoft Raul - Spanish (Mexico)', 'es-MX'), v('Microsoft Sabina - Spanish (Mexico)', 'es-MX')])?.name, 'Microsoft Sabina - Spanish (Mexico)');
  assert.equal(elegirVoz([v('Monica', 'es-ES'), v('Paulina', 'es-MX')])?.name, 'Paulina');
  assert.equal(elegirVoz([v('Google español', 'es-ES'), v('Google español de Estados Unidos', 'es-US')])?.lang, 'es-US');
  assert.equal(elegirVoz([v('espeak-ng Spanish (Latin America)', 'es-419'), v('Jorge', 'es-MX'), v('Samantha', 'en-US')]), null);
  for (const voces of [[v('Microsoft Raul', 'es-MX'), v('Diego', 'es-AR'), v('Microsoft Pablo', 'es-ES'), v('Juan', 'es-MX')]]) {
    assert.equal(elegirVoz(voces), null);
  }
});
