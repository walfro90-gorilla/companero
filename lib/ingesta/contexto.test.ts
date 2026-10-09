import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerContextos, lotes, peticionContexto } from './contexto.ts';

test('leerContextos solo acepta órdenes que existen y textos no vacíos', () => {
  const m = leerContextos(
    { secciones: [{ orden: 1, contexto: ' Trata de X. ¿Cómo? ' }, { orden: 9, contexto: 'no existe' }, { orden: 2, contexto: '' }, { orden: '3', contexto: 'tres' }] },
    [1, 2, 3],
  );
  assert.deepEqual([...m.entries()], [[1, 'Trata de X. ¿Cómo?'], [3, 'tres']]);
});

test('leerContextos tolera basura', () => {
  assert.equal(leerContextos(null, [1]).size, 0);
  assert.equal(leerContextos({ secciones: 'no' }, [1]).size, 0);
});

test('peticionContexto incluye cada sección y pide JSON', () => {
  const p = peticionContexto('Uno', 'Manual', [{ orden: 1, titulo: 'Cobro "rápido"', texto: 'Texto' }]);
  const contenido = String(p.messages[0].content);
  assert.match(contenido, /<seccion orden="1" titulo="Cobro 'rápido'">/);
  assert.match(String(p.instructions), /JSON/);
});

test('lotes', () => {
  assert.deepEqual(lotes([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});
