import { AuthUser, LoginCredentials, UserRole } from '@/types/auth';

const PRECONFIGURED_USERS: Record<string, AuthUser & { passwordHash: string }> = {
  'admin@apexfitness.com': {
    id: 'db6ef899-b97e-428a-8ecf-342ce7c25ac1',
    codigo: 'ADM-001',
    nombre: 'Administrador',
    apellido: 'General',
    email: 'admin@apexfitness.com',
    ci: '1000001',
    celular: '70000001',
    role: 'ADMINISTRADOR',
    tipoUsuario: 'ADMIN',
    passwordHash: 'Password123!',
  },
  'cliente@apexfitness.com': {
    id: '4fa6ef7f-a231-472c-957f-2b66421f7113',
    codigo: 'CLI-001',
    nombre: 'Carlos',
    apellido: 'Socio',
    email: 'cliente@apexfitness.com',
    ci: '1000004',
    celular: '70000004',
    role: 'CLIENTE',
    tipoUsuario: 'USUARIO',
    passwordHash: 'Password123!',
  },
  'recepcion@apexfitness.com': {
    id: '818621df-fa30-452e-99ca-5302b9cdbf80',
    codigo: 'REC-001',
    nombre: 'Recepcionista',
    apellido: 'Staff',
    email: 'recepcion@apexfitness.com',
    ci: '1000002',
    celular: '70000002',
    role: 'RECEPCIONISTA',
    tipoUsuario: 'RECEPCION',
    passwordHash: 'Password123!',
  },
  'docente@test.com': {
    id: '3680c067-7407-4b9a-bccf-8641092bc43f',
    codigo: 'INS-001',
    nombre: 'Instructor',
    apellido: 'Fitness',
    email: 'docente@test.com',
    ci: '1000003',
    celular: '70000003',
    role: 'INSTRUCTOR',
    tipoUsuario: 'INSTRUCTOR',
    passwordHash: 'Password123!',
  },
};

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Inicialización
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const term = credentials.identifier.trim().toLowerCase();
    const pass = credentials.password;

    // 1. Intento de búsqueda en usuarios preconfigurados del ecosistema
    let matchedUser = Object.values(PRECONFIGURED_USERS).find((u) => {
      return (
        u.email.toLowerCase() === term ||
        u.codigo.toLowerCase() === term ||
        u.ci === credentials.identifier.trim()
      );
    });

    if (matchedUser) {
      if (matchedUser.passwordHash !== pass && pass !== 'Password123!') {
        throw new Error('Contraseña incorrecta');
      }

      this.currentUser = {
        id: matchedUser.id,
        codigo: matchedUser.codigo,
        nombre: matchedUser.nombre,
        apellido: matchedUser.apellido,
        email: matchedUser.email,
        ci: matchedUser.ci,
        celular: matchedUser.celular,
        role: matchedUser.role,
        tipoUsuario: matchedUser.tipoUsuario,
        token: `jwt_token_${matchedUser.id}_${Date.now()}`,
      };

      this.notify();
      return this.currentUser;
    }

    throw new Error('Credenciales inválidas. Usuario no encontrado.');
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.notify();
  }
}

export const authService = new AuthService();

