import 'server-only';
import { ssml, type Quien } from './hablar.ts';
import { aceptaIdioma, elegirProveedor, type Proveedor } from './proveedor.ts';

// Texto a voz (docs/adr/0016): ElevenLabs (voz principal, decisión de Wal) o Azure Speech (segunda opción). Solo se
// manda el RESUMEN hablado o una línea corta, nunca datos personales. Ni el texto ni las llaves se registran: solo el
// código de error.

const REGION = /^[a-z0-9]{2,30}$/;

/** Quién diría la frase ahora (para la llave del caché); null si nadie: la dice el navegador. */
export const vozPara = (quien: Quien) => elegirProveedor(process.env, quien);

export type Sintesis = { audio: ArrayBuffer; proveedor: Proveedor } | { error: 'sin_voz' | 'fallo' };

export async function sintetizar(texto: string, quien: Quien = 'asistente'): Promise<Sintesis> {
  const p = vozPara(quien);
  if (!p) return { error: 'sin_voz' };
  try {
    const audio = p.proveedor === 'elevenlabs' ? await conElevenLabs(texto, p.voz, p.modelo) : await conAzure(texto, p.voz);
    return audio ? { audio, proveedor: p.proveedor } : { error: 'fallo' };
  } catch (e) {
    console.error(`[voz] ${p.proveedor} no respondió:`, e instanceof Error ? e.name : 'error');
    return { error: 'fallo' };
  }
}

/** POST /v1/text-to-speech/{voice_id} (doc oficial de ElevenLabs, revisada el 9-oct). */
async function conElevenLabs(texto: string, voz: string, modelo: string): Promise<ArrayBuffer | null> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: texto,
      model_id: modelo,
      ...(aceptaIdioma(modelo) ? { language_code: 'es' } : {}),
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    // 401 llave, 402/quota_exceeded créditos, 429 límite: el navegador dice el resumen con su voz.
    const j = (await res.json().catch(() => null)) as { detail?: { status?: unknown } } | null;
    const estado = typeof j?.detail?.status === 'string' ? j.detail.status.slice(0, 40) : '';
    console.error('[voz] ElevenLabs respondió', res.status, estado);
    return null;
  }
  return res.arrayBuffer();
}

async function conAzure(texto: string, voz: string): Promise<ArrayBuffer | null> {
  const region = process.env.AZURE_SPEECH_REGION || 'eastus';
  if (!REGION.test(region)) return null;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'companero',
    },
    body: ssml(texto, voz),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    console.error('[voz] Azure Speech respondió', res.status);
    return null;
  }
  return res.arrayBuffer();
}
