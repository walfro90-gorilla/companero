'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Bot, FileText, Home, Inbox, Settings, Users } from 'lucide-react';

const ICONOS = {
  inicio: Home, asistente: Bot, canalizaciones: Inbox, contenido: FileText,
  modulos: BookOpen, equipo: Users, metricas: BarChart3, ajustes: Settings,
};

export type Enlace = { href: string; texto: string; icono: keyof typeof ICONOS };

export function Navegacion({ enlaces }: { enlaces: Enlace[] }) {
  const ruta = usePathname();
  const inicio = enlaces[0]?.href;
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 md:px-4">
      {enlaces.map(e => {
        const Icono = ICONOS[e.icono];
        const activo = e.href === inicio ? ruta === e.href : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${
              activo ? 'border-[var(--marca)] font-medium text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Icono className="size-4" /> {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
