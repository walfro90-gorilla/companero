import 'server-only';
import { transcribe } from 'ai';
import { groq, type GroqTranscriptionModelOptions } from '@ai-sdk/groq';
import { textoUtil } from './formato.ts';

// Voz a texto con Whisper en Groq (docs/adr/0005). El audio no se guarda: se transcribe y se descarta; lo que
// sigue (la pregunta) es texto, igual que si se hubiera escrito.

const MODELO = process.env.IA_MODELO_VOZ || 'whisper-large-v3-turbo';

export const vozDisponible = () => Boolean(process.env.GROQ_API_KEY);

export async function transcribirAudio(audio: Uint8Array): Promise<string | null> {
  const r = await transcribe({
    model: groq.transcription(MODELO),
    audio,
    providerOptions: {
      // Sin `prompt`: con audio sin voz, Whisper repetía la propia pista ("…a su asistente de capacitación…")
      // y se habría mandado como pregunta (prueba del 9-oct).
      groq: { language: 'es' } satisfies GroqTranscriptionModelOptions,
    },
    abortSignal: AbortSignal.timeout(20_000),
  });
  return textoUtil(r.text);
}
