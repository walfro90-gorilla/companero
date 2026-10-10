import { z } from 'zod';
import { analizar } from '@/lib/conocimiento/citas';
import { generarConRespaldo } from '@/lib/ia/cadena';
import { rapidosConfigurados } from '@/lib/ia/proveedores';
import { sesion } from '@/lib/sesion';
import { MAX_TEXTO_VOZ, limpiarResumen, peticionResumen, resumenDeRespaldo } from '@/lib/voz/hablar';
import { sintesisDisponible, sintetizar } from '@/lib/voz/sintetizar';

// La voz del asistente (docs/adr/0016): recibe la respuesta escrita, un modelo rápido la convierte en un resumen
// hablado de 2 o 3 frases (sin agregar nada) y Azure Speech lo dice con una voz neural de México. Devuelve el MP3 y
// el resumen en X-Resumen (subtítulo). Sin llave de Azure responde 503 con el resumen, y el navegador lo dice con su
// voz de respaldo. Exige sesión y ser miembro de la empresa, igual que /api/transcribir.

export const maxDuration = 30;

const Cuerpo = z.object({
  empresa: z.string().regex(/^[a-z0-9-]{3,40}$/),
  texto: z.string().trim().min(1).max(MAX_TEXTO_VOZ),
});

const error = (mensaje: string, status: number, extra: object = {}) => Response.json({ error: mensaje, ...extra }, { status });

export async function POST(request: Request) {
  const s = await sesion();
  if (!s) return error('Tu sesión terminó. Vuelve a entrar.', 401);
  const datos = Cuerpo.safeParse(await request.json().catch(() => null));
  if (!datos.success) return error('Texto inválido.', 400);
  // Solo miembros: la RLS no deja ver una empresa ajena.
  const { data: empresa } = await s.supabase.from('empresas').select('id').eq('slug', datos.data.empresa).maybeSingle();
  if (!empresa) return error('No encontré esa empresa.', 404);

  const { texto } = datos.data;
  const { canalizar } = analizar(texto, () => true);
  const rapidos = rapidosConfigurados();
  const r = rapidos.length ? await generarConRespaldo(rapidos, peticionResumen(texto, canalizar), { plazo: 6_000, registrar: () => {} }) : null;
  const resumen = (r?.ok && limpiarResumen(r.texto)) || resumenDeRespaldo(texto, canalizar);

  if (!sintesisDisponible()) return error('La voz natural no está configurada.', 503, { resumen });
  const audio = await sintetizar(resumen).catch(() => null);
  if (!audio) return error('No se pudo generar la voz.', 502, { resumen });
  return new Response(audio, {
    headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store', 'x-resumen': encodeURIComponent(resumen) },
  });
}
