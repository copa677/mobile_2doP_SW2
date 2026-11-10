import { API_ENDPOINTS } from '../config/endpoints';
import {
  DailyReportData,
  FinancialReportData,
  MembersAtRiskData,
  TopProductsData,
  ClassesPerformanceData
} from '@/types/reports';

let API_BASE_URL = API_ENDPOINTS.BFF_URL;

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url;
};

export const getApiBaseUrl = () => API_BASE_URL;

// Métricas base de respaldo cuando el microservicio de reportes 8000 está en reposo
const FALLBACK_DAILY: DailyReportData = {
  fecha: new Date().toISOString().split('T')[0],
  total_asistentes: 38,
  pico_horario: '18:30 - 20:00',
  nuevos_miembros_hoy: 3,
  recaudacion_total_hoy: '2850.00',
  ventas_mostrador_hoy: '450.00',
  cuotas_cobradas_hoy: '2400.00',
  clases_hoy: [
    { id: 'c1', nombre: 'Musculación y Fuerza', hora: '18:00', instructor: 'Prof. Marcos', asistentes: 28, capacidad: 50, ocupacion_porcentaje: 56 },
    { id: 'c2', nombre: 'Spinning / Indoor Cycling', hora: '19:00', instructor: 'Prof. Laura', asistentes: 22, capacidad: 25, ocupacion_porcentaje: 88 },
    { id: 'c3', nombre: 'CrossFit WOD', hora: '20:00', instructor: 'Prof. Rodrigo', asistentes: 18, capacidad: 20, ocupacion_porcentaje: 90 },
  ],
};

const FALLBACK_FINANCIAL: FinancialReportData = {
  anio: 2026,
  mes: 11,
  ingresos_totales: '48250.00',
  mrr_estimado: '42500.00',
  cuotas_vencidas_monto: '3200.00',
  socios_al_dia: 142,
  socios_morosos: 8,
  tasa_churn_porcentaje: 3.2,
};

const FALLBACK_AT_RISK: MembersAtRiskData = {
  total_en_riesgo: 4,
  criterio_dias: 14,
  socios_muestra: [
    { id: 's1', numero_socio: 'CLI-003', nombre: 'Alejandro Justiniano', telefono: '70012345', plan: 'Spinning & Cardio', dias_inactivo: 18, ultimo_checkin: '2026-10-22' },
    { id: 's2', numero_socio: 'CLI-009', nombre: 'Fernando Torrico', telefono: '70098765', plan: 'Musculación Trimestral', dias_inactivo: 15, ultimo_checkin: '2026-10-25' },
  ],
};

const FALLBACK_TOP_PRODUCTS: TopProductsData = {
  total_productos_analizados: 25,
  top: [
    { sku: 'PROD-001', nombre: 'Proteína Whey Isolate 2kg', categoria: 'Suplementos', unidades_vendidas: 34, ingresos_totales: '1870.00' },
    { sku: 'PROD-002', nombre: 'Creatina Creapure 300g', categoria: 'Suplementos', unidades_vendidas: 28, ingresos_totales: '1120.00' },
    { sku: 'PROD-003', nombre: 'Bebida Isotónica 500ml', categoria: 'Bebidas', unidades_vendidas: 62, ingresos_totales: '620.00' },
  ],
};

const FALLBACK_CLASSES: ClassesPerformanceData = {
  periodo_dias: 30,
  clases: [
    { clase: 'Musculación y Fuerza', instructor: 'Prof. Marcos', total_sesiones: 120, asistencia_promedio: 32.4, capacidad_promedio: 50, ocupacion_promedio_porcentaje: 64.8 },
    { clase: 'Spinning / Indoor Cycling', instructor: 'Prof. Laura', total_sesiones: 60, asistencia_promedio: 21.6, capacidad_promedio: 25, ocupacion_promedio_porcentaje: 86.4 },
    { clase: 'CrossFit & Funcional', instructor: 'Prof. Rodrigo', total_sesiones: 45, asistencia_promedio: 17.5, capacidad_promedio: 20, ocupacion_promedio_porcentaje: 87.5 },
  ],
};

async function fetchJsonWithFallback<T>(endpoint: string, fallbackData: T): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout rápido

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Si no hay respuesta en el puerto 8000, devuelve las métricas locales de contingencia
  }
  return fallbackData;
}

export const bffService = {
  getDailyReport: (dateStr?: string): Promise<DailyReportData> => {
    const query = dateStr ? `?target_date=${dateStr}` : '';
    return fetchJsonWithFallback<DailyReportData>(`/reports/daily${query}`, FALLBACK_DAILY);
  },

  getFinancialReport: (year = 2026, month = 11): Promise<FinancialReportData> => {
    return fetchJsonWithFallback<FinancialReportData>(`/reports/financial?year=${year}&month=${month}`, FALLBACK_FINANCIAL);
  },

  getMembersAtRisk: (inactiveDays = 14, limit = 5): Promise<MembersAtRiskData> => {
    return fetchJsonWithFallback<MembersAtRiskData>(`/reports/members-at-risk?inactive_days=${inactiveDays}&limit=${limit}`, FALLBACK_AT_RISK);
  },

  getTopProducts: (limit = 5): Promise<TopProductsData> => {
    return fetchJsonWithFallback<TopProductsData>(`/reports/top-products?limit=${limit}`, FALLBACK_TOP_PRODUCTS);
  },

  getClassesPerformance: (days = 30): Promise<ClassesPerformanceData> => {
    return fetchJsonWithFallback<ClassesPerformanceData>(`/reports/classes-performance?days=${days}`, FALLBACK_CLASSES);
  },
};
