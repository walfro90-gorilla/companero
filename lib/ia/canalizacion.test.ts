import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerSiNo, peticionClasificar, revisarCanalizacion } from './canalizacion.ts';

test('solo se revisa si menciona al supervisor y no trae marca', () => {
  assert.equal(revisarCanalizacion('No repitas el cargo e informa a tu supervisor [D1-3].'), true);
  assert.equal(revisarCanalizacion('Informa a tu supervisor.\n[CANALIZAR:supervisor]'), false);
  assert.equal(revisarCanalizacion('Informa a tu supervisor.\n【CANALIZAR:supervisor】'), false);
  assert.equal(revisarCanalizacion('Escanea cada código [D1-2].'), false);
});

test('lee SI/NO aunque venga con signos o mayúsculas', () => {
  assert.equal(leerSiNo('SI'), true);
  assert.equal(leerSiNo('Sí.'), true);
  assert.equal(leerSiNo('**Sí**'), true);
  assert.equal(leerSiNo('NO'), false);
  assert.equal(leerSiNo('Simplemente no'), false);
});

test('la petición lleva la pregunta y la respuesta', () => {
  const p = peticionClasificar('Me faltan $50 en el corte', 'Avisa a tu supervisor.');
  assert.match(String(p.messages[0].content), /Me faltan \$50/);
  assert.match(String(p.instructions), /Responde solo SI o NO/);
});
