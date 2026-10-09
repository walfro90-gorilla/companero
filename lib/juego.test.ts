import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progreso, puntos, racha, type Actividad } from './juego.ts';

const nada: Actividad = { lecciones: 0, tests: [], practicas: 0, preguntas: 0, modulosCompletos: 0, dias: [] };

test('sin actividad: nivel 1, sin insignias', () => {
  const p = progreso(nada, '2026-10-09');
  assert.equal(p.puntos, 0);
  assert.equal(p.nivel, 1);
  assert.equal(p.nombreNivel, 'Nuevo ingreso');
  assert.ok(p.insignias.every(i => !i.ganada));
});

test('puntos: lecciones, test aprobado, prácticas, preguntas con tope y módulo completo', () => {
  assert.equal(puntos({ ...nada, lecciones: 4 }), 40);
  assert.equal(puntos({ ...nada, tests: [{ aciertos: 4, total: 5 }] }), 60); // 80 % aprueba
  assert.equal(puntos({ ...nada, tests: [{ aciertos: 3, total: 5 }] }), 10); // 60 % no aprueba
  assert.equal(puntos({ ...nada, preguntas: 100 }), 50); // tope: preguntar no es la meta
  assert.equal(puntos({ ...nada, practicas: 2, modulosCompletos: 1 }), 160);
});

test('un módulo completo típico lleva a "Listo para operar"', () => {
  const p = progreso({ lecciones: 5, tests: [{ aciertos: 6, total: 6 }], practicas: 3, preguntas: 8, modulosCompletos: 1, dias: ['2026-10-09'] }, '2026-10-09');
  assert.equal(p.puntos, 50 + 60 + 90 + 16 + 100);
  assert.equal(p.nombreNivel, 'En práctica');
  assert.ok(p.insignias.find(i => i.id === 'test-perfecto')!.ganada);
  assert.ok(p.siguiente !== null && p.avanceNivel > 0 && p.avanceNivel < 1);
});

test('racha: cuenta hacia atrás desde hoy o ayer', () => {
  assert.equal(racha(['2026-10-07', '2026-10-08', '2026-10-09'], '2026-10-09'), 3);
  assert.equal(racha(['2026-10-07', '2026-10-08'], '2026-10-09'), 2); // hoy todavía no, sigue viva
  assert.equal(racha(['2026-10-05', '2026-10-06'], '2026-10-09'), 0);
  assert.equal(racha(['2026-09-30', '2026-10-01'], '2026-10-01'), 2); // cambio de mes
});
