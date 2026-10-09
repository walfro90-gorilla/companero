'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { boton, campo } from '@/app/_ui/estilos';

export function FormContrasena() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async e => {
        e.preventDefault();
        if (password.length < 8) return setError('Mínimo 8 caracteres.');
        setOcupado(true);
        const { error } = await clienteNavegador().auth.updateUser({ password });
        if (error) {
          setOcupado(false);
          return setError('No se pudo guardar. Intenta de nuevo.');
        }
        router.replace('/inicio');
      }}
    >
      <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={campo} autoComplete="new-password" />
      <button type="submit" disabled={ocupado} className={`${boton} w-full`}>Guardar</button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
