import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fusionar } from './fusion.ts';

const l = (...cs: string[]) => cs.map(codigo => ({ codigo }));

test('lo que aparece en ambas listas sube; no se repite; respeta el límite', () => {
  const r = fusionar([l('A', 'B', 'C'), l('C', 'D', 'A')], 3).map(x => x.codigo);
  assert.deepEqual(r, ['A', 'C', 'B']);
});

test('con una sola lista conserva el orden', () => {
  assert.deepEqual(fusionar([l('X', 'Y')], 10).map(x => x.codigo), ['X', 'Y']);
});
