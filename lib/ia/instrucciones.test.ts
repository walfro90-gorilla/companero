import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fechaHora, instrucciones } from './instrucciones.ts';

test('la fecha y hora van en Cd. Juárez (UTC−6 en octubre) y fuera del bloque en caché', () => {
  const ahora = new Date('2026-10-10T15:05:00Z'); // 09:05 en Cd. Juárez
  assert.match(fechaHora(ahora), /sábado, 10 de octubre de 2026,? 09:05/);
  const [reglas, material] = instrucciones({ asistente: 'Rosa', empresa: 'Tienda Escuela' }, '[D1-1] …', ahora);
  assert.doesNotMatch(String(reglas.content), /2026/);
  assert.match(String(material.content), /09:05/);
});
