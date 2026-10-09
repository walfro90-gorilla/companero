import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/tipos.ts';
import { consultaDeBusqueda, materialParaPrompt, type Recuperada } from '../rag/material.ts';
import { conmutar } from './cadena.ts';
import { instrucciones, type Persona } from './instrucciones.ts';
import { aMensajesModelo, type Mensaje } from './mensajes.ts';
import { configurados } from './proveedores.ts';

// El cerebro del asistente (RAG, docs/adr/0010): buscar en el material de la empresa → responder citando.
// Lo usan la ruta del chat y la prueba documentada, para que la prueba ejercite lo mismo que ve el empleado.

// El thinking adaptativo de Claude cuenta contra este tope: holgado para que no se coma la respuesta.
const MAX_TOKENS = 4000;
export const SECCIONES_POR_CONSULTA = 8;

export async function buscar(supabase: SupabaseClient<Database>, empresaId: string, consulta: string): Promise<Recuperada[]> {
  const { data, error } = await supabase.rpc('buscar_secciones', {
    p_empresa: empresaId, p_consulta: consulta.slice(0, 1000), p_limite: SECCIONES_POR_CONSULTA,
  });
  if (error) {
    console.error('[asistente] falló la búsqueda:', error.message);
    return [];
  }
  return data ?? [];
}

export async function responder(
  { supabase, empresaId, persona, mensajes }: { supabase: SupabaseClient<Database>; empresaId: string; persona: Persona; mensajes: Mensaje[] },
  opciones?: Parameters<typeof conmutar>[2],
) {
  const recuperadas = await buscar(supabase, empresaId, consultaDeBusqueda(mensajes));
  const conmutacion = await conmutar(
    configurados(),
    // Sin temperature: claude-opus-5-5 rechaza los parámetros de muestreo con un 400.
    { instructions: instrucciones(persona, materialParaPrompt(recuperadas)), messages: aMensajesModelo(mensajes), maxOutputTokens: MAX_TOKENS },
    opciones,
  );
  return { conmutacion, recuperadas };
}
