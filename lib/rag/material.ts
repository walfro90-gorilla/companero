import type { Mensaje } from '../ia/mensajes.ts';

// El paso "búsqueda en documentos" del RAG (docs/adr/0010), lógica pura: qué se busca y cómo se le
// presenta al modelo lo que encontró el buscador (Postgres: public.buscar_secciones).

export type Recuperada = {
  codigo: string;
  documento: string;
  fuente: string | null;
  titulo: string;
  texto: string;
  pagina: number | null;
  /** Cómo la cita el documento («sección 5, Si la segunda parte queda incierta»), si se sabe (ADR 0013). */
  referencia: string | null;
  puntaje: number;
  vias: string;
};

/** Lo que el navegador muestra como "consulté estas secciones" (sin el texto, que viaja aparte). */
export type Consultada = Pick<Recuperada, 'codigo' | 'documento' | 'titulo' | 'pagina' | 'referencia' | 'vias'>;

/** Lo que ve la persona por una cita: la referencia del documento, o el título si no hay. */
export function nombreCita(c: { referencia?: string | null; documento?: string; titulo: string; pagina?: number | null }): string {
  const base = c.referencia ?? (c.documento ? `${c.documento} › ${c.titulo}` : c.titulo);
  return c.pagina ? `${base} (pág. ${c.pagina})` : base;
}

/** Texto corto para el chip de una cita: «sección 5» de «sección 5, Si la segunda…». */
export function citaCorta(referencia: string | null | undefined, codigo: string): string {
  if (!referencia) return codigo;
  const corta = referencia.split(',')[0].trim();
  return corta.length <= 24 ? corta : `${corta.slice(0, 22)}…`;
}

export function materialParaPrompt(xs: Recuperada[]): string {
  if (!xs.length) return 'El buscador no encontró ninguna sección del material relacionada con esta conversación.';
  return xs
    .map(s => `[${s.codigo}] ${s.referencia ? `${s.documento}, ${s.referencia}` : `${s.documento} › ${s.titulo}`}${s.pagina ? ` (pág. ${s.pagina})` : ''}\n${s.texto}`)
    .join('\n\n');
}

const SEGUIMIENTO = /^(y\b|¿y\b|pero\b|entonces\b|no entend|explic|otra forma|¿?por qu[eé]\b|¿?y si\b)/i;

/**
 * Qué se manda al buscador. Una pregunta de seguimiento ("¿y si no está el supervisor?", "explícamelo de
 * otra forma") sola no encuentra nada: se le suma la pregunta anterior.
 */
export function consultaDeBusqueda(mensajes: Mensaje[]): string {
  const delUsuario = mensajes.filter(m => m.rol === 'usuario').map(m => m.texto.trim());
  const ultima = delUsuario.at(-1) ?? '';
  const anterior = delUsuario.at(-2);
  if (anterior && (ultima.split(/\s+/).length < 5 || SEGUIMIENTO.test(ultima))) return `${ultima}\n${anterior}`;
  return ultima;
}
