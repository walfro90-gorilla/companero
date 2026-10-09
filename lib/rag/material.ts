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
  puntaje: number;
  vias: string;
};

/** Lo que el navegador muestra como "consulté estas secciones" (sin el texto, que viaja aparte). */
export type Consultada = Pick<Recuperada, 'codigo' | 'documento' | 'titulo' | 'pagina' | 'vias'>;

export function materialParaPrompt(xs: Recuperada[]): string {
  if (!xs.length) return 'El buscador no encontró ninguna sección del material relacionada con esta conversación.';
  return xs
    .map(s => `[${s.codigo}] ${s.documento} › ${s.titulo}${s.pagina ? ` (pág. ${s.pagina})` : ''}\n${s.texto}`)
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
