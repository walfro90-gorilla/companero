import type { CSSProperties } from 'react';
import Link from 'next/link';
import { NOMBRE_ROL, contextoEmpresa } from '@/lib/sesion';
import { BotonSalir } from '@/app/_ui/salir';
import { Navegacion, type Enlace } from './navegacion';

// Marco de cada empresa (docs/adr/0009): color de marca, nombre y menú según el rol.
export default async function LayoutEmpresa({ children, params }: LayoutProps<'/e/[slug]'>) {
  const { slug } = await params;
  const { empresa, miembro, gestiona, supervisa, usuario } = await contextoEmpresa(slug);
  const base = `/e/${slug}`;
  const enlaces: Enlace[] = [
    { href: base, texto: 'Inicio', icono: 'inicio' },
    { href: `${base}/asistente`, texto: empresa.avatar.nombre, icono: 'asistente' },
    ...(supervisa ? [{ href: `${base}/canalizaciones`, texto: 'Dudas del equipo', icono: 'canalizaciones' } as const] : []),
    ...(gestiona
      ? ([
          { href: `${base}/admin/contenido`, texto: 'Contenido', icono: 'contenido' },
          { href: `${base}/admin/modulos`, texto: 'Módulos', icono: 'modulos' },
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
              {usuario.anonimo ? 'Invitado' : (miembro.nombre ?? usuario.email)} · {NOMBRE_ROL[miembro.rol]}
              {miembro.puesto ? ` · ${miembro.puesto}` : ''}
            </span>
          </Link>
          <BotonSalir />
        </div>
        <Navegacion enlaces={enlaces} />
      </header>
      {children}
    </div>
  );
}
