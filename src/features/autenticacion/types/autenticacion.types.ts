export interface IniciarSesionPeticion {
  correo: string;
  password: string;
}

export interface UsuarioSesion {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  correo: string;
  rol: string;
  telefono?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  accessToken: string;
  refreshToken: string;
  expiraEn: number;
}
