import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consultaDeBusqueda, materialParaPrompt } from './material.ts';

const s = { codigo: 'D1-3', documento: 'Manual de caja', fuente: null, titulo: 'Cancelaciones', texto: 'Llama al supervisor.', pagina: 4, puntaje: 0.03, vias: 'texto' };

test('materialParaPrompt pone el código, el documento, la página y el texto', () => {
  assert.equal(materialParaPrompt([s]), '[D1-3] Manual de caja › Cancelaciones (pág. 4)\nLlama al supervisor.');
});

test('sin resultados, el modelo lo sabe explícitamente', () => {
  assert.match(materialParaPrompt([]), /no encontró/);
});

test('una pregunta completa se busca sola', () => {
  assert.equal(
    consultaDeBusqueda([{ rol: 'usuario', texto: '¿Cómo cancelo un artículo?' }, { rol: 'avatar', texto: '…' }, { rol: 'usuario', texto: '¿Qué hago si un producto no tiene precio?' }]),
    '¿Qué hago si un producto no tiene precio?',
  );
});

test('una de seguimiento se busca junto con la anterior', () => {
  const m = [{ rol: 'usuario' as const, texto: '¿Cómo cancelo un artículo?' }, { rol: 'avatar' as const, texto: '…' }];
  assert.equal(consultaDeBusqueda([...m, { rol: 'usuario', texto: '¿y si no está?' }]), '¿y si no está?\n¿Cómo cancelo un artículo?');
  assert.equal(
    consultaDeBusqueda([...m, { rol: 'usuario', texto: 'No entendí bien. ¿Me lo explicas de otra forma?' }]),
    'No entendí bien. ¿Me lo explicas de otra forma?\n¿Cómo cancelo un artículo?',
  );
});
