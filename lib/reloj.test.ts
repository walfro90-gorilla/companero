import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correoDeEmpleado, esCorreoDeEmpleado, leerLista, normalizarNumero } from './reloj.ts';

test('normalizarNumero acepta letras, números y guion', () => {
  assert.equal(normalizarNumero(' 0001 '), '0001');
  assert.equal(normalizarNumero('ab-12'), 'AB-12');
  assert.equal(normalizarNumero('12 34'), '1234');
  assert.equal(normalizarNumero('12.34'), null);
  assert.equal(normalizarNumero(''), null);
  assert.equal(normalizarNumero('1'.repeat(21)), null);
});

test('correo interno por empresa y número', () => {
  const c = correoDeEmpleado('11111111-2222-4333-8444-555555555555', 'AB-12');
  assert.equal(c, 'r-11111111-2222-4333-8444-555555555555-ab-12@reloj.companero.invalid');
  assert.ok(esCorreoDeEmpleado(c));
  assert.ok(!esCorreoDeEmpleado('ana@empresa.com'));
});

test('leerLista: números con nombre opcional, sin repetidos', () => {
  assert.deepEqual(leerLista('0001\n0002, Ana López\n\n0003;Beto'), [
    { numero: '0001', nombre: null }, { numero: '0002', nombre: 'Ana López' }, { numero: '0003', nombre: 'Beto' },
  ]);
  assert.match((leerLista('0001\n0001') as { error: string }).error, /repetido/);
  assert.match((leerLista('12.3') as { error: string }).error, /no es un número/);
});
