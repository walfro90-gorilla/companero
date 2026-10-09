'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { boton, botonSecundario, campo, etiqueta } from '../_ui/estilos';

// Entrada de administración y RH (docs/adr/0014): correo y contraseña. Los empleados entran con su número de
// reloj desde la página de su empresa o el QR de su sucursal. Sin Google ni modo invitado.

type Modo = 'entrar' | 'crear' | 'recuperar' | 'confirmar';

export function FormularioEntrar({ next }: { next: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const correo = () => email.trim().toLowerCase();
  const listo = () => {
    router.replace(next);
    router.refresh();
  };
  const terminar = (mensaje?: string) => {
    setOcupado(false);
    if (mensaje) setError(mensaje);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError('');
    setAviso('');
    const supabase = clienteNavegador();
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email: correo(), password });
      if (error) return terminar(error.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'Correo o contraseña incorrectos.');
      return listo();
    }
    if (modo === 'crear') {
      if (password.length < 8) return terminar('La contraseña necesita al menos 8 caracteres.');
      const { data, error } = await supabase.auth.signUp({ email: correo(), password });
      if (error) return terminar(error.message.includes('registered') ? 'Ese correo ya tiene cuenta: entra con tu contraseña.' : 'No se pudo crear la cuenta.');
      if (data.session) return listo();
      // El proyecto pide confirmar el correo: llega un código de 6 dígitos (supabase/templates/codigo.html).
      setModo('confirmar');
      setAviso(`Te mandamos un código a ${correo()}.`);
      return terminar();
    }
    if (modo === 'confirmar') {
      const { error } = await supabase.auth.verifyOtp({ email: correo(), token: codigo.trim(), type: 'signup' });
      if (error) return terminar('El código no es correcto o ya venció.');
      return listo();
    }
    const destino = new URL('/auth/callback', window.location.origin);
    destino.searchParams.set('next', '/restablecer');
    const { error } = await supabase.auth.resetPasswordForEmail(correo(), { redirectTo: destino.toString() });
    if (error) return terminar('No se pudo mandar el correo. Intenta más tarde.');
    setAviso('Si ese correo tiene cuenta, te llegó un enlace para poner una contraseña nueva.');
    terminar();
  }

  const titulo = { entrar: 'Entrar', crear: 'Crear cuenta de administración', recuperar: 'Recuperar contraseña', confirmar: 'Confirma tu correo' }[modo];
  return (
    <form onSubmit={enviar} className="space-y-3">
      <h2 className="font-semibold">{titulo}</h2>
      {modo !== 'confirmar' && (
        <label className="block">
          <span className={etiqueta}>Correo</span>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={campo} autoComplete="email" placeholder="tu@empresa.com" />
        </label>
      )}
      {(modo === 'entrar' || modo === 'crear') && (
        <label className="block">
          <span className={etiqueta}>Contraseña{modo === 'crear' ? ' (mínimo 8 caracteres)' : ''}</span>
          <input type="password" required minLength={modo === 'crear' ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} className={campo}
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} />
        </label>
      )}
      {modo === 'confirmar' && (
        <input inputMode="numeric" autoComplete="one-time-code" required pattern="\d{6}" maxLength={6} value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} className={`${campo} text-center text-2xl tracking-[0.5em]`} placeholder="000000" />
      )}
      <button type="submit" disabled={ocupado} className={`${boton} w-full`}>
        {modo === 'crear' ? <UserPlus className="size-4" /> : modo === 'recuperar' ? <KeyRound className="size-4" /> : <LogIn className="size-4" />}
        {ocupado ? 'Un momento…' : { entrar: 'Entrar', crear: 'Crear cuenta', recuperar: 'Mandarme el enlace', confirmar: 'Confirmar' }[modo]}
      </button>
      {aviso && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{aviso}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap justify-between gap-2 pt-1 text-sm">
        {modo !== 'entrar' && <button type="button" onClick={() => setModo('entrar')} className={botonSecundario}>Ya tengo cuenta</button>}
        {modo === 'entrar' && (
          <>
            <button type="button" onClick={() => setModo('recuperar')} className="text-stone-500 hover:text-stone-900">¿Olvidaste tu contraseña?</button>
            <button type="button" onClick={() => setModo('crear')} className="text-stone-500 hover:text-stone-900">Registrar mi empresa</button>
          </>
        )}
      </div>
    </form>
  );
}
