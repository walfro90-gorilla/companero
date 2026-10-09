import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limpiarTexto, seccionarMarkdown, seccionarPaginas, trocear } from './seccionar.ts';
import { htmlAMarkdown } from './html.ts';

test('markdown: corta en ## y omite el # del documento', () => {
  const md = '---\nid: D1\ntitulo: Manual\n---\n# Manual de caja\n\nIntro breve del manual.\n\n## Apertura\nCuenta el fondo.\n\n## Cancelaciones\nLlama al supervisor.\n### Detalle\nCon su clave.';
  const s = seccionarMarkdown(md, 'Manual');
  assert.deepEqual(s.map(x => x.titulo), ['Introducción', 'Apertura', 'Cancelaciones']);
  assert.equal(s[0].texto, 'Intro breve del manual.');
  assert.match(s[2].texto, /\*\*Detalle\*\*\nCon su clave\./);
});

test('markdown sin encabezados: una sección con el título del documento', () => {
  const s = seccionarMarkdown('Solo un párrafo.\n\nY otro.', 'Política de uniformes');
  assert.equal(s.length, 1);
  assert.equal(s[0].titulo, 'Política de uniformes');
});

test('markdown con un solo nivel #: usa ese nivel', () => {
  const s = seccionarMarkdown('# Uno\nA.\n# Dos\nB.', 'Doc');
  assert.deepEqual(s.map(x => x.titulo), ['Uno', 'Dos']);
});

test('trocear parte por párrafos y numera los títulos', () => {
  const parrafo = Array.from({ length: 50 }, () => 'palabra').join(' ');
  const texto = Array.from({ length: 5 }, () => parrafo).join('\n\n');
  const partes = trocear({ titulo: 'Cobro', texto }, 120);
  assert.equal(partes.length, 3);
  assert.deepEqual(partes.map(p => p.titulo), ['Cobro', 'Cobro (2)', 'Cobro (3)']);
});

test('PDF: una sección por página, con su número; las vacías se saltan', () => {
  const s = seccionarPaginas(['Apertura de caja\nAl iniciar el turno cuenta el fondo fijo.', '   ', '12\nSin título claro pero con texto suficiente aquí.']);
  assert.deepEqual(s.map(x => [x.titulo, x.pagina]), [['Apertura de caja', 1], ['Sin título claro pero con texto suficiente aquí', 3]]);
});

test('limpiarTexto une palabras cortadas por guion y normaliza espacios', () => {
  assert.equal(limpiarTexto('cance-\nlación   del  artículo\r\n\n\n\nfin'), 'cancelación del artículo\n\nfin');
});

test('htmlAMarkdown conserva encabezados, listas y negritas', () => {
  const md = htmlAMarkdown('<h1>Manual</h1><h2>Cobro &amp; cambio</h2><p>Paso <strong>uno</strong></p><ul><li>A</li><li>B</li></ul>');
  assert.equal(md, '# Manual\n\n## Cobro & cambio\n\nPaso **uno**\n\n- A\n- B');
});
