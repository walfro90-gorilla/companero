'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { boton, campo } from '@/app/_ui/estilos';
import { responderCanalizacion, type EstadoRespuesta } from './acciones';

/** Escucha canalizaciones nuevas de la empresa (Realtime respeta la RLS) y refresca la bandeja. */
export function EnVivo({ empresaId }: { empresaId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = clienteNavegador();
    const canal = supabase
      .channel(`canalizaciones-${empresaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canalizaciones', filter: `empresa_id=eq.${empresaId}` }, cambio => {
        if (cambio.eventType === 'INSERT') navigator.vibrate?.([200, 100, 200]);
        router.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [empresaId, router]);
  return null;
}

export function FormRespuesta({ slug, id }: { slug: string; id: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoRespuesta, FormData>(responderCanalizacion.bind(null, slug, id), {});
  return (
    <form action={accion} className="mt-3 flex gap-2">
      <input name="respuesta" required className={campo} placeholder="Tu respuesta…" maxLength={2000} />
      <button type="submit" disabled={pendiente} className={boton}><Send className="size-4" /></button>
      {estado.error && <p className="text-sm text-red-700">{estado.error}</p>}
    </form>
  );
}
