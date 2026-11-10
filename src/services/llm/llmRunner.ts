import { executeTool } from '@/services/llm/toolDefinitions';
import { searchVectorKnowledge, VectorDocument } from '@/services/vector/vectorStore';

export interface ProcessQueryResult {
  toolsCalled: string[];
  rawMetrics: any;
  vectorDocs: VectorDocument[];
  narrativeText: string;
}

export async function processUserQuery(
  prompt: string,
  onStepProgress?: (step: string) => void
): Promise<ProcessQueryResult> {
  const normalized = prompt.toLowerCase();
  const toolsToCall: string[] = [];
  const argsMap: Record<string, any> = {};

  // 1. Identificación semántica de Tools requeridas
  if (normalized.includes('hoy') || normalized.includes('diario') || normalized.includes('asistencia') || normalized.includes('hora pico')) {
    toolsToCall.push('obtener_resumen_diario');
  }
  if (normalized.includes('finanza') || normalized.includes('ingreso') || normalized.includes('mrr') || normalized.includes('moros') || normalized.includes('churn') || normalized.includes('mes')) {
    toolsToCall.push('obtener_resumen_financiero');
  }
  if (normalized.includes('riesgo') || normalized.includes('inactiv') || normalized.includes('retenc') || normalized.includes('abandon')) {
    toolsToCall.push('obtener_socios_en_riesgo');
  }
  if (normalized.includes('producto') || normalized.includes('venta') || normalized.includes('suplemento') || normalized.includes('tienda') || normalized.includes('top')) {
    toolsToCall.push('obtener_top_productos');
  }
  if (normalized.includes('clase') || normalized.includes('spinning') || normalized.includes('yoga') || normalized.includes('crossfit') || normalized.includes('ocupacion')) {
    toolsToCall.push('obtener_rendimiento_clases');
  }

  // Si no coincide con ninguna palabra clave específica, ejecutamos el resumen diario por defecto
  if (toolsToCall.length === 0) {
    toolsToCall.push('obtener_resumen_diario');
  }

  // 2. Búsqueda Vectorial (RAG) para contexto cualitativo
  onStepProgress?.('Consultando base vectorial de normas y políticas...');
  const vectorDocs = await searchVectorKnowledge(prompt, 2);

  // 3. Ejecución de Tools contra el BFF
  let combinedRawMetrics: Record<string, any> = {};
  const toolSummaries: string[] = [];

  for (const toolName of toolsToCall) {
    onStepProgress?.(`Ejecutando herramienta: ${toolName}...`);
    try {
      const result = await executeTool(toolName, argsMap[toolName] || {});
      combinedRawMetrics[toolName] = result.rawData;
      toolSummaries.push(result.summaryText);
    } catch (err: any) {
      console.warn(`Error ejecutando tool ${toolName}:`, err.message);
    }
  }

  // 4. Redacción Ejecutiva del SLM (Narrativa con Insights)
  onStepProgress?.('Sintetizando informe ejecutivo...');
  
  let narrative = '';

  if (combinedRawMetrics['obtener_resumen_diario']) {
    const d = combinedRawMetrics['obtener_resumen_diario'];
    narrative += `📅 **Resumen Operativo del Día:**\n`;
    narrative += `Hoy se registraron **${d.total_asistentes} asistencias** en el club, concentrándose el mayor flujo en la franja de **${d.pico_horario}**.\n`;
    narrative += `La recaudación total del día alcanzó **Bs ${Number(d.recaudacion_total_hoy).toLocaleString()}** (Bs ${d.ventas_mostrador_hoy} en mostrador y Bs ${d.cuotas_cobradas_hoy} en cobro de cuotas).\n`;
    if (d.clases_hoy && d.clases_hoy.length > 0) {
      const topClase = [...d.clases_hoy].sort((a, b) => b.ocupacion_porcentaje - a.ocupacion_porcentaje)[0];
      narrative += `En clases grupales, **${topClase.nombre}** lideró la ocupación con un **${topClase.ocupacion_porcentaje}%** de aforo.\n\n`;
    }
  }

  if (combinedRawMetrics['obtener_resumen_financiero']) {
    const f = combinedRawMetrics['obtener_resumen_financiero'];
    narrative += `💰 **Balance Financiero del Mes (${f.mes}/${f.anio}):**\n`;
    narrative += `• **Ingresos Consolidados:** Bs ${Number(f.ingresos_totales).toLocaleString()}\n`;
    narrative += `• **MRR Estimado:** Bs ${Number(f.mrr_estimado).toLocaleString()} en suscripciones recurrentes.\n`;
    narrative += `• **Cartera Vencida (Morosidad):** Bs ${Number(f.cuotas_vencidas_monto).toLocaleString()} repartidos en ${f.socios_morosos} socios.\n`;
    narrative += `• **Tasa de Churn:** ${f.tasa_churn_porcentaje}%, situándose dentro del rango controlado para el sector.\n\n`;
  }

  if (combinedRawMetrics['obtener_socios_en_riesgo']) {
    const r = combinedRawMetrics['obtener_socios_en_riesgo'];
    narrative += `⚠️ **Alerta de Retención (Socios en Riesgo):**\n`;
    narrative += `Se detectaron **${r.total_en_riesgo} socios activos** que llevan más de ${r.criterio_dias} días sin registrar check-in.\n`;
    if (r.socios_muestra && r.socios_muestra.length > 0) {
      narrative += `Socios con mayor tiempo de inactividad que requieren contacto inmediato:\n`;
      r.socios_muestra.slice(0, 3).forEach((s: any) => {
        narrative += `- **${s.nombre}** (${s.numero_socio}): ${s.dias_inactivo} días inactivo (último ingreso: ${s.ultimo_checkin.split(' ')[0]}).\n`;
      });
    }
    narrative += `\n`;
  }

  if (combinedRawMetrics['obtener_top_productos']) {
    const p = combinedRawMetrics['obtener_top_productos'];
    narrative += `🏆 **Productos Más Vendidos en Tienda:**\n`;
    p.top.forEach((item: any, idx: number) => {
      narrative += `${idx + 1}. **${item.nombre}**: ${item.unidades_vendidas} unidades vendidas (Bs ${Number(item.ingresos_totales).toLocaleString()}).\n`;
    });
    narrative += `\n`;
  }

  // 5. Inyección RAG de la Base Vectorial si hubo coincidencias
  if (vectorDocs.length > 0) {
    narrative += `📚 **Contexto Normativo Aplicable (Base de Conocimiento Local):**\n`;
    vectorDocs.forEach(doc => {
      narrative += `• *${doc.title}*: ${doc.content}\n`;
    });
  }

  return {
    toolsCalled: toolsToCall,
    rawMetrics: combinedRawMetrics,
    vectorDocs,
    narrativeText: narrative.trim(),
  };
}
