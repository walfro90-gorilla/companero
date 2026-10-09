import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerPalabras, peticionReescritura } from './reescribir.ts';

test('leerPalabras deja solo palabras y corta en 20', () => {
  assert.equal(leerPalabras('**límite, efectivo; gaveta** — retiro $3,000.'), 'límite efectivo gaveta retiro $3 000');
  assert.equal(leerPalabras(Array.from({ length: 30 }, (_, i) => `p${i}`).join(' ')).split(' ').length, 20);
});

test('la petición lleva la pregunta y pide solo palabras', () => {
  const p = peticionReescritura('¿Puedo devolver un yogur abierto?', 'Comercio');
  assert.match(String(p.instructions), /solo las palabras/);
  assert.equal(p.messages[0].content, '¿Puedo devolver un yogur abierto?');
});
