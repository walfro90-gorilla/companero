import { z } from 'zod';
import { canalizacionFaltante, responder } from '@/lib/ia/asistente';
import { MAX_CARACTERES, MAX_CARACTERES_HISTORIAL, MAX_MENSAJES_HISTORIAL } from '@/lib/ia/mensajes';
import { analizar } from '@/lib/conocimiento/citas';
import type { Consultada } from '@/lib/rag/material';
import { avatarDe } from '@/lib/avatar';
import { sesion } from '@/lib/sesion';

// Chat del asistente (docs/adr/0003, 0004 y 0010). Busca en el material de la empresa, responde texto plano
// en streaming con marcas [D1-3] y [CANALIZAR:…], y al terminar registra la consulta (y la canalización, si
// la hubo) con la sesión de quien pregunta: la RLS impide escribir en otra empresa.
// Cabeceras: X-Proveedor, X-Respaldo y X-Consultadas (las secciones que trajo el buscador).

export const maxDuration = 60;

const PLAZO_TOTAL = 55_000;

const Cuerpo = z.object({
  empresa: z.string().regex(/^[a-z0-9-]{3,40}$/),
  mensajes: z
    .array(z.object({ rol: z.enum(['usuario', 'avatar']), texto: z.string().trim().min(1).max(MAX_CARACTERES_HISTORIAL) }))
    .min(1)
    .max(MAX_MENSAJES_HISTORIAL),
});

const error = (mensaje: string, status: number) => Response.json({ error: mensaje }, { status });

export async function POST(request: Request) {
  const s = await sesion();
  if (!s) return error('Tu sesión terminó. Vuelve a entrar.', 401);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error('Cuerpo inválido.', 400);
  }
  const datos = Cuerpo.safeParse(cuerpo);
  if (!datos.success) return error('Mensaje inválido.', 400);
  const { mensajes } = datos.data;
  const pregunta = mensajes.at(-1);
  if (pregunta?.rol !== 'usuario') return error('El último mensaje debe ser del usuario.', 400);
  // Estricto solo con lo que la persona escribe ahora; el historial ya pasó (ver lib/ia/mensajes.ts).
  if (pregunta.texto.length > MAX_CARACTERES) return error(`Tu pregunta es muy larga: máximo ${MAX_CARACTERES} caracteres.`, 400);

  const { supabase, usuario } = s;
  const { data: empresa } = await supabase.from('empresas').select('id, nombre, giro, avatar').eq('slug', datos.data.empresa).maybeSingle();
  if (!empresa) return error('No encontré esa empresa.', 404);
  const { data: miembro } = await supabase
    .from('miembros').select('sucursal_id, puestos(nombre)').eq('empresa_id', empresa.id).eq('usuario_id', usuario.id).maybeSingle();
  if (!miembro) return error('No perteneces a esta empresa.', 403);

  const avatar = avatarDe(empresa.avatar);
  const { conmutacion: r, recuperadas } = await responder({
    supabase, empresaId: empresa.id, mensajes,
    persona: { asistente: avatar.nombre, empresa: empresa.nombre, giro: empresa.giro, puesto: miembro.puestos?.nombre ?? null },
  });
  if (!r.ok) return error('No pude responder en este momento. Intenta de nuevo en un minuto.', 502);

  const codigos = new Set(recuperadas.map(x => x.codigo));
  const consultadas: Consultada[] = recuperadas.map(({ codigo, documento, titulo, pagina, referencia, vias }) => ({ codigo, documento, titulo, pagina, referencia, vias }));

  async function registrar(texto: string) {
    const a = analizar(texto, id => codigos.has(id));
    if (a.invalidas.length) console.warn('[asistente] citas a secciones que no trajo el buscador:', a.invalidas);
    const { data: consulta, error: e1 } = await supabase
      .from('consultas')
      .insert({
        empresa_id: empresa!.id, sucursal_id: miembro!.sucursal_id, usuario_id: usuario.id,
        pregunta: pregunta!.texto, respuesta: texto.slice(0, 8000), consultadas: [...codigos],
        citas: a.citas, invalidas: a.invalidas, canalizada: a.canalizar, proveedor: r.ok ? r.eslabon.proveedor : null,
      })
      .select('id')
      .single();
    if (e1) console.error('[asistente] no se registró la consulta:', e1.message);
    if (a.canalizar) {
      const { error: e2 } = await supabase.from('canalizaciones').insert({
        empresa_id: empresa!.id, sucursal_id: miembro!.sucursal_id, usuario_id: usuario.id,
        consulta_id: consulta?.id ?? null, destino: a.canalizar, pregunta: pregunta!.texto,
      });
      if (e2) console.error('[asistente] no se registró la canalización:', e2.message);
    }
  }

  const codificador = new TextEncoder();
  const corta = setTimeout(() => r.cancelar(), PLAZO_TOTAL);
  let completo = r.primero;
  const flujo = new ReadableStream<Uint8Array>({
    async start(controlador) {
      controlador.enqueue(codificador.encode(r.primero));
      try {
        for (;;) {
          const paso = await r.resto.next();
          if (paso.done) break;
          completo += paso.value;
          controlador.enqueue(codificador.encode(paso.value));
        }
      } catch (err) {
        // Ya hay texto en pantalla: se corta y se queda lo que llegó.
        console.error('[asistente] se cortó el flujo a mitad:', err);
      } finally {
        clearTimeout(corta);
        // Red de seguridad: si mandó al supervisor sin marca y la persona está atendiendo algo ahora, se canaliza.
        const marca = await canalizacionFaltante(pregunta!.texto, completo).catch(() => '');
        if (marca) {
          completo += marca;
          controlador.enqueue(codificador.encode(marca));
        }
        // Se registra antes de cerrar: en serverless, después de cerrar la función puede congelarse.
        await registrar(completo).catch(e => console.error('[asistente] registro:', e));
        controlador.close();
      }
    },
  });

  return new Response(flujo, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-proveedor': r.eslabon.proveedor,
      'x-modelo': r.eslabon.modelo,
      'x-respaldo': r.intentos.length > 0 ? '1' : '0',
      'x-consultadas': encodeURIComponent(JSON.stringify(consultadas)),
    },
  });
}
