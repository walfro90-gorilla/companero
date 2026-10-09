import { MAX_BYTES } from '@/lib/voz/formato';
import { transcribirAudio, vozDisponible } from '@/lib/voz/transcribir';
import { sesion } from '@/lib/sesion';

// Pulsar para hablar (docs/adr/0005): recibe el audio de una pregunta y devuelve el texto. Exige sesión y ser
// miembro de la empresa; no guarda el audio.

export const maxDuration = 30;

const error = (mensaje: string, status: number) => Response.json({ error: mensaje }, { status });

export async function POST(request: Request) {
  const s = await sesion();
  if (!s) return error('Tu sesión terminó. Vuelve a entrar.', 401);
  if (!vozDisponible()) return error('La voz no está disponible en este momento. Escribe tu pregunta.', 503);

  let datos: FormData;
  try {
    datos = await request.formData();
  } catch {
    return error('Audio inválido.', 400);
  }
  const audio = datos.get('audio');
  const slug = String(datos.get('empresa') ?? '');
  if (!(audio instanceof Blob) || audio.size === 0) return error('No llegó audio.', 400);
  if (audio.size > MAX_BYTES) return error('El audio es muy largo. Haz preguntas cortas.', 413);

  // Solo miembros: la RLS no deja ver una empresa ajena.
  const { data: empresa } = await s.supabase.from('empresas').select('id').eq('slug', slug).maybeSingle();
  if (!empresa) return error('No encontré esa empresa.', 404);

  try {
    const texto = await transcribirAudio(new Uint8Array(await audio.arrayBuffer()));
    if (!texto) return error('No te escuché bien. Mantén presionado el micrófono mientras hablas.', 422);
    return Response.json({ texto });
  } catch (e) {
    console.error('[voz] no se pudo transcribir:', e);
    return error('No pude entender el audio. Intenta de nuevo o escribe tu pregunta.', 502);
  }
}
