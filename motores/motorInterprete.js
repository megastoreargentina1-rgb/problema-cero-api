/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor Intérprete v1.0
 * ==========================================================
 *
 * Traduce las respuestas del formulario (texto libre)
 * al objeto estructurado que los motores necesitan.
 *
 * Flujo:
 *   Texto del usuario (5 pasos)
 *   ↓
 *   motorInterprete
 *   ↓
 *   { datosBloqueos, icdUniversales, icdArbol, madurez... }
 *   ↓
 *   motorDiagnostico
 *
 * Lógica aprobada por Armand Waisman (fundador):
 *
 *   Paso 2 — Opción 1 → OFERTA
 *   Paso 2 — Opción 2 → ADQUISICION
 *   Paso 2 — Opción 3 → POSICIONAMIENTO
 *   Paso 2 — Opción 4 → ADQUISICION u OPERACION (desempata Paso 4)
 *   Paso 2 — Opción 5 → CONVERSION
 *
 *   Paso 4 — Opción 1 (Tracción)     → ADQUISICION
 *   Paso 4 — Opción 2 (Conversión)   → CONVERSION
 *   Paso 4 — Opción 3 (Rentabilidad) → FINANCIERO
 *   Paso 4 — Opción 4 (Retención)    → CONVERSION
 *   Paso 4 — Opción 5 (Incertidumbre)→ sin confirmar (no suma evidencia)
 *
 * ==========================================================
 */

// ── SEÑALES POR BLOQUEO ─────────────────────────────────────
// Palabras y frases que el usuario puede escribir libremente
// y que son evidencia de cada bloqueo.

const SENALES = {
  OFERTA: [
    "precio", "caro", "cotizo y no cierro", "preguntan y desaparecen",
    "piden precio y nada", "vale mucho", "muy caro", "no ven el valor",
    "no entienden por qué vale", "no perciben el valor", "opción 1"
  ],
  POSICIONAMIENTO: [
    "descuento", "rebaja", "más barato", "competencia de precio",
    "guerra de precios", "no me diferencio", "igual que todos",
    "me comparan", "no saben qué me diferencia", "opción 3"
  ],
  ADQUISICION: [
    "nadie consulta", "no llegan", "poca gente", "no me conocen",
    "no tengo clientes", "no genero consultas", "boca a boca",
    "no tengo publicidad", "no tengo tráfico", "invisibilidad",
    "nadie llega", "opción 2", "opción 1"
  ],
  CONVERSION: [
    "consultan pero no compran", "preguntan y no cierro",
    "no vuelven", "compran una vez", "falta retención",
    "no recomiendan", "no fidelizan", "cierro poco",
    "no logro cerrar", "opción 2", "opción 4", "opción 5"
  ],
  OPERACION: [
    "trabajo todo el día", "no rinde", "saturado", "no delego",
    "dependo de mí", "no tengo equipo", "no llego a entregar",
    "solo", "no escala", "no tengo procesos", "opción 4"
  ],
  FINANCIERO: [
    "vendo pero no gano", "margen bajo", "no sé cuánto gano",
    "no me queda nada", "no hay flujo", "rentabilidad baja",
    "gasto más de lo que entra", "opción 3"
  ]
};

// ── FUNCIÓN PRINCIPAL ───────────────────────────────────────

function motorInterprete(textoCompleto = "") {
  const texto = textoCompleto.toLowerCase();

  // Separar los bloques del texto
  const bloques = extraerBloques(texto);

  // Detectar qué opción eligió en Paso 2 y Paso 4
  const opcionPaso2 = detectarOpcion(bloques.paso2);
  const opcionPaso4 = detectarOpcion(bloques.paso4);

  // Construir evidencias por bloqueo
  const datosBloqueos = construirEvidencias(
    bloques,
    opcionPaso2,
    opcionPaso4
  );

  // Construir datos de madurez desde Paso 1 y Paso 3
  const datosMadurez = extraerMadurez(bloques);

  // Calcular puntajes ICD aproximados
  const icdUniversales = calcularUniversales(bloques);
  const icdArbol       = calcularArbol(opcionPaso2, opcionPaso4);

  return {
    datosBloqueos,
    datosMadurez,
    icdUniversales,
    icdArbol,
    opcionPaso2,
    opcionPaso4,
    bloquesDetectados: Object.keys(datosBloqueos).filter(
      b => datosBloqueos[b].evidencias.length > 0
    )
  };
}

// ── EXTRAER BLOQUES DEL TEXTO ───────────────────────────────

function extraerBloques(texto) {
  return {
    paso1: extraerSeccion(texto, "el negocio",            "el problema"),
    paso2: extraerSeccion(texto, "el problema",           "las bases"),
    paso3: extraerSeccion(texto, "las bases",             "el punto de bloqueo"),
    paso4: extraerSeccion(texto, "el punto de bloqueo",   "el objetivo"),
    paso5: extraerSeccion(texto, "el objetivo",           null)
  };
}

function extraerSeccion(texto, inicio, fin) {
  const idxInicio = texto.indexOf(inicio);
  if (idxInicio === -1) return "";
  const desde = idxInicio + inicio.length;
  if (!fin) return texto.slice(desde).trim();
  const idxFin = texto.indexOf(fin, desde);
  if (idxFin === -1) return texto.slice(desde).trim();
  return texto.slice(desde, idxFin).trim();
}

// ── DETECTAR OPCIÓN ELEGIDA ─────────────────────────────────

function detectarOpcion(texto) {
  const match = texto.match(/opci[oó]n\s*([1-5])/i);
  if (match) return parseInt(match[1]);

  // Detección por palabras clave si no dice "opción X"
  if (/tracción|cuesta que.*descubran|nadie.*consul/i.test(texto)) return 1;
  if (/consultas.*no.*pag|preguntan.*no.*compr/i.test(texto))       return 2;
  if (/margen.*bajo|rentabilidad/i.test(texto))                     return 3;
  if (/no vuelven|no recomiendan/i.test(texto))                     return 4;
  if (/traba.*no.*identific|no sé qué/i.test(texto))                return 5;

  return null;
}

// ── CONSTRUIR EVIDENCIAS POR BLOQUEO ───────────────────────

function construirEvidencias(bloques, opcionPaso2, opcionPaso4) {
  const textoTotal = Object.values(bloques).join(" ");
  const resultado  = {};

  const BLOQUEOS = [
    "OFERTA", "POSICIONAMIENTO", "ADQUISICION",
    "CONVERSION", "OPERACION", "FINANCIERO"
  ];

  BLOQUEOS.forEach(bloqueo => {
    const evidencias = [];

    // Evidencia 1: señales en texto libre
    const senales = SENALES[bloqueo] || [];
    senales.forEach(senal => {
      if (textoTotal.includes(senal.toLowerCase())) {
        if (!evidencias.includes(senal)) {
          evidencias.push(senal);
        }
      }
    });

    // Evidencia 2: opción elegida en Paso 2
    const bloquePaso2 = mapearOpcionPaso2(opcionPaso2, opcionPaso4);
    if (bloquePaso2 === bloqueo) {
      if (!evidencias.includes("opcion_paso2")) {
        evidencias.push("opcion_paso2");
      }
    }

    // Evidencia 3: opción elegida en Paso 4
    const bloquePaso4 = mapearOpcionPaso4(opcionPaso4);
    if (bloquePaso4 === bloqueo) {
      if (!evidencias.includes("opcion_paso4")) {
        evidencias.push("opcion_paso4");
      }
    }

    // Pregunta crítica consistente:
    // se activa cuando Paso 2 y Paso 4 apuntan al mismo bloqueo
    const preguntaCriticaConsistente =
      bloquePaso2 === bloqueo && bloquePaso4 === bloqueo;

    resultado[bloqueo] = {
      evidencias,
      preguntaCriticaConsistente
    };
  });

  return resultado;
}

// ── MAPEO DE OPCIONES A BLOQUEOS ────────────────────────────

function mapearOpcionPaso2(opcion, opcionPaso4) {
  switch (opcion) {
    case 1: return "OFERTA";
    case 2: return "ADQUISICION";
    case 3: return "POSICIONAMIENTO";
    case 4:
      // Desempate: si Paso 4 dice Tracción → ADQUISICION, sino → OPERACION
      return (opcionPaso4 === 1) ? "ADQUISICION" : "OPERACION";
    case 5: return "CONVERSION";
    default: return null;
  }
}

function mapearOpcionPaso4(opcion) {
  switch (opcion) {
    case 1: return "ADQUISICION";
    case 2: return "CONVERSION";
    case 3: return "FINANCIERO";
    case 4: return "CONVERSION";
    case 5: return null; // incertidumbre: no confirma bloqueo
    default: return null;
  }
}

// ── EXTRAER DATOS DE MADUREZ ────────────────────────────────

function extraerMadurez(bloques) {
  const texto = (bloques.paso1 + " " + bloques.paso3).toLowerCase();

  // Tiempo en mercado
  let tiempoEnMercado = null;
  if (/más de (dos|2|tres|3|cuatro|4|cinco|5)\s*a[ñn]/i.test(texto)) {
    tiempoEnMercado = "mas_de_2_años";
  } else if (/1|un|uno\s*a[ñn]|un año/i.test(texto)) {
    tiempoEnMercado = "entre_1_y_2_años";
  } else if (/mes|recién|arranqu|empec/i.test(texto)) {
    tiempoEnMercado = "menos_de_1_año";
  }

  // Equipo
  let equipoTrabajo = "solo";
  if (/equipo|empleado|colaborador|staff/i.test(texto)) {
    equipoTrabajo = "equipo_formal";
  } else if (/ayuda|freelance|externo/i.test(texto)) {
    equipoTrabajo = "colaboradores";
  }

  // Procesos
  let procesosDefinidos = "no";
  if (/proceso|sistema|estructura|automatiz/i.test(texto)) {
    procesosDefinidos = "si";
  } else if (/algo|parcial|intento/i.test(texto)) {
    procesosDefinidos = "parcialmente";
  }

  // Facturación (aproximada por canales y publicidad)
  let facturacionMensual = "baja";
  if (/publicidad|ads|invierto|presupuesto/i.test(texto)) {
    facturacionMensual = "media";
  }
  if (/varios canales|web.*instagram|local.*web/i.test(texto)) {
    facturacionMensual = "media";
  }

  return {
    tiempoEnMercado,
    equipoTrabajo,
    procesosDefinidos,
    facturacionMensual
  };
}

// ── CALCULAR ICD UNIVERSALES ────────────────────────────────
// Puntaje 0-40: qué tan completa es la información básica

function calcularUniversales(bloques) {
  let score = 0;
  if (bloques.paso1 && bloques.paso1.length > 20) score += 10;
  if (bloques.paso2 && bloques.paso2.length > 20) score += 10;
  if (bloques.paso3 && bloques.paso3.length > 20) score += 10;
  if (bloques.paso4 && bloques.paso4.length > 20) score += 10;
  return score;
}

// ── CALCULAR ICD ÁRBOL ──────────────────────────────────────
// Puntaje 0-30: coherencia del árbol de decisión

function calcularArbol(opcionPaso2, opcionPaso4) {
  let score = 0;
  if (opcionPaso2 !== null) score += 15;
  if (opcionPaso4 !== null) score += 15;
  return score;
}

module.exports = motorInterprete;
