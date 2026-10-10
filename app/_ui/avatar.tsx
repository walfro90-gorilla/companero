import type { Avatar as DatosAvatar } from '@/lib/avatar';

// Personaje 2D (docs/adr/0005); colores y nombre por empresa. Los estados solo cambian la animación (globals.css).

export type EstadoAvatar = 'reposo' | 'escuchando' | 'pensando' | 'hablando' | 'canalizando';

/** Estrella de 5 picos (la del uniforme de Del Río) centrada en (cx, cy). */
function estrella(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radio = i % 2 ? r * 0.42 : r;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + radio * Math.cos(ang)).toFixed(1)},${(cy + radio * Math.sin(ang)).toFixed(1)}`;
  }).join(' ');
}

const ETIQUETA: Record<EstadoAvatar, string> = {
  reposo: 'Lista para ayudarte',
  escuchando: 'Te escucho…',
  pensando: 'Revisando tu material…',
  hablando: 'Respondiendo',
  canalizando: 'Esto le toca a otra persona',
};

export function Avatar({ avatar, estado, chico = false }: { avatar: DatosAvatar; estado: EstadoAvatar; chico?: boolean }) {
  const c = avatar.colores;
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 200 200"
        className={`avatar ${chico ? 'size-20' : 'size-40 md:size-56'}`}
        data-estado={estado}
        role="img"
        aria-label={`${avatar.nombre}: ${ETIQUETA[estado]}`}
      >
        <circle cx="100" cy="100" r="96" fill={c.fondo} />
        {estado === 'escuchando' && <circle className="avatar-escucha" cx="100" cy="100" r="92" fill="none" stroke={c.camisa} strokeWidth="5" />}
        <g className="avatar-cuerpo">
          {/* Cabello de atrás */}
          <path d="M48 98 C44 46 156 46 152 98 L156 150 L44 150 Z" fill={c.cabello} />
          {/* Cuerpo y camisa */}
          <path d="M40 200 C44 160 70 146 100 146 C130 146 156 160 160 200 Z" fill={c.camisa} />
          {c.detalle ? (
            <g>
              {/* Vivos de los hombros y franja de la bolsa */}
              <path d="M50 180 C55 167 63 158 74 152" fill="none" stroke={c.detalle} strokeWidth="4" strokeLinecap="round" />
              <path d="M150 180 C145 167 137 158 126 152" fill="none" stroke={c.detalle} strokeWidth="4" strokeLinecap="round" />
              <rect x="62" y="178" width="24" height="4" rx="1" fill={c.detalle} />
              {/* Cuello tipo polo */}
              <path d="M90 146 L100 160 L110 146 Z" fill={c.detalle} />
              <path d="M88 145 L100 162 L93 171 L79 150 Z" fill={c.detalle} stroke="#00000030" strokeWidth="1" />
              <path d="M112 145 L100 162 L107 171 L121 150 Z" fill={c.detalle} stroke="#00000030" strokeWidth="1" />
            </g>
          ) : (
            <path d="M88 146 L100 162 L112 146 Z" fill="#fff" />
          )}
          {/* Cuello y cara */}
          <rect x="88" y="124" width="24" height="26" rx="8" fill={c.piel} />
          <ellipse cx="100" cy="98" rx="42" ry="46" fill={c.piel} />
          {/* Fleco recto: cubre toda la parte de arriba de la cabeza y llega a las cejas */}
          <path d="M54 96 C52 34 148 34 146 96 C140 84 124 80 100 80 C76 80 60 84 54 96 Z" fill={c.cabello} />
          {/* Ojos */}
          <ellipse className="avatar-ojo" cx="84" cy="98" rx="5" ry="6.5" fill="#1c1917" />
          <ellipse className="avatar-ojo" cx="116" cy="98" rx="5" ry="6.5" fill="#1c1917" />
          {/* Mejillas */}
          <circle cx="74" cy="114" r="6" fill="#f29b9b" opacity="0.45" />
          <circle cx="126" cy="114" r="6" fill="#f29b9b" opacity="0.45" />
          {/* Boca */}
          <ellipse className="avatar-boca" cx="100" cy="122" rx="10" ry="7" fill="#7f1d1d" />
          {c.acento ? (
            /* Estrella en el pecho, donde va el logo del uniforme */
            <polygon points={estrella(130, 178, 9)} fill={c.acento} stroke={c.detalle ?? '#fff'} strokeWidth="1.5" strokeLinejoin="round" />
          ) : (
            <g>
              {/* Gafete */}
              <rect x="118" y="168" width="26" height="16" rx="3" fill="#fff" />
              <rect x="122" y="173" width="18" height="2.5" rx="1" fill={c.camisa} />
              <rect x="122" y="178" width="12" height="2.5" rx="1" fill="#a8a29e" />
            </g>
          )}
        </g>
        {estado === 'pensando' && (
          <g>
            <rect x="132" y="22" width="52" height="26" rx="13" fill="#fff" stroke="#e7e5e4" />
            <circle className="avatar-punto" cx="146" cy="35" r="4" fill="#78716c" />
            <circle className="avatar-punto" cx="158" cy="35" r="4" fill="#78716c" />
            <circle className="avatar-punto" cx="170" cy="35" r="4" fill="#78716c" />
          </g>
        )}
        {estado === 'canalizando' && (
          <g>
            <circle cx="160" cy="40" r="18" fill="#f59e0b" />
            <text x="160" y="47" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">!</text>
          </g>
        )}
      </svg>
      <figcaption className={chico ? 'sr-only' : 'text-center'}>
        <span className="block text-lg font-semibold">{avatar.nombre}</span>
        <span className="text-sm text-stone-500" aria-live="polite">{ETIQUETA[estado]}</span>
      </figcaption>
    </figure>
  );
}
