import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirVoz, elegirVozCliente } from './elegir-voz.ts';
import { MAX_LITERAL, MAX_RESUMEN, completarResumen, escaparXml, limpiarResumen, quienEs, resumenDeRespaldo, ssml, textoLiteral } from './hablar.ts';

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

test('la voz del cliente simulado sale del personaje: de mujer o de hombre', () => {
  assert.equal(quienEs('señora con prisa que quiere cancelar un producto ya cobrado'), 'clienta');
  assert.equal(quienEs('Clienta molesta porque le cobraron dos veces'), 'clienta');
  assert.equal(quienEs('cliente con prisa que quiere pagar con tarjeta'), 'cliente');
  assert.equal(quienEs('el supervisor del turno'), 'cliente');
});

test('lo que no puede faltar en el resumen: los pasos en pantalla o el aviso, una sola vez', () => {
  const pasos = 'Haz esto:\n1. Uno.\n2. Dos.\n3. Tres.\n4. Cuatro.';
  assert.ok(completarResumen('Pide autorización al supervisor.', pasos, null).endsWith('Te dejo los pasos en la pantalla.'));
  assert.equal(completarResumen('Pide autorización. Te dejo los pasos en la pantalla.', pasos, null), 'Pide autorización. Te dejo los pasos en la pantalla.');
  assert.equal(completarResumen('Eso no viene en tu material. Ya le avisé a Recursos Humanos.', 'x', 'rh'), 'Eso no viene en tu material. Ya le avisé a Recursos Humanos.');
  assert.ok(completarResumen('Eso no viene en tu material.', 'x', 'supervisor').endsWith('Ya le avisé a tu supervisor.'));
  assert.ok(completarResumen('a '.repeat(200), pasos, null).length <= MAX_RESUMEN);
});

test('una línea del cliente se dice tal cual, sin marcas y corta', () => {
  assert.equal(textoLiteral('¡Oiga! Me cobró **dos veces** [D1-5] el refresco.'), '¡Oiga! Me cobró dos veces el refresco.');
  assert.ok(textoLiteral('Bla. '.repeat(300)).length <= MAX_LITERAL);
});

test('la voz del cliente en el navegador es distinta de la de la asistente y nunca eSpeak', () => {
  const v = (name: string, lang: string) => ({ name, lang });
  const voces = [v('Microsoft Sabina - Spanish (Mexico)', 'es-MX'), v('Microsoft Raul - Spanish (Mexico)', 'es-MX'), v('espeak-ng Spanish', 'es')];
  const asistente = elegirVoz(voces);
  assert.equal(asistente?.name, 'Microsoft Sabina - Spanish (Mexico)');
  assert.equal(elegirVozCliente(voces, asistente, false)?.name, 'Microsoft Raul - Spanish (Mexico)');
  assert.equal(elegirVozCliente([voces[0], voces[2]], asistente, true), null);
});

test('sin pasos (o si canaliza) no dice «pasos en la pantalla», y cada oración empieza con mayúscula', () => {
  const r = completarResumen('Entiendo tu duda, pero esa información no está en el material. Te dejo los pasos en la pantalla. ya le avisé a Recursos Humanos.', 'Eso no viene en tu material. [CANALIZAR:rh]', 'rh');
  assert.equal(r, 'Entiendo tu duda, pero esa información no está en el material. Ya le avisé a Recursos Humanos.');
  assert.equal(completarResumen('pide tu ticket. te dejo los pasos en la pantalla.', 'Pide tu ticket.', null), 'Pide tu ticket.');
});

test('el aviso de canalización se dice una sola vez aunque el modelo lo repita', () => {
  assert.equal(
    completarResumen('Eso no viene en tu material. Te lo paso a Recursos Humanos para que lo revisen. Ya le avisé a Recursos Humanos.', 'x [CANALIZAR:rh]', 'rh'),
    'Eso no viene en tu material. Ya le avisé a Recursos Humanos.',
  );
});
