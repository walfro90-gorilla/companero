import { LogOut } from 'lucide-react';

export function BotonSalir() {
  return (
    <form action="/auth/salir" method="post">
      <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900">
        <LogOut className="size-4" /> Salir
      </button>
    </form>
  );
}
