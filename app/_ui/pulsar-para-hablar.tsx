'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic } from 'lucide-react';
import { MAX_MS, MIN_MS, VOLUMEN_MINIMO, elegirFormato, extensionDe } from '@/lib/voz/formato';

// Pulsar para hablar (docs/adr/0005): se mantiene presionado el micrófono (mouse, dedo o la tecla Espacio),
// se graba, al soltar se transcribe con Whisper en el servidor y el texto se envía como pregunta. El audio no se
// guarda en ningún lado.

export type EstadoVoz = 'listo' | 'grabando' | 'transcribiendo';

export function PulsarParaHablar({
  slug, deshabilitado, onTexto, onEstado,
}: {
  slug: string;
  deshabilitado?: boolean;
  onTexto: (texto: string) => void;
  onEstado?: (e: EstadoVoz) => void;
}) {
  const [estado, setEstado] = useState<EstadoVoz>('listo');
  const [segundos, setSegundos] = useState(0);
  const [aviso, setAviso] = useState('');
  const grabador = useRef<MediaRecorder | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const trozos = useRef<Blob[]>([]);
  const inicio = useRef(0);
  const soltado = useRef(false);
  const reloj = useRef<number | null>(null);
  // Medidor de volumen: si no hubo voz, el audio ni se manda (Whisper inventa frases con silencio o ruido).
  const medidor = useRef<{ ctx: AudioContext; analizador: AnalyserNode; datos: Float32Array<ArrayBuffer> } | null>(null);
  const volumenMaximo = useRef(0);

  const cambiar = (e: EstadoVoz) => {
    setEstado(e);
    onEstado?.(e);
  };

  const avisar = (texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso(a => (a === texto ? '' : a)), 4500);
  };

  const soltarMicrofono = () => {
    flujo.current?.getTracks().forEach(t => t.stop());
    flujo.current = null;
    void medidor.current?.ctx.close().catch(() => {});
    medidor.current = null;
  };

  const medir = () => {
    const m = medidor.current;
    if (!m) return;
    m.analizador.getFloatTimeDomainData(m.datos);
    let suma = 0;
    for (const x of m.datos) suma += x * x;
    volumenMaximo.current = Math.max(volumenMaximo.current, Math.sqrt(suma / m.datos.length));
  };

  useEffect(
    () => () => {
      if (reloj.current) window.clearInterval(reloj.current);
      flujo.current?.getTracks().forEach(t => t.stop());
    },
    [],
  );

  async function empezar() {
    if (deshabilitado || estado !== 'listo' || grabador.current) return;
    soltado.current = false;
    setAviso('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      avisar('Tu navegador no permite grabar audio. Escribe tu pregunta.');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      avisar('Necesito permiso para usar el micrófono.');
      return;
    }
    // Si soltó mientras el navegador pedía permiso, no se graba: el siguiente toque ya funciona.
    if (soltado.current) {
      stream.getTracks().forEach(t => t.stop());
      avisar('Listo. Ahora mantén presionado el micrófono mientras hablas.');
      return;
    }
    const tipo = elegirFormato(t => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    flujo.current = stream;
    trozos.current = [];
    rec.ondataavailable = ev => {
      if (ev.data.size) trozos.current.push(ev.data);
    };
    rec.onstop = () => void enviar(rec.mimeType || tipo || 'audio/webm');
    grabador.current = rec;
    volumenMaximo.current = 0;
    try {
      const ctx = new AudioContext();
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analizador);
      medidor.current = { ctx, analizador, datos: new Float32Array(analizador.fftSize) };
    } catch {
      medidor.current = null; // sin medidor se manda igual; el servidor filtra las frases fantasma
      volumenMaximo.current = 1;
    }
    rec.start(250);
    inicio.current = Date.now();
    setSegundos(0);
    reloj.current = window.setInterval(() => {
      medir();
      const ms = Date.now() - inicio.current;
      setSegundos(Math.floor(ms / 1000));
      if (ms >= MAX_MS) terminar();
    }, 100);
    cambiar('grabando');
  }

  function terminar() {
    medir();
    soltado.current = true;
    if (reloj.current) {
      window.clearInterval(reloj.current);
      reloj.current = null;
    }
    if (grabador.current?.state === 'recording') grabador.current.stop();
  }

  async function enviar(tipo: string) {
    grabador.current = null;
    soltarMicrofono();
    if (Date.now() - inicio.current < MIN_MS) {
      cambiar('listo');
      avisar('Mantén presionado el micrófono mientras hablas.');
      return;
    }
    if (volumenMaximo.current < VOLUMEN_MINIMO) {
      cambiar('listo');
      avisar('No escuché tu voz. Acércate al micrófono y vuelve a intentar.');
      return;
    }
    cambiar('transcribiendo');
    try {
      const datos = new FormData();
      datos.append('audio', new Blob(trozos.current, { type: tipo }), `pregunta.${extensionDe(tipo)}`);
      datos.append('empresa', slug);
      const res = await fetch('/api/transcribir', { method: 'POST', body: datos });
      const j = (await res.json().catch(() => null)) as { texto?: string; error?: string } | null;
      if (!res.ok || !j?.texto) throw new Error(j?.error ?? 'No pude entender el audio.');
      cambiar('listo');
      onTexto(j.texto);
    } catch (e) {
      cambiar('listo');
      avisar(e instanceof Error ? e.message : 'No pude entender el audio.');
    }
  }

  const grabando = estado === 'grabando';
  return (
    <div className="relative">
      <button
        type="button"
        disabled={deshabilitado || estado === 'transcribiendo'}
        onPointerDown={e => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          void empezar();
        }}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        onKeyDown={e => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            void empezar();
          }
        }}
        onKeyUp={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            terminar();
          }
        }}
        onContextMenu={e => e.preventDefault()}
        aria-label={grabando ? 'Grabando: suelta para enviar' : 'Mantén presionado para hablar'}
        aria-pressed={grabando}
        title="Mantén presionado para hablar"
        className={`flex size-12 shrink-0 touch-none select-none items-center justify-center rounded-xl transition [-webkit-touch-callout:none] disabled:opacity-50 ${
          grabando ? 'scale-110 bg-red-600 text-white ring-4 ring-red-200' : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
        }`}
      >
        {estado === 'transcribiendo' ? <Loader2 className="size-5 animate-spin" /> : <Mic className={`size-5 ${grabando ? 'animate-pulse' : ''}`} />}
      </button>
      {grabando && (
        <span className="pointer-events-none absolute -top-10 right-0 whitespace-nowrap rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow">
          ● Suelta para enviar · {segundos}s
        </span>
      )}
      {estado === 'transcribiendo' && (
        <span className="pointer-events-none absolute -top-10 right-0 whitespace-nowrap rounded-full bg-stone-800 px-3 py-1 text-xs text-white shadow">
          Escribiendo lo que dijiste…
        </span>
      )}
      {aviso && !grabando && (
        <span role="status" className="absolute -top-10 right-0 w-max max-w-64 rounded-lg bg-amber-100 px-3 py-1 text-xs text-amber-950 shadow">
          {aviso}
        </span>
      )}
    </div>
  );
}
