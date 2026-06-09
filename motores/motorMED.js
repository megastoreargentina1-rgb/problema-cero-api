/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor MED v1.0
 * ==========================================================
 */

const REGLAS_MED =
  require("../config/reglasMED");

function calcularPuntaje(
  cantidadEvidencias,
  confirmado
) {

  const puntos =
    REGLAS_MED.puntuacion;

  if (confirmado) {
    return puntos.confirmado;
  }

  if (cantidadEvidencias >= 3) {
    return puntos.evidencia3;
  }

  if (cantidadEvidencias >= 2) {
    return puntos.evidencia2;
  }

  if (cantidadEvidencias >= 1) {
    return puntos.evidencia1;
  }

  return puntos.evidencia0;
}

function evaluarBloqueo(
  nombre,
  evidencias = [],
  preguntaCriticaConsistente = false
) {

  const regla =
    REGLAS_MED.bloqueos[nombre];

  const cantidad =
    evidencias.length;

  const confirmado =
    cantidad >=
      regla.minimoConfirmacion &&
    preguntaCriticaConsistente;

  return {
    bloqueo: nombre,

    evidencias,

    cantidadEvidencias:
      cantidad,

    confirmado,

    puntaje:
      calcularPuntaje(
        cantidad,
        confirmado
      )
  };
}

function motorMED(
  datosBloqueos = {}
) {

  const resultado = {};

  let puntajeTotal = 0;

  Object.keys(
    REGLAS_MED.bloqueos
  ).forEach(nombre => {

    const datos =
      datosBloqueos[nombre] || {};

    const evaluacion =
      evaluarBloqueo(
        nombre,
        datos.evidencias || [],
        datos.preguntaCriticaConsistente || false
      );

    resultado[nombre] =
      evaluacion;

    if (
      evaluacion.puntaje >
      puntajeTotal
    ) {
      puntajeTotal =
        evaluacion.puntaje;
    }

  });

  const confirmados =
    Object.values(resultado)
      .filter(
        b => b.confirmado
      )
      .map(
        b => b.bloqueo
      );

  return {
    puntaje:
      puntajeTotal,

    bloqueos:
      resultado,

    confirmados
  };
}

module.exports =
  motorMED;
