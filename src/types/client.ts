export interface AttendanceRecord {
  id: string;
  fecha: string;        // YYYY-MM-DD
  hora: string;         // HH:mm
  disciplina: string;   // Sala de Musculación, Spinning, CrossFit, etc.
  instructor?: string;
  estado: 'VALIDO' | 'DENEGADO' | 'FUERA_HORARIO';
  mensaje?: string;
}

export interface MembershipInfo {
  id: string;
  planNombre: string;
  disciplina: string;
  estado: 'VIGENTE' | 'VENCIDO' | 'PENDIENTE';
  fechaInicio: string;
  fechaFin: string;
  diasRestantes: number;
  precio: string;
  codigoSocio: string;
  numeroSocio: string;
}

export interface WorkoutExercise {
  id: string;
  nombre: string;
  series: number;
  repeticiones: string; // ej: "12-10-8" o "15"
  pesoSugerido?: string; // ej: "25 kg"
  descansoSegundos: number;
  grupoMuscular: string;
  notas?: string;
  completado: boolean;
}

export interface WorkoutDayRoutine {
  diaSemana: string;    // Lunes, Martes, Miércoles, etc.
  titulo: string;       // Pecho y Tríceps, Pierna y Abdomen, etc.
  esDiaHoy: boolean;
  ejercicios: WorkoutExercise[];
}

export interface QrCheckinResult {
  exitoso: boolean;
  mensaje: string;
  detalles?: {
    socio: string;
    disciplina: string;
    fechaHora: string;
    estadoPlan: string;
  };
}

