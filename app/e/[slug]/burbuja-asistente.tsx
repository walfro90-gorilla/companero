'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import type { Avatar as DatosAvatar } from '@/lib/avatar';
import { Chat } from './asistente/chat';

// La asistente a la mano en todas las secciones de la empresa (pedido de Wal, 10-oct): una burbuja abajo a la derecha
// que abre el mismo chat (citas, voz, micrófono y canalización). Vive en el layout, así que la conversación se
// conserva al cambiar de sección. En la página de la asistente no se muestra: ahí ya está el chat completo.
export function BurbujaAsistente({ slug, avatar, bienvenida }: { slug: string; avatar: DatosAvatar; bienvenida: string }) {
  const ruta = usePathname();
  const [abierta, setAbierta] = useState(false);
  // Se monta al abrirla por primera vez y luego solo se oculta, para no perder la conversación.
  const [usada, setUsada] = useState(false);
  if (ruta?.startsWith(`/e/${slug}/asistente`)) return null;

  return (
    <>
      {usada && (
        <div
          role="dialog"
          aria-label={`Chat con ${avatar.nombre}`}
          className={`${abierta ? 'flex' : 'hidden'} fixed inset-0 z-40 flex-col overflow-hidden bg-white md:inset-auto md:bottom-24 md:right-6 md:h-[min(680px,calc(100dvh-8rem))] md:w-[440px] md:rounded-2xl md:border md:border-stone-200 md:shadow-2xl`}
        >
          <Chat slug={slug} avatar={avatar} bienvenida={bienvenida} compacto onCerrar={() => setAbierta(false)} />
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setUsada(true);
          setAbierta(!abierta);
        }}
        aria-expanded={abierta}
        aria-label={abierta ? 'Cerrar el chat' : `Pregúntale a ${avatar.nombre}`}
        className={`${abierta ? 'hidden md:inline-flex' : 'inline-flex'} fixed bottom-4 right-4 z-40 items-center gap-2 rounded-full bg-[var(--marca,#c81e5b)] px-4 py-3 font-medium text-white shadow-lg hover:opacity-90 md:bottom-6 md:right-6`}
      >
        {abierta ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span>{abierta ? 'Cerrar' : `Pregúntale a ${avatar.nombre}`}</span>
      </button>
    </>
  );
}
