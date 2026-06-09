/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor ICD v1.0
 * ==========================================================
 */

const REGLAS_ICD =
  require("../config/reglasICD");

function obtenerEstadoICD(valor) {

  const rangos =
    REGLAS_ICD.rangos;

  if (
    valor >= rangos.confirmado.min
  ) {
    return rangos.confirmado.estado;
  }

  if (
    valor >= rangos.probable.min
  ) {
    return rangos.probable.estado;
  }

  if (
    valor >= rangos.hipotesis.min
  ) {
    return rangos.hipotesis.estado;
  }

  return rangos.insuficiente.estado;
}

function limitar(valor, min, max) {
  return Math.max(
    min,
    Math.min(valor, max)
  );
}

function motorICD({
  universales = 0,
  arbol = 0,
  med = 0,
  coherencia = 0
} = {}) {

  const pesos =
    REGLAS_ICD.pesos;

  const scoreUniversales =
    limitar(
      universales,
      0,
      pesos.universales
    );

  const scoreArbol =
    limitar(
      arbol,
      0,
      pesos.arbol
    );

  const scoreMED =
    limitar(
      med,
      0,
      pesos.med
    );

  const scoreCoherencia =
    limitar(
      coherencia,
      -15,
      pesos.coherencia
    );

  const valor =
    scoreUniversales +
    scoreArbol +
    scoreMED +
    scoreCoherencia;

  return {
    valor,
    estado:
      obtenerEstadoICD(valor),

    detalle: {
      universales:
        scoreUniversales,

      arbol:
        scoreArbol,

      med:
        scoreMED,

      coherencia:
        scoreCoherencia
    }
  };
}

module.exports =
  motorICD;
