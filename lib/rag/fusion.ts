// Fusión de varias listas de resultados por rango (Reciprocal Rank Fusion, k = 60). Lógica pura, con pruebas.

export function fusionar<T extends { codigo: string }>(listas: T[][], limite: number): T[] {
  const puntaje = new Map<string, { item: T; p: number }>();
  for (const lista of listas) {
    lista.forEach((item, i) => {
      const actual = puntaje.get(item.codigo) ?? { item, p: 0 };
      actual.p += 1 / (60 + i + 1);
      puntaje.set(item.codigo, actual);
    });
  }
  return [...puntaje.values()].sort((a, b) => b.p - a.p).slice(0, limite).map(x => x.item);
}
