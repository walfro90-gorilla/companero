import { requerirGestion } from '@/lib/sesion';
import { boton, tarjeta } from '@/app/_ui/estilos';
import { guardarListado } from './acciones';
import { FormAvatar } from './formulario';

// Identidad del asistente de la empresa (docs/adr/0005): nombre, saludo, colores y preguntas sugeridas.
export default async function Ajustes({ params }: PageProps<'/e/[slug]/admin/ajustes'>) {
  const { slug } = await params;
  const { supabase, empresa } = await requerirGestion(slug);
  const { data: e } = await supabase.from('empresas').select('en_lista_acceso').eq('id', empresa.id).single();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">Tu asistente</h1>
      <p className="text-sm text-stone-600">Así se presenta con tu personal. Usa solo nombres, colores e imágenes que tu empresa autorice.</p>
      <FormAvatar slug={slug} avatar={empresa.avatar} />
      <form action={guardarListado.bind(null, slug)} className={`${tarjeta} space-y-3`}>
        <h2 className="font-semibold">Entrada de tus empleados</h2>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="en_lista" defaultChecked={e?.en_lista_acceso ?? true} className="mt-0.5 size-4" />
          <span>
            Mostrar a {empresa.nombre} en la lista de «Soy empleado» (solo el nombre). Si la quitas, tus empleados entran con el QR de su
            sucursal o en /acceso/{slug}.
          </span>
        </label>
        <button type="submit" className={boton}>Guardar</button>
      </form>
    </main>
  );
}
