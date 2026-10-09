// Identidad del asistente, una por empresa (docs/adr/0005 y 0009). Vive en empresas.avatar (jsonb) y la
// edita admin/RH. Lo que falte se completa con la base genérica. Sin el logotipo ni la marca de una empresa
// salvo que ella lo autorice.

export type Colores = { piel: string; cabello: string; camisa: string; fondo: string };

export type Avatar = {
  nombre: string;
  /** "tu compañera de capacitación" */
  rol: string;
  /** Saludo propio de la empresa; si no hay, se arma uno con la empresa y el puesto. */
  saludo: string | null;
  colores: Colores;
  /** Preguntas sugeridas debajo del chat. */
  preguntas: string[];
};

export const AVATAR_BASE: Avatar = {
  nombre: 'Rosa',
  rol: 'tu compañera de capacitación',
  saludo: null,
  colores: { piel: '#f1c7a0', cabello: '#3b2418', camisa: '#c81e5b', fondo: '#fde7ef' },
  preguntas: [
    '¿Qué voy a aprender en mi inducción?',
    '¿Qué hago en mi primer día?',
    '¿Cuándo debo llamar a mi supervisor?',
  ],
};

const COLOR = /^#[0-9a-f]{6}$/i;

const texto = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

/** Lee el jsonb sin confiar en él: cualquier campo inválido cae a la base. */
export function avatarDe(json: unknown): Avatar {
  const o = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
  const c = (o.colores && typeof o.colores === 'object' ? o.colores : {}) as Record<string, unknown>;
  const color = (k: keyof Colores) => (typeof c[k] === 'string' && COLOR.test(c[k] as string) ? (c[k] as string) : AVATAR_BASE.colores[k]);
  const preguntas = Array.isArray(o.preguntas)
    ? o.preguntas.map(p => texto(p, 120)).filter((p): p is string => Boolean(p)).slice(0, 6)
    : [];
  return {
    nombre: texto(o.nombre, 30) ?? AVATAR_BASE.nombre,
    rol: texto(o.rol, 60) ?? AVATAR_BASE.rol,
    saludo: texto(o.saludo, 600),
    colores: { piel: color('piel'), cabello: color('cabello'), camisa: color('camisa'), fondo: color('fondo') },
    preguntas: preguntas.length ? preguntas : AVATAR_BASE.preguntas,
  };
}

/** Función 01 del reto: bienvenida, qué se aprenderá y el siguiente paso. Fija: no gasta una llamada. */
export function bienvenida(a: Avatar, empresa: string, puesto?: string | null): string {
  if (a.saludo) return a.saludo;
  return (
    `¡Hola! Soy ${a.nombre}, ${a.rol} en ${empresa}. Te voy a acompañar en tu inducción` +
    (puesto ? ` como ${puesto.toLowerCase()}` : '') +
    '. Todo lo que te diga viene del material autorizado de la empresa y te digo de qué parte sale. ' +
    'Si algo no viene ahí, te digo a quién preguntarle. Pregúntame lo que quieras o elige una de las preguntas de abajo.'
  );
}
