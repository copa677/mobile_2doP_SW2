export interface DailyReportClassItem {
  id: string;
  nombre: string;
  hora: string;
  instructor: string;
  asistentes: number;
  capacidad: number;
  ocupacion_porcentaje: number;
}

export interface DailyReportData {
  fecha: string;
  total_asistentes: number;
  pico_horario: string;
  nuevos_miembros_hoy: number;
  recaudacion_total_hoy: string;
  ventas_mostrador_hoy: string;
  cuotas_cobradas_hoy: string;
  clases_hoy: DailyReportClassItem[];
}

export interface FinancialReportData {
  anio: number;
  mes: number;
  ingresos_totales: string;
  mrr_estimado: string;
  cuotas_vencidas_monto: string;
  socios_al_dia: number;
  socios_morosos: number;
  tasa_churn_porcentaje: number;
}

export interface MemberAtRiskItem {
  id: string;
  numero_socio: string;
  nombre: string;
  telefono: string | null;
  plan: string;
  dias_inactivo: number;
  ultimo_checkin: string;
}

export interface MembersAtRiskData {
  total_en_riesgo: number;
  criterio_dias: number;
  socios_muestra: MemberAtRiskItem[];
}

export interface TopProductItem {
  sku: string;
  nombre: string;
  categoria: string;
  unidades_vendidas: number;
  ingresos_totales: string;
}

export interface TopProductsData {
  total_productos_analizados: number;
  top: TopProductItem[];
}

export interface ClassPerformanceItem {
  clase: string;
  instructor: string;
  total_sesiones: number;
  asistencia_promedio: number;
  capacidad_promedio: number;
  ocupacion_promedio_porcentaje: number;
}

export interface ClassesPerformanceData {
  periodo_dias: number;
  clases: ClassPerformanceItem[];
}

export interface ModelInfo {
  id: string;
  name: string;
  sizeMB: number;
  recommended: boolean;
  filename: string;
  downloadUrl: string;
  sha256?: string;
  description: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: number;
  last_query: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls_json?: string;
  raw_metrics_json?: string;
  created_at: number;
}
