import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generarConRespaldo, jsonDe } from '../ia/cadena.ts';
import { configurados } from '../ia/proveedores.ts';
import type { Database } from '../supabase/tipos.ts';
import { lotes, leerContextos, peticionContexto } from './contexto.ts';
import type { SeccionCruda } from './seccionar.ts';

// Guarda las secciones de un documento y les agrega contexto con IA (docs/adr/0010). Lo usan la app (con la
// sesión de admin/RH: la RLS valida) y el script de demos (con la llave secreta, solo en local).

type Supa = SupabaseClient<Database>;

export type ResultadoIngesta = { secciones: number; conContexto: number; avisos: string[] };

export async function guardarSecciones(
  supabase: Supa,
  { documentoId, empresaId, empresa, documento, secciones }: {
    documentoId: string; empresaId: string; empresa: string; documento: string; secciones: SeccionCruda[];
  },
): Promise<ResultadoIngesta> {
  const avisos: string[] = [];
  // Reemplazo completo: reprocesar un documento no deja secciones viejas.
  const { error: e1 } = await supabase.from('secciones').delete().eq('documento_id', documentoId);
  if (e1) throw new Error(`No se pudieron limpiar las secciones: ${e1.message}`);
  const filas = secciones.map((s, i) => ({
    documento_id: documentoId, orden: i + 1, titulo: s.titulo.slice(0, 200), texto: s.texto, pagina: s.pagina ?? null,
    referencia: s.referencia?.slice(0, 300) ?? null,
    // El trigger secciones_empresa lo vuelve a poner desde el documento: no se puede colar en otra empresa.
    empresa_id: empresaId,
  }));
  const { error: e2 } = await supabase.from('secciones').insert(filas);
  if (e2) throw new Error(`No se pudieron guardar las secciones: ${e2.message}`);

  let conContexto = 0;
  if (configurados().length === 0) {
    avisos.push('Sin llaves de IA: se guardó sin contexto (la búsqueda funciona, pero entiende menos sinónimos).');
    return { secciones: filas.length, conContexto, avisos };
  }
  const ordenes = filas.map(f => f.orden);
  // Lotes chicos: con 25 secciones la respuesta de gpt-oss (tope de 4000 tokens) se cortaba y el JSON no servía.
  // Tres lotes a la vez para que un manual de 100 secciones tarde menos de un minuto.
  const pendientes = lotes(filas.map(f => ({ orden: f.orden, titulo: f.referencia ?? f.titulo, texto: f.texto })), 10);
  let fallidos = 0;
  const trabajar = async () => {
    for (let lote = pendientes.shift(); lote; lote = pendientes.shift()) {
      const r = await generarConRespaldo(configurados(), peticionContexto(empresa, documento, lote), { plazo: 90_000 });
      const contextos = r.ok ? leerContextos(jsonDe(r.texto), ordenes) : new Map<number, string>();
      if (contextos.size < lote.length) fallidos += lote.length - contextos.size;
      for (const [orden, contexto] of contextos) {
        const { error } = await supabase.from('secciones').update({ contexto }).eq('documento_id', documentoId).eq('orden', orden);
        if (!error) conContexto++;
      }
    }
  };
  await Promise.all([trabajar(), trabajar(), trabajar()]);
  if (fallidos) avisos.push(`${fallidos} secciones quedaron sin contexto (la IA no respondió bien); se pueden reprocesar.`);
  return { secciones: filas.length, conContexto, avisos };
}
