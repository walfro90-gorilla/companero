import { headers } from 'next/headers';
import { z } from 'zod';
import { altaEmpleado } from '@/lib/empleados';
import { abrirSesion } from '@/lib/sesion-empleado';
import { LIMITE_ALTAS, LIMITE_FALLOS, VENTANA_MIN, normalizarNumero } from '@/lib/reloj';
import { accesoRelojDisponible, clienteAdmin } from '@/lib/supabase/admin';
import { rutaSegura } from '@/lib/texto';

// Acceso de empleados por número de reloj (docs/adr/0014). Desde la página de la empresa solo entran números ya
// registrados; desde el QR de una sucursal, un número nuevo queda dado de alta como colaborador de esa sucursal.
// Admin y RH no entran por aquí (correo y contraseña). Límites por IP: intentos fallidos y altas nuevas por QR.

const Cuerpo = z.object({
  numero: z.string().max(40),
  empresa: z.string().regex(/^[a-z0-9-]{3,40}$/).optional(),
  codigo: z.string().regex(/^[A-Za-z0-9]{6,12}$/).optional(),
  next: z.string().max(300).optional(),
});

const error = (mensaje: string, status: number) => Response.json({ error: mensaje }, { status });

export async function POST(request: Request) {
  if (!accesoRelojDisponible()) return error('El acceso por número de reloj no está configurado.', 503);
  const datos = Cuerpo.safeParse(await request.json().catch(() => null));
  if (!datos.success || (!datos.data.empresa && !datos.data.codigo)) return error('Datos inválidos.', 400);
  const numero = normalizarNumero(datos.data.numero);
  if (!numero) return error('Escribe tu número de reloj (letras, números o guion).', 400);

  const admin = clienteAdmin();
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'local').split(',')[0].trim();
  const desde = new Date(Date.now() - VENTANA_MIN * 60_000).toISOString();
  const { count } = await admin.from('accesos_reloj').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('exito', false).gte('creado_en', desde);
  if ((count ?? 0) >= LIMITE_FALLOS) return error(`Demasiados intentos. Espera ${VENTANA_MIN} minutos o pide ayuda a tu supervisor.`, 429);

  // ¿A qué empresa y sucursal entra?
  let empresa: { id: string; slug: string } | null = null;
  let sucursalId: string | null = null;
  if (datos.data.codigo) {
    const { data: s } = await admin
      .from('sucursales').select('id, empresas!inner(id, slug)').eq('codigo_union', datos.data.codigo.toUpperCase()).eq('activa', true).maybeSingle();
    if (s) {
      empresa = s.empresas;
      sucursalId = s.id;
    }
  } else {
    const { data: e } = await admin.from('empresas').select('id, slug').eq('slug', datos.data.empresa!).maybeSingle();
    empresa = e;
  }
  const fallo = async (mensaje: string, status: number) => {
    await admin.from('accesos_reloj').insert({ ip, empresa_id: empresa?.id ?? null, numero, exito: false });
    return error(mensaje, status);
  };
  if (!empresa) return fallo('No encontré tu empresa. Usa el QR de tu sucursal.', 404);

  const { data: miembro } = await admin
    .from('miembros').select('usuario_id, rol').eq('empresa_id', empresa.id).eq('numero_reloj', numero).maybeSingle();
  let usuarioId = miembro?.usuario_id ?? null;
  if (miembro && (miembro.rol === 'admin' || miembro.rol === 'rh')) {
    return fallo('Este número es de administración: entra con tu correo y contraseña.', 403);
  }
  let nuevo = false;
  if (!usuarioId) {
    if (!sucursalId) return fallo('Ese número de reloj no está registrado. Escanea el QR de tu sucursal o pide tu alta a RH.', 404);
    const { count: altas } = await admin.from('accesos_reloj').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('alta', true).gte('creado_en', desde);
    if ((altas ?? 0) >= LIMITE_ALTAS) return error(`Se dieron de alta muchos números desde esta red. Espera ${VENTANA_MIN} minutos o pide tu alta a RH.`, 429);
    const alta = await altaEmpleado(admin, { empresaId: empresa.id, numero, sucursalId, rol: 'colaborador' });
    if ('error' in alta) return error(alta.error, 500);
    usuarioId = alta.usuarioId;
    nuevo = alta.nuevo;
  }

  const sesion = await abrirSesion(admin, usuarioId);
  if (sesion === 'saturado') return error('Hay muchas entradas en este momento. Intenta de nuevo en un minuto.', 503);
  if (sesion === 'error') return error('No se pudo abrir la sesión. Intenta de nuevo.', 500);
  await admin.from('accesos_reloj').insert({ ip, empresa_id: empresa.id, numero, exito: true, alta: nuevo });
  const base = `/e/${empresa.slug}`;
  const next = rutaSegura(datos.data.next, base);
  return Response.json({ destino: next.startsWith(base) ? next : base });
}
