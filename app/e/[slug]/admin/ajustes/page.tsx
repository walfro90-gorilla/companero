import { requerirGestion } from '@/lib/sesion';
import { FormAvatar } from './formulario';

// Identidad del asistente de la empresa (docs/adr/0005): nombre, saludo, colores y preguntas sugeridas.
export default async function Ajustes({ params }: PageProps<'/e/[slug]/admin/ajustes'>) {
  const { slug } = await params;
  const { empresa } = await requerirGestion(slug);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">Tu asistente</h1>
      <p className="text-sm text-stone-600">Así se presenta con tu personal. Usa solo nombres, colores e imágenes que tu empresa autorice.</p>
      <FormAvatar slug={slug} avatar={empresa.avatar} />
    </main>
  );
}
