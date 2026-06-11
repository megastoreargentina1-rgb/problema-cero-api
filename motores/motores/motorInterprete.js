/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor Diagnóstico Central v2.2
 * ==========================================================
 *
 * Coordina todos los motores del sistema.
 *
 * Filosofía:
 *   Problema Cero piensa en código.
 *   Gemini solamente redacta.
 *
 * Flujo:
 *   texto del formulario
 *     → motorInterprete  (traduce texto → evidencias)
 *     → motorMadurez     (contexto del negocio)
 *     → motorMED         (evidencias por bloqueo)
 *     → motorICD         (confianza del diagnóstico)
 *     → motorBloqueos    (bloqueo principal y secundario)
 *     → motorCausal      (causa raíz)
 *     → motorPrioridades (qué resolver primero)
 *     → objeto diagnóstico final
 *
 * ==========================================================
 */

const motorInterprete  = require("./motorInterprete");
const motorMadurez     = require("./motorMadurez");
const motorICD         = require("./motorICD");
const motorMED         = require("./motorMED");
const motorBloqueos    = require("./motorBloqueos");
const motorCausal      = require("./motorCausal");
const motorPrioridades = require("./motorPrioridades");

function motorDiagnostico(textoFormulario = "") {
  try {

    // ── 1. INTÉRPRETE ──────────────────────────────────────
    // Traduce el texto libre del formulario a estructuras
    // que los motores pueden procesar.
    const interpretado = motorInterprete(textoFormulario);

    // ── 2. MADUREZ ─────────────────────────────────────────
    // Usa los datos extraídos del texto para evaluar
    // el nivel de madurez del negocio.
    const madurez = motorMadurez(interpretado.datosMadurez);

    // ── 3. MED ─────────────────────────────────────────────
    // Recibe las evidencias por bloqueo detectadas
    // por el intérprete.
    const med = motorMED(interpretado.datosBloqueos);

    // ── 4. ICD ─────────────────────────────────────────────
    // Índice de confianza diagnóstica.
    // Usa los puntajes calculados por el intérprete
    // más el puntaje del MED y coherencia.
    const coherencia = calcularCoherencia(
      interpretado.opcionPaso2,
      interpretado.opcionPaso4,
      med
    );

    const icd = motorICD({
      universales: interpretado.icdUniversales,
      arbol:       interpretado.icdArbol,
      med:         med.puntaje,
      coherencia
    });

    // ── 5. BLOQUEOS ────────────────────────────────────────
    const bloqueos = motorBloqueos({
      respuestas: interpretado,
      med,
      madurez,
      icd
    });

    // ── 6. CAUSAL ──────────────────────────────────────────
    const bloqueosConfirmados = med.confirmados || [];

    const existeEquivalencia = detectarEquivalencia(
      bloqueos.ranking || []
    );

    const causaRaiz = motorCausal({
      bloqueosConfirmados,
      icd: icd.valor,
      existeEquivalencia
    });

    // ── 7. PRIORIDADES ─────────────────────────────────────
    const prioridades = motorPrioridades({
      bloqueos,
      causaRaiz,
      madurez
    });

    // ── OBJETO DIAGNÓSTICO FINAL ───────────────────────────
    return {
      fechaDiagnostico:   new Date().toISOString(),
      madurez,
      icd:                icd.valor,
      estadoDiagnostico:  icd.estado,
      bloqueoPrincipal:   bloqueos.principal  || interpretado.bloquesDetectados[0] || null,
      bloqueoSecundario:  bloqueos.secundario || interpretado.bloquesDetectados[1] || null,
      causaRaiz,
      evidencia:          med.confirmados     || [],
      prioridades,
      opcionPaso2:        interpretado.opcionPaso2,
      opcionPaso4:        interpretado.opcionPaso4,
      bloquesDetectados:  interpretado.bloquesDetectados,
      metadata: {
        version: "2.2.0",
        origen:  "motorDiagnostico"
      }
    };

  } catch (error) {
    console.error("[PROBLEMA CERO] Error en motorDiagnostico:", error);
    return {
      error:   true,
      mensaje: "No fue posible generar el diagnóstico."
    };
  }
}

// ── FUNCIONES DE SOPORTE ────────────────────────────────────

/**
 * Calcula coherencia entre Paso 2, Paso 4 y MED.
 * Si los tres apuntan al mismo bloqueo: +10
 * Si hay contradicción grave: -15
 * Si es neutral: 0
 */
function calcularCoherencia(opcionPaso2, opcionPaso4, med) {
  if (!opcionPaso2 || !opcionPaso4) return 0;

  const confirmados = med.confirmados || [];

  // Si Paso 2 y Paso 4 apuntan al mismo bloqueo y MED lo confirma
  if (
    opcionPaso2 === opcionPaso4 &&
    confirmados.length > 0
  ) return 10;

  // Si Paso 2 y Paso 4 apuntan al mismo bloqueo
  if (opcionPaso2 === opcionPaso4) return 5;

  // Si son distintos pero ambos válidos: neutral
  return 0;
}

/**
 * Detecta equivalencia entre los dos bloqueos con mayor score.
 * Si la diferencia es <= 2, no se puede confirmar causa raíz.
 */
function detectarEquivalencia(ranking = []) {
  if (ranking.length < 2) return false;
  const primero = ranking[0]?.[1] ?? 0;
  const segundo = ranking[1]?.[1] ?? 0;
  return Math.abs(primero - segundo) <= 2;
}

module.exports = motorDiagnostico;
