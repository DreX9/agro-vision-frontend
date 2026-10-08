export type RolUsuarioTipo = 'ADMINISTRADOR' | 'AGRONOMO' | 'SUPERVISOR' | 'OPERADOR';
export type SexoUsuarioTipo = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  rol: RolUsuarioTipo;
  sexo?: SexoUsuarioTipo | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  activo: boolean;
  createdAt: string;
}

export interface CrearUsuarioPeticion {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  rol: RolUsuarioTipo;
  sexo?: SexoUsuarioTipo;
  fechaNacimiento?: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
}

export interface ActualizarUsuarioPeticion {
  nombres: string;
  apellidos: string;
  correo: string;
  password?: string;
  rol: RolUsuarioTipo;
  sexo?: SexoUsuarioTipo;
  fechaNacimiento?: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
}

export interface FiltroUsuariosPeticion {
  busqueda?: string;
  rol?: string;
  activo?: boolean;
  pagina?: number;
  limite?: number;
}

export interface ListaPaginadaUsuarios {
  elementos: Usuario[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

