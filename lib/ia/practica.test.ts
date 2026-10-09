import { test } from 'node:test';
import assert from 'node:assert/strict';
import { peticionPersonaje, peticionRetroalimentacion, type Escena } from './practica.ts';

const e: Escena = { empresa: 'Uno', personaje: 'cliente con prisa', situacion: 'Quiere cancelar un refresco ya cobrado.', objetivo: 'Llamar al supervisor [D1-5].', material: '[D1-5] Manual › Cancelaciones\nLlama al supervisor.' };

test('el personaje abre la escena cuando no hay mensajes', () => {
  const p = peticionPersonaje(e, []);
  assert.equal(p.messages.length, 1);
  assert.match(String(p.messages[0].content), /Empieza la escena/);
  assert.match(String(p.instructions), /cliente con prisa/);
});

test('en la conversación, lo del personaje va como assistant y lo del colaborador como user', () => {
  const p = peticionPersonaje(e, [{ rol: 'avatar', texto: 'Oiga, quiero cancelar esto.' }, { rol: 'usuario', texto: 'Claro, llamo a mi supervisor.' }]);
  assert.deepEqual(p.messages.map(m => m.role), ['assistant', 'user']);
});

test('la retroalimentación lleva el material, el objetivo y la transcripción, y pide no calificar', () => {
  const p = peticionRetroalimentacion(e, [{ rol: 'avatar', texto: 'Quiero cancelar.' }, { rol: 'usuario', texto: 'Ya lo cancelo yo.' }]);
  assert.match(String(p.instructions), /\[D1-5\] Manual › Cancelaciones/);
  assert.match(String(p.instructions), /No califiques/);
  assert.match(String(p.messages[0].content), /Colaborador: Ya lo cancelo yo\./);
});
