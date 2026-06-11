/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor Prioridades v1.0
 * ==========================================================
 *
 * Determina qué debe resolver el negocio primero.
 *
 * Recibe:
 *   bloqueos   → resultado de motorBloqueos
 *   causaRaiz  → resultado de motorCausal
 *   madurez    → resultado de motorMadurez
 *
 * Devuelve:
 *   Array ordenado de prioridades con etiqueta y razón.
 *
 * ==========================================================
 */

const ORDEN_JERARQUICO = [
  "OFERTA",
  "POSICIONAMIENTO",
  "ADQUISICION",
  "CONVERSION",
  "OPERACION",
  "FINANCIERO"
];

const DESCRIPCIONES = {
  OFERTA: "Redefinir la propuesta de valor para que el mercado perciba una razón clara para comprar.",
  POSICIONAMIENTO: "Clarificar qué hace diferente al negocio y comunicarlo de forma consistente.",
  ADQUISICION: "Generar más oportunidades de venta con canales y acciones concretas.",
  CONVERSION: "Mejorar el proceso de venta para transformar más oportunidades en clientes.",
  OPERACION: "Ordenar la estructura interna para que el negocio pueda crecer sin romperse.",
  FINANCIERO: "Estabilizar la gestión económica para que el crecimiento sea sostenible."
};

function motorPrioridades({
  bloqueos = {},
  causaRaiz = {},
  madurez = {}
} = {}) {

  const prioridades = [];

  // Prioridad 1: causa raíz si está identificada
  if (causaRaiz.causaRaiz) {
    prioridades.push({
      orden: 1,
      bloqueo: causaRaiz.causaRaiz,
      tipo: "CAUSA_RAIZ",
      estado: causaRaiz.estado,
      descripcion: DESCRIPCIONES[causaRaiz.causaRaiz] || "",
      urgencia: "ALTA"
    });
  }

  // Prioridad 2: bloqueo principal si es distinto a causa raíz
  if (
    bloqueos.principal &&
    bloqueos.principal !== causaRaiz.causaRaiz
  ) {
    prioridades.push({
      orden: 2,
      bloqueo: bloqueos.principal,
      tipo: "BLOQUEO_PRINCIPAL",
      estado: "IDENTIFICADO",
      descripcion: DESCRIPCIONES[bloqueos.principal] || "",
      urgencia: "MEDIA"
    });
  }

  // Prioridad 3: bloqueo secundario
  if (
    bloqueos.secundario &&
    bloqueos.secundario !== causaRaiz.causaRaiz &&
    bloqueos.secundario !== bloqueos.principal
  ) {
    prioridades.push({
      orden: 3,
      bloqueo: bloqueos.secundario,
      tipo: "BLOQUEO_SECUNDARIO",
      estado: "IDENTIFICADO",
      descripcion: DESCRIPCIONES[bloqueos.secundario] || "",
      urgencia: "BAJA"
    });
  }

  // Si no hay nada identificado, usar jerarquía + madurez como fallback
  if (prioridades.length === 0) {
    const fallback = madurez.nivel === "TEMPRANO"
      ? "OFERTA"
      : madurez.nivel === "EN_DESARROLLO"
        ? "POSICIONAMIENTO"
        : "ADQUISICION";

    prioridades.push({
      orden: 1,
      bloqueo: fallback,
      tipo: "SUGERENCIA",
      estado: "INFORMACION_INSUFICIENTE",
      descripcion: DESCRIPCIONES[fallback] || "",
      urgencia: "MEDIA"
    });
  }

  return prioridades;
}

module.exports = motorPrioridades;
