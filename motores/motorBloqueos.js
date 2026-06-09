/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor de Bloqueos
 * ==========================================================
 *
 * Determina:
 *
 * - Bloqueo principal
 * - Bloqueo secundario
 *
 * IMPORTANTE:
 *
 * Esta primera versión es estructural.
 *
 * Las reglas reales se cargarán
 * progresivamente desde MED e ICD.
 *
 * ==========================================================
 */

const REGLAS_BLOQUEOS =
  require("../config/reglasBloqueos");

function motorBloqueos({
  respuestas = {},
  med = {},
  madurez = {},
  icd = {}
}) {

  const bloqueosDisponibles = Object.keys(
    REGLAS_BLOQUEOS
  );

  const scores = {};

  bloqueosDisponibles.forEach(
    bloqueo => {
      scores[bloqueo] = 0;
    }
  );

  /**
   * =========================================
   * Lugar donde se cargarán las reglas futuras
   * =========================================
   */

  const ranking =
    Object.entries(scores)
      .sort(
        (a, b) => b[1] - a[1]
      );

  const principal =
    ranking[0]?.[0] || null;

  const secundario =
    ranking[1]?.[0] || null;

  return {
    principal,
    secundario,
    ranking,
    scores
  };
}

module.exports = motorBloqueos;
