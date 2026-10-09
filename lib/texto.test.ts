import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rutaSegura, slugDe } from './texto.ts';

test('slugDe quita acentos, espacios y símbolos', () => {
  assert.equal(slugDe('Del Río Superette'), 'del-rio-superette');
  assert.equal(slugDe('  Ñandú & Cía. '), 'nandu-cia');
});

test('rutaSegura solo acepta rutas internas', () => {
  assert.equal(rutaSegura('/e/uno'), '/e/uno');
  assert.equal(rutaSegura('//malo.com'), '/inicio');
  assert.equal(rutaSegura('https://malo.com'), '/inicio');
  assert.equal(rutaSegura(null), '/inicio');
});
