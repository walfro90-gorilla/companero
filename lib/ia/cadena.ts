// La conmutación entre proveedores (portado de brotes/lib/ia/cadena.ts; docs/adr/0003).
//
// streamText NO es async y NO lanza: los errores salen por el flujo o por onError. Un try/catch alrededor
// no se dispara nunca y la cadena de respaldo sería decorativa (una llave muerta = respuesta vacía con 200
// para siempre). Por eso se tira del PRIMER fragmento aquí: hasta que llega, no se le ha mandado nada al
// navegador y se puede cambiar de proveedor sin que se note. Después ya no.

import { generateText, streamText, type LanguageModel, type ModelMessage, type SystemModelMessage } from 'ai';
import { clasificar, comoRegistrar, type Diagnostico } from './fallos.ts';

export type Eslabon = {
  proveedor: string;
  /** Id del modelo, para registrar quién respondió. */
  modelo: string;
  crear: () => LanguageModel;
  /** providerOptions del AI SDK (p. ej. el esfuerzo de razonamiento de gpt-oss). */
  opciones?: Record<string, Record<string, string | number | boolean>>;
  /** Tope de tokens propio: los modelos que razonan gastan tokens antes de escribir. */
  tokensSalida?: number;
};

export type Intento = { proveedor: string; clase: Diagnostico | 'vacio' };

/** `instructions` puede ir en varias piezas: así el corpus lleva su propio punto de caché (ADR 0003). */
export type Peticion = { instructions: string | SystemModelMessage[]; messages: ModelMessage[]; maxOutputTokens: number; temperature?: number };

export type Uso = { inputTokens?: number; outputTokens?: number };

export type Conmutacion =
  | {
      ok: true;
      eslabon: Eslabon;
      /** Primer fragmento de texto (ya leído). */
      primero: string;
      /** El resto del texto. */
      resto: AsyncIterator<string>;
      uso: PromiseLike<Uso>;
      /** Los que fallaron antes: si hay alguno, respondió el respaldo. */
      intentos: Intento[];
      cancelar: () => void;
    }
  | { ok: false; intentos: Intento[] };

/** Ordena la cadena según `IA_ORDEN` ("groq,anthropic"); los no mencionados van al final en su orden. */
export function ordenar<T extends { proveedor: string }>(cadena: readonly T[], orden?: string | null): T[] {
  const pedidos = (orden ?? '').split(',').map(x => x.trim()).filter(Boolean);
  const peso = (p: T) => {
    const i = pedidos.indexOf(p.proveedor);
    return i < 0 ? pedidos.length + cadena.indexOf(p) : i;
  };
  return [...cadena].sort((a, b) => peso(a) - peso(b));
}

export async function conmutar(
  eslabones: readonly Eslabon[],
  peticion: Peticion,
  { plazoPrimero = 20_000, registrar = console.error }: { plazoPrimero?: number; registrar?: (...x: unknown[]) => void } = {},
): Promise<Conmutacion> {
  const intentos: Intento[] = [];
  for (const e of eslabones) {
    const control = new AbortController();
    const corta = setTimeout(() => control.abort(), plazoPrimero);
    let fallo: unknown = null;
    try {
      const r = streamText({
        model: e.crear(),
        instructions: peticion.instructions,
        messages: peticion.messages,
        maxOutputTokens: e.tokensSalida ?? peticion.maxOutputTokens,
        temperature: peticion.temperature,
        providerOptions: e.opciones,
        abortSignal: control.signal,
        onError: ({ error }) => {
          fallo = error;
        },
      });
      const it = r.textStream[Symbol.asyncIterator]();
      let primero: IteratorResult<string>;
      try {
        primero = await it.next();
      } catch (error) {
        fallo = error;
        primero = { done: true, value: undefined };
      }
      clearTimeout(corta);
      // Vacío sin error también es fallo: para Wal, una respuesta vacía y una caída son lo mismo.
      if (fallo || primero.done || !primero.value?.trim()) {
        const clase: Intento['clase'] = fallo ? clasificar(fallo) : 'vacio';
        intentos.push({ proveedor: e.proveedor, clase });
        registrar(`[avatar] ${e.proveedor}: ${comoRegistrar(clase)}`, fallo ?? '');
        control.abort();
        continue;
      }
      return {
        ok: true, eslabon: e, primero: primero.value, resto: it, intentos, cancelar: () => control.abort(),
        uso: Promise.resolve(r.usage).then(u => ({ inputTokens: u.inputTokens, outputTokens: u.outputTokens })),
      };
    } catch (error) {
      clearTimeout(corta);
      const clase = clasificar(error);
      intentos.push({ proveedor: e.proveedor, clase });
      registrar(`[avatar] ${e.proveedor}: ${comoRegistrar(clase)}`, error);
    }
  }
  registrar('[avatar] ningún proveedor contestó');
  return { ok: false, intentos };
}

export type Generado = { ok: true; eslabon: Eslabon; texto: string; intentos: Intento[] } | { ok: false; intentos: Intento[] };

/**
 * Lo mismo sin streaming (consejo del día, aprender hechos): el primero que devuelva texto no vacío.
 * Para tareas de fondo: un fallo se registra y no se le muestra a nadie.
 */
export async function generarConRespaldo(
  eslabones: readonly Eslabon[],
  peticion: Peticion,
  { plazo = 25_000, registrar = console.error }: { plazo?: number; registrar?: (...x: unknown[]) => void } = {},
): Promise<Generado> {
  const intentos: Intento[] = [];
  for (const e of eslabones) {
    try {
      const r = await generateText({
        model: e.crear(),
        instructions: peticion.instructions,
        messages: peticion.messages,
        maxOutputTokens: e.tokensSalida ?? peticion.maxOutputTokens,
        temperature: peticion.temperature,
        providerOptions: e.opciones,
        abortSignal: AbortSignal.timeout(plazo),
      });
      if (r.text.trim()) return { ok: true, eslabon: e, texto: r.text.trim(), intentos };
      intentos.push({ proveedor: e.proveedor, clase: 'vacio' });
      registrar(`[avatar] ${e.proveedor}: ${comoRegistrar('vacio')}`);
    } catch (error) {
      const clase = clasificar(error);
      intentos.push({ proveedor: e.proveedor, clase });
      registrar(`[avatar] ${e.proveedor}: ${comoRegistrar(clase)}`, error);
    }
  }
  return { ok: false, intentos };
}

/** Extrae el primer objeto JSON de un texto (los modelos a veces lo envuelven en ```json). */
export function jsonDe(texto: string): unknown {
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio < 0 || fin <= inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fin + 1));
  } catch {
    return null;
  }
}
