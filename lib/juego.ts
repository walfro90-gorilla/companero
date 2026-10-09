// Gamificación personal (docs/adr/0011). Lógica pura, con pruebas: de la actividad de una persona a puntos,
// nivel, insignias y racha. Es motivación para quien aprende, no evaluación: no hay rankings entre personas.

export type Actividad = {
  /** Lecciones vistas. */
  lecciones: number;
  /** Mejor resultado de cada test: { aciertos, total } por módulo. */
  tests: { aciertos: number; total: number }[];
  practicas: number;
  /** Preguntas al asistente. */
  preguntas: number;
  /** Módulos con todas sus lecciones vistas y el test aprobado. */
  modulosCompletos: number;
  /** Fechas (YYYY-MM-DD, hora local) con alguna actividad. */
  dias: string[];
};

export const PUNTOS = { leccion: 10, test: 10, testAprobado: 50, practica: 30, pregunta: 2, preguntasTope: 50, modulo: 100 } as const;
export const APROBADO = 0.8;

export const NIVELES = [
  { desde: 0, nombre: 'Nuevo ingreso' },
  { desde: 60, nombre: 'Aprendiz' },
  { desde: 200, nombre: 'En práctica' },
  { desde: 400, nombre: 'Listo para operar' },
  { desde: 700, nombre: 'Experto' },
] as const;

export type Insignia = { id: string; nombre: string; descripcion: string; ganada: boolean };

export type Progreso = {
  puntos: number;
  nivel: number;
  nombreNivel: string;
  /** Puntos del nivel siguiente (null si ya es el último). */
  siguiente: number | null;
  /** 0–1 dentro del nivel actual. */
  avanceNivel: number;
  racha: number;
  insignias: Insignia[];
};

const aprobado = (t: { aciertos: number; total: number }) => t.total > 0 && t.aciertos / t.total >= APROBADO;

export function puntos(a: Actividad): number {
  return (
    a.lecciones * PUNTOS.leccion +
    a.tests.reduce((s, t) => s + PUNTOS.test + (aprobado(t) ? PUNTOS.testAprobado : 0), 0) +
    a.practicas * PUNTOS.practica +
    Math.min(a.preguntas * PUNTOS.pregunta, PUNTOS.preguntasTope) +
    a.modulosCompletos * PUNTOS.modulo
  );
}

/** Días seguidos con actividad, terminando hoy o ayer (si hoy aún no hace nada, la racha sigue viva). */
export function racha(dias: string[], hoy: string): number {
  const set = new Set(dias);
  const menos = (d: string, n: number) => {
    const f = new Date(`${d}T12:00:00Z`);
    f.setUTCDate(f.getUTCDate() - n);
    return f.toISOString().slice(0, 10);
  };
  let desde = set.has(hoy) ? hoy : set.has(menos(hoy, 1)) ? menos(hoy, 1) : null;
  if (!desde) return 0;
  let n = 0;
  while (set.has(desde)) {
    n++;
    desde = menos(desde, 1);
  }
  return n;
}

export function progreso(a: Actividad, hoy: string): Progreso {
  const p = puntos(a);
  const nivel = NIVELES.findLastIndex(n => p >= n.desde);
  const actual = NIVELES[nivel];
  const siguiente = NIVELES[nivel + 1]?.desde ?? null;
  const r = racha(a.dias, hoy);
  const insignias: Insignia[] = [
    { id: 'primera-leccion', nombre: 'Primer paso', descripcion: 'Viste tu primera lección', ganada: a.lecciones >= 1 },
    { id: 'test-perfecto', nombre: 'Test perfecto', descripcion: 'Todas bien en un test', ganada: a.tests.some(t => t.total > 0 && t.aciertos === t.total) },
    { id: 'practica', nombre: 'Manos a la obra', descripcion: 'Completaste 3 prácticas', ganada: a.practicas >= 3 },
    { id: 'curioso', nombre: 'Curiosidad', descripcion: 'Le hiciste 10 preguntas al asistente', ganada: a.preguntas >= 10 },
    { id: 'modulo', nombre: 'Módulo completo', descripcion: 'Terminaste un módulo con el test aprobado', ganada: a.modulosCompletos >= 1 },
    { id: 'racha', nombre: 'Constancia', descripcion: '3 días seguidos aprendiendo', ganada: r >= 3 },
  ];
  return {
    puntos: p, nivel: nivel + 1, nombreNivel: actual.nombre, siguiente,
    avanceNivel: siguiente === null ? 1 : (p - actual.desde) / (siguiente - actual.desde),
    racha: r, insignias,
  };
}
