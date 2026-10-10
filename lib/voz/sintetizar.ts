import 'server-only';
import { VOZ_POR_OMISION, ssml } from './hablar.ts';

// Texto a voz con Azure Speech (docs/adr/0016; Microsoft patrocina el evento; plan F0 gratis). Solo se manda el
// RESUMEN hablado de una respuesta, nunca datos personales. Ni el texto ni la llave se registran.

const REGION = /^[a-z0-9]{2,30}$/;
const VOZ = /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/;

export const sintesisDisponible = () => Boolean(process.env.AZURE_SPEECH_KEY);

/** MP3 con la voz neural (AZURE_VOZ cambia la voz sin tocar código). null si Azure no respondió bien. */
export async function sintetizar(texto: string): Promise<ArrayBuffer | null> {
  const llave = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'eastus';
  const voz = process.env.AZURE_VOZ && VOZ.test(process.env.AZURE_VOZ) ? process.env.AZURE_VOZ : VOZ_POR_OMISION;
  if (!llave || !REGION.test(region)) return null;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': llave,
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
