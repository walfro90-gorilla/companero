import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR_BASE, avatarDe } from './avatar.ts';

test('el uniforme con cuello, vivos y estrella (Del Río) se lee del jsonb', () => {
  const a = avatarDe({ colores: { camisa: '#1c54a5', detalle: '#da2027', acento: '#f8da08' } });
  assert.equal(a.colores.camisa, '#1c54a5');
  assert.equal(a.colores.detalle, '#da2027');
  assert.equal(a.colores.acento, '#f8da08');
});

test('sin detalle ni acento, el uniforme de siempre; un color inválido cae a la base', () => {
  const a = avatarDe({ colores: { camisa: 'rojo', detalle: 'javascript:alert(1)', acento: 42 } });
  assert.equal(a.colores.camisa, AVATAR_BASE.colores.camisa);
  assert.equal(a.colores.detalle, null);
  assert.equal(a.colores.acento, null);
  assert.deepEqual(avatarDe(null).colores, AVATAR_BASE.colores);
});
