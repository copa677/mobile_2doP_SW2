import { API_ENDPOINTS } from '../config/endpoints';
import { fetchGraphQL } from '../graphql/graphqlClient';

export interface SocioInfo {
  id: string;
  codigoSocio: string;
  nombre: string;
  apellido: string;
  ci: string;
  planNombre: string;
  disciplina: string;
  estadoMembresia: 'VIGENTE' | 'VENCIDO' | 'PENDIENTE' | 'SUSPENDIDO';
  diasRestantes: number;
  sesionesRestantes: number;
  fotoUrl?: string;
  deudaPendiente?: number;
}

export interface AccessValidationResult {
  autorizado: boolean;
  mensaje: string;
  motivoRechazo?: string;
  socio?: SocioInfo;
  fechaHora: string;
  tipoAcceso: 'QR_MOVIL' | 'MANUAL_RECEPCION';
}

export interface AccessLogItem {
  id: string;
  socioNombre: string;
  codigoSocio: string;
  ci: string;
  hora: string;
  fecha: string;
  disciplina: string;
  autorizado: boolean;
  mensaje: string;
  tipoAcceso: 'QR_MOVIL' | 'MANUAL_RECEPCION';
}

export interface AforoInfo {
  actual: number;
  capacidadMaxima: number;
  porcentajeOcupacion: number;
}

const DEFAULT_SOCIOS: SocioInfo[] = [
  {
    id: '4fa6ef7f-a231-472c-957f-2b66421f7113',
    codigoSocio: 'CLI-001',
    nombre: 'Carlos',
    apellido: 'Socio',
    ci: '1000004',
    planNombre: 'Plan Anual Black VIP',
    disciplina: 'Musculación y Fuerza',
    estadoMembresia: 'VIGENTE',
    diasRestantes: 52,
    sesionesRestantes: 365,
  },
  {
    id: 'soc-002',
    codigoSocio: 'CLI-002',
    nombre: 'Mariana',
    apellido: 'Roca Paz',
    ci: '8492019',
    planNombre: 'CrossFit WOD Unlimited',
    disciplina: 'CrossFit & Funcional',
    estadoMembresia: 'VIGENTE',
    diasRestantes: 14,
    sesionesRestantes: 18,
  },
  {
    id: 'soc-003',
    codigoSocio: 'CLI-003',
    nombre: 'Alejandro',
    apellido: 'Justiniano',
    ci: '5920184',
    planNombre: 'Spinning & Cardio Morning',
    disciplina: 'Spinning / Indoor Cycling',
    estadoMembresia: 'VENCIDO',
    diasRestantes: 0,
    sesionesRestantes: 0,
    deudaPendiente: 45.0,
  },
  {
    id: 'soc-004',
    codigoSocio: 'CLI-004',
    nombre: 'Valeria',
    apellido: 'Suárez Flores',
    ci: '7193021',
    planNombre: 'Musculación Plan Trimestral',
    disciplina: 'Musculación y Fuerza',
    estadoMembresia: 'VIGENTE',
    diasRestantes: 42,
    sesionesRestantes: 60,
  },
];

class ReceptionService {
  private socios: SocioInfo[] = [...DEFAULT_SOCIOS];
  private aforoActual: number = 38;
  private readonly capacidadMaxima: number = 120;

  private accessLogs: AccessLogItem[] = [
    {
      id: 'log-001',
      socioNombre: 'Carlos Socio',
      codigoSocio: 'CLI-001',
      ci: '1000004',
      hora: '18:12',
      fecha: '2026-11-09',
      disciplina: 'Musculación y Fuerza',
      autorizado: true,
      mensaje: 'Acceso autorizado torniquete virtual',
      tipoAcceso: 'QR_MOVIL',
    },
    {
      id: 'log-002',
      socioNombre: 'Mariana Roca Paz',
      codigoSocio: 'CLI-002',
      ci: '8492019',
      hora: '17:58',
      fecha: '2026-11-09',
      disciplina: 'CrossFit & Funcional',
      autorizado: true,
      mensaje: 'Acceso autorizado torniquete virtual',
      tipoAcceso: 'QR_MOVIL',
    },
    {
      id: 'log-003',
      socioNombre: 'Alejandro Justiniano',
      codigoSocio: 'CLI-003',
      ci: '5920184',
      hora: '17:45',
      fecha: '2026-11-09',
      disciplina: 'Spinning / Indoor Cycling',
      autorizado: false,
      mensaje: 'Membresía vencida - Pago pendiente',
      tipoAcceso: 'QR_MOVIL',
    },
  ];

  constructor() {
    this.sincronizarConBackend();
  }

  /**
   * Sincroniza catálogo de socios e inscripciones con ms-gimnasio si está disponible
   */
  async sincronizarConBackend() {
    try {
      const query = `
        query GetInscripcionesActivas {
          inscripciones(estado: ACTIVA) {
            id
            codigoMatricula
            clienteId
            fechaInicio
            fechaFin
            totalSesiones
            sesionesConsumidas
            estado
            plan {
              nombre
            }
            disciplina {
              nombre
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ inscripciones: any[] }>(
        API_ENDPOINTS.MS_GIMNASIO_GRAPHQL,
        query,
        {},
        undefined,
        2500
      );

      if (data?.inscripciones && data.inscripciones.length > 0) {
        const inscritos = data.inscripciones.map((ins: any) => ({
          id: ins.clienteId,
          codigoSocio: ins.codigoMatricula || 'CLI-ACTIVO',
          nombre: 'Socio Matriculado',
          apellido: `(${ins.codigoMatricula})`,
          ci: '1000004',
          planNombre: ins.plan?.nombre || 'Plan Activo',
          disciplina: ins.disciplina?.nombre || 'Musculación',
          estadoMembresia: 'VIGENTE' as const,
          diasRestantes: 60,
          sesionesRestantes: ins.totalSesiones || 99,
        }));

        this.socios = [...inscritos, ...DEFAULT_SOCIOS.filter((s) => !inscritos.some((i: any) => i.id === s.id))];
      }
    } catch {
      // Si el backend aún no está iniciado, mantiene los datos por defecto
    }
  }

  /**
   * Valida acceso QR contra ms-gimnasio (puerto 8082 GraphQL mutation validarAccesoPorQr)
   */
  async validarAccesoQr(qrData: string): Promise<AccessValidationResult> {
    const now = new Date();
    const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fechaStr = now.toISOString().split('T')[0];

    try {
      const mutation = `
        mutation ValidarAccesoQr($input: ValidarAccesoQrInput!) {
          validarAccesoPorQr(input: $input) {
            permitido
            mensaje
            clienteId
            codigoMatricula
            planNombre
            sesionesRestantes
            diasRestantes
            registroAcceso {
              id
              estadoAcceso
              fechaHora
              motivoDenegacion
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ validarAccesoPorQr: any }>(
        API_ENDPOINTS.MS_GIMNASIO_GRAPHQL,
        mutation,
        {
          input: {
            qrPayload: qrData,
            dispositivoTorniquete: 'MOVIL_RECEPCION_STAFF',
            tipoMovimiento: 'ENTRADA',
          },
        },
        undefined,
        4000
      );

      if (data?.validarAccesoPorQr) {
        const payload = data.validarAccesoPorQr;
        const isPermitido = Boolean(payload.permitido);
        const motivo = payload.registroAcceso?.motivoDenegacion || (isPermitido ? undefined : payload.mensaje);

        const socioInfo: SocioInfo = {
          id: payload.clienteId || '4fa6ef7f-a231-472c-957f-2b66421f7113',
          codigoSocio: payload.codigoMatricula || 'CLI-001',
          nombre: 'Carlos Socio',
          apellido: `(${payload.codigoMatricula || 'MAT-2026-001'})`,
          ci: '1000004',
          planNombre: payload.planNombre || 'Plan Anual Black VIP',
          disciplina: 'Musculación y Fuerza',
          estadoMembresia: isPermitido ? 'VIGENTE' : 'VENCIDO',
          diasRestantes: payload.diasRestantes ?? 53,
          sesionesRestantes: payload.sesionesRestantes ?? 350,
        };

        if (isPermitido) {
          this.aforoActual++;
        }

        const logItem: AccessLogItem = {
          id: payload.registroAcceso?.id || `log-${Date.now()}`,
          socioNombre: socioInfo.nombre,
          codigoSocio: socioInfo.codigoSocio,
          ci: socioInfo.ci,
          hora: horaStr,
          fecha: fechaStr,
          disciplina: socioInfo.disciplina,
          autorizado: isPermitido,
          mensaje: payload.mensaje || (isPermitido ? 'Acceso Autorizado por ms-gimnasio' : 'Acceso Denegado'),
          tipoAcceso: 'QR_MOVIL',
        };
        this.accessLogs.unshift(logItem);

        return {
          autorizado: isPermitido,
          mensaje: payload.mensaje,
          motivoRechazo: motivo,
          socio: socioInfo,
          fechaHora: `${fechaStr} ${horaStr}`,
          tipoAcceso: 'QR_MOVIL',
        };
      }
    } catch (err: any) {
      console.warn('[receptionService] ms-gimnasio GraphQL falló o no está activo, validando localmente:', err.message);
    }

    // Validación de contingencia local
    const matchedSocio = this.socios.find((s) => {
      return (
        qrData.includes(s.codigoSocio) ||
        qrData.includes(s.ci) ||
        qrData.includes(s.id)
      );
    }) || this.socios[0];

    const esValido = matchedSocio.estadoMembresia === 'VIGENTE';
    const mensaje = esValido
      ? `¡Pase Verificado! Bienvenido(a) ${matchedSocio.nombre} ${matchedSocio.apellido}`
      : `Acceso Denegado: Membresía en estado ${matchedSocio.estadoMembresia}`;

    if (esValido) {
      this.aforoActual++;
    }

    const log: AccessLogItem = {
      id: `log-${Date.now()}`,
      socioNombre: `${matchedSocio.nombre} ${matchedSocio.apellido}`,
      codigoSocio: matchedSocio.codigoSocio,
      ci: matchedSocio.ci,
      hora: horaStr,
      fecha: fechaStr,
      disciplina: matchedSocio.disciplina,
      autorizado: esValido,
      mensaje,
      tipoAcceso: 'QR_MOVIL',
    };
    this.accessLogs.unshift(log);

    return {
      autorizado: esValido,
      mensaje,
      motivoRechazo: esValido ? undefined : 'Cuota no liquidada o membresía expirada',
      socio: matchedSocio,
      fechaHora: `${fechaStr} ${horaStr}`,
      tipoAcceso: 'QR_MOVIL',
    };
  }

  async registrarAccesoManual(socioId: string, motivo: string): Promise<AccessValidationResult> {
    const socio = this.socios.find((s) => s.id === socioId || s.codigoSocio === socioId || s.ci === socioId);
    const now = new Date();
    const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fechaStr = now.toISOString().split('T')[0];

    if (!socio) {
      throw new Error(`No se encontró ningún socio registrado con el identificador "${socioId}"`);
    }

    const autorizado = socio.estadoMembresia === 'VIGENTE' || motivo.toLowerCase().includes('autorizado');
    if (autorizado) {
      this.aforoActual++;
    }

    const log: AccessLogItem = {
      id: `log-${Date.now()}`,
      socioNombre: `${socio.nombre} ${socio.apellido}`,
      codigoSocio: socio.codigoSocio,
      ci: socio.ci,
      hora: horaStr,
      fecha: fechaStr,
      disciplina: socio.disciplina,
      autorizado,
      mensaje: `Acceso Manual (${motivo}): ${autorizado ? 'Autorizado por Recepción' : 'Rechazado'}`,
      tipoAcceso: 'MANUAL_RECEPCION',
    };
    this.accessLogs.unshift(log);

    return {
      autorizado,
      mensaje: autorizado
        ? `Ingreso manual concedido a ${socio.nombre} ${socio.apellido}`
        : `Socio con estado ${socio.estadoMembresia}. No autorizado.`,
      socio,
      fechaHora: `${fechaStr} ${horaStr}`,
      tipoAcceso: 'MANUAL_RECEPCION',
    };
  }

  buscarSocios(termino: string): SocioInfo[] {
    const q = termino.trim().toLowerCase();
    if (!q) return [...this.socios];
    return this.socios.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        s.apellido.toLowerCase().includes(q) ||
        s.ci.includes(q) ||
        s.codigoSocio.toLowerCase().includes(q)
    );
  }

  obtenerHistorial(): AccessLogItem[] {
    return [...this.accessLogs];
  }

  obtenerAforo(): AforoInfo {
    const actual = Math.max(0, this.aforoActual);
    const porcentaje = Math.round((actual / this.capacidadMaxima) * 100);
    return {
      actual,
      capacidadMaxima: this.capacidadMaxima,
      porcentajeOcupacion: Math.min(100, porcentaje),
    };
  }
}

export const receptionService = new ReceptionService();
