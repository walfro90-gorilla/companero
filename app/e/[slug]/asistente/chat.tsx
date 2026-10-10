'use client';

import { useRef, useState } from 'react';
import { BookOpen, FileSearch, RefreshCw, Send, UserRound, Volume2, VolumeX } from 'lucide-react';
import type { Avatar as DatosAvatar } from '@/lib/avatar';
import { analizar, type Destino } from '@/lib/conocimiento/citas';
import { elegirVoz } from '@/lib/voz/elegir-voz';
import { MAX_TEXTO_VOZ, resumenDeRespaldo } from '@/lib/voz/hablar';
import { citaCorta, nombreCita, type Consultada } from '@/lib/rag/material';
import { Avatar, type EstadoAvatar } from '@/app/_ui/avatar';
import { ChipCita, ConNegritas, PanelSeccion } from '@/app/_ui/fuentes';
import { PulsarParaHablar } from '@/app/_ui/pulsar-para-hablar';
import { leerSecciones, type SeccionVisible } from './acciones';

// Chat con el asistente (docs/adr/0004 y 0010). Muestra el paso de búsqueda (qué secciones consultó), las
// citas como referencias que abren el texto exacto y el original, y la canalización a supervisor/RH.

type Mensaje = {
  rol: 'usuario' | 'avatar';
  texto: string;
  /** La bienvenida es fija: se muestra pero no se manda al modelo. */
  fija?: boolean;
  consultadas?: Consultada[];
  proveedor?: string;
  respaldo?: boolean;
  error?: boolean;
};

const REFORMULAR = 'No entendí bien. ¿Me lo explicas de otra forma?';

const DESTINO: Record<Destino, { titulo: string; texto: string }> = {
  supervisor: {
    titulo: 'Le pasé tu duda a tu supervisor',
    texto: 'Esto no lo resuelves por tu cuenta ni viene completo en tu material. Tu supervisor ya la ve en su bandeja; su respuesta te llega en Inicio.',
  },
  rh: {
    titulo: 'Le pasé tu duda a Recursos Humanos',
    texto: 'Es un tema laboral que no forma parte de tu capacitación. RH ya la ve; su respuesta te llega en Inicio.',
  },
};

// La voz (docs/adr/0016): un resumen hablado de la respuesta con Azure Speech (es-MX-DaliaNeural); si no está
// disponible, el mismo resumen con una voz femenina del navegador elegida por nombre (lib/voz/elegir-voz.ts).

/** WAV vacío: se reproduce dentro del clic de "Voz activada" para desbloquear el audio en celular y Safari. */
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

async function decirConNavegador(texto: string, alTerminar: () => void) {
  const voz = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!voz) return alTerminar();
  const elegida = elegirVoz(await vocesDelNavegador());
  // Mejor callar que sonar robótica (eSpeak) o con voz de hombre.
  if (!elegida) return alTerminar();
  voz.cancel();
  const dicho = new SpeechSynthesisUtterance(texto);
  dicho.voice = elegida;
  dicho.lang = elegida.lang;
  dicho.rate = 1;
  dicho.pitch = 1.05;
  dicho.onend = alTerminar;
  dicho.onerror = alTerminar;
  voz.speak(dicho);
}

function leerConsultadas(cabecera: string | null): Consultada[] {
  if (!cabecera) return [];
  try {
    return JSON.parse(decodeURIComponent(cabecera)) as Consultada[];
  } catch {
    return [];
  }
}

export function Chat({ slug, avatar, bienvenida }: { slug: string; avatar: DatosAvatar; bienvenida: string }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: 'avatar', texto: bienvenida, fija: true }]);
  const [entrada, setEntrada] = useState('');
  const [estado, setEstado] = useState<EstadoAvatar>('reposo');
  const [conVoz, setConVoz] = useState(false);
  const [secciones, setSecciones] = useState<Map<string, SeccionVisible>>(new Map());
  const [abierta, setAbierta] = useState<string | null>(null);
  // Ocupado mientras llega la respuesta (o se transcribe la voz); mientras el avatar HABLA ya se puede preguntar otra
  // cosa: la voz se calla.
  const [cargando, setCargando] = useState(false);
  const ocupado = cargando || estado === 'pensando';
  const final = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  /** Cada respuesta tiene su turno de voz: si llega otra pregunta, la voz anterior ya no suena. */
  const turnoVoz = useRef(0);

  function callar() {
    turnoVoz.current++;
    audio.current?.pause();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }

  /** En el clic de "Voz activada": deja listo el audio (celular y Safari solo lo dejan sonar si nació en un clic). */
  function desbloquearAudio() {
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

  async function decir(texto: string, canaliza: Destino | null, alTerminar: () => void) {
    const turno = ++turnoVoz.current;
    const vigente = () => turno === turnoVoz.current;
    let resumen: string | null = null;
    try {
      const res = await fetch('/api/voz', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ empresa: slug, texto: texto.slice(0, MAX_TEXTO_VOZ) }),
      });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        if (!vigente()) return URL.revokeObjectURL(url);
        const a = audio.current ?? new Audio();
        audio.current = a;
        const fin = () => {
          URL.revokeObjectURL(url);
          a.onended = a.onerror = null;
          if (vigente()) alTerminar();
        };
        a.onended = fin;
        a.onerror = fin;
        a.src = url;
        await a.play();
        return;
      }
      resumen = ((await res.json().catch(() => null)) as { resumen?: string } | null)?.resumen ?? null;
    } catch {
      // Sin red o audio bloqueado: cae a la voz del navegador.
    }
    if (vigente()) await decirConNavegador(resumen ?? resumenDeRespaldo(texto, canaliza), alTerminar);
  }

  const bajar = () => requestAnimationFrame(() => final.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));

  function precargar(codigos: string[]) {
    const faltan = codigos.filter(c => !secciones.has(c));
    if (!faltan.length) return;
    leerSecciones(slug, faltan)
      .then(xs => setSecciones(prev => new Map([...prev, ...xs.map(x => [x.codigo, x] as const)])))
      .catch(() => {});
  }

  async function enviar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || ocupado) return;
    callar();
    setCargando(true);
    const historial: Mensaje[] = [...mensajes, { rol: 'usuario', texto: pregunta }];
    setMensajes([...historial, { rol: 'avatar', texto: '' }]);
    setEntrada('');
    setEstado('pensando');
    bajar();

    const actualizar = (cambio: Partial<Mensaje>) =>
      setMensajes(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], ...cambio }]);

    let completo = '';
    let consultadas: Consultada[] = [];
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          empresa: slug,
          // Solo lo reciente: el modelo usa los últimos 12 y un historial enorme no debe tumbar la pregunta nueva.
          mensajes: historial.filter(m => !m.fija && !m.error && m.texto).slice(-24).map(({ rol, texto }) => ({ rol, texto })),
        }),
      });
      if (!res.ok || !res.body) {
        const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(cuerpo?.error ?? 'No pude responder en este momento.');
      }
      consultadas = leerConsultadas(res.headers.get('x-consultadas'));
      precargar(consultadas.map(c => c.codigo));
      actualizar({ consultadas, proveedor: res.headers.get('x-proveedor') ?? undefined, respaldo: res.headers.get('x-respaldo') === '1' });
      setEstado('hablando');
      const lector = res.body.getReader();
      const decodificador = new TextDecoder();
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        completo += decodificador.decode(value, { stream: true });
        actualizar({ texto: completo });
        bajar();
      }
    } catch (e) {
      actualizar({ texto: e instanceof Error ? e.message : 'Algo falló. Intenta de nuevo.', error: true });
      setEstado('reposo');
      setCargando(false);
      return;
    }
    setCargando(false);

    const validas = new Set(consultadas.map(c => c.codigo));
    const { canalizar } = analizar(completo, id => validas.has(id));
    const alTerminar = () => setEstado(canalizar ? 'canalizando' : 'reposo');
    if (conVoz) decir(completo, canalizar, alTerminar);
    else alTerminar();
  }

  const ultimoAvatar = mensajes.findLastIndex(m => m.rol === 'avatar' && !m.fija && !m.error && m.texto);
  const seccionAbierta = abierta ? secciones.get(abierta) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:grid md:grid-cols-[280px_1fr] md:gap-6 md:p-6">
      <aside className="flex flex-col items-center gap-4 md:sticky md:top-6 md:self-start">
        <Avatar avatar={avatar} estado={estado} />
        <button
          type="button"
          onClick={() => {
            if (conVoz) {
              callar();
              if (!cargando && estado === 'hablando') setEstado('reposo');
            } else desbloquearAudio();
            setConVoz(!conVoz);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50"
          aria-pressed={conVoz}
        >
          {conVoz ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          {conVoz ? 'Voz activada' : 'Voz apagada'}
        </button>
      </aside>

      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {mensajes.map((m, i) =>
            m.rol === 'usuario' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-stone-800 px-4 py-2 text-white">{m.texto}</p>
              </div>
            ) : (
              <RespuestaAvatar
                key={i}
                mensaje={m}
                cargando={!m.texto && estado === 'pensando'}
                onAbrir={codigo => {
                  precargar([codigo]);
                  setAbierta(codigo);
                }}
                onReformular={i === ultimoAvatar && !ocupado ? () => enviar(REFORMULAR) : undefined}
              />
            ),
          )}
          <div ref={final} />
        </div>

        <div className="border-t border-stone-200 p-3 md:p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {avatar.preguntas.map(p => (
              <button
                key={p}
                type="button"
                disabled={ocupado}
                onClick={() => enviar(p)}
                className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              enviar(entrada);
            }}
          >
            <input
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              placeholder={`Escribe o mantén presionado el micrófono para hablarle a ${avatar.nombre}…`}
              maxLength={2000}
              className="min-w-0 flex-1 rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              aria-label="Tu pregunta"
            />
            <PulsarParaHablar
              slug={slug}
              deshabilitado={ocupado}
              onTexto={texto => enviar(texto)}
              onEstado={e => {
                if (e === 'grabando') callar();
                setEstado(e === 'grabando' ? 'escuchando' : e === 'transcribiendo' ? 'pensando' : 'reposo');
              }}
            />
            <button
              type="submit"
              disabled={ocupado || !entrada.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--marca)] px-4 py-3 font-medium text-white disabled:opacity-50"
            >
              <Send className="size-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </section>

      {abierta && <PanelSeccion slug={slug} codigo={abierta} seccion={seccionAbierta} onCerrar={() => setAbierta(null)} />}
    </div>
  );
}

function RespuestaAvatar({
  mensaje, cargando, onAbrir, onReformular,
}: {
  mensaje: Mensaje;
  cargando: boolean;
  onAbrir: (codigo: string) => void;
  onReformular?: () => void;
}) {
  const consultadas = mensaje.consultadas ?? [];
  const validas = new Set(consultadas.map(c => c.codigo));
  const a = analizar(mensaje.texto, id => validas.has(id));
  const nombre = (id: string) => {
    const c = consultadas.find(x => x.codigo === id);
    return c ? nombreCita(c) : id;
  };
  const corta = (id: string) => citaCorta(consultadas.find(x => x.codigo === id)?.referencia, id);
  return (
    <div className="flex max-w-[92%] flex-col gap-2">
      {!mensaje.fija && !mensaje.error && (
        <p className="flex items-center gap-1.5 text-xs text-stone-500">
          <FileSearch className="size-3.5" />
          {cargando
            ? 'Buscando en el material de la empresa…'
            : consultadas.length
              ? `Consulté ${consultadas.length} ${consultadas.length === 1 ? 'sección' : 'secciones'} del material`
              : 'No encontré nada sobre esto en el material'}
        </p>
      )}
      <div
        className={`whitespace-pre-wrap rounded-2xl rounded-bl-sm px-4 py-3 leading-relaxed ${
          mensaje.error ? 'bg-red-50 text-red-800' : 'bg-stone-100'
        }`}
      >
        {cargando ? (
          <span className="text-stone-500">Revisando tu material…</span>
        ) : (
          a.trozos.map((t, i) =>
            t.tipo === 'texto' ? (
              <ConNegritas key={i} texto={t.texto} />
            ) : (
              t.ids.map(id => <ChipCita key={`${i}-${id}`} codigo={id} onAbrir={onAbrir} titulo={nombre(id)} etiqueta={corta(id)} />)
            ),
          )
        )}
      </div>

      {a.citas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <BookOpen className="size-3.5" />
          <span>Fuentes:</span>
          {a.citas.map(id => (
            <button key={id} type="button" onClick={() => onAbrir(id)} className="underline decoration-dotted hover:text-stone-900">
              {nombre(id)}
            </button>
          ))}
        </div>
      )}

      {a.canalizar && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <UserRound className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{DESTINO[a.canalizar].titulo}</p>
            <p>{DESTINO[a.canalizar].texto}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-stone-500">
        {mensaje.respaldo && <span>Respondió el sistema de respaldo ({mensaje.proveedor}).</span>}
        {onReformular && (
          <button type="button" onClick={onReformular} className="inline-flex items-center gap-1 hover:text-stone-800">
            <RefreshCw className="size-3.5" /> Explícamelo de otra forma
          </button>
        )}
      </div>
    </div>
  );
}
