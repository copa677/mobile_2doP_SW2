export type UserRole = 'ADMINISTRADOR' | 'CLIENTE' | 'RECEPCIONISTA' | 'INSTRUCTOR';

export interface AuthUser {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  celular?: string;
  role: UserRole;
  tipoUsuario: string;
  token?: string;
}

export interface LoginCredentials {
  identifier: string; // Email, Código o CI
  password: string;
}

