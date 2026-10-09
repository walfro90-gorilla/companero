import type { Peticion } from './cadena.ts';
import type { Mensaje } from './mensajes.ts';

// Simulador de situaciones prácticas (función 04 del reto; docs/adr/0011). Lógica pura: arma las peticiones.
// El asistente interpreta a un personaje (p. ej. un cliente) y al final da retroalimentación citando el
// material, sin calificar a la persona.

export type Escena = { empresa: string; personaje: string; situacion: string; objetivo: string; material: string };

const MAX_TURNOS = 12;

export function peticionPersonaje(e: Escena, mensajes: Mensaje[]): Peticion {
  const conversacion = mensajes.slice(-MAX_TURNOS).map(m => ({
    role: m.rol === 'avatar' ? ('assistant' as const) : ('user' as const),
    content: m.texto.slice(0, 1000),
  }));
  return {
    instructions: `Estás en un simulador de capacitación de ${e.empresa}. Interpretas a este personaje: ${e.personaje}.
Situación: ${e.situacion}
Hablas SOLO como ese personaje, en español de México, con 1 a 3 oraciones por turno, de forma natural y un poco desafiante. No ayudes a la persona en capacitación ni le des pistas del procedimiento; reacciona a lo que haga como lo haría el personaje. No menciones que eres una IA, un simulador ni ningún manual. Si te pide algo que el personaje no tiene o no quiere dar, insiste una vez y luego cede. Sin emojis.`,
    // La primera vez no hay mensajes: el personaje abre la escena.
    messages: conversacion.length ? conversacion : [{ role: 'user', content: '(Empieza la escena con lo primero que diría tu personaje.)' }],
    maxOutputTokens: 1500,
  };
}

export function peticionRetroalimentacion(e: Escena, mensajes: Mensaje[]): Peticion {
  const transcripcion = mensajes
    .slice(-MAX_TURNOS * 2)
    .map(m => `${m.rol === 'avatar' ? 'Personaje' : 'Colaborador'}: ${m.texto.slice(0, 1000)}`)
    .join('\n');
  return {
    instructions: `Eres instructor de capacitación de ${e.empresa}. Revisas una práctica: la persona en capacitación ("Colaborador") atendió a un personaje ("Personaje") en esta situación: ${e.situacion}
Lo que debía hacer: ${e.objetivo}
Compara lo que hizo SOLO contra el material autorizado de abajo. Da retroalimentación breve y amable, en tres partes con estos títulos en negritas:
**Lo que hiciste bien** — concreto.
**Lo que faltó** — el paso correcto según el material, con su cita [D1-3]. Si no faltó nada, dilo.
**Para la próxima** — un consejo práctico.
No califiques a la persona ni le pongas número: es para aprender. No inventes pasos que no estén en el material. Español de México, de tú, sin emojis.

Material autorizado:
${e.material}`,
    messages: [{ role: 'user', content: `Transcripción de la práctica:\n${transcripcion}` }],
    maxOutputTokens: 3000,
  };
}
