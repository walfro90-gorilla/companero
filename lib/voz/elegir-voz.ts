// Voz de respaldo del navegador (docs/adr/0016), si Azure no está disponible. Antes se tomaba la primera voz en
// español: en Linux suele ser eSpeak (robótica) y en Windows a veces una de hombre, así que cambiaba con cada equipo.
// Ahora se elige por nombre una voz femenina de México, EE. UU. o España, y nunca una de la lista de abajo.

const FEMENINAS = [/Dalia/i, /Paulina/i, /Sabina/i, /M[oó]nica/i, /Paloma/i, /Elvira/i, /Helena/i, /Google español/i];
const EVITAR = /Ra[uú]l|Jorge|Juan|Pablo|Diego|Carlos|Jos[eé]|Enrique|eSpeak/i;
const IDIOMAS = ['es-mx', 'es-us', 'es-es'];

type Voz = { name: string; lang: string };
const MASCULINAS = /Ra[uú]l|Jorge|Juan|Pablo|Diego|Carlos|Jos[eé]|Enrique|[AÁ]lvaro/i;
const idioma = (v: Voz) => v.lang.replace('_', '-').toLowerCase();

/** La mejor voz femenina en español, o null si solo hay voces que hay que evitar (mejor callar que sonar mal). */
export function elegirVoz<T extends Voz>(voces: readonly T[]): T | null {
  const es = voces.filter(v => idioma(v).startsWith('es') && !EVITAR.test(v.name));
  for (const nombre of FEMENINAS) {
    for (const lang of IDIOMAS) {
      const v = es.find(x => idioma(x) === lang && nombre.test(x.name));
      if (v) return v;
    }
    const v = es.find(x => nombre.test(x.name));
    if (v) return v;
  }
  return null;
}

/**
 * Voz del cliente simulado en la práctica (respaldo del navegador): en español, distinta de la de la asistente para
 * que se note el cambio de personaje; de hombre o de mujer según el personaje si la hay. Nunca eSpeak.
 * null: no hay otra, se usa la de la asistente con otro tono.
 */
export function elegirVozCliente<T extends Voz>(voces: readonly T[], asistente: T | null, mujer: boolean): T | null {
  const es = voces.filter(v => idioma(v).startsWith('es') && !/eSpeak/i.test(v.name) && v.name !== asistente?.name);
  const deGenero = es.find(v => (mujer ? FEMENINAS.some(f => f.test(v.name)) : MASCULINAS.test(v.name)));
  return deGenero ?? es[0] ?? null;
}
