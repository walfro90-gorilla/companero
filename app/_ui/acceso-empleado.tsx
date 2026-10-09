'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, LogIn } from 'lucide-react';
import { boton, campo, etiqueta } from './estilos';

// Entrada del empleado (docs/adr/0014): solo su número de reloj. Con `codigo` (QR de sucursal), un número nuevo
// queda dado de alta en esa sucursal.
export function AccesoEmpleado({ empresa, codigo, next }: { empresa?: string; codigo?: string; next?: string }) {
  const router = useRouter();
  const [numero, setNumero] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError('');
    const res = await fetch('/api/acceso-reloj', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ numero, empresa, codigo, next }),
    });
    const j = (await res.json().catch(() => null)) as { destino?: string; error?: string } | null;
    if (!res.ok || !j?.destino) {
      setOcupado(false);
      setError(j?.error ?? 'No se pudo entrar. Intenta de nuevo.');
      return;
    }
    router.replace(j.destino);
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="space-y-3">
      <label className="block">
        <span className={etiqueta}>Tu número de reloj</span>
        <input
          value={numero} onChange={e => setNumero(e.target.value.toUpperCase())} required maxLength={20} autoFocus
          autoComplete="off" autoCapitalize="characters" inputMode="text" placeholder="0001"
          className={`${campo} text-center text-2xl font-semibold tracking-[0.3em]`}
        />
      </label>
      <button type="submit" disabled={ocupado || !numero.trim()} className={`${boton} w-full`}>
        <LogIn className="size-4" /> {ocupado ? 'Entrando…' : 'Entrar'}
      </button>
      {codigo && (
        <p className="flex gap-1.5 text-xs text-stone-500">
          <BadgeCheck className="size-4 shrink-0" /> Si es tu primera vez, escribe tu número y quedas registrado en esta sucursal.
        </p>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <p className="pt-2 text-center text-xs text-stone-500">
        ¿Eres de administración o RH? <Link href="/entrar" className="underline">Entra con tu correo</Link>
      </p>
    </form>
  );
}
