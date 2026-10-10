import { createHash } from 'node:crypto';
import { VOCES, type Quien } from './hablar.ts';

// Proveedores de voz (docs/adr/0016). ElevenLabs es la voz principal (decisión de Wal); Azure Speech queda como
// segunda opción; sin ninguno, el navegador dice el resumen con su voz de respaldo (en Edge: «Microsoft Dalia Online
// (Natural)»). Lógica pura (con pruebas): qué proveedor y qué voz usar, y la llave del caché que evita gastar créditos
// dos veces en lo mismo (10 jueces que oyen la misma lección = una sola síntesis).

type Env = Record<string, string | undefined>;
export type Proveedor = 'elevenlabs' | 'azure';

export const MODELO_ELEVENLABS = 'eleven_flash_v2_5';
const VARIABLE_ELEVENLABS: Record<Quien, string> = {
  asistente: 'ELEVENLABS_VOZ', cliente: 'ELEVENLABS_VOZ_CLIENTE', clienta: 'ELEVENLABS_VOZ_CLIENTA',
};
const VOICE_ID = /^[A-Za-z0-9]{10,40}$/;
const VOZ_AZURE = /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/;

/** El voice_id de ElevenLabs de quien habla; null si falta o no tiene forma de voice_id. */
export function vozElevenLabs(env: Env, quien: Quien): string | null {
  const v = env[VARIABLE_ELEVENLABS[quien]]?.trim();
  return v && VOICE_ID.test(v) ? v : null;
}

/** El modelo de ElevenLabs (flash, el rápido y barato, por omisión). */
export function modeloElevenLabs(env: Env): string {
  const m = env.ELEVENLABS_MODELO?.trim();
  return m && /^eleven_[a-z0-9_]+$/.test(m) ? m : MODELO_ELEVENLABS;
}

/** language_code solo lo aceptan Flash/Turbo v2.5 (la doc oficial: no se admite en multilingual_v2). */
export const aceptaIdioma = (modelo: string) => /^eleven_(flash|turbo)_v2_5$/.test(modelo);

export function vozAzure(env: Env, quien: Quien): string {
  const v = env[VOCES[quien].variable];
  return v && VOZ_AZURE.test(v) ? v : VOCES[quien].omision;
}

/**
 * Quién dice la frase: ElevenLabs si hay llave y voz para ese personaje; si no, Azure si hay llave; si no, nadie (el
 * navegador). Así, si falta la voz del cliente en ElevenLabs, el cliente no suena igual que la asistente.
 */
export function elegirProveedor(env: Env, quien: Quien): { proveedor: Proveedor; voz: string; modelo: string } | null {
  if (env.ELEVENLABS_API_KEY) {
    const voz = vozElevenLabs(env, quien);
    if (voz) return { proveedor: 'elevenlabs', voz, modelo: modeloElevenLabs(env) };
  }
  if (env.AZURE_SPEECH_KEY) return { proveedor: 'azure', voz: vozAzure(env, quien), modelo: 'azure' };
  return null;
}

/** Llave del caché: el mismo texto con la misma voz, modelo y modo se sintetiza una sola vez. */
export function llaveCache(partes: readonly string[]): string {
  return createHash('sha256').update(partes.join('\u0000')).digest('hex');
}

/** Caché en memoria del proceso, con los más recientes (LRU). */
export class Lru<V> {
  private readonly max: number;
  private readonly m = new Map<string, V>();
  constructor(max: number) {
    this.max = max;
  }
  get(k: string): V | undefined {
    const v = this.m.get(k);
    if (v !== undefined) {
      this.m.delete(k);
      this.m.set(k, v);
    }
    return v;
  }
  set(k: string, v: V) {
    this.m.delete(k);
    this.m.set(k, v);
    while (this.m.size > this.max) this.m.delete(this.m.keys().next().value!);
  }
  get size() {
    return this.m.size;
  }
}
