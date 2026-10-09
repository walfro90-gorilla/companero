import Link from 'next/link';
import { BookOpenCheck, FileUp, MessageCircleQuestion, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { AVATAR_BASE } from '@/lib/avatar';
import { PRODUCTO } from '@/lib/marca';
import { sesion } from '@/lib/sesion';
import { Avatar } from './_ui/avatar';
import { boton, tarjeta } from './_ui/estilos';

const PASOS = [
  { icono: FileUp, titulo: 'Sube tus manuales', texto: 'PDF, Word o texto. Se parten en secciones citables y RH decide qué se publica.' },
  { icono: BookOpenCheck, titulo: 'La IA arma la inducción', texto: 'Lecciones, test y situaciones prácticas a partir de tu material, con su fuente. RH aprueba.' },
  { icono: MessageCircleQuestion, titulo: 'Tu personal pregunta y practica', texto: 'Un asistente que responde citando el documento y la sección, desde el celular.' },
  { icono: UserRoundCheck, titulo: 'Lo que no sabe, lo canaliza', texto: 'Sin inventar: lo manda al supervisor o a RH, y te dice qué le falta a tu material.' },
];

export default async function Landing() {
  const conSesion = Boolean(await sesion());
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-12 p-4 py-10 md:p-10">
      <section className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{PRODUCTO.nombre}</h1>
          <p className="text-xl text-stone-700">{PRODUCTO.lema}</p>
          <p className="text-stone-600">
            Cada persona nueva repite las mismas preguntas y le quita horas a su supervisor. {PRODUCTO.nombre} acompaña la inducción y los
            refuerzos de tu personal con un asistente que solo responde con tu material autorizado.
          </p>
          <Link href={conSesion ? '/inicio' : '/entrar'} className={boton}>{conSesion ? 'Ir a mis empresas' : 'Entrar'}</Link>
        </div>
        <Avatar avatar={AVATAR_BASE} estado="reposo" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ icono: Icono, titulo, texto }) => (
          <article key={titulo} className={tarjeta}>
            <Icono className="mb-2 size-6 text-[#c81e5b]" />
            <h2 className="font-semibold">{titulo}</h2>
            <p className="text-sm text-stone-600">{texto}</p>
          </article>
        ))}
      </section>
      <p className="flex items-center gap-2 text-sm text-stone-500">
        <ShieldCheck className="size-4" /> Multiempresa y multisucursal: cada empresa ve solo lo suyo. Sin contraseñas ni datos personales de más.
      </p>
    </main>
  );
}
