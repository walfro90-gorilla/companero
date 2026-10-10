'use client';

import { useRef, useState } from 'react';
import type { Destino } from '@/lib/conocimiento/citas';
import { elegirVoz, elegirVozCliente } from '@/lib/voz/elegir-voz';
import { MAX_LITERAL, MAX_TEXTO_VOZ, resumenDeRespaldo, textoLiteral, type Quien } from '@/lib/voz/hablar';

// La voz en el navegador (docs/adr/0016), compartida por el chat y la inducción: pide a /api/voz el audio de Azure
// (el servidor elige la voz según `quien`) y, si no se puede, dice lo mismo con la voz del navegador: femenina para
// la asistente y otra distinta para el cliente simulado.

/** WAV vacío: se reproduce dentro del clic que activa la voz para desbloquear el audio en celular y Safari. */
const SILENCIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/** Las voces del navegador pueden llegar vacías la primera vez: se espera voiceschanged (máximo 1.5 s). */
function vocesDelNavegador(): Promise<SpeechSynthesisVoice[]> {
  const voz = window.speechSynthesis;
  const ya = voz.getVoices();
  if (ya.length) return Promise.resolve(ya);
  return new Promise(listo => {
    const leer = () => listo(voz.getVoices());
    voz.addEventListener('voiceschanged', leer, { once: true });
    setTimeout(leer, 1500);
  });
}

async function decirConNavegador(texto: string, quien: Quien, alTerminar: () => void) {
  const voz = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!voz) return alTerminar();
  const voces = await vocesDelNavegador();
  const asistente = elegirVoz(voces);
  let elegida = asistente;
  let tono = 1.05;
  if (quien !== 'asistente') {
    // Otra voz para que se note el cambio de personaje; si no hay otra, la misma con otro tono.
    elegida = elegirVozCliente(voces, asistente, quien === 'clienta') ?? asistente;
    tono = elegida === asistente ? (quien === 'clienta' ? 1.3 : 0.75) : 1;
  }
  // Mejor callar que sonar robótica (eSpeak) o, para la asistente, con voz de hombre.
  if (!elegida) return alTerminar();
  voz.cancel();
  const dicho = new SpeechSynthesisUtterance(texto);
  dicho.voice = elegida;
  dicho.lang = elegida.lang;
  dicho.rate = 1;
  dicho.pitch = tono;
  dicho.onend = alTerminar;
  dicho.onerror = alTerminar;
  voz.speak(dicho);
}

export type OpcionesDecir = {
  /** 'resumen': la asistente resume una respuesta larga; 'literal': se dice tal cual (cliente simulado, frases fijas). */
  modo?: 'resumen' | 'literal';
  quien?: Quien;
  canaliza?: Destino | null;
  alTerminar?: () => void;
};

export function useVoz(slug: string) {
  const [activa, setActiva] = useState(false);
  /** Quién está hablando ahora (para mover la boca de su avatar). */
  const [diciendo, setDiciendo] = useState<Quien | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  /** Cada frase tiene su turno: si se pide otra (o se calla), la anterior ya no suena. */
  const turno = useRef(0);

  function callar() {
    turno.current++;
    audio.current?.pause();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setDiciendo(null);
  }

  /** Dentro de un clic: deja listo el audio (celular y Safari solo dejan sonar lo que nació en un clic). */
  function desbloquear() {
    const a = audio.current ?? new Audio();
    audio.current = a;
    a.src = SILENCIO;
    a.play().catch(() => {});
    const voz = window.speechSynthesis;
    if (voz) {
      voz.getVoices();
      voz.speak(new SpeechSynthesisUtterance(''));
    }
  }

  function alternar() {
    if (activa) callar();
    else desbloquear();
    setActiva(!activa);
  }

  async function decir(texto: string, o: OpcionesDecir = {}) {
    const { modo = 'resumen', quien = 'asistente', canaliza = null } = o;
    const mio = ++turno.current;
    const vigente = () => mio === turno.current;
    const terminar = () => {
      if (!vigente()) return;
      setDiciendo(null);
      o.alTerminar?.();
    };
    setDiciendo(quien);
    let dicho: string | null = null;
    try {
      const res = await fetch('/api/voz', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ empresa: slug, texto: texto.slice(0, modo === 'literal' ? MAX_LITERAL : MAX_TEXTO_VOZ), modo, quien }),
      });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        if (!vigente()) return URL.revokeObjectURL(url);
        const a = audio.current ?? new Audio();
        audio.current = a;
        const fin = () => {
          URL.revokeObjectURL(url);
          a.onended = a.onerror = null;
          terminar();
        };
        a.onended = fin;
        a.onerror = fin;
        a.src = url;
        await a.play();
        return;
      }
      dicho = ((await res.json().catch(() => null)) as { resumen?: string } | null)?.resumen ?? null;
    } catch {
      // Sin red o audio bloqueado: cae a la voz del navegador.
    }
    if (!vigente()) return;
    await decirConNavegador(dicho ?? (modo === 'literal' ? textoLiteral(texto) : resumenDeRespaldo(texto, canaliza)), quien, terminar);
  }

  return { activa, alternar, desbloquear, decir, callar, diciendo };
}
