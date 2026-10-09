import type { Database } from './supabase/tipos.ts';

// Roles (lógica pura: la usan servidor y navegador).
export type Rol = Database['public']['Enums']['rol_miembro'];

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: 'Administración',
  rh: 'Recursos Humanos',
  supervisor: 'Supervisión',
  colaborador: 'Colaborador',
};
