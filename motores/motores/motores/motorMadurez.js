/**
 * ==========================================================
 * PROBLEMA CERO
 * Motor Madurez v1.0
 * ==========================================================
 *
 * Evalúa el nivel de madurez del negocio
 * a partir de las respuestas del formulario.
 *
 * Niveles:
 *   TEMPRANO   → negocio en etapa inicial, sin estructura clara
 *   EN_DESARROLLO → negocio con base pero sin consistencia
 *   ESTABLECIDO  → negocio con estructura y operación definida
 *
 * ==========================================================
 */

function motorMadurez(respuestas = {}) {

  const {
    tiempoEnMercado,
    clientesActivos,
    facturacionMensual,
    equipoTrabajo,
    procesosDefinidos
  } = respuestas;

  let puntaje = 0;

  // Tiempo en mercado
  if (tiempoEnMercado === "mas_de_2_años") puntaje += 3;
  else if (tiempoEnMercado === "entre_1_y_2_años") puntaje += 2;
  else if (tiempoEnMercado === "menos_de_1_año") puntaje += 1;

  // Clientes activos
  if (clientesActivos === "mas_de_20") puntaje += 3;
  else if (clientesActivos === "entre_5_y_20") puntaje += 2;
  else if (clientesActivos === "menos_de_5") puntaje += 1;

  // Facturación mensual
  if (facturacionMensual === "alta") puntaje += 3;
  else if (facturacionMensual === "media") puntaje += 2;
  else if (facturacionMensual === "baja") puntaje += 1;

  // Equipo de trabajo
  if (equipoTrabajo === "equipo_formal") puntaje += 2;
  else if (equipoTrabajo === "colaboradores") puntaje += 1;

  // Procesos definidos
  if (procesosDefinidos === "si") puntaje += 2;
  else if (procesosDefinidos === "parcialmente") puntaje += 1;

  // Determinar nivel
  let nivel;
  if (puntaje >= 10) {
    nivel = "ESTABLECIDO";
  } else if (puntaje >= 5) {
    nivel = "EN_DESARROLLO";
  } else {
    nivel = "TEMPRANO";
  }

  return {
    nivel,
    puntaje,
    descripcion: descripciones[nivel]
  };
}

const descripciones = {
  TEMPRANO: "El negocio está en etapa inicial. Prioridad: validar oferta y conseguir los primeros clientes consistentes.",
  EN_DESARROLLO: "El negocio tiene base pero le falta consistencia. Prioridad: ordenar estructura y estabilizar resultados.",
  ESTABLECIDO: "El negocio tiene estructura definida. Prioridad: escalar sin perder eficiencia operativa."
};

module.exports = motorMadurez;
