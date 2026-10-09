import { z } from 'zod';
import { conmutar } from '@/lib/ia/cadena';
import { MAX_CARACTERES } from '@/lib/ia/mensajes';
import { peticionPersonaje, peticionRetroalimentacion } from '@/lib/ia/practica';
import { configurados } from '@/lib/ia/proveedores';
import { materialParaPrompt } from '@/lib/rag/material';
import { sesion } from '@/lib/sesion';
import { clienteAdmin } from '@/lib/supabase/admin';

// Simulador de situaciones prácticas (docs/adr/0011): el personaje responde en streaming; con `evaluar`, el
// instructor da retroalimentación citando las secciones del escenario (X-Secciones = las citas válidas).
// Al terminar la retroalimentación, el servidor guarda la práctica (conversación + retroalimentación) para que RH la
// revise (ADR 0014). La guarda aquí y no el navegador para que nadie pueda inventarse la retroalimentación de la IA.

export const maxDuration = 60;

const Cuerpo = z.object({
  empresa: z.string().regex(/^[a-z0-9-]{3,40}$/),
  escenario: z.string().uuid(),
  evaluar: z.boolean().default(false),
  mensajes: z.array(z.object({ rol: z.enum(['usuario', 'avatar']), texto: z.string().trim().min(1).max(MAX_CARACTERES) })).max(40),
});

const error = (mensaje: string, status: number) => Response.json({ error: mensaje }, { status });
const CODIGO = /^D(\d+)-(\d+)$/;

export async function POST(request: Request) {
  const s = await sesion();
  if (!s) return error('Tu sesión terminó. Vuelve a entrar.', 401);
  const datos = Cuerpo.safeParse(await request.json().catch(() => null));
  if (!datos.success) return error('Mensaje inválido.', 400);
  if (datos.data.evaluar && !datos.data.mensajes.some(m => m.rol === 'usuario')) return error('Primero responde en la práctica.', 400);
  const { supabase, usuario } = s;
  const { data: empresa } = await supabase.from('empresas').select('id, nombre').eq('slug', datos.data.empresa).maybeSingle();
  if (!empresa) return error('No encontré esa empresa.', 404);
  // RLS: solo escenarios de módulos que puede ver.
  const { data: esc } = await supabase
    .from('escenarios').select('modulo_id, situacion, personaje, objetivo, secciones').eq('id', datos.data.escenario).eq('empresa_id', empresa.id).maybeSingle();
  if (!esc) return error('No encontré esa práctica.', 404);

  let material = '';
  if (datos.data.evaluar) {
    const pares = esc.secciones.map(c => CODIGO.exec(c)).filter((m): m is RegExpExecArray => Boolean(m));
    const { data: filas } = await supabase
      .from('secciones').select('orden, titulo, texto, pagina, referencia, documentos!inner(numero, titulo, fuente)')
      .eq('empresa_id', empresa.id).in('documentos.numero', [...new Set(pares.map(m => Number(m[1])))]);
    const quiero = new Set(esc.secciones);
    material = materialParaPrompt((filas ?? []).filter(f => quiero.has(`D${f.documentos.numero}-${f.orden}`)).map(f => ({
      codigo: `D${f.documentos.numero}-${f.orden}`, documento: f.documentos.titulo, fuente: f.documentos.fuente,
      titulo: f.titulo, texto: f.texto, pagina: f.pagina, referencia: f.referencia, puntaje: 0, vias: '',
    })));
  }
  const escena = { empresa: empresa.nombre, personaje: esc.personaje, situacion: esc.situacion, objetivo: esc.objetivo, material };
  const r = await conmutar(
    configurados(),
    datos.data.evaluar ? peticionRetroalimentacion(escena, datos.data.mensajes) : peticionPersonaje(escena, datos.data.mensajes),
  );
  if (!r.ok) return error('No pude responder en este momento. Intenta de nuevo en un minuto.', 502);

  const codificador = new TextEncoder();
  const flujo = new ReadableStream<Uint8Array>({
    async start(c) {
      c.enqueue(codificador.encode(r.primero));
      let texto = r.primero;
      let completo = false;
      try {
        for (;;) {
          const paso = await r.resto.next();
          if (paso.done) break;
          texto += paso.value;
          c.enqueue(codificador.encode(paso.value));
        }
        completo = true;
      } catch (err) {
        console.error('[practica] se cortó el flujo:', err);
      }
      // Se guarda ANTES de cerrar el flujo: cuando el navegador ve el final, la práctica ya cuenta para su progreso.
      // La RLS ya validó arriba que el escenario es de un módulo que esta persona puede ver.
      if (datos.data.evaluar && completo && texto.trim()) {
        const { error: e } = await clienteAdmin().from('practicas').insert({
          empresa_id: empresa.id, usuario_id: usuario.id, modulo_id: esc.modulo_id, escenario_id: datos.data.escenario,
          transcripcion: datos.data.mensajes, retroalimentacion: texto.slice(0, 6000),
        });
        if (e) console.error('[practica] no se guardó la práctica:', e.message);
      }
      c.close();
    },
  });
  return new Response(flujo, {
    headers: {
      'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store',
      'x-proveedor': r.eslabon.proveedor, 'x-secciones': esc.secciones.join(','),
    },
  });
}
