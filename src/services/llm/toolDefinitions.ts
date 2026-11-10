import { bffService, executeMcpTool } from '@/services/bff/apiClient';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export const REGISTERED_TOOLS: ToolDefinition[] = [
  {
    name: 'obtener_resumen_diario',
    description: 'Devuelve la asistencia total, hora pico, nuevos socios, recaudación de hoy y ocupación de clases.',
    parameters: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha YYYY-MM-DD. Opcional, por defecto hoy.' }
      }
    }
  },
  {
    name: 'obtener_resumen_financiero',
    description: 'Devuelve ingresos mensuales, MRR estimado, cuotas vencidas/morosidad y tasa de churn.',
    parameters: {
      type: 'object',
      properties: {
        year: { type: 'integer', description: 'Año, ej 2026' },
        month: { type: 'integer', description: 'Mes del 1 al 12' }
      }
    }
  },
  {
    name: 'obtener_socios_en_riesgo',
    description: 'Devuelve socios inactivos que llevan más de N días sin ingresar al club para campañas de retención.',
    parameters: {
      type: 'object',
      properties: {
        dias_inactividad: { type: 'integer', description: 'Días mínimos de inactividad, por defecto 14' }
      }
    }
  },
  {
    name: 'obtener_top_productos',
    description: 'Devuelve el ranking de los productos de tienda más vendidos y facturación generada.',
    parameters: {
      type: 'object',
      properties: {
        limite: { type: 'integer', description: 'Cantidad de productos en el top' }
      }
    }
  },
  {
    name: 'obtener_rendimiento_clases',
    description: 'Devuelve la ocupación y asistencia promedio a clases grupales (Spinning, Yoga, CrossFit, etc.).',
    parameters: {
      type: 'object',
      properties: {
        dias: { type: 'integer', description: 'Periodo de días a analizar, ej 30' }
      }
    }
  },
  {
    name: 'reporte_recaudacion',
    description: 'Consulta de ingresos y cobros confirmados en ms-mcp para auditar recaudación en Bs.',
    parameters: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha YYYY-MM-DD. Opcional, por defecto hoy.' }
      }
    }
  },
  {
    name: 'reporte_asistencias',
    description: 'Consulta accesos por torniquetes, afluencia y picos de asistencia en ms-mcp.',
    parameters: {
      type: 'object',
      properties: {
        fecha_inicio: { type: 'string', description: 'Fecha inicio YYYY-MM-DD' },
        fecha_fin: { type: 'string', description: 'Fecha fin YYYY-MM-DD' }
      }
    }
  },
  {
    name: 'reporte_fallas_mantenimiento',
    description: 'Consulta máquinas averiadas y alertas de mantenimiento técnico desde ms-inventario a través de ms-mcp.',
    parameters: {
      type: 'object',
      properties: {
        solo_averiados: { type: 'boolean', description: 'Filtrar sólo equipos averiados' }
      }
    }
  },
  {
    name: 'exportar_reporte',
    description: 'Genera un documento PDF o CSV de cualquier reporte analítico de ms-mcp para descarga.',
    parameters: {
      type: 'object',
      properties: {
        herramienta: { type: 'string', description: 'Nombre de la herramienta MCP a exportar' },
        formato: { type: 'string', enum: ['PDF', 'CSV'], description: 'Formato de salida' }
      },
      required: ['herramienta']
    }
  }
];

export async function executeTool(toolName: string, args: Record<string, any> = {}): Promise<{
  toolName: string;
  rawData: any;
  summaryText: string;
}> {
  switch (toolName) {
    case 'obtener_resumen_diario': {
      const data = await bffService.getDailyReport(args.fecha);
      return {
        toolName,
        rawData: data,
        summaryText: `Asistencias hoy: ${data.total_asistentes}, Hora pico: ${data.pico_horario}, Recaudación: Bs ${data.recaudacion_total_hoy}, Clases dictadas: ${data.clases_hoy.length}`
      };
    }
    case 'obtener_resumen_financiero': {
      const data = await bffService.getFinancialReport(args.year ?? 2026, args.month ?? 10);
      return {
        toolName,
        rawData: data,
        summaryText: `Ingresos mes: Bs ${data.ingresos_totales}, MRR: Bs ${data.mrr_estimado}, Morosidad: Bs ${data.cuotas_vencidas_monto}, Churn: ${data.tasa_churn_porcentaje}%`
      };
    }
    case 'obtener_socios_en_riesgo': {
      const data = await bffService.getMembersAtRisk(args.dias_inactividad ?? 14, 5);
      return {
        toolName,
        rawData: data,
        summaryText: `Total socios en riesgo (+${data.criterio_dias} días sin check-in): ${data.total_en_riesgo} socios.`
      };
    }
    case 'obtener_top_productos': {
      const data = await bffService.getTopProducts(args.limite ?? 3);
      const topStr = data.top.map(p => `${p.nombre} (${p.unidades_vendidas} uds - Bs ${p.ingresos_totales})`).join(', ');
      return {
        toolName,
        rawData: data,
        summaryText: `Top productos: ${topStr}`
      };
    }
    case 'obtener_rendimiento_clases': {
      const data = await bffService.getClassesPerformance(args.dias ?? 30);
      const topClasses = data.clases.map(c => `${c.clase}: ${c.ocupacion_promedio_porcentaje}% ocupación`).join('; ');
      return {
        toolName,
        rawData: data,
        summaryText: `Ocupación clases (últimos ${data.periodo_dias} días): ${topClasses}`
      };
    }
    case 'reporte_recaudacion': {
      const data = await executeMcpTool('reporte_recaudacion', args);
      const rec = data?.totales?.total_recaudado_bob ?? data?.totales?.total_membresias_bob ?? '0.00';
      return {
        toolName,
        rawData: data,
        summaryText: `Recaudación efectiva: Bs ${rec}. Total cobros registrados: ${data?.total_filas ?? 0}. Cobertura: ${data?.cobertura || 'ms-gimnasio'}`
      };
    }
    case 'reporte_asistencias': {
      const data = await executeMcpTool('reporte_asistencias', args);
      const total = data?.totales?.total_asistencias ?? data?.total_filas ?? 0;
      return {
        toolName,
        rawData: data,
        summaryText: `Accesos por torniquete registrados: ${total} personas. Horario pico: ${data?.totales?.franja_pico || 'N/D'}`
      };
    }
    case 'reporte_fallas_mantenimiento': {
      const data = await executeMcpTool('reporte_fallas_mantenimiento', args);
      return {
        toolName,
        rawData: data,
        summaryText: `Equipos con estado de avería o mantenimiento: ${data?.total_filas ?? 0} máquinas.`
      };
    }
    case 'exportar_reporte': {
      const data = await bffService.exportReport(args.herramienta, args.parametros || {}, args.formato || 'PDF');
      return {
        toolName,
        rawData: data,
        summaryText: data ? `Archivo generado con éxito: ${data.filename}. Listo para descarga.` : 'No se pudo generar el archivo exportado.'
      };
    }
    default: {
      try {
        const data = await executeMcpTool(toolName, args);
        return {
          toolName,
          rawData: data,
          summaryText: `Reporte ${toolName} ejecutado: ${data?.total_filas ?? 0} registros obtenidos.`
        };
      } catch (err: any) {
        throw new Error(`Herramienta desconocida o error en ms-mcp: ${toolName} - ${err.message}`);
      }
    }
  }
}
