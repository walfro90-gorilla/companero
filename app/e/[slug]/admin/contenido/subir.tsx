'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, CheckCircle2, ClipboardPaste, RotateCcw, Trash2, Upload } from 'lucide-react';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { boton, botonSecundario, campo, etiqueta, tarjeta } from '@/app/_ui/estilos';
import { borrarDocumento, cambiarEstado, crearDesdeTexto, crearDocumento, procesarDocumento, type Resultado } from './acciones';

const TIPOS = '.pdf,.docx,.md,.txt';
const MAX_BYTES = 20 * 1024 * 1024;

export function Subir({ slug }: { slug: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<'archivo' | 'texto'>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [paso, setPaso] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function subir(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    try {
      if (modo === 'texto') {
        setPaso('Partiendo en secciones y preparando la búsqueda con IA…');
        setResultado(await crearDesdeTexto(slug, titulo, texto));
      } else {
        if (!archivo) return;
        if (archivo.size > MAX_BYTES) return setResultado({ ok: false, error: 'El archivo pesa más de 20 MB.' });
        setPaso('Registrando…');
        const doc = await crearDocumento(slug, titulo || archivo.name.replace(/\.[^.]+$/, ''), archivo.name);
        if ('error' in doc) return setResultado({ ok: false, error: doc.error });
        setPaso('Subiendo el archivo…');
        const { error } = await clienteNavegador().storage.from('documentos').upload(doc.ruta, archivo, { contentType: archivo.type || undefined, upsert: true });
        if (error) return setResultado({ ok: false, error: 'No se pudo subir el archivo.' });
        setPaso('Leyendo el documento, partiéndolo en secciones y preparando la búsqueda con IA…');
        setResultado(await procesarDocumento(slug, doc.id));
      }
      setArchivo(null);
      setTitulo('');
      setTexto('');
      router.refresh();
    } finally {
      setPaso('');
    }
  }

  return (
    <form onSubmit={subir} className={`${tarjeta} space-y-3`}>
      <div className="flex gap-2">
        <button type="button" onClick={() => setModo('archivo')} className={modo === 'archivo' ? boton : botonSecundario}><Upload className="size-4" /> Subir archivo</button>
        <button type="button" onClick={() => setModo('texto')} className={modo === 'texto' ? boton : botonSecundario}><ClipboardPaste className="size-4" /> Pegar texto</button>
      </div>
      <label className="block">
        <span className={etiqueta}>Título</span>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} className={campo} placeholder="Manual de caja" />
      </label>
      {modo === 'archivo' ? (
        <label className="block">
          <span className={etiqueta}>Archivo (PDF, Word, Markdown o texto; hasta 20 MB)</span>
          <input type="file" accept={TIPOS} onChange={e => setArchivo(e.target.files?.[0] ?? null)} className={campo} />
        </label>
      ) : (
        <label className="block">
          <span className={etiqueta}>Texto (usa ## para separar secciones, si puedes)</span>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={8} className={campo} placeholder={'## Apertura de caja\n1. …'} />
        </label>
      )}
      <button type="submit" disabled={Boolean(paso) || (modo === 'archivo' ? !archivo : !texto.trim())} className={boton}>
        {paso ? 'Procesando…' : 'Agregar al material'}
      </button>
      {paso && <p className="text-sm text-stone-600">{paso}</p>}
      {resultado && (resultado.ok ? (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <p className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="size-4" /> Quedó en {resultado.secciones} secciones ({resultado.conContexto} con contexto para la búsqueda). Revísalo y publícalo.</p>
          {resultado.avisos.map(a => <p key={a}>{a}</p>)}
        </div>
      ) : (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{resultado.error}</p>
      ))}
    </form>
  );
}

export function AccionesDocumento({ slug, id, estado }: { slug: string; id: string; estado: 'borrador' | 'autorizado' | 'archivado' }) {
  const [pendiente, iniciar] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <div className="flex items-center gap-1">
      {estado !== 'autorizado' && (
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => cambiarEstado(slug, id, 'autorizado'))} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
          Publicar
        </button>
      )}
      {estado === 'autorizado' && (
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => cambiarEstado(slug, id, 'archivado'))} title="Archivar (deja de usarse)" className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
          <Archive className="size-4" />
        </button>
      )}
      {estado === 'archivado' && (
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => cambiarEstado(slug, id, 'borrador'))} title="Regresar a borrador" className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
          <RotateCcw className="size-4" />
        </button>
      )}
      {confirmar ? (
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => borrarDocumento(slug, id))} className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white">¿Borrar?</button>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)} title="Borrar" className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-600">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
