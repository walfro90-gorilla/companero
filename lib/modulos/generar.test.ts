import { test } from 'node:test';
import assert from 'node:assert/strict';
import { peticionLecciones, validarEscenarios, validarLecciones, validarPreguntas, type Revision } from './generar.ts';

const validos = new Set(['D1-1', 'D1-2', 'D1-5']);
const rev = (): Revision => ({ descartadas: [] });

test('lecciones: se quedan las que citan secciones existentes; se descartan las inventadas', () => {
  const r = rev();
  const v = validarLecciones({
    titulo: 'Inducción de caja', descripcion: 'Lo básico',
    lecciones: [
      { titulo: 'Apertura', objetivo: 'Abrir caja', contenido: '1. Cuenta el fondo frente al supervisor [D1-1].', secciones: ['D1-1'] },
      { titulo: 'Inventada', contenido: 'Haz un arqueo cada hora [D9-9].' },
      { titulo: 'Sin cita', contenido: 'Sonríe siempre al cliente, es importante.' },
    ],
  }, validos, r);
  assert.deepEqual(v?.lecciones.map(l => l.titulo), ['Apertura']);
  assert.equal(r.descartadas.length, 2);
});

test('preguntas: la correcta debe existir y la explicación citar una sección real', () => {
  const r = rev();
  const ps = validarPreguntas({
    preguntas: [
      { enunciado: '¿Quién autoriza una cancelación?', opciones: ['Tú', 'El supervisor', 'El cliente', 'Nadie'], correcta: 1, explicacion: 'La autoriza el supervisor [D1-5].', seccion: 'D1-5' },
      { enunciado: '¿Pregunta rota?', opciones: ['a', 'b'], correcta: 3, explicacion: 'Porque sí [D1-1].', seccion: 'D1-1' },
      { enunciado: '¿Cita falsa?', opciones: ['a', 'b'], correcta: 0, explicacion: 'Dice el manual [D7-1].', seccion: 'D7-1' },
    ],
  }, validos, r);
  assert.equal(ps.length, 1);
  assert.equal(ps[0].correcta, 1);
  assert.equal(r.descartadas.length, 2);
});

test('escenarios: el objetivo debe citar el material', () => {
  const r = rev();
  const es = validarEscenarios({
    escenarios: [
      { titulo: 'Cliente con prisa', situacion: 'Un cliente quiere cancelar un refresco ya cobrado.', personaje: 'cliente con prisa', objetivo: 'Llamar al supervisor para que autorice [D1-5].', secciones: ['D1-5'] },
      { titulo: 'Sin fuente', situacion: 'Algo pasa en la caja ahora.', personaje: 'cliente', objetivo: 'Resolverlo como puedas.' },
    ],
  }, validos, r);
  assert.deepEqual(es.map(e => e.titulo), ['Cliente con prisa']);
});

test('basura del modelo no truena', () => {
  assert.equal(validarLecciones(null, validos, rev()), null);
  assert.deepEqual(validarPreguntas('hola', validos, rev()), []);
  assert.deepEqual(validarEscenarios({ escenarios: 3 }, validos, rev()), []);
});

test('la petición de lecciones lleva el material con sus ids', () => {
  const p = peticionLecciones({ empresa: 'Uno', puesto: 'Cajero', tipo: 'induccion', enfoque: null, secciones: [{ codigo: 'D1-1', documento: 'Manual', titulo: 'Apertura', texto: 'Cuenta el fondo.' }] });
  assert.match(String(p.messages[0].content), /\[D1-1\] Manual › Apertura/);
  assert.match(String(p.instructions), /Cajero/);
});

test('descarta preguntas con opciones repetidas y quita la numeración de las lecciones', () => {
  const r = rev();
  const ps = validarPreguntas({ preguntas: [{ enunciado: '¿Total con cupón?', opciones: ['$70.50', '$71.00', '$70.50', '$71.00'], correcta: 0, explicacion: 'Cálculo [D1-1].', seccion: 'D1-1' }] }, validos, r);
  assert.equal(ps.length, 0);
  assert.match(r.descartadas[0], /opciones repetidas/);
  const l = validarLecciones({ titulo: 'Módulo', lecciones: [{ titulo: '1. Apertura', contenido: 'Cuenta el fondo con tu supervisor [D1-1].' }] }, validos, rev());
  assert.equal(l?.lecciones[0].titulo, 'Apertura');
});
