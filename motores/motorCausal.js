/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor Causal v1.0
 * ==========================================================
 */

const REGLAS =
  require("../config/reglasCausales");

function obtenerEstado(icd) {

  if (icd >= 85) {
    return REGLAS.estados.CONFIRMADA;
  }

  if (icd >= 70) {
    return REGLAS.estados.PROBABLE;
  }

  return REGLAS.estados.NO_AUTORIZADA;
}

function existeBloqueoSuperior(
  bloqueo,
  confirmados
) {

  const prioridadActual =
    REGLAS.precedencia[bloqueo];

  return confirmados.some(
    item =>
      REGLAS.precedencia[item] <
      prioridadActual
  );
}

function motorCausal({
  bloqueosConfirmados = [],
  icd = 0,
  existeEquivalencia = false
} = {}) {

  const descartados = [];

  const candidatos =
    bloqueosConfirmados.filter(
      bloqueo => {

        const descartar =
          existeBloqueoSuperior(
            bloqueo,
            bloqueosConfirmados
          );

        if (descartar) {
          descartados.push(
            bloqueo
          );
        }

        return !descartar;
      }
    );

  let causaRaiz = null;

  if (
    candidatos.length > 0
  ) {

    causaRaiz =
      candidatos.sort(
        (a, b) =>
          REGLAS.precedencia[a] -
          REGLAS.precedencia[b]
      )[0];

  }

  return {

    causaRaiz,

    estado:
      obtenerEstado(icd),

    bloqueosConfirmados,

    bloqueosDescartados:
      descartados,

    autorizada:
      icd >= 85 &&
      !existeEquivalencia &&
      !!causaRaiz

  };
}

module.exports =
  motorCausal;
