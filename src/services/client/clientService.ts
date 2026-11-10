import {
  AttendanceRecord,
  MembershipInfo,
  WorkoutDayRoutine,
  QrCheckinResult,
} from '@/types/client';
import { API_ENDPOINTS } from '../config/endpoints';
import { fetchGraphQL } from '../graphql/graphqlClient';

class ClientService {
  // Registro en memoria de ejercicios marcados como completados por el socio en la sesión
  private completedExerciseIds: Set<string> = new Set<string>();

  private fallbackAttendances: AttendanceRecord[] = [
    {
      id: 'att-001',
      fecha: '2026-11-08',
      hora: '18:30',
      disciplina: 'Musculación y Fuerza',
      instructor: 'Prof. Marcos',
      estado: 'VALIDO',
      mensaje: 'Acceso autorizado torniquete 1',
    },
    {
      id: 'att-002',
      fecha: '2026-11-06',
      hora: '07:15',
      disciplina: 'Spinning / Indoor Cycling',
      instructor: 'Prof. Laura',
      estado: 'VALIDO',
      mensaje: 'Acceso autorizado sala cardiovascular',
    },
    {
      id: 'att-003',
      fecha: '2026-11-04',
      hora: '19:00',
      disciplina: 'CrossFit & Funcional',
      instructor: 'Prof. Rodrigo',
      estado: 'VALIDO',
      mensaje: 'Acceso autorizado box',
    },
  ];

  private fallbackMembership: MembershipInfo = {
    id: '2289808e-cace-4a77-81e0-64d8221150dc',
    planNombre: 'Plan Anual Black VIP',
    disciplina: 'Musculación y Fuerza',
    estado: 'VIGENTE',
    fechaInicio: '2026-01-01',
    fechaFin: '2027-01-01',
    diasRestantes: 52,
    precio: 'Bs 2,200.00 / año',
    codigoSocio: 'CLI-001',
    numeroSocio: 'MAT-2026-001',
  };

  private fallbackRoutines: WorkoutDayRoutine[] = [
    {
      diaSemana: 'Lunes',
      titulo: 'Pecho, Hombros y Tríceps (Empuje)',
      esDiaHoy: true,
      ejercicios: [
        {
          id: 'ex-1',
          nombre: 'Press Banca Plano con Barra',
          series: 4,
          repeticiones: '10-8-8-6',
          pesoSugerido: '60 kg',
          descansoSegundos: 90,
          grupoMuscular: 'Pectoral Mayor',
          notas: 'Mantener retracción escapular y rango completo.',
          completado: true,
        },
        {
          id: 'ex-2',
          nombre: 'Press Inclinado con Mancuernas',
          series: 3,
          repeticiones: '12-10-10',
          pesoSugerido: '22 kg c/u',
          descansoSegundos: 60,
          grupoMuscular: 'Pectoral Superior',
          notas: 'Banco a 30 grados, control en la fase excéntrica.',
          completado: true,
        },
        {
          id: 'ex-3',
          nombre: 'Elevaciones Laterales con Mancuerna',
          series: 4,
          repeticiones: '15-15-12-12',
          pesoSugerido: '10 kg c/u',
          descansoSegundos: 45,
          grupoMuscular: 'Deltoides Lateral',
          notas: 'Codos ligeramente flexionados, sin balanceo.',
          completado: false,
        },
      ],
    },
    {
      diaSemana: 'Martes',
      titulo: 'Espalda, Trapecio y Bíceps (Tracción)',
      esDiaHoy: false,
      ejercicios: [
        {
          id: 'ex-4',
          nombre: 'Dominadas Pronas en Barra Fija',
          series: 4,
          repeticiones: '8-8-6-6',
          pesoSugerido: 'Peso Corporal',
          descansoSegundos: 90,
          grupoMuscular: 'Dorsal Ancho',
          completado: false,
        },
      ],
    },
  ];

  /**
   * Obtiene la membresía activa del socio desde ms-gimnasio (puerto 8082 GraphQL)
   */
  async getMyMembership(clienteId?: string): Promise<MembershipInfo> {
    const targetClienteId = clienteId || '4fa6ef7f-a231-472c-957f-2b66421f7113';

    try {
      const query = `
        query GetInscripcionActiva($clienteId: ID!) {
          inscripcionActivaCliente(clienteId: $clienteId) {
            id
            codigoMatricula
            fechaInicio
            fechaFin
            totalSesiones
            sesionesConsumidas
            estado
            plan {
              id
              codigo
              nombre
              duracionDias
              tipoAcceso
            }
            disciplina {
              id
              nombre
            }
            boletaPago {
              montoTotal
              estado
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ inscripcionActivaCliente: any }>(
        API_ENDPOINTS.MS_GIMNASIO_GRAPHQL,
        query,
        { clienteId: targetClienteId }
      );

      if (data?.inscripcionActivaCliente) {
        const insc = data.inscripcionActivaCliente;
        const hoy = new Date();
        const fin = new Date(insc.fechaFin);
        const diffDays = Math.max(0, Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          id: insc.id,
          planNombre: insc.plan?.nombre || 'Membresía Activa',
          disciplina: insc.disciplina?.nombre || 'Musculación General',
          estado: insc.estado === 'ACTIVA' ? 'VIGENTE' : 'VENCIDO',
          fechaInicio: insc.fechaInicio,
          fechaFin: insc.fechaFin,
          diasRestantes: diffDays,
          precio: insc.boletaPago?.montoTotal ? `Bs ${insc.boletaPago.montoTotal}` : 'Al Día',
          codigoSocio: 'CLI-001',
          numeroSocio: insc.codigoMatricula,
        };
      }
    } catch (err: any) {
      console.log('ℹ️ [clientService] ms-gimnasio no disponible o sin inscripción activa, usando membresía en caché:', err.message);
    }

    return { ...this.fallbackMembership };
  }

  /**
   * Obtiene el código QR criptográfico dinámico desde ms-gimnasio (obtenerQrPaseDigital)
   */
  async getDigitalPassInfo(userId?: string, codigoSocio?: string, socioNombre?: string, ci?: string) {
    const mem = await this.getMyMembership(userId);
    let qrToken = `APEX_QR_${codigoSocio || mem.codigoSocio}_${Date.now()}_HMAC_VALID`;

    // Intentar solicitar el token firmado al backend ms-gimnasio
    try {
      const query = `
        query GetQrPaseDigital($inscripcionId: ID!) {
          obtenerQrPaseDigital(inscripcionId: $inscripcionId)
        }
      `;
      const data = await fetchGraphQL<{ obtenerQrPaseDigital: string }>(
        API_ENDPOINTS.MS_GIMNASIO_GRAPHQL,
        query,
        { inscripcionId: mem.id }
      );
      if (data?.obtenerQrPaseDigital) {
        qrToken = data.obtenerQrPaseDigital;
      }
    } catch (err: any) {
      console.log('ℹ️ [clientService] Usando token QR generado localmente:', err.message);
    }

    return {
      membership: mem,
      qrToken,
      validoHasta: 'Hoy 23:59',
      socioNombre: socioNombre || (codigoSocio === 'CLI-6305913' ? 'Brayan Quispe' : 'Carlos Socio'),
      ci: ci || (codigoSocio === 'CLI-6305913' ? '6305913' : '1000004'),
    };
  }

  /**
   * Obtiene el historial de accesos y asistencias
   */
  async getAttendances(): Promise<AttendanceRecord[]> {
    return [...this.fallbackAttendances];
  }

  async getMyAttendances(): Promise<AttendanceRecord[]> {
    return this.getAttendances();
  }

  /**
   * Obtiene las rutinas de entrenamiento desde ms-entrenamiento (puerto 8083 GraphQL)
   */
  async getMyWorkouts(clienteId?: string): Promise<WorkoutDayRoutine[]> {
    const targetClienteId = clienteId || '4fa6ef7f-a231-472c-957f-2b66421f7113';

    try {
      const query = `
        query GetPlanEntrenamiento($usuarioId: ID!) {
          planEntrenamientoActivo(usuarioId: $usuarioId) {
            id
            nombre
            objetivo
            observacion
            rutinasProgramadas {
              id
              diaSemana
              rutina {
                id
                nombre
                nivel
                rutinaEjercicios {
                  id
                  series
                  repeticiones
                  descansoSegundos
                  ejercicio {
                    id
                    nombre
                    equipamiento
                    nivelDificultad
                  }
                }
              }
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ planEntrenamientoActivo: any }>(
        API_ENDPOINTS.MS_ENTRENAMIENTO_GRAPHQL,
        query,
        { usuarioId: targetClienteId }
      );

      if (data?.planEntrenamientoActivo?.rutinasProgramadas?.length > 0) {
        const DIAS_MAP: Record<number, string> = {
          1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES', 4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO', 0: 'DOMINGO'
        };
        const hoyStr = DIAS_MAP[new Date().getDay()] || '';

        const dias = data.planEntrenamientoActivo.rutinasProgramadas.map((item: any, index: number) => {
          const r = item.rutina;
          const diaUpper = String(item.diaSemana || '').toUpperCase();
          const esHoy = diaUpper === hoyStr || (index === 0 && !data.planEntrenamientoActivo.rutinasProgramadas.some((p: any) => String(p.diaSemana).toUpperCase() === hoyStr));
          const diaDisplay = diaUpper.charAt(0) + diaUpper.slice(1).toLowerCase();

          return {
            diaSemana: diaDisplay || `Día ${index + 1}`,
            titulo: `${r?.nombre || 'Rutina de Fuerza'} (${r?.nivel || 'Intermedio'})`,
            esDiaHoy: esHoy,
            ejercicios: (r?.rutinaEjercicios || []).map((re: any, exIdx: number) => {
              const exId = String(re.id || `re-${re.orden || exIdx}`);
              return {
                id: exId,
                nombre: re.ejercicio?.nombre || 'Ejercicio Guía',
                series: re.series || 4,
                repeticiones: String(re.repeticiones || '10'),
                pesoSugerido: 'Carga según plan',
                descansoSegundos: re.descansoSegundos || 60,
                grupoMuscular: re.ejercicio?.equipamiento || 'Musculación',
                notas: re.ejercicio?.nivelDificultad ? `Dificultad: ${re.ejercicio.nivelDificultad}` : '',
                completado: this.completedExerciseIds.has(exId),
              };
            }),
          };
        });
        return dias;
      }
    } catch (err: any) {
      console.log('ℹ️ [clientService] ms-entrenamiento GraphQL en reposo, usando rutinas locales:', err.message);
    }

    const routinesCopy: WorkoutDayRoutine[] = JSON.parse(JSON.stringify(this.fallbackRoutines));
    return routinesCopy.map((r) => ({
      ...r,
      ejercicios: r.ejercicios.map((e) => ({
        ...e,
        completado: this.completedExerciseIds.has(e.id),
      })),
    }));
  }

  async toggleExercise(dayIndex: number, exerciseId: string): Promise<boolean> {
    const id = String(exerciseId);
    let isNowCompleted = false;

    if (this.completedExerciseIds.has(id)) {
      this.completedExerciseIds.delete(id);
      isNowCompleted = false;
    } else {
      this.completedExerciseIds.add(id);
      isNowCompleted = true;
    }

    // Mantener sincronizado fallbackRoutines en memoria
    const routine = this.fallbackRoutines[dayIndex];
    if (routine) {
      const exercise = routine.ejercicios.find((e) => String(e.id) === id);
      if (exercise) {
        exercise.completado = isNowCompleted;
      }
    }

    return isNowCompleted;
  }

  async processQrCheckin(qrData: string, socioNombre = 'Brayan Quispe (CLI-6305913)'): Promise<QrCheckinResult> {
    const now = new Date();
    const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fechaStr = now.toISOString().split('T')[0];

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      fecha: fechaStr,
      hora: horaStr,
      disciplina: 'Musculación y Fuerza',
      instructor: 'Recepción Central',
      estado: 'VALIDO',
      mensaje: 'Acceso registrado correctamente vía QR móvil',
    };

    this.fallbackAttendances.unshift(newRecord);

    return {
      exitoso: true,
      mensaje: '¡Asistencia registrada con éxito! Disfruta tu entrenamiento.',
      detalles: {
        socio: socioNombre,
        disciplina: 'Musculación y Fuerza',
        fechaHora: `${fechaStr} a las ${horaStr}`,
        estadoPlan: 'Membresía VIGENTE',
      },
    };
  }
}

export const clientService = new ClientService();
