'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, UserRound } from 'lucide-react';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { boton, botonSecundario, campo, etiqueta } from '../_ui/estilos';

// Entrar sin contraseña (docs/adr/0009): Google, o correo + código de 6 dígitos (funciona aunque el correo se
// abra en otro dispositivo, a diferencia del enlace mágico con PKCE). Invitado: sesión anónima.

function IconoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function FormularioEntrar({ next, invitado }: { next: string; invitado: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  const entrar = () => {
    router.replace(next);
    router.refresh();
  };

  async function google() {
    setOcupado(true);
    setError('');
    const destino = new URL('/auth/callback', window.location.origin);
    destino.searchParams.set('next', next);
    const { error } = await clienteNavegador().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: destino.toString() } });
    // En éxito el navegador se va a Google; solo llegamos aquí si falla.
    if (error) {
      setOcupado(false);
      setError('No se pudo entrar con Google. Usa tu correo o intenta de nuevo.');
    }
  }

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError('');
    const { error } = await clienteNavegador().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    setOcupado(false);
    if (error) setError(error.status === 429 ? 'Se pidieron muchos códigos. Espera un momento.' : 'No pudimos mandar el código. Revisa el correo.');
    else setPaso('codigo');
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError('');
    const { error } = await clienteNavegador().auth.verifyOtp({ email: email.trim().toLowerCase(), token: codigo.trim(), type: 'email' });
    if (error) {
      setOcupado(false);
      setError('El código no es correcto o ya venció.');
    } else entrar();
  }

  async function comoInvitado() {
    setOcupado(true);
    setError('');
    const { error } = await clienteNavegador().auth.signInAnonymously();
    if (error) {
      setOcupado(false);
      setError('El modo invitado no está disponible.');
    } else entrar();
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={google} disabled={ocupado} className={`${botonSecundario} w-full`}>
        <IconoGoogle /> Entrar con Google
      </button>
      <div className="flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" /> o con tu correo <span className="h-px flex-1 bg-stone-200" />
      </div>
      {paso === 'correo' ? (
        <form onSubmit={pedirCodigo} className="space-y-3">
          <label className="block">
            <span className={etiqueta}>Correo</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={campo} placeholder="tu@correo.com" autoComplete="email" />
          </label>
          <button type="submit" disabled={ocupado || !email} className={`${boton} w-full`}>
            <Mail className="size-4" /> Mandarme un código
          </button>
        </form>
      ) : (
        <form onSubmit={verificar} className="space-y-3">
          <label className="block">
            <span className={etiqueta}>Código que llegó a {email}</span>
            <input
              inputMode="numeric" autoComplete="one-time-code" required pattern="\d{6}" maxLength={6} value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} className={`${campo} text-center text-2xl tracking-[0.5em]`} placeholder="000000"
            />
          </label>
          <button type="submit" disabled={ocupado || codigo.length !== 6} className={`${boton} w-full`}>Entrar</button>
          <button type="button" onClick={() => setPaso('correo')} className="w-full text-sm text-stone-500 hover:text-stone-800">Usar otro correo</button>
        </form>
      )}
      {invitado && (
        <button type="button" onClick={comoInvitado} disabled={ocupado} className="flex w-full items-center justify-center gap-2 text-sm text-stone-600 hover:text-stone-900">
          <UserRound className="size-4" /> Probar como invitado
        </button>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
