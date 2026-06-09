/**
 * ==========================================================
 * PROBLEMA CERO
 * Reglas Causales v1.0
 * ==========================================================
 */

module.exports = {

  jerarquia: [
    "OFERTA",
    "POSICIONAMIENTO",
    "ADQUISICION",
    "CONVERSION",
    "OPERACION",
    "FINANCIERO"
  ],

  estados: {
    CONFIRMADA: "CAUSA_RAIZ_CONFIRMADA",
    PROBABLE: "CAUSA_RAIZ_PROBABLE",
    NO_AUTORIZADA: "CAUSA_RAIZ_NO_AUTORIZADA"
  },

  precedencia: {
    OFERTA: 1,
    POSICIONAMIENTO: 2,
    ADQUISICION: 3,
    CONVERSION: 4,
    OPERACION: 5,
    FINANCIERO: 6
  }

};
