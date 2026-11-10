/**
 * Base de Datos Vectorial Local y Motor RAG para GymPulse
 * 
 * Propósito: Almacenar representaciones semánticas de reglamentos, contratos,
 * beneficios de planes y políticas del club para enriquecer los reportes del SLM local.
 */

export interface VectorDocument {
  id: string;
  category: 'reglamento' | 'promociones' | 'politicas_cobro' | 'reclamos';
  title: string;
  content: string;
  keywords: string[];
}

export const GYM_KNOWLEDGE_BASE: VectorDocument[] = [
  {
    id: 'doc-01',
    category: 'politicas_cobro',
    title: 'Política de Congelamiento por Motivo Médico',
    content: 'Artículo 4.2: Todo socio activo con plan trimestral o superior tiene derecho a congelar su membresía sin costo alguno hasta un máximo de 60 días continuos o discontinuos, presentando certificado médico en recepción dentro de las primeras 48 horas de la lesión.',
    keywords: ['congelar', 'pausa', 'médico', 'lesión', 'baja', 'suspender', 'enfermedad'],
  },
  {
    id: 'doc-02',
    category: 'politicas_cobro',
    title: 'Recargo y Bloqueo de Acceso por Morosidad',
    content: 'Artículo 6.1: Si una cuota no es pagada tras 5 días de su fecha de vencimiento, el torniquete de acceso biométrico se bloqueará automáticamente. A partir del día 15 de mora, se aplicará un recargo administrativo del 5% sobre el saldo adeudado.',
    keywords: ['mora', 'moroso', 'bloqueo', 'recargo', 'torniquete', 'vencido', 'impago'],
  },
  {
    id: 'doc-03',
    category: 'promociones',
    title: 'Plan Retención para Socios Inactivos (+14 días)',
    content: 'Campaña "Vuelve al Ritmo": Los socios que registren más de 14 días sin check-in pueden acceder a una sesión de reactivación gratuita con entrenador personal y un 15% de descuento en suplementos durante su primera semana de retorno.',
    keywords: ['riesgo', 'inactivo', 'retención', 'abandono', 'deserción', 'volver', 'campaña'],
  },
  {
    id: 'doc-04',
    category: 'reglamento',
    title: 'Aforo y Reserva de Clases Grupales',
    content: 'Artículo 8.4: Las clases de Spinning y CrossFit tienen cupo máximo de 25 personas. Las reservas se abren con 24 horas de anticipación. Un socio con más de 2 inasistencias sin cancelar pierde la facultad de reservar por 7 días.',
    keywords: ['spinning', 'clase', 'reserva', 'aforo', 'cupo', 'capacidad', 'inasistencia'],
  },
  {
    id: 'doc-05',
    category: 'promociones',
    title: 'Beneficios Plan Anual VIP Black',
    content: 'Los socios del Plan Anual Black disponen de toalla diaria incluida, 2 pases de cortesía para invitados al mes, acceso a sala de vapor y 10% de descuento permanente en la tienda de suplementos.',
    keywords: ['anual', 'vip', 'black', 'beneficios', 'invitado', 'descuento', 'toalla'],
  },
];

/**
 * Simulación de búsqueda semántica vectorial (Cosine Similarity sobre Bag-of-Words & Embeddings)
 * En producción se combina con un embedding model GGUF de ~30MB.
 */
export async function searchVectorKnowledge(query: string, limit = 2): Promise<VectorDocument[]> {
  const normalizedQuery = query.toLowerCase();
  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  const scoredDocs = GYM_KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    // Puntuación por coincidencia semántica en keywords
    for (const kw of doc.keywords) {
      if (normalizedQuery.includes(kw)) {
        score += 3.0;
      }
    }
    // Puntuación por coincidencia en contenido
    for (const w of words) {
      if (doc.content.toLowerCase().includes(w)) {
        score += 1.0;
      }
      if (doc.title.toLowerCase().includes(w)) {
        score += 2.0;
      }
    }
    return { doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);

  return scoredDocs
    .filter(item => item.score > 0)
    .slice(0, limit)
    .map(item => item.doc);
}
