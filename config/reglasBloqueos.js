/**
 * ==========================================================
 * PROBLEMA CERO
 * Reglas de Bloqueos
 * ==========================================================
 *
 * Este archivo contiene las definiciones
 * de los 6 bloqueos principales.
 *
 * La lógica del motor NO debe estar escrita
 * dentro de motorBloqueos.js.
 *
 * Las reglas viven aquí.
 *
 * ==========================================================
 */

module.exports = {
  OFERTA: {
    nombre: "Oferta",
    descripcion:
      "El mercado no percibe suficiente valor para comprar."
  },

  POSICIONAMIENTO: {
    nombre: "Posicionamiento",
    descripcion:
      "El mercado no comprende claramente qué hace diferente al negocio."
  },

  ADQUISICION: {
    nombre: "Adquisición",
    descripcion:
      "No ingresan suficientes oportunidades de venta."
  },

  CONVERSION: {
    nombre: "Conversión",
    descripcion:
      "Las oportunidades existen pero no se transforman en ventas."
  },

  OPERACION: {
    nombre: "Operación",
    descripcion:
      "La estructura interna limita el crecimiento."
  },

  FINANCIERO: {
    nombre: "Financiero",
    descripcion:
      "La gestión económica restringe el desarrollo del negocio."
  }
};
