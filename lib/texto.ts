// Utilidades de texto puras.

/** "Del Río Superette" → "del-rio-superette" (para la URL de la empresa). */
export function slugDe(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** Solo rutas internas: evita open-redirect con ?next=//otro-dominio. */
export function rutaSegura(next: string | null | undefined, porOmision = '/inicio'): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : porOmision;
}
