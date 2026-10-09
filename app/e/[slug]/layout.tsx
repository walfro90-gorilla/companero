import type { CSSProperties } from 'react';
import Link from 'next/link';
import { NOMBRE_ROL, contextoEmpresa } from '@/lib/sesion';
import { BotonSalir } from '@/app/_ui/salir';
import { Navegacion, type Enlace } from './navegacion';

// Marco de cada empresa (docs/adr/0009): color de marca, nombre y menú según el rol.
export default async function LayoutEmpresa({ children, params }: LayoutProps<'/e/[slug]'>) {
  const { slug } = await params;
  const { supabase, empresa, miembro, gestiona, supervisa, usuario } = await contextoEmpresa(slug);
  // Franja de contenido ficticio en TODAS las pantallas si la empresa usa material de ejemplo (ADR 0013).
  const { count: ficticios } = await supabase
    .from('documentos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa.id).eq('ejemplo', true).neq('estado', 'archivado');
  const base = `/e/${slug}`;
  const enlaces: Enlace[] = [
    { href: base, texto: 'Inicio', icono: 'inicio' },
    { href: `${base}/asistente`, texto: empresa.avatar.nombre, icono: 'asistente' },
    ...(supervisa ? [{ href: `${base}/canalizaciones`, texto: 'Dudas del equipo', icono: 'canalizaciones' } as const] : []),
    ...(gestiona
      ? ([
          { href: `${base}/admin/contenido`, texto: 'Contenido', icono: 'contenido' },
          { href: `${base}/admin/modulos`, texto: 'Módulos', icono: 'modulos' },
          { href: `${base}/admin/respuestas`, texto: 'Respuestas', icono: 'respuestas' },
          { href: `${base}/admin/equipo`, texto: 'Equipo', icono: 'equipo' },
          { href: `${base}/admin/metricas`, texto: 'Métricas', icono: 'metricas' },
          { href: `${base}/admin/ajustes`, texto: 'Asistente', icono: 'ajustes' },
        ] as const)
      : []),
  ];
  const estilo = { '--marca': empresa.avatar.colores.camisa, '--marca-suave': empresa.avatar.colores.fondo } as CSSProperties;
  return (
    <div className="flex flex-1 flex-col" style={estilo}>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 md:px-6">
          <Link href="/inicio?elegir" className="min-w-0">
            <span className="block truncate font-semibold">{empresa.nombre}</span>
            <span className="block truncate text-xs text-stone-500">
              {miembro.numero_reloj ? `Núm. ${miembro.numero_reloj}${miembro.nombre ? ` · ${miembro.nombre}` : ''}` : (miembro.nombre ?? usuario.email)} · {NOMBRE_ROL[miembro.rol]}
              {miembro.puesto ? ` · ${miembro.puesto}` : ''}
            </span>
          </Link>
          <BotonSalir />
        </div>
        <Navegacion enlaces={enlaces} />
      </header>
      {(ficticios ?? 0) > 0 && (
        <p className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
          <strong>Contenido ficticio con fines de demostración.</strong> No describe políticas, precios ni sistemas reales de
          Del Río, Superette ni de ninguna otra empresa.
        </p>
      )}
      {children}
    </div>
  );
}
