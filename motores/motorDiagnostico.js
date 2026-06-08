/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor Diagnóstico Central
 * ==========================================================
 *
 * Este archivo NO diagnostica directamente.
 *
 * Su función es coordinar todos los motores
 * especializados del sistema.
 *
 * Filosofía:
 *
 * Problema Cero piensa en código.
 * Gemini solamente redacta.
 *
 * ==========================================================
 */

const motorMadurez = require("./motorMadurez");
const motorICD = require("./motorICD");
const motorMED = require("./motorMED");
const motorBloqueos = require("./motorBloqueos");
const motorCausal = require("./motorCausal");
const motorPrioridades = require("./motorPrioridades");

function motorDiagnostico(respuestas = {}) {
  try {
    const madurez = motorMadurez(respuestas);

    const icd = motorICD(respuestas);

    const med = motorMED(respuestas);

    const bloqueos = motorBloqueos({
      respuestas,
      med,
      madurez,
      icd
    });

    const causaRaiz = motorCausal({
      respuestas,
      med,
      bloqueos,
      madurez,
      icd
    });

    const prioridades = motorPrioridades({
      bloqueos,
      causaRaiz,
      madurez
    });

    return {
      fechaDiagnostico: new Date().toISOString(),

      madurez,

      icd: icd.valor || 0,

      estadoDiagnostico:
        icd.estado || "INSUFICIENTE",

      bloqueoPrincipal:
        bloqueos.principal || null,

      bloqueoSecundario:
        bloqueos.secundario || null,

      causaRaiz,

      evidencia:
        med.evidencia || [],

      prioridades:
        prioridades || [],

      metadata: {
        version: "2.0.0",
        origen: "motorDiagnostico"
      }
    };
  } catch (error) {
    console.error(
      "[PROBLEMA CERO] Error en motorDiagnostico:",
      error
    );

    return {
      error: true,
      mensaje:
        "No fue posible generar el diagnóstico."
    };
  }
}

module.exports = motorDiagnostico;
