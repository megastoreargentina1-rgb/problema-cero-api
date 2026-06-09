/**
 * ==========================================================
 * PROBLEMA CERO
 * ICD v1.0
 * Índice de Confianza Diagnóstica
 * ==========================================================
 */

module.exports = {
  pesos: {
    universales: 40,
    arbol: 30,
    med: 20,
    coherencia: 10
  },

  rangos: {
    insuficiente: {
      min: 0,
      max: 39,
      estado: "INFORMACION_INSUFICIENTE"
    },

    hipotesis: {
      min: 40,
      max: 69,
      estado: "HIPOTESIS_PRELIMINAR"
    },

    probable: {
      min: 70,
      max: 84,
      estado: "DIAGNOSTICO_PROBABLE"
    },

    confirmado: {
      min: 85,
      max: 100,
      estado: "DIAGNOSTICO_SOLIDO"
    }
  }
};
