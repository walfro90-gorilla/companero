import { requerirSesion } from '@/lib/sesion';
import { FormContrasena } from './formulario';

// Poner una contraseña nueva después del enlace de recuperación (docs/adr/0014).
export default async function Restablecer() {
  await requerirSesion('/restablecer');
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Tu contraseña nueva</h1>
        <FormContrasena />
      </div>
    </main>
  );
}
