import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirFormato, extensionDe, textoUtil } from './formato.ts';

test('elige el primer formato que soporta el navegador', () => {
  assert.equal(elegirFormato(t => t.startsWith('audio/webm')), 'audio/webm;codecs=opus');
  assert.equal(elegirFormato(t => t === 'audio/mp4'), 'audio/mp4'); // Safari
  assert.equal(elegirFormato(() => false), null);
});

test('extensión según el formato', () => {
  assert.equal(extensionDe('audio/webm;codecs=opus'), 'webm');
  assert.equal(extensionDe('audio/mp4'), 'm4a');
  assert.equal(extensionDe('audio/ogg;codecs=opus'), 'ogg');
});

test('descarta silencios y frases fantasma de Whisper', () => {
  assert.equal(textoUtil('  ¿Cómo hago   una cancelación? '), '¿Cómo hago una cancelación?');
  assert.equal(textoUtil('Gracias por ver.'), null);
  assert.equal(textoUtil('..'), null);
});

test('descarta las frases fantasma típicas de Whisper con ruido o música', async () => {
  const { textoUtil: t } = await import('./formato.ts');
  for (const f of ['Gracias.', ' Muchas gracias. ', '¡Música!', 'Subtítulos realizados por la comunidad de Amara.org', '¡Suscríbete!', 'Mm.']) {
    assert.equal(t(f), null, f);
  }
  assert.equal(t('¿Qué?'), null);
  assert.equal(t('¿Devoluciones?'), '¿Devoluciones?');
  assert.equal(t('¿Gracias a qué se aplica el cupón DESC10?'), '¿Gracias a qué se aplica el cupón DESC10?');
});
