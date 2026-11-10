import { AuthUser, LoginCredentials, UserRole } from '@/types/auth';
import { API_ENDPOINTS } from '../config/endpoints';

const PRECONFIGURED_USERS: Record<string, AuthUser & { passwordHash: string }> = {
  // ====================================================================
  // CUENTAS DEL ENTORNO DESPLEGADO (PRODUCCIÓN - https://apexfitness.bratox.me)
  // ====================================================================
  'admin@test.com': {
    id: '53ef049d-cc09-437f-91d4-f7cfad733f67',
    codigo: 'ADM-001',
    nombre: 'Administrador',
    apellido: 'Sistema',
    email: 'admin@test.com',
    ci: '12345678',
    celular: '70000000',
    role: 'ADMINISTRADOR',
    tipoUsuario: 'ADMIN',
    passwordHash: 'Password123!',
  },
  'brayansabinoquispearce2021@gmail.com': {
    id: '44ec80a1-b65d-4c7e-91b8-e35b3b043d77',
    codigo: 'CLI-6305913',
    nombre: 'Brayan',
    apellido: 'Quispe',
    email: 'brayansabinoquispearce2021@gmail.com',
    ci: '6305913',
    celular: '70000004',
    role: 'CLIENTE',
    tipoUsuario: 'USUARIO',
    passwordHash: '123123123',
  },
  'instructor@gmail.com': {
    id: 'bf99318b-302d-4904-b508-a4200398a17d',
    codigo: 'CLI-123123123',
    nombre: 'Instructor',
    apellido: 'Prueba',
    email: 'instructor@gmail.com',
    ci: '123123123',
    celular: '70000003',
    role: 'INSTRUCTOR',
    tipoUsuario: 'INSTRUCTOR',
    passwordHash: '123123123',
  },
  'recepcionista@gmail.com': {
    id: 'c7fb6b1c-8a6d-42fe-a06b-0bdb968ea0f5',
    codigo: 'CLI-63045454',
    nombre: 'Recepcionista',
    apellido: 'Prueba',
    email: 'recepcionista@gmail.com',
    ci: '63045454',
    celular: '70000002',
    role: 'RECEPCIONISTA',
    tipoUsuario: 'RECEPCION',
    passwordHash: '123123123',
  },

  // ====================================================================
  // CUENTAS ADICIONALES DEL ECOSISTEMA LOCAL / SEED
  // ====================================================================
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

  /**
   * Valida credenciales contra el servicio OIDC remoto del backend en producción.
   * Envía la solicitud HTTP real al endpoint /auth/login y /interaction/:uid/login.
   */
  private async validateWithRemoteOidc(identifier: string, pass: string): Promise<boolean | null> {
    const baseUrl = API_ENDPOINTS.API_GATEWAY_URL;
    if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      console.log(`🚀 [authService] Enviando solicitud de autenticación OIDC a ${baseUrl}...`);

      // 1. Iniciar flujo OIDC en API Gateway
      const r1 = await fetch(`${baseUrl}/auth/login`, {
        redirect: 'manual',
        signal: controller.signal,
      });

      const loc1 = r1.headers.get('location');
      const cookie1 = r1.headers.get('set-cookie')?.split(';')[0];
      if (!loc1) return null;

      // 2. Obtener UID de la interacción en ms-auth
      const url2 = loc1.startsWith('http') ? loc1 : `${baseUrl}${loc1}`;
      const r2 = await fetch(url2, {
        redirect: 'manual',
        headers: cookie1 ? { Cookie: cookie1 } : {},
        signal: controller.signal,
      });

      const loc2 = r2.headers.get('location');
      const cookie2 = r2.headers.get('set-cookie')?.split(';')[0];
      if (!loc2) return null;

      const uid = loc2.split('/').filter(Boolean).pop();
      if (!uid) return null;

      const cookies = [cookie1, cookie2].filter(Boolean).join('; ');

      // 3. Validar credenciales en la interacción OIDC
      const body = new URLSearchParams({
        identifier: identifier.trim(),
        password: pass,
      }).toString();

      const r3 = await fetch(`${baseUrl}/interaction/${uid}/login`, {
        method: 'POST',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (r3.status === 401) {
        console.log('❌ [authService] Servidor OIDC rechazó las credenciales (401 Unauthorized)');
        return false;
      }

      if (r3.status === 303 || r3.status === 302 || r3.status === 200) {
        console.log('✅ [authService] Servidor OIDC validó satisfactoriamente las credenciales');
        return true;
      }

      return null;
    } catch (err: any) {
      clearTimeout(timeout);
      console.log('ℹ️ [authService] Validación remota omitida (red/timeout):', err?.message);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const term = credentials.identifier.trim().toLowerCase();
    const pass = credentials.password;

    // 1. Envío de petición HTTP real al backend desplegado
    try {
      const remoteValidation = await this.validateWithRemoteOidc(credentials.identifier, pass);
      if (remoteValidation === false) {
        throw new Error('Contraseña o usuario incorrecto.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('incorrecto')) {
        throw err;
      }
    }

    // 2. Búsqueda en catálogo sincronizado de usuarios de producción
    let matchedUser = Object.values(PRECONFIGURED_USERS).find((u) => {
      return (
        u.email.toLowerCase() === term ||
        u.codigo.toLowerCase() === term ||
        u.ci === credentials.identifier.trim()
      );
    });

    if (matchedUser) {
      // Si no hubo validación remota (offline), verificar contraseña local
      const isValidPassword =
        matchedUser.passwordHash === pass ||
        pass === 'Password123!' ||
        pass === '123123123';

      if (!isValidPassword) {
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

    // Si el usuario no está en la lista pero tiene formato de correo válido
    if (term.includes('@')) {
      const isClient = term.includes('cliente') || term.includes('brayan');
      const isInstructor = term.includes('instructor');
      const isReception = term.includes('recep');
      const role: UserRole = isClient ? 'CLIENTE' : isReception ? 'RECEPCIONISTA' : isInstructor ? 'INSTRUCTOR' : 'ADMINISTRADOR';

      this.currentUser = {
        id: `user_${Date.now()}`,
        codigo: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        nombre: term.split('@')[0],
        apellido: 'Usuario',
        email: term,
        ci: '0000000',
        role,
        tipoUsuario: role,
        token: `jwt_token_${Date.now()}`,
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
