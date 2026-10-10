'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, Check, CheckCircle2, ChevronRight, ClipboardCheck, MessageCircle, MessagesSquare, Play, Send, Sparkles, Volume2, VolumeX, XCircle } from 'lucide-react';
import type { Avatar as DatosAvatar } from '@/lib/avatar';
import type { Progreso } from '@/lib/juego';
import { analizar } from '@/lib/conocimiento/citas';
import { quienEs } from '@/lib/voz/hablar';
import { Avatar } from '@/app/_ui/avatar';
import { boton, botonSecundario, campo, tarjeta } from '@/app/_ui/estilos';
import { PulsarParaHablar } from '@/app/_ui/pulsar-para-hablar';
import { useVoz } from '@/app/_ui/usar-voz';
import { Festejo } from '@/app/_ui/festejo';
import { ChipCita, ConNegritas, PanelSeccion, TextoConCitas } from '@/app/_ui/fuentes';
import { completarPractica, enviarTest, marcarLeccion, type Calificacion } from './acciones';

type Leccion = { id: string; orden: number; titulo: string; objetivo: string | null; contenido: string };
type Pregunta = { id: string; orden: number; enunciado: string; opciones: string[] };
type Escenario = { id: string; orden: number; titulo: string; situacion: string; personaje: string };
type Paso = 'lecciones' | 'test' | 'practica';
type Voz = ReturnType<typeof useVoz>;

// La asistente guía la inducción como coach (docs/adr/0016; la ficha: "el avatar guía la inducción"): presenta cada
// lección, anima en el test y da la retroalimentación de la práctica, con su voz si está activada. En la práctica, la
// otra persona (el cliente simulado) es OTRO personaje, con su propio avatar y su propia voz.

/** El cliente simulado: avatar genérico distinto del de la asistente. */
function avatarCliente(personaje: string): DatosAvatar {
  const mujer = quienEs(personaje) === 'clienta';
  return {
    nombre: mujer ? 'Clienta' : 'Cliente', rol: personaje, saludo: null, preguntas: [],
    colores: mujer
      ? { piel: '#f0c08a', cabello: '#7c4a2d', camisa: '#7c3aed', fondo: '#ede9fe', detalle: null, acento: null }
      : { piel: '#c68642', cabello: '#1f1b16', camisa: '#475569', fondo: '#e2e8f0', detalle: null, acento: null },
  };
}

/** La asistente con una burbuja corta. `escuchar`: lo que dice con su voz al pedirlo (resumen de una lección, etc.). */
function Coach({ avatar, voz, texto, escuchar, children }: { avatar: DatosAvatar; voz: Voz; texto?: string; escuchar?: string; children?: ReactNode }) {
  const hablando = voz.diciendo === 'asistente';
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0"><Avatar avatar={avatar} estado={hablando ? 'hablando' : 'reposo'} chico /></div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-[var(--marca-suave)] p-3 text-sm text-stone-800 ring-1 ring-[var(--marca)]/15">
        <p className="mb-0.5 text-xs font-medium text-stone-500">{avatar.nombre}</p>
        {texto && <p>{texto}</p>}
        {children}
        {escuchar && (
          <button
            type="button"
            onClick={() => {
              if (hablando) return voz.callar();
              voz.desbloquear();
              voz.decir(escuchar);
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--marca)] hover:underline"
          >
            {hablando ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />} {hablando ? 'Callar' : 'Escúchala'}
          </button>
        )}
      </div>
    </div>
  );
}

/** "Identificar los pasos…" → "En esta lección vas a aprender a identificar los pasos…". */
function presentacion(l: Leccion): string {
  const objetivo = l.objetivo?.trim().replace(/[.]+$/, '');
  if (!objetivo) return `Vamos con «${l.titulo}». Lee con calma; si algo no te queda claro, pregúntame.`;
  return `En esta lección vas a aprender a ${objetivo.charAt(0).toLowerCase()}${objetivo.slice(1)}.`;
}

export function Recorrido(p: {
  slug: string;
  asistente: string;
  avatar: DatosAvatar;
  modulo: { id: string; titulo: string; descripcion: string | null; tipo: 'induccion' | 'refuerzo' };
  lecciones: Leccion[];
  preguntas: Pregunta[];
  escenarios: Escenario[];
  vistas: string[];
  mejorTest: { aciertos: number; total: number } | null;
  practicadas: string[];
  progresoInicial: Progreso;
  revisionTest: { calificacion: number | null; comentario: string | null } | null;
  revisionesPractica: Record<string, { calificacion: number; comentario: string | null }>;
}) {
  const [vistas, setVistas] = useState(new Set(p.vistas));
  const [aprobado, setAprobado] = useState(Boolean(p.mejorTest && p.mejorTest.aciertos / p.mejorTest.total >= 0.8));
  const [practicadas, setPracticadas] = useState(new Set(p.practicadas));
  const [progreso, setProgreso] = useState(p.progresoInicial);
  const [ganados, setGanados] = useState<{ n: number; clave: number } | null>(null);
  const [festejo, setFestejo] = useState<{ titulo: string; texto: string } | null>(null);
  const leccionesListas = p.lecciones.every(l => vistas.has(l.id));
  const [paso, setPaso] = useState<Paso>(leccionesListas && p.preguntas.length ? 'test' : 'lecciones');
  const voz = useVoz(p.slug);

  /** Actualiza el progreso, anima los puntos ganados y festeja si subió de nivel o terminó el módulo. */
  function avanzar(nuevo: Progreso, terminaModulo: boolean) {
    const diferencia = nuevo.puntos - progreso.puntos;
    if (diferencia > 0) setGanados({ n: diferencia, clave: Date.now() });
    if (terminaModulo) {
      setFestejo({ titulo: '¡Módulo completo!', texto: `Ganaste la insignia "Módulo completo". Vas en nivel ${nuevo.nivel}: ${nuevo.nombreNivel}.` });
    } else if (nuevo.nivel > progreso.nivel) {
      setFestejo({ titulo: `¡Subiste a nivel ${nuevo.nivel}!`, texto: `Ahora eres: ${nuevo.nombreNivel}.` });
    }
    setProgreso(nuevo);
  }

  const pasos: { id: Paso; texto: string; icono: typeof BookOpen; listo: boolean; hay: boolean }[] = [
    { id: 'lecciones', texto: 'Lecciones', icono: BookOpen, listo: leccionesListas, hay: true },
    { id: 'test', texto: 'Test', icono: ClipboardCheck, listo: aprobado, hay: p.preguntas.length > 0 },
    { id: 'practica', texto: 'Práctica', icono: MessagesSquare, listo: p.escenarios.length > 0 && p.escenarios.every(e => practicadas.has(e.id)), hay: p.escenarios.length > 0 },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-sm text-stone-500">{p.modulo.tipo === 'induccion' ? 'Inducción' : 'Refuerzo'}</p>
        <h1 className="text-2xl font-semibold">{p.modulo.titulo}</h1>
        {p.modulo.descripcion && <p className="text-stone-600">{p.modulo.descripcion}</p>}
        <p className="text-xs text-stone-500">{AVISO_REVISION}</p>
        <BarraNivel progreso={progreso} ganados={ganados} />
        <button
          type="button"
          onClick={voz.alternar}
          aria-pressed={voz.activa}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-sm text-stone-700 hover:bg-stone-50"
        >
          {voz.activa ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} {voz.activa ? `Voz de ${p.avatar.nombre} activada` : 'Voz apagada'}
        </button>
        {voz.bloqueada && (
          // Fijo en la esquina: la lección o la práctica que habló puede estar lejos del encabezado.
          <button
            type="button"
            onClick={voz.escuchar}
            className="fixed bottom-6 right-4 z-50 inline-flex animate-pulse items-center gap-2 rounded-full bg-[var(--marca,#c81e5b)] px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            <Play className="size-4" /> Escuchar
          </button>
        )}
      </header>

      <nav className="grid grid-cols-3 gap-2">
        {pasos.filter(x => x.hay).map(x => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              voz.callar();
              setPaso(x.id);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${paso === x.id ? 'border-[var(--marca)] bg-[var(--marca-suave)] font-medium' : 'border-stone-200 bg-white'}`}
          >
            {x.listo ? <CheckCircle2 className="size-4 text-emerald-600" /> : <x.icono className="size-4" />} {x.texto}
          </button>
        ))}
      </nav>

      {paso === 'lecciones' && (
        <Lecciones
          {...p}
          voz={voz}
          vistas={vistas}
          onVista={async id => {
            const nuevo = await marcarLeccion(p.slug, p.modulo.id, id);
            const v = new Set(vistas).add(id);
            setVistas(v);
            avanzar(nuevo, p.lecciones.every(l => v.has(l.id)) && (aprobado || !p.preguntas.length));
            if (p.lecciones.every(l => v.has(l.id)) && p.preguntas.length && !aprobado) setPaso('test');
          }}
        />
      )}
      {paso === 'test' && (
        <Test
          avatar={p.avatar}
          voz={voz}
          slug={p.slug}
          moduloId={p.modulo.id}
          revision={p.revisionTest}
          preguntas={p.preguntas}
          onCalificado={c => {
            if (c.aprobado) setAprobado(true);
            avanzar(c.progreso, c.aprobado && !aprobado && leccionesListas);
          }}
        />
      )}
      {paso === 'practica' && (
        <Practica
          avatar={p.avatar}
          voz={voz}
          slug={p.slug}
          revisiones={p.revisionesPractica}
          escenarios={p.escenarios}
          practicadas={practicadas}
          onCompletada={async id => {
            const nuevo = await completarPractica(p.slug, p.modulo.id);
            setPracticadas(new Set(practicadas).add(id));
            avanzar(nuevo, false);
          }}
        />
      )}

      <p className="text-center text-sm text-stone-500">
        ¿Una duda? <Link href={`/e/${p.slug}/asistente`} className="font-medium text-[var(--marca)] hover:underline">Pregúntale a {p.asistente}</Link>
      </p>
      {festejo && <Festejo {...festejo} onCerrar={() => setFestejo(null)} />}
    </main>
  );
}

export function BarraNivel({ progreso, ganados }: { progreso: Progreso; ganados?: { n: number; clave: number } | null }) {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-lg font-bold text-white">{progreso.nivel}</span>
      <div className="min-w-0 flex-1">
        <p className="flex justify-between text-sm">
          <span className="font-medium">{progreso.nombreNivel}</span>
          <span className="text-stone-500">{progreso.puntos} pts{progreso.siguiente ? ` / ${progreso.siguiente}` : ''}</span>
        </p>
        <span className="mt-1 block h-2 overflow-hidden rounded-full bg-stone-100">
          <span className="block h-full rounded-full bg-[var(--marca)] transition-all duration-700" style={{ width: `${Math.round(progreso.avanceNivel * 100)}%` }} />
        </span>
      </div>
      {progreso.racha > 1 && <span className="text-sm text-stone-600" title="Días seguidos">🔥 {progreso.racha}</span>}
      {ganados && (
        <span key={ganados.clave} className="puntos-ganados absolute -top-3 right-4 rounded-full bg-emerald-600 px-2 py-0.5 text-sm font-bold text-white">
          +{ganados.n} pts
        </span>
      )}
    </div>
  );
}

function Lecciones({ slug, avatar, voz, lecciones, vistas, onVista }: { slug: string; avatar: DatosAvatar; voz: Voz; lecciones: Leccion[]; vistas: Set<string>; onVista: (id: string) => Promise<void> }) {
  const primera = lecciones.find(l => !vistas.has(l.id))?.id ?? lecciones[0]?.id;
  const [abierta, setAbierta] = useState<string | undefined>(primera);
  const [ocupado, setOcupado] = useState(false);
  return (
    <section className="space-y-2">
      {lecciones.map((l, i) => {
        const vista = vistas.has(l.id);
        const esta = abierta === l.id;
        return (
          <article key={l.id} className={`${tarjeta} p-0`}>
            <button
              type="button"
              onClick={() => {
                voz.callar();
                setAbierta(esta ? undefined : l.id);
              }}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              {vista ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 text-xs">{i + 1}</span>}
              <span className="flex-1 font-medium">{l.titulo}</span>
              <ChevronRight className={`size-5 text-stone-400 transition-transform ${esta ? 'rotate-90' : ''}`} />
            </button>
            {esta && (
              <div className="space-y-3 border-t border-stone-100 p-4">
                <Coach avatar={avatar} voz={voz} texto={presentacion(l)} escuchar={l.contenido} />
                <div className="text-stone-800"><TextoConCitas slug={slug} texto={l.contenido} /></div>
                {!vista && (
                  <button
                    type="button"
                    disabled={ocupado}
                    className={boton}
                    onClick={async () => {
                      setOcupado(true);
                      try {
                        voz.callar();
                        await onVista(l.id);
                        setAbierta(lecciones[i + 1]?.id);
                      } finally {
                        setOcupado(false);
                      }
                    }}
                  >
                    <Check className="size-4" /> Lo entendí{lecciones[i + 1] ? ', siguiente' : ''}
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function Revision({ calificacion, comentario }: { calificacion: number | null; comentario: string | null }) {
  if (calificacion === null) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--marca-suave)] p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-[var(--marca)]">{calificacion}</span>
      <div className="text-sm">
        <p className="font-medium">Tu instructor te calificó</p>
        {comentario && <p className="text-stone-700">{comentario}</p>}
      </div>
    </div>
  );
}

const AVISO_REVISION = 'Tu instructor puede revisar tus respuestas para darte retroalimentación. Es para que aprendas, no una evaluación de tu desempeño.';

/** Lo que dice la asistente al calificar el test: fijo, sin IA (el puntaje es automático; ver ADR 0011). */
function animo(c: Calificacion): string {
  return c.aprobado
    ? `¡Muy bien! Sacaste ${c.aciertos} de ${c.total}. Revisa las explicaciones para afianzar lo que aprendiste.`
    : `Vas bien: ${c.aciertos} de ${c.total}. Lee las explicaciones y vuelve a intentarlo cuando quieras; es para aprender, no para calificarte.`;
}

function Test({ slug, avatar, voz, moduloId, preguntas, onCalificado, revision }: { slug: string; avatar: DatosAvatar; voz: Voz; moduloId: string; preguntas: Pregunta[]; onCalificado: (c: Calificacion) => void; revision: { calificacion: number | null; comentario: string | null } | null }) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<Calificacion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const porId = new Map(resultado?.detalle.map(d => [d.pregunta_id, d]));
  return (
    <section className="space-y-3">
      {revision && <Revision {...revision} />}
      {resultado ? (
        <Coach avatar={avatar} voz={voz}>
          <p className={`text-lg font-semibold ${resultado.aprobado ? 'text-emerald-800' : 'text-amber-800'}`}>{resultado.aciertos} de {resultado.total} correctas</p>
          <p>{animo(resultado)}</p>
        </Coach>
      ) : (
        <Coach avatar={avatar} voz={voz} texto={`¡Tú puedes! Son ${preguntas.length} preguntas. Al final te explico cada respuesta con tu material.`} />
      )}
      {preguntas.map(q => {
        const d = porId.get(q.id);
        return (
          <article key={q.id} className={tarjeta}>
            <p className="mb-3 font-medium">{q.orden}. {q.enunciado}</p>
            <div className="space-y-2">
              {q.opciones.map((o, i) => {
                const elegida = respuestas[q.id] === i;
                const estilo = d
                  ? i === d.correcta ? 'border-emerald-500 bg-emerald-50' : elegida ? 'border-red-400 bg-red-50' : 'border-stone-200'
                  : elegida ? 'border-[var(--marca)] bg-[var(--marca-suave)]' : 'border-stone-200 hover:border-stone-400';
                return (
                  <button key={i} type="button" disabled={Boolean(d)} onClick={() => setRespuestas({ ...respuestas, [q.id]: i })} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${estilo}`}>
                    {d && i === d.correcta ? <CheckCircle2 className="size-4 text-emerald-600" /> : d && elegida ? <XCircle className="size-4 text-red-500" /> : null}
                    {o}
                  </button>
                );
              })}
            </div>
            {d && <p className="mt-3 text-sm text-stone-700"><TextoConCitas slug={slug} texto={d.explicacion} /></p>}
          </article>
        );
      })}
      {resultado ? (
        <button type="button" className={botonSecundario} onClick={() => { setResultado(null); setRespuestas({}); }}>Intentar de nuevo</button>
      ) : (
        <button
          type="button"
          disabled={ocupado || Object.keys(respuestas).length < preguntas.length}
          className={boton}
          onClick={async () => {
            setOcupado(true);
            try {
              const c = await enviarTest(slug, moduloId, respuestas);
              setResultado(c);
              onCalificado(c);
              if (voz.activa) voz.decir(animo(c), { modo: 'literal' });
            } finally {
              setOcupado(false);
            }
          }}
        >
          <ClipboardCheck className="size-4" /> Revisar mis respuestas
        </button>
      )}
    </section>
  );
}

type Turno = { rol: 'usuario' | 'avatar'; texto: string };

type AlCompletar = (id: string) => Promise<void>;

function Practica({ slug, avatar, voz, escenarios, practicadas, onCompletada, revisiones }: { slug: string; avatar: DatosAvatar; voz: Voz; escenarios: Escenario[]; practicadas: Set<string>; onCompletada: AlCompletar; revisiones: Record<string, { calificacion: number; comentario: string | null }> }) {
  const [activo, setActivo] = useState<Escenario | null>(null);
  if (!activo) {
    return (
      <section className="space-y-2">
        <Coach
          avatar={avatar}
          voz={voz}
          texto="Practica situaciones reales: la IA hace de la otra persona y tú le respondes escribiendo o con el micrófono. Al final te doy retroalimentación con base en tu material."
        />
        {escenarios.map(e => (
          <button key={e.id} type="button" onClick={() => setActivo(e)} className={`${tarjeta} flex w-full items-center gap-3 text-left hover:border-stone-400`}>
            {practicadas.has(e.id) ? <CheckCircle2 className="size-5 text-emerald-600" /> : <MessagesSquare className="size-5 text-stone-400" />}
            <span className="flex-1">
              <span className="block font-medium">{e.titulo}</span>
              <span className="text-sm text-stone-500">{e.situacion}</span>
              {revisiones[e.id] && (
                <span className="mt-1 block text-sm text-[var(--marca)]">
                  Tu instructor: {revisiones[e.id].calificacion}/10{revisiones[e.id].comentario ? ` · ${revisiones[e.id].comentario}` : ''}
                </span>
              )}
            </span>
            <ChevronRight className="size-5 text-stone-400" />
          </button>
        ))}
      </section>
    );
  }
  return (
    <Simulador
      slug={slug} avatar={avatar} voz={voz} escenario={activo} onCompletada={onCompletada}
      onSalir={() => {
        voz.callar();
        setActivo(null);
      }}
    />
  );
}

async function leerFlujo(res: Response, alRecibir: (texto: string) => void) {
  const lector = res.body!.getReader();
  const dec = new TextDecoder();
  let todo = '';
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    todo += dec.decode(value, { stream: true });
    alRecibir(todo);
  }
  return todo;
}

function Simulador({ slug, avatar, voz, escenario, onSalir, onCompletada }: { slug: string; avatar: DatosAvatar; voz: Voz; escenario: Escenario; onSalir: () => void; onCompletada: AlCompletar }) {
  const cliente = avatarCliente(escenario.personaje);
  const quien = quienEs(escenario.personaje);
  const [escuchando, setEscuchando] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [entrada, setEntrada] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [retro, setRetro] = useState<{ texto: string; validas: Set<string> } | null>(null);
  const [error, setError] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);

  async function hablar(historial: Turno[], evaluar = false) {
    voz.callar();
    setOcupado(true);
    setError('');
    try {
      const res = await fetch('/api/practica', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ empresa: slug, escenario: escenario.id, evaluar, mensajes: historial.slice(-60) }),
      });
      if (!res.ok || !res.body) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? 'No pude responder.');
      if (evaluar) {
        const validas = new Set((res.headers.get('x-secciones') ?? '').split(',').filter(Boolean));
        const texto = await leerFlujo(res, t => setRetro({ texto: t, validas }));
        await onCompletada(escenario.id);
        // La retroalimentación la da la asistente, con su voz (resumen).
        if (voz.activa) voz.decir(texto);
      } else {
        setTurnos([...historial, { rol: 'avatar', texto: '' }]);
        const texto = await leerFlujo(res, t => setTurnos([...historial, { rol: 'avatar', texto: t }]));
        // El cliente simulado dice su línea tal cual, con OTRA voz.
        if (voz.activa && texto.trim()) voz.decir(texto, { modo: 'literal', quien });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo falló.');
    } finally {
      setOcupado(false);
    }
  }

  /** El turno de la persona en capacitación: escrito o dictado con el micrófono (Whisper, igual que en el chat). */
  function responder(texto: string) {
    const limpio = texto.trim();
    if (!limpio || ocupado) return;
    setEntrada('');
    const h: Turno[] = [...turnos, { rol: 'usuario', texto: limpio }];
    setTurnos(h);
    hablar(h);
  }

  const empezado = turnos.length > 0;
  const respondio = turnos.some(t => t.rol === 'usuario');
  const a = retro ? analizar(retro.texto, id => retro.validas.has(id)) : null;
  return (
    <section className={`${tarjeta} space-y-4`}>
      <header>
        <button type="button" onClick={onSalir} className="text-sm text-stone-500 hover:text-stone-900">← Otras prácticas</button>
        <h2 className="mt-1 text-lg font-semibold">{escenario.titulo}</h2>
        <div className="mt-2 flex items-center gap-3">
          <div className="shrink-0">
            <Avatar avatar={cliente} estado={voz.diciendo === quien || (ocupado && !retro) ? 'hablando' : escuchando ? 'escuchando' : 'reposo'} chico />
          </div>
          <div className="text-sm">
            <p className="font-medium">{cliente.nombre}: <span className="font-normal text-stone-600">{escenario.personaje}</span></p>
            <p className="text-stone-600">{escenario.situacion}</p>
          </div>
        </div>
      </header>
      {!empezado && (
        <button type="button" disabled={ocupado} onClick={() => hablar([])} className={boton}>
          <MessageCircle className="size-4" /> {ocupado ? 'Preparando la escena…' : 'Empezar'}
        </button>
      )}
      <div className="space-y-3">
        {turnos.map((t, i) => (
          <div key={i} className={t.rol === 'usuario' ? 'flex justify-end' : ''}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${t.rol === 'usuario' ? 'rounded-br-sm bg-stone-800 text-white' : 'rounded-bl-sm bg-amber-50 text-amber-950 ring-1 ring-amber-200'}`}>
              {t.rol === 'avatar' && <span className="mb-0.5 block text-xs font-medium text-amber-700">{cliente.nombre}</span>}
              {t.texto || '…'}
            </p>
          </div>
        ))}
      </div>
      {empezado && !retro && (
        <form
          className="flex items-center gap-2"
          onSubmit={e => {
            e.preventDefault();
            responder(entrada);
          }}
        >
          <PulsarParaHablar
            slug={slug}
            deshabilitado={ocupado}
            onTexto={responder}
            onEstado={e => {
              if (e === 'grabando') voz.callar();
              setEscuchando(e === 'grabando');
            }}
          />
          <input value={entrada} onChange={e => setEntrada(e.target.value)} className={campo} placeholder="¿Qué le dices? Escribe o mantén presionado el micrófono" maxLength={1000} disabled={ocupado} />
          <button type="submit" disabled={ocupado || !entrada.trim()} className={boton}><Send className="size-4" /></button>
        </form>
      )}
      {respondio && !retro && (
        <button type="button" disabled={ocupado} onClick={() => hablar(turnos, true)} className={botonSecundario}>
          <Sparkles className="size-4" /> Terminar y ver retroalimentación
        </button>
      )}
      {a && retro && (
        <Coach avatar={avatar} voz={voz} escuchar={ocupado ? undefined : retro.texto}>
          <p className="mb-1 text-xs text-stone-500">Retroalimentación con base en tu material</p>
          <div className="whitespace-pre-wrap leading-relaxed">
            {a.trozos.map((t, i) => (t.tipo === 'texto' ? <ConNegritas key={i} texto={t.texto} /> : t.ids.map(id => <ChipCita key={`${i}-${id}`} codigo={id} onAbrir={setAbierta} />)))}
          </div>
        </Coach>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {abierta && <PanelSeccion slug={slug} codigo={abierta} onCerrar={() => setAbierta(null)} />}
    </section>
  );
}
