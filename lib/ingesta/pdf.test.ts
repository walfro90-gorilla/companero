import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineasDeFragmentos, seccionarPorTitulos, type Fragmento } from './pdf.ts';

// Fragmentos como los da unpdf: y crece hacia arriba; el orden interno no siempre es el visual.
const f = (str: string, y: number, fontSize: number, x = 50): Fragmento => ({ str, x, y, width: str.length * fontSize * 0.5, fontSize });
const pie = (n: number) => [f('MANUAL DE PRUEBA · TIENDA', 790, 6), f(`Documento ficticio ${n}`, 20, 8)];
const cuerpo = (t: string, y: number) => f(t, y, 10.5);

const paginas: Fragmento[][] = [
  [f('Manual de', 700, 34.5), f('prueba', 660, 34.5), f('portada', 620, 34.5), cuerpo('Texto de portada con varias palabras aquí.', 500), ...pie(1)],
  [
    f('Procedimiento de cobro', 640, 12.5), // el subtítulo llega ANTES que el título en el orden interno
    f('1', 700, 15), f('Organización del puesto', 700, 19, 80),
    cuerpo('Qué cubre esta sección con suficiente texto para contar.', 670),
    cuerpo('1 · Saluda al cliente y escanea cada producto con cuidado.', 610),
    f('Cuando no hay cambio', 560, 12.5),
    cuerpo('Avisa al supervisor antes de confirmar el pago, siempre.', 530),
    ...pie(2),
  ],
  [
    f('Catálogo y condiciones de las', 720, 19), f('6', 705, 15), f('promociones', 690, 19),
    cuerpo('Los precios de esta sección son de la tienda ficticia de prueba.', 660),
    f('Cupón DESC10', 620, 12.5),
    cuerpo('Aplica 10% a unidades sin promoción automática, mínimo de $150.', 600),
    ...pie(3),
  ],
  [f('Referencias', 700, 12.5), cuerpo('Fuentes consultadas para el manual de prueba, varias.', 680), ...pie(4)],
];

test('arma "sección N, Subtítulo" en orden visual y quita encabezados y pies repetidos', () => {
  const s = seccionarPorTitulos(lineasDeFragmentos(paginas), 'Manual de prueba')!;
  assert.deepEqual(s.map(x => x.referencia), [
    'Manual de prueba, presentación',
    'sección 1',
    'sección 1, Procedimiento de cobro',
    'sección 1, Cuando no hay cambio',
    'sección 6',
    'sección 6, Cupón DESC10',
    'sección 6, Referencias',
  ]);
  assert.equal(s.find(x => x.referencia === 'sección 6')!.titulo, 'Catálogo y condiciones de las promociones');
  assert.equal(s.find(x => x.referencia === 'sección 6, Cupón DESC10')!.pagina, 3);
  assert.ok(s.every(x => !x.texto.includes('MANUAL DE PRUEBA') && !x.texto.includes('Documento ficticio')));
});

test('columnas separadas por un hueco ancho se marcan con " · "', () => {
  const [l] = lineasDeFragmentos([[f('Cuatro aguas', 500, 9.5, 64), f('$80', 500, 9.5, 260), f('$60', 500, 9.5, 480)]]);
  assert.equal(l.texto, 'Cuatro aguas · $80 · $60');
});

test('un PDF sin títulos con estilo devuelve null (se parte por páginas)', () => {
  const plano = [[cuerpo('Solo texto normal en la primera página del documento.', 700)], [cuerpo('Y más texto normal en la segunda página.', 700)]];
  assert.equal(seccionarPorTitulos(lineasDeFragmentos(plano), 'Plano'), null);
});
