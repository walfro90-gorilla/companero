import assert from 'node:assert/strict';
import test from 'node:test';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { conmutar, generarConRespaldo, jsonDe, ordenar, type Eslabon } from './cadena.ts';
import { clasificar } from './fallos.ts';

const uso = {
  inputTokens: { total: 120, noCache: 120, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 7, text: 7, reasoning: undefined },
};

function responde(...trozos: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 't' },
          ...trozos.map(delta => ({ type: 'text-delta' as const, id: 't', delta })),
          { type: 'text-end', id: 't' },
          { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, logprobs: undefined, usage: uso },
        ],
      }),
    }),
  });
}

const falla = (error: unknown) => new MockLanguageModelV4({ doStream: async () => { throw error; } });
const vacio = () => responde();

const eslabon = (proveedor: string, crear: () => unknown): Eslabon =>
  ({ proveedor, modelo: `${proveedor}-modelo`, crear: crear as Eslabon['crear'] });
const pet = { instructions: 'x', messages: [{ role: 'user' as const, content: 'hola' }], maxOutputTokens: 100 };
const silencio = () => {};

async function leer(r: Extract<Awaited<ReturnType<typeof conmutar>>, { ok: true }>) {
  let texto = r.primero;
  for (;;) {
    const s = await r.resto.next();
    if (s.done) break;
    texto += s.value;
  }
  return texto;
}

test('responde el primero si funciona', async () => {
  const r = await conmutar([eslabon('anthropic', () => responde('Hola', ', Wal')), eslabon('groq', () => responde('no'))], pet, { registrar: silencio });
  assert.ok(r.ok);
  assert.equal(r.eslabon.proveedor, 'anthropic');
  assert.deepEqual(r.intentos, []);
  assert.equal(await leer(r), 'Hola, Wal');
  assert.deepEqual(await r.uso, { inputTokens: 120, outputTokens: 7 });
});

test('una llave muerta pasa al siguiente y queda registrada como "clave"', async () => {
  const muerta = Object.assign(new Error('invalid x-api-key'), { statusCode: 401 });
  const r = await conmutar([eslabon('anthropic', () => falla(muerta)), eslabon('groq', () => responde('Respaldo'))], pet, { registrar: silencio });
  assert.ok(r.ok);
  assert.equal(r.eslabon.proveedor, 'groq');
  assert.deepEqual(r.intentos, [{ proveedor: 'anthropic', clase: 'clave' }]);
  assert.equal(await leer(r), 'Respaldo');
});

test('una respuesta vacía también es fallo (el caso de gpt-oss sin tokens)', async () => {
  const r = await conmutar([eslabon('groq', vacio), eslabon('anthropic', () => responde('ok'))], pet, { registrar: silencio });
  assert.ok(r.ok);
  assert.deepEqual(r.intentos, [{ proveedor: 'groq', clase: 'vacio' }]);
});

test('un 400 tampoco corta la cadena (Google responde 400 a una llave inválida)', async () => {
  const r = await conmutar([eslabon('a', () => falla(Object.assign(new Error('bad'), { statusCode: 400 }))), eslabon('b', () => responde('sí'))], pet, { registrar: silencio });
  assert.ok(r.ok);
  assert.equal(r.eslabon.proveedor, 'b');
});

test('si todos fallan, lo dice con todos los intentos', async () => {
  const r = await conmutar([eslabon('a', vacio), eslabon('b', () => falla(new Error('fetch failed')))], pet, { registrar: silencio });
  assert.equal(r.ok, false);
  assert.deepEqual(r.intentos, [{ proveedor: 'a', clase: 'vacio' }, { proveedor: 'b', clase: 'proveedor' }]);
});

test('ordenar respeta IA_ORDEN y deja al final a los no mencionados', () => {
  const cadena = [{ proveedor: 'anthropic' }, { proveedor: 'groq' }];
  assert.deepEqual(ordenar(cadena).map(x => x.proveedor), ['anthropic', 'groq']);
  assert.deepEqual(ordenar(cadena, 'groq,anthropic').map(x => x.proveedor), ['groq', 'anthropic']);
  assert.deepEqual(ordenar(cadena, 'groq').map(x => x.proveedor), ['groq', 'anthropic']);
  assert.deepEqual(ordenar(cadena, 'inventado').map(x => x.proveedor), ['anthropic', 'groq']);
});

test('clasificar', () => {
  assert.equal(clasificar({ statusCode: 401 }), 'clave');
  assert.equal(clasificar({ statusCode: 400, message: 'API key not valid' }), 'clave');
  assert.equal(clasificar({ statusCode: 429 }), 'proveedor');
  assert.equal(clasificar(new Error('fetch failed')), 'proveedor');
  assert.equal(clasificar({ statusCode: 422 }), 'nuestro');
});

const genera = (text: string) => new MockLanguageModelV4({
  doGenerate: async () => ({
    content: [{ type: 'text', text }], finishReason: { unified: 'stop', raw: undefined }, usage: uso, warnings: [],
  }),
});
const fallaGen = (error: unknown) => new MockLanguageModelV4({ doGenerate: async () => { throw error; } });

test('generarConRespaldo: vacío o error pasan al siguiente', async () => {
  const r = await generarConRespaldo([
    eslabon('groq', () => genera('   ')),
    eslabon('anthropic', () => fallaGen(Object.assign(new Error('x'), { statusCode: 529 }))),
    eslabon('otro', () => genera('Riega solo si el vaso pesa poco.')),
  ], pet, { registrar: silencio });
  assert.ok(r.ok);
  assert.equal(r.texto, 'Riega solo si el vaso pesa poco.');
  assert.deepEqual(r.intentos, [{ proveedor: 'groq', clase: 'vacio' }, { proveedor: 'anthropic', clase: 'proveedor' }]);
});

test('jsonDe saca el JSON aunque venga envuelto', () => {
  assert.deepEqual(jsonDe('```json\n{"hechos": []}\n```'), { hechos: [] });
  assert.equal(jsonDe('sin json'), null);
  assert.equal(jsonDe('{roto'), null);
});
