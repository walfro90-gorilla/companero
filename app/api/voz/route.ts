import { z } from 'zod';
import { analizar } from '@/lib/conocimiento/citas';
import { generarConRespaldo } from '@/lib/ia/cadena';
import { rapidosConfigurados } from '@/lib/ia/proveedores';
import { sesion } from '@/lib/sesion';
import { MAX_LITERAL, MAX_TEXTO_VOZ, completarResumen, limpiarResumen, peticionResumen, resumenDeRespaldo, textoLiteral } from '@/lib/voz/hablar';
import { sintesisDisponible, sintetizar } from '@/lib/voz/sintetizar';

// La voz (docs/adr/0016). Modo `resumen` (la asistente): un modelo rápido convierte la respuesta escrita en 2 o 3
// frases (sin agregar nada) y Azure Speech las dice con una voz neural de México. Modo `literal` (el cliente simulado
// de la práctica, frases fijas del coach): se dice tal cual, hasta 600 caracteres. `quien` decide la voz en el
// servidor. Devuelve el MP3 y lo dicho en X-Resumen. Sin llave de Azure responde 503 con lo que se iba a decir, y el
// navegador lo dice con su voz de respaldo. Exige sesión y ser miembro de la empresa, igual que /api/transcribir.

export const maxDuration = 30;

const Cuerpo = z.object({
  empresa: z.string().regex(/^[a-z0-9-]{3,40}$/),
  texto: z.string().trim().min(1).max(MAX_TEXTO_VOZ),
  modo: z.enum(['resumen', 'literal']).default('resumen'),
  quien: z.enum(['asistente', 'cliente', 'clienta']).default('asistente'),
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

  const { texto, modo, quien } = datos.data;
  if (modo === 'literal' && texto.length > MAX_LITERAL) return error('Texto inválido.', 400);
  let resumen: string;
  if (modo === 'literal') {
    resumen = textoLiteral(texto);
  } else {
    const { canalizar } = analizar(texto, () => true);
    const rapidos = rapidosConfigurados();
    const r = rapidos.length ? await generarConRespaldo(rapidos, peticionResumen(texto, canalizar), { plazo: 6_000, registrar: () => {} }) : null;
    resumen = r?.ok && limpiarResumen(r.texto) ? completarResumen(limpiarResumen(r.texto), texto, canalizar) : resumenDeRespaldo(texto, canalizar);
  }
  if (!resumen) return error('Texto inválido.', 400);

  if (!sintesisDisponible()) return error('La voz natural no está configurada.', 503, { resumen });
  const audio = await sintetizar(resumen, quien).catch(() => null);
  if (!audio) return error('No se pudo generar la voz.', 502, { resumen });
  return new Response(audio, {
    headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store', 'x-resumen': encodeURIComponent(resumen) },
  });
}
