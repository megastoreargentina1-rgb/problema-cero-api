const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
require("dotenv").config();

const motorDiagnostico = require("./motores/motorDiagnostico");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_API_KEY               = process.env.GEMINI_API_KEY;
const GOOGLE_SHEET_ID              = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY           = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : null;

// ── HEALTH CHECK ────────────────────────────────────────────

app.get("/", (req, res) => {
  res.send("Problema Cero API v2.3 activa");
});

// ── GEMINI: SOLO REDACTA ────────────────────────────────────

async function llamarGemini(prompt) {
  const aiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await aiRes.json();

  if (data.error) {
    throw new Error(JSON.stringify(data.error));
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text
    || "No se pudo generar respuesta.";
}

// ── EXTRAER JSON DE RESPUESTA DE GEMINI ─────────────────────
// Gemini a veces agrega texto antes/después del JSON.
// Esta función extrae solo el objeto JSON válido.

function extraerJSON(texto) {
  try {
    const inicio = texto.indexOf("{");
    const fin    = texto.lastIndexOf("}");
    if (inicio === -1 || fin === -1) return null;
    return JSON.parse(texto.slice(inicio, fin + 1));
  } catch (e) {
    return null;
  }
}

// ── GOOGLE SHEETS ───────────────────────────────────────────

async function guardarEnSheets(datos) {
  if (!GOOGLE_SHEET_ID)               throw new Error("Falta GOOGLE_SHEET_ID en Render.");
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL)  throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_EMAIL en Render.");
  if (!GOOGLE_PRIVATE_KEY)            throw new Error("Falta GOOGLE_PRIVATE_KEY en Render.");

  const auth = new google.auth.JWT({
    email:  GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:    GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Hoja 1!A:M",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString("es-AR"),
        datos.userId             || "",
        datos.tipo               || "",
        datos.consultaOriginal   || "",
        datos.diagnosticoInicial || "",
        datos.respuesta1         || "",
        datos.respuesta2         || "",
        datos.respuesta3         || "",
        datos.feedback1          || "",
        datos.feedback2          || "",
        datos.feedback3          || "",
        datos.analisisCompleto   || "",
        datos.arraysEstructurados || ""
      ]]
    }
  });

  return true;
}

// ── PROMPTS PARA GEMINI ─────────────────────────────────────
// Gemini NO decide bloqueo ni causa raíz.
// Recibe el objeto diagnóstico ya calculado y lo redacta.

function crearPromptDiagnostico(diagnostico, consultaOriginal) {

  const bloqueoPrincipal   = diagnostico.bloqueoPrincipal  || "No identificado";
  const bloqueoSecundario  = diagnostico.bloqueoSecundario || "No identificado";
  const causaRaizNombre    = diagnostico.causaRaiz?.causaRaiz || "No determinada";
  const estadoCausa        = diagnostico.causaRaiz?.estado    || "";
  const autorizada         = diagnostico.causaRaiz?.autorizada;
  const prioridad1         = diagnostico.prioridades?.[0];
  const madurez            = diagnostico.madurez;

  const reglaCerteza = autorizada
    ? 'El diagnóstico tiene suficiente evidencia. Podés afirmar "El problema principal es..."'
    : 'El diagnóstico NO está completamente confirmado. Usá "La evidencia sugiere..." o "La hipótesis más fuerte es..."';

  return `
Actuá como Problema Cero.

Problema Cero es un sistema de diagnóstico estratégico para negocios.
No fue creado para motivar personas.
Fue creado para entregar estructura, detectar fallas y ordenar negocios.

Tu tarea es ÚNICAMENTE redactar el diagnóstico en lenguaje natural.
NO decidís el bloqueo. NO calculás la causa raíz. Eso ya está calculado.
Solo convertís el objeto de diagnóstico en texto claro, humano y ejecutivo.

CASO DEL USUARIO:
${consultaOriginal}

DIAGNÓSTICO CALCULADO POR EL SISTEMA:
- Nivel de madurez del negocio: ${madurez?.nivel || "No determinado"}
- Descripción de madurez: ${madurez?.descripcion || ""}
- Índice de confianza diagnóstica (ICD): ${diagnostico.icd}
- Estado del diagnóstico: ${diagnostico.estadoDiagnostico}
- Bloqueo principal detectado: ${bloqueoPrincipal}
- Bloqueo secundario detectado: ${bloqueoSecundario}
- Causa raíz: ${causaRaizNombre}
- Estado de causa raíz: ${estadoCausa}
- Diagnóstico autorizado: ${autorizada ? "SÍ" : "NO"}
- Prioridad principal: ${prioridad1?.bloqueo || "No definida"}
- Descripción de prioridad: ${prioridad1?.descripcion || ""}

REGLA DE CERTEZA:
${reglaCerteza}

IDENTIDAD:
- Humano y empático. Entendés su esfuerzo sin condescendencia.
- Directo y con autoridad. Sos un profesional de alto nivel.
- Nunca revelás que sos una IA.
- Hablás en español rioplatense natural. No usás "usted".

REGLA DE VOCABULARIO:
- PROHIBIDO: metáforas médicas o clínicas (hemorragia, síntoma, bisturí, paciente, etc.)
- PROHIBIDO: tono de gurú, motivacional o genérico
- PROHIBIDO: frases vacías como "¡Excelente!" o "Gran pregunta"
- PERMITIDO: lenguaje empresarial de alta gerencia, directo y humano

REGLAS DE FORMATO:
- Párrafos cortos. Máximo 2 o 3 líneas.
- Usá viñetas (-) cuando desglosés más de dos elementos.
- Usá **negritas** solo para el concepto central.
- Usá EXACTAMENTE los títulos indicados abajo.

ESTRUCTURA OBLIGATORIA:

⚡ RESUMEN RÁPIDO

👉 Tu problema principal:
Una frase específica y concreta sobre la falla estructural.

👉 Qué está pasando:
Qué ocurre realmente (usá viñetas si son varios puntos).

👉 Qué deberías corregir primero:
La prioridad principal en formato directo.

━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA PRINCIPAL

Explicá el problema dominante. Máximo 3 párrafos cortos.

━━━━━━━━━━━━━━━━━━━━

🧠 QUÉ SIGNIFICA

Cómo impacta en su negocio (usá viñetas):
- ventas
- conversión
- posicionamiento

━━━━━━━━━━━━━━━━━━━━

⚠️ CAUSA REAL

Explicá la raíz de la falla en párrafos cortos. Conectá la causa con su caso específico.

━━━━━━━━━━━━━━━━━━━━

🚀 ACCIÓN CONCRETA

Indicá (con viñetas):
- qué corregir primero
- qué dejar de hacer HOY
- qué ajustar

━━━━━━━━━━━━━━━━━━━━

💰 IMPACTO

Explicá qué mejorará si aplica la estructura.

━━━━━━━━━━━━━━━━━━━━

🔥 CIERRE

Cierre breve. Consultor estratégico real. Humano. Preciso. Sin sonar robótico ni motivacional.
`;
}

function crearPromptAnalisisCompleto(diagnostico, consultaOriginal) {

  const bloqueoPrincipal  = diagnostico.bloqueoPrincipal  || "No identificado";
  const bloqueoSecundario = diagnostico.bloqueoSecundario || "No identificado";
  const causaRaizNombre   = diagnostico.causaRaiz?.causaRaiz || "No determinada";
  const estadoCausa       = diagnostico.causaRaiz?.estado    || "";
  const prioridad1        = diagnostico.prioridades?.[0];
  const prioridad2        = diagnostico.prioridades?.[1];

  return `
Actuá como Problema Cero en MODO ANÁLISIS COMPLETO.

Tu tarea es ÚNICAMENTE redactar el plan de acción en lenguaje natural.
El diagnóstico ya está calculado. No lo repetís. No lo recalculás.
Convertís el objeto diagnóstico en un mapa de ejecución concreto.

CASO DEL USUARIO:
${consultaOriginal}

DIAGNÓSTICO CALCULADO POR EL SISTEMA:
- Nivel de madurez del negocio: ${diagnostico.madurez?.nivel || "No determinado"}
- Bloqueo principal: ${bloqueoPrincipal}
- Bloqueo secundario: ${bloqueoSecundario}
- Causa raíz: ${causaRaizNombre}
- Estado de causa raíz: ${estadoCausa}
- Prioridad 1: ${prioridad1?.bloqueo || ""} — ${prioridad1?.descripcion || ""}
- Prioridad 2: ${prioridad2?.bloqueo || ""} — ${prioridad2?.descripcion || ""}

IDENTIDAD:
Sos un estratega humano premium. Claro. Directo. Ejecutivo.
Sin sonar frío, soberbio ni corporativo.
Hablás en español rioplatense natural. No usás "usted".

REGLA DE VOCABULARIO:
- PROHIBIDO: metáforas médicas o clínicas
- PROHIBIDO: tono de gurú, motivacional o genérico
- PERMITIDO: español rioplatense natural, directo y de alto valor

INSTRUCCIÓN CRÍTICA DE FORMATO:
Devolvé ÚNICAMENTE un objeto JSON válido.
Sin texto antes ni después. Sin markdown. Sin bloques de código.

{
  "textoNarrativo": "todas las secciones narrativas aquí con sus títulos y separadores",
  "plan7Dias": [
    {"dia": 1, "accion": "texto"},
    {"dia": 2, "accion": "texto"},
    {"dia": 3, "accion": "texto"},
    {"dia": 4, "accion": "texto"},
    {"dia": 5, "accion": "texto"},
    {"dia": 6, "accion": "texto"},
    {"dia": 7, "accion": "texto"}
  ],
  "plan30Dias": [
    {"semana": 1, "objetivo": "texto", "accion": "texto"},
    {"semana": 2, "objetivo": "texto", "accion": "texto"},
    {"semana": 3, "objetivo": "texto", "accion": "texto"},
    {"semana": 4, "objetivo": "texto", "accion": "texto"}
  ],
  "contenidos": [
    {"numero": 1, "gancho": "texto", "tema": "texto", "objetivo": "texto"},
    {"numero": 2, "gancho": "texto", "tema": "texto", "objetivo": "texto"},
    {"numero": 3, "gancho": "texto", "tema": "texto", "objetivo": "texto"},
    {"numero": 4, "gancho": "texto", "tema": "texto", "objetivo": "texto"},
    {"numero": 5, "gancho": "texto", "tema": "texto", "objetivo": "texto"}
  ],
  "escenarios": [
    {"condicion": "texto", "accion": "texto"},
    {"condicion": "texto", "accion": "texto"},
    {"condicion": "texto", "accion": "texto"}
  ],
  "mensajes": [
    {"numero": 1, "texto": "texto"},
    {"numero": 2, "texto": "texto"},
    {"numero": 3, "texto": "texto"}
  ]
}

CONTENIDO DE textoNarrativo — incluir en este orden:

🧭 MAPA EJECUTIVO

4 a 6 viñetas: bloqueo confirmado, qué consume energía, qué corregir primero, resultado a buscar.

━━━━━━━━━━━━━━━━━━━━

🎯 PRIORIDAD ABSOLUTA

Una prioridad. Qué corregir, por qué va primero, qué pasa si lo sigue postergando.

━━━━━━━━━━━━━━━━━━━━

🛑 QUÉ DEJAR DE HACER YA

3 a 5 cosas concretas en viñetas.

━━━━━━━━━━━━━━━━━━━━

🔧 QUÉ CORREGIR PRIMERO

3 a 5 correcciones. Cada una: qué cambiar, cómo, para qué.

━━━━━━━━━━━━━━━━━━━━

📊 MÉTRICA QUE DEBERÍA MIRAR

1 a 3 métricas. Qué mirar, por qué importa, qué decisión tomar.

━━━━━━━━━━━━━━━━━━━━

🧠 CIERRE ESTRATÉGICO

Cierre breve, humano y firme. Sin motivación. Con dirección.
`;
}

// ── ENDPOINT PRINCIPAL ──────────────────────────────────────

app.post("/api/diagnostico", async (req, res) => {
  try {
    const {
      problem,
      userId,
      consultaOriginal,
      respuesta1,
      respuesta2,
      respuesta3,
      feedback1,
      feedback2,
      feedback3
    } = req.body;

    const textoConsulta = consultaOriginal || problem || "";

    const esAnalisisCompleto =
      typeof textoConsulta === "string" &&
      textoConsulta.toUpperCase().includes("ANÁLISIS COMPLETO");

    // ── PASO 1: LOS MOTORES CALCULAN ──────────────────────
    const diagnostico = motorDiagnostico(textoConsulta);

    // ── PASO 2: GEMINI SOLO REDACTA ───────────────────────
    const prompt = esAnalisisCompleto
      ? crearPromptAnalisisCompleto(diagnostico, textoConsulta)
      : crearPromptDiagnostico(diagnostico, textoConsulta);

    const respuestaGemini = await llamarGemini(prompt);

    // ── PASO 3: PROCESAR RESPUESTA ─────────────────────────
    let resultadoFinal;
    let plan7Dias  = [];
    let plan30Dias = [];
    let contenidos = [];
    let escenarios = [];
    let mensajes   = [];

    if (esAnalisisCompleto) {
      const jsonExtraido = extraerJSON(respuestaGemini);
      if (jsonExtraido && jsonExtraido.textoNarrativo) {
        resultadoFinal = jsonExtraido.textoNarrativo;
        plan7Dias  = Array.isArray(jsonExtraido.plan7Dias)  ? jsonExtraido.plan7Dias  : [];
        plan30Dias = Array.isArray(jsonExtraido.plan30Dias) ? jsonExtraido.plan30Dias : [];
        contenidos = Array.isArray(jsonExtraido.contenidos) ? jsonExtraido.contenidos : [];
        escenarios = Array.isArray(jsonExtraido.escenarios) ? jsonExtraido.escenarios : [];
        mensajes   = Array.isArray(jsonExtraido.mensajes)   ? jsonExtraido.mensajes   : [];
        console.log("✅ JSON estructurado OK");
      } else {
        // FALLBACK — Gemini no devolvió JSON válido, usar texto completo
        resultadoFinal = respuestaGemini;
        console.warn("⚠️ Fallback activo: Gemini no devolvió JSON válido");
      }
    } else {
      // Diagnóstico inicial — flujo sin cambios
      const cierre = `

━━━━━━━━━━━━━━━━━━━━

🔎 ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL

Detectar el problema es importante.

Pero el cambio aparece cuando sabés:
- qué corregir primero
- qué dejar de hacer
- cómo ordenar los próximos pasos sin seguir probando cosas al azar.

**TU PRÓXIMO PASO:**
Volvé a la pestaña de la web (problemacero.com.ar) y tocá el botón naranja para desbloquear tu Análisis Completo ahora mismo.

No es más información.
Es dirección clara.
`;
      resultadoFinal = respuestaGemini + cierre;
    }

    // ── PASO 4: GUARDAR EN SHEETS ─────────────────────────
    try {
      const arraysEstructurados = esAnalisisCompleto && plan7Dias.length
        ? JSON.stringify({ plan7Dias, plan30Dias, contenidos, escenarios, mensajes })
        : "";

      await guardarEnSheets({
        userId,
        tipo:                 esAnalisisCompleto ? "analisis_completo" : "diagnostico_inicial",
        consultaOriginal:     textoConsulta,
        diagnosticoInicial:   esAnalisisCompleto ? "" : resultadoFinal,
        respuesta1:           respuesta1  || "",
        respuesta2:           respuesta2  || "",
        respuesta3:           respuesta3  || "",
        feedback1:            feedback1   || "",
        feedback2:            feedback2   || "",
        feedback3:            feedback3   || "",
        analisisCompleto:     esAnalisisCompleto ? resultadoFinal : "",
        arraysEstructurados
      });
    } catch (sheetError) {
      console.error("Error guardando en Sheets:", sheetError.message);
    }

    // ── PASO 5: RESPUESTA ──────────────────────────────────
    res.json({
      ok:          true,
      diagnostico: resultadoFinal,
      ...(esAnalisisCompleto && { plan7Dias, plan30Dias, contenidos, escenarios, mensajes })
    });

  } catch (error) {
    console.error("Error diagnóstico:", error);
    res.status(500).json({
      error:   "Error diagnóstico",
      detalle: error.message
    });
  }
});

// ── ENDPOINTS DE DEBUG ──────────────────────────────────────

app.get("/api/test-sheets", async (req, res) => {
  try {
    await guardarEnSheets({
      userId:               "test_render",
      tipo:                 "test",
      consultaOriginal:     "Prueba técnica desde Render",
      diagnosticoInicial:   "Si aparece esta fila, Google Sheets está conectado correctamente.",
      respuesta1: "", respuesta2: "", respuesta3: "",
      feedback1:  "", feedback2:  "", feedback3:  "",
      analisisCompleto:     "Prueba",
      arraysEstructurados:  ""
    });
    res.json({ ok: true, mensaje: "Guardado confirmado en Google Sheets" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "NO se pudo guardar", error: error.message });
  }
});

app.get("/api/debug-env", (req, res) => {
  res.json({
    geminiApiKey:              GEMINI_API_KEY               ? "OK" : "FALTA",
    sheetId:                   GOOGLE_SHEET_ID              ? "OK" : "FALTA",
    serviceEmail:              GOOGLE_SERVICE_ACCOUNT_EMAIL ? "OK" : "FALTA",
    privateKey:                GOOGLE_PRIVATE_KEY           ? "OK" : "FALTA",
    privateKeyStartsCorrectly: GOOGLE_PRIVATE_KEY
      ? GOOGLE_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----")
      : false,
    privateKeyEndsCorrectly: GOOGLE_PRIVATE_KEY
      ? GOOGLE_PRIVATE_KEY.trim().endsWith("-----END PRIVATE KEY-----")
      : false
  });
});

app.get("/api/debug-motores", (req, res) => {
  try {
    const textoTest = `EL NEGOCIO:
1. Vendo ropa urbana.
2. Apunto a jóvenes de 18 a 30 años.
3. Arranqué hace 1 año.

EL PROBLEMA ELEGIDO Y DETALLE:
1. Opción 1.
2. Me llegan mensajes preguntando el precio y después no responden más.

LAS BASES DEL NEGOCIO:
1. Defino precios mirando la competencia.
2. Solo vendo por Instagram.
3. Dependo del boca a boca.
4. Trabajo completamente solo.

EL PUNTO DE BLOQUEO:
1. Opción 2. Tengo consultas pero no logro cerrar las ventas.

EL OBJETIVO A 90 DÍAS:
1. Quiero tener 5 clientes fijos por mes sin competir por precio.`;

    const resultado = motorDiagnostico(textoTest);
    res.json({ ok: true, diagnostico: resultado });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── ARRANQUE ────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Problema Cero v2.3 activo en puerto ${PORT}`);
});
