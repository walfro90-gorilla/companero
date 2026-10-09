import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/tipos.ts';
import { consultaDeBusqueda, materialParaPrompt, type Recuperada } from '../rag/material.ts';
import { conmutar, generarConRespaldo } from './cadena.ts';
import { MARCA_SUPERVISOR, leerSiNo, peticionClasificar, revisarCanalizacion } from './canalizacion.ts';
import { instrucciones, type Persona } from './instrucciones.ts';
import { aMensajesModelo, type Mensaje } from './mensajes.ts';
import { configurados, rapidosConfigurados } from './proveedores.ts';
import { leerPalabras, peticionReescritura } from '../rag/reescribir.ts';
import { fusionar } from '../rag/fusion.ts';

// El cerebro del asistente (RAG, docs/adr/0010): buscar en el material de la empresa → responder citando.
// Lo usan la ruta del chat y la prueba documentada, para que la prueba ejercite lo mismo que ve el empleado.

// El thinking adaptativo de Claude cuenta contra este tope: holgado para que no se coma la respuesta.
const MAX_TOKENS = 4000;
// 12: con el manual del reto (96 secciones cortas) algunas respuestas necesitan dos secciones (p. ej. la
// categoría de un producto en la sección 6 y el plazo de devolución en la 9).
export const SECCIONES_POR_CONSULTA = 12;

export async function buscar(supabase: SupabaseClient<Database>, empresaId: string, consulta: string, giro?: string | null): Promise<Recuperada[]> {
  // Reescritura: la pregunta original + palabras clave del vocabulario del manual. Si la IA rápida no responde a
  // tiempo, se busca solo con la pregunta (nunca se bloquea la respuesta por esto).
  const r = rapidosConfigurados().length
    ? await generarConRespaldo(rapidosConfigurados(), peticionReescritura(consulta, giro), { plazo: 6_000, registrar: () => {} })
    : null;
  const palabras = r?.ok ? leerPalabras(r.texto) : '';
  // Dos búsquedas (la pregunta tal cual y la pregunta + palabras clave) fusionadas por rango: la reescritura
  // encuentra lo que la pregunta sola no, sin perder lo que la pregunta sola ya encontraba (pruebas/busqueda.json).
  const consultas = palabras ? [consulta, `${consulta}\n${palabras}`] : [consulta];
  const listas = await Promise.all(consultas.map(async q => {
    const { data, error } = await supabase.rpc('buscar_secciones', { p_empresa: empresaId, p_consulta: q.slice(0, 1200), p_limite: SECCIONES_POR_CONSULTA });
    if (error) console.error('[asistente] falló la búsqueda:', error.message);
    return data ?? [];
  }));
  return fusionar(listas, SECCIONES_POR_CONSULTA);
}

export async function responder(
  { supabase, empresaId, persona, mensajes, ahora }: {
    supabase: SupabaseClient<Database>; empresaId: string; persona: Persona; mensajes: Mensaje[];
    /** Para la prueba documentada: una hora fija hace la prueba reproducible (promociones con horario). */
    ahora?: Date;
  },
  opciones?: Parameters<typeof conmutar>[2],
) {
  const recuperadas = await buscar(supabase, empresaId, consultaDeBusqueda(mensajes), persona.giro);
  const conmutacion = await conmutar(
    configurados(),
    // Sin temperature: claude-opus-5-5 rechaza los parámetros de muestreo con un 400.
    { instructions: instrucciones(persona, materialParaPrompt(recuperadas), ahora), messages: aMensajesModelo(mensajes), maxOutputTokens: MAX_TOKENS },
    opciones,
  );
  return { conmutacion, recuperadas };
}

/**
 * Red de seguridad (ADR 0013): si la respuesta manda al supervisor sin la marca y la persona está atendiendo algo
 * ahora, devuelve la marca para agregarla al final ('' si no hace falta). Un fallo de la IA aquí no rompe nada.
 */
export async function canalizacionFaltante(pregunta: string, respuesta: string): Promise<string> {
  if (!revisarCanalizacion(respuesta)) return '';
  const r = await generarConRespaldo(configurados(), peticionClasificar(pregunta, respuesta), { plazo: 15_000, registrar: () => {} });
  return r.ok && leerSiNo(r.texto) ? MARCA_SUPERVISOR : '';
}
