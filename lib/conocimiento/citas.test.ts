import assert from 'node:assert/strict';
import test from 'node:test';
import { analizar, codigosCitados, normalizarCodigo, textoPlano } from './citas.ts';

const existe = (id: string) => ['D1-1', 'D1-5', 'D2-3'].includes(id);

test('separa texto y citas, sin repetir fuentes', () => {
  const a = analizar('Llama a tu supervisor [D1-5]. Lleva el ticket [D1-5, D2-3].', existe);
  assert.deepEqual(a.citas, ['D1-5', 'D2-3']);
  assert.deepEqual(a.invalidas, []);
  assert.equal(a.canalizar, null);
  assert.deepEqual(a.trozos, [
    { tipo: 'texto', texto: 'Llama a tu supervisor ' },
    { tipo: 'cita', ids: ['D1-5'] },
    { tipo: 'texto', texto: '. Lleva el ticket ' },
    { tipo: 'cita', ids: ['D1-5', 'D2-3'] },
    { tipo: 'texto', texto: '.' },
  ]);
});

test('una cita a una sección inexistente nunca se muestra como fuente', () => {
  const a = analizar('Paso inventado [D9-9]. Paso real [D1-1, D4-2].', existe);
  assert.deepEqual(a.citas, ['D1-1']);
  assert.deepEqual(a.invalidas, ['D9-9', 'D4-2']);
  assert.ok(a.trozos.every(t => t.tipo !== 'cita' || t.ids.every(existe)));
});

test('detecta la canalización y la quita del texto', () => {
  const a = analizar('Eso no viene en tu material de inducción.\n[CANALIZAR:supervisor]\n', existe);
  assert.equal(a.canalizar, 'supervisor');
  assert.deepEqual(a.trozos, [{ tipo: 'texto', texto: 'Eso no viene en tu material de inducción.' }]);
  assert.equal(analizar('Pregunta en RH. [canalizar: RH]', existe).canalizar, 'rh');
});

test('el texto para la voz va sin marcas ni markdown', () => {
  assert.equal(textoPlano('**Primero** cuenta el fondo [D1-1].\n[CANALIZAR:rh]'), 'Primero cuenta el fondo .');
});

test('tolera espacios dentro de los corchetes (lo hace gpt-oss en Groq)', () => {
  const a = analizar('Avisa a tu supervisor.\n\n[ D1-6, D1-7 ]\n[ CANALIZAR:supervisor ]', id => ['D1-6', 'D1-7'].includes(id));
  assert.deepEqual(a.citas, ['D1-6', 'D1-7']);
  assert.equal(a.canalizar, 'supervisor');
  assert.equal(textoPlano('Hazlo así [ D1-7 ].'), 'Hazlo así .');
});

test('acepta los corchetes 【】 de gpt-oss', () => {
  const a = analizar('Revisa la línea del descuento【D1-4】.\n【CANALIZAR:supervisor】', id => id === 'D1-4');
  assert.deepEqual(a.citas, ['D1-4']);
  assert.equal(a.canalizar, 'supervisor');
});

test('reconoce las citas como de verdad las escribe Groq: guion U+2011, varios códigos y texto extra (Bart, 9-oct)', () => {
  const existe = (id: string) => ['D1-6', 'D1-7', 'D1-36', 'D1-51', 'D1-53', 'D1-57'].includes(id);
  const texto = 'Llama al supervisor [D1‑51]. Paso 1 [D1‑53, paso 1]. Ver también [D1‑6, D1‑36] y 【D1-7】 o [D1-57]. Mal: [D1-999].';
  const a = analizar(texto, existe);
  assert.deepEqual(a.citas, ['D1-51', 'D1-53', 'D1-6', 'D1-36', 'D1-7', 'D1-57']);
  assert.deepEqual(a.invalidas, ['D1-999']);
  assert.ok(a.trozos.every(t => t.tipo !== 'texto' || !/D1/.test(t.texto)), 'ninguna marca queda como texto');
});

test('otros guiones y separadores también cuentan; el código se normaliza', () => {
  const todo = () => true;
  assert.deepEqual(analizar('[d1 – 4; D2−3] [D1-5 y D1-8] [D3－2]', todo).citas, ['D1-4', 'D2-3', 'D1-5', 'D1-8', 'D3-2']);
  assert.deepEqual(codigosCitados('[D1‑3] y [D1-3, nota]'), ['D1-3', 'D1-3']);
  assert.equal(normalizarCodigo(' d12‑ 7 '), 'D12-7');
  // Un corchete que no es cita no se toca.
  assert.deepEqual(analizar('[nota: ver arriba] [D-1]', todo).citas, []);
});
