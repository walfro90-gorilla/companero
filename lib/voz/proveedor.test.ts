import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Lru, aceptaIdioma, elegirProveedor, llaveCache, modeloElevenLabs, vozElevenLabs } from './proveedor.ts';

const RIO = 'EXAVITQu4vr4xnSDxMaL';
const JORGE = 'TxGEqnHWrfWFTfGW9XjX';

test('ElevenLabs primero, luego Azure, luego el navegador', () => {
  assert.deepEqual(elegirProveedor({ ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOZ: RIO, AZURE_SPEECH_KEY: 'a' }, 'asistente'),
    { proveedor: 'elevenlabs', voz: RIO, modelo: 'eleven_flash_v2_5' });
  assert.equal(elegirProveedor({ AZURE_SPEECH_KEY: 'a' }, 'asistente')?.voz, 'es-MX-DaliaNeural');
  assert.equal(elegirProveedor({}, 'asistente'), null);
});

test('si falta la voz del cliente en ElevenLabs, no suena como la asistente: Azure o el navegador', () => {
  const env = { ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOZ: RIO };
  assert.equal(elegirProveedor(env, 'cliente'), null);
  assert.equal(elegirProveedor({ ...env, AZURE_SPEECH_KEY: 'a' }, 'cliente')?.voz, 'es-MX-JorgeNeural');
  assert.equal(elegirProveedor({ ...env, ELEVENLABS_VOZ_CLIENTE: JORGE }, 'cliente')?.voz, JORGE);
});

test('voice_id y modelo se validan; language_code solo en flash/turbo v2.5', () => {
  assert.equal(vozElevenLabs({ ELEVENLABS_VOZ: 'abc/../x' }, 'asistente'), null);
  assert.equal(vozElevenLabs({ ELEVENLABS_VOZ: ` ${RIO} ` }, 'asistente'), RIO);
  assert.equal(modeloElevenLabs({ ELEVENLABS_MODELO: 'eleven_multilingual_v2' }), 'eleven_multilingual_v2');
  assert.equal(modeloElevenLabs({ ELEVENLABS_MODELO: 'otro; rm -rf' }), 'eleven_flash_v2_5');
  assert.ok(aceptaIdioma('eleven_flash_v2_5') && !aceptaIdioma('eleven_multilingual_v2'));
});

test('la llave del caché distingue voz, modo, quién y texto; el LRU olvida al más viejo', () => {
  const a = llaveCache(['elevenlabs', RIO, 'flash', 'resumen', 'asistente', 'Hola']);
  assert.equal(a, llaveCache(['elevenlabs', RIO, 'flash', 'resumen', 'asistente', 'Hola']));
  assert.notEqual(a, llaveCache(['elevenlabs', RIO, 'flash', 'literal', 'asistente', 'Hola']));
  assert.notEqual(a, llaveCache(['elevenlabs', JORGE, 'flash', 'resumen', 'asistente', 'Hola']));
  const c = new Lru<number>(2);
  c.set('x', 1);
  c.set('y', 2);
  c.get('x');
  c.set('z', 3);
  assert.equal(c.get('y'), undefined);
  assert.equal(c.get('x'), 1);
  assert.equal(c.size, 2);
});
