import { bienvenida } from '@/lib/avatar';
import { contextoEmpresa } from '@/lib/sesion';
import { Chat } from './chat';

// La franja de contenido ficticio la pone el layout de la empresa (ADR 0013).
export default async function Asistente({ params }: PageProps<'/e/[slug]/asistente'>) {
  const { slug } = await params;
  const { empresa, miembro } = await contextoEmpresa(slug);
  return <Chat slug={slug} avatar={empresa.avatar} bienvenida={bienvenida(empresa.avatar, empresa.nombre, miembro.puesto)} />;
}
