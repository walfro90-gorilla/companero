import { bienvenida } from '@/lib/avatar';
import { contextoEmpresa } from '@/lib/sesion';
import { Chat } from './chat';

export default async function Asistente({ params }: PageProps<'/e/[slug]/asistente'>) {
  const { slug } = await params;
  const { supabase, empresa, miembro } = await contextoEmpresa(slug);
  // Si hay material de ejemplo publicado, la UI lo avisa siempre (docs/adr/0004).
  const { count } = await supabase
    .from('documentos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa.id).eq('estado', 'autorizado').eq('ejemplo', true);
  return (
    <Chat
      slug={slug}
      avatar={empresa.avatar}
      bienvenida={bienvenida(empresa.avatar, empresa.nombre, miembro.puesto)}
      hayEjemplo={(count ?? 0) > 0}
    />
  );
}
