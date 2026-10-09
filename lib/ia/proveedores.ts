import 'server-only';
import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { ordenar, type Eslabon } from './cadena.ts';

// La cadena (docs/adr/0003): Anthropic primero, Groq de respaldo. Un proveedor sin llave se SALTA (no es un
// fallo). `IA_ORDEN` ("groq,anthropic") cambia el orden. Los ids de modelo caducan: se cambian con
// IA_MODELO_* y se verifican con `npm run probar:cadena`.

export type ProveedorIA = Eslabon & { nombre: string; variable: string };

const m = {
  anthropic: process.env.IA_MODELO_ANTHROPIC || 'claude-opus-5-5',
  // En claude-opus-5-5 el thinking siempre es adaptativo: el esfuerzo es el control de latencia del avatar.
  esfuerzo: process.env.IA_ESFUERZO_ANTHROPIC || 'low',
  groq: process.env.IA_MODELO_GROQ || 'openai/gpt-oss-120b',
  // medium: con low, gpt-oss no levantaba la canalización de un faltante en el corte (prueba documentada del
  // 9-oct: 9/10 → 10/10, de 0.6 a 0.8 s en promedio). Con el tope de 4000 tokens el razonamiento no se come la respuesta.
  esfuerzoGroq: process.env.IA_ESFUERZO_GROQ || 'medium',
};

export const CADENA: ProveedorIA[] = [
  {
    proveedor: 'anthropic', nombre: 'Anthropic', variable: 'ANTHROPIC_API_KEY', modelo: m.anthropic,
    crear: () => anthropic(m.anthropic),
    // fallbacks 'default': si un clasificador de seguridad rechaza el turno, la API lo reintenta sola con el
    // modelo que recomienda Anthropic (falsos positivos en un chat de capacitación serían raros, pero gratis).
    opciones: { anthropic: { effort: m.esfuerzo, fallbacks: 'default' } },
  },
  {
    proveedor: 'groq', nombre: 'Groq', variable: 'GROQ_API_KEY', modelo: m.groq,
    crear: () => groq(m.groq),
    // gpt-oss razona antes de escribir: con esfuerzo bajo y tope amplio, el razonamiento no se come la
    // respuesta (en clawbot-orion dio 233 de 233 respuestas vacías por eso).
    opciones: { groq: { reasoningEffort: m.esfuerzoGroq } },
    tokensSalida: 4000,
  },
];

/** Proveedores con llave, en orden. */
export function configurados(): ProveedorIA[] {
  return ordenar(CADENA.filter(p => Boolean(process.env[p.variable])), process.env.IA_ORDEN);
}

/** Quién tiene llave y con qué modelo (nunca la llave). */
export function estadoProveedores() {
  const activos = configurados().map(p => p.proveedor);
  return CADENA.map(p => ({
    proveedor: p.proveedor, nombre: p.nombre, modelo: p.modelo, variable: p.variable,
    configurado: Boolean(process.env[p.variable]), posicion: activos.indexOf(p.proveedor) + 1,
  }));
}

// Modelos rápidos para tareas cortas de apoyo (reescribir la consulta antes de buscar): Groq gpt-oss-20b y, de
// respaldo, Claude Haiku. Se cambian con IA_MODELO_RAPIDO_GROQ / IA_MODELO_RAPIDO_ANTHROPIC.
const rapido = {
  groq: process.env.IA_MODELO_RAPIDO_GROQ || 'openai/gpt-oss-20b',
  anthropic: process.env.IA_MODELO_RAPIDO_ANTHROPIC || 'claude-haiku-5-5',
};

export const CADENA_RAPIDA: ProveedorIA[] = [
  {
    proveedor: 'groq', nombre: 'Groq', variable: 'GROQ_API_KEY', modelo: rapido.groq,
    crear: () => groq(rapido.groq), opciones: { groq: { reasoningEffort: 'low' } }, tokensSalida: 1200,
  },
  { proveedor: 'anthropic', nombre: 'Anthropic', variable: 'ANTHROPIC_API_KEY', modelo: rapido.anthropic, crear: () => anthropic(rapido.anthropic) },
];

export function rapidosConfigurados(): ProveedorIA[] {
  return ordenar(CADENA_RAPIDA.filter(p => Boolean(process.env[p.variable])), process.env.IA_ORDEN);
}
