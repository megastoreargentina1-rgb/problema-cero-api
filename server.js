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

app.get("/", (req, res) => {
  res.send("Problema Cero API v2.5 activa");
});

async function llamarGemini(prompt, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await aiRes.json();
      if (data.error) {
        const codigo = data.error.code || 0;
        if (codigo === 503 && i < intentos - 1) {
          console.warn(`⚠️ Gemini 503 — reintento ${i + 1}`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        throw new Error(JSON.stringify(data.error));
      }
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
    } catch (err) {
      if (i < intentos - 1) {
        console.warn(`⚠️ Error Gemini — reintento ${i + 1}: ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      } else { throw err; }
    }
  }
}

function extraerJSON(texto) {
  if (!texto) return null;
  try { return JSON.parse(texto.trim()); } catch (e1) {}
  try {
    const inicio = texto.indexOf("{"); const fin = texto.lastIndexOf("}");
    if (inicio !== -1 && fin !== -1 && fin > inicio) return JSON.parse(texto.slice(inicio, fin + 1));
  } catch (e2) {}
  try {
    const sinMd = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const inicio = sinMd.indexOf("{"); const fin = sinMd.lastIndexOf("}");
    if (inicio !== -1 && fin !== -1 && fin > inicio) return JSON.parse(sinMd.slice(inicio, fin + 1));
  } catch (e3) {}
  return null;
}

async function guardarEnSheets(datos) {
  if (!GOOGLE_SHEET_ID)               throw new Error("Falta GOOGLE_SHEET_ID.");
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL)  throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_EMAIL.");
  if (!GOOGLE_PRIVATE_KEY)            throw new Error("Falta GOOGLE_PRIVATE_KEY.");
  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL, key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID, range: "Hoja 1!A:M",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[
      new Date().toLocaleString("es-AR"),
      datos.userId || "", datos.tipo || "", datos.consultaOriginal || "",
      datos.diagnosticoInicial || "", datos.respuesta1 || "", datos.respuesta2 || "",
      datos.respuesta3 || "", datos.feedback1 || "", datos.feedback2 || "",
      datos.feedback3 || "", datos.analisisCompleto || "", datos.arraysEstructurados || ""
    ]] }
  });
  return true;
}

// ── PROMPT DIAGNÓSTICO INICIAL ───────────────────────────────

function crearPromptDiagnostico(diagnostico, consultaOriginal) {
  const bloqueoPrincipal  = diagnostico.bloqueoPrincipal  || "No identificado";
  const bloqueoSecundario = diagnostico.bloqueoSecundario || "No identificado";
  const causaRaizNombre   = diagnostico.causaRaiz?.causaRaiz || "No determinada";
  const estadoCausa       = diagnostico.causaRaiz?.estado    || "";
  const autorizada        = diagnostico.causaRaiz?.autorizada;
  const prioridad1        = diagnostico.prioridades?.[0];
  const madurez           = diagnostico.madurez;

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
- PROHIBIDO: metáforas médicas o clínicas
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

IMPORTANTE: Terminá el texto exactamente después del cierre.
No agregues preguntas, encuestas, ni llamados a la acción.
El sistema se encarga del siguiente paso por fuera del diagnóstico.
`;
}

// ── PROMPT ANÁLISIS COMPLETO ─────────────────────────────────

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

━━━━━━━━━━━━━━━━━━━━
REGLA DE UNIVERSALIDAD — CRÍTICA
━━━━━━━━━━━━━━━━━━━━

Este sistema atiende todo tipo de negocios. El plan SIEMPRE se adapta
al canal y contexto real del usuario, no al canal más popular o más fácil.

PERFILES QUE PODÉS RECIBIR — adaptá el plan a cada uno:
1. Servicios de belleza (uñas, peluquería, estética) → turnos, WhatsApp, boca a boca, Instagram
2. Gastronomía (resto, delivery, catering, pastelería) → reseñas, delivery apps, local físico, Google Maps
3. Comercio minorista (ropa, calzado, accesorios) → local físico, Mercado Libre, redes, vidrieras
4. Servicios profesionales (contadores, abogados, psicólogos, arquitectos) → LinkedIn, referencias, web, email
5. Construcción y oficios (plomeros, electricistas, albañiles, carpinteros) → WhatsApp, recomendaciones, grupos de vecinos
6. Educación y formación (profesores, coaches, cursos, tutorías) → Zoom, YouTube, email, comunidades
7. Salud y bienestar (nutricionistas, kinesiólogos, yoga, meditación) → turnos, consultorio, Instagram, referencias médicas
8. Tecnología y freelance (diseñadores, programadores, marketers, redactores) → portafolios, LinkedIn, Upwork, clientes directos
9. Productos artesanales y manufactura (velas, bijouterie, ropa, muebles) → ferias, Tienda Nube, Instagram, Mercado Libre
10. Agro, alimentos y distribución (productores, mayoristas, distribuidores) → canales B2B, WhatsApp, ferias, referidos

REGLA ABSOLUTA DE NIVEL:
- NUNCA bajés el nivel estratégico del plan por las limitaciones declaradas del usuario.
- Si el usuario dice "no sé de redes", el plan le indica QUÉ aprender, DÓNDE aprenderlo
  y en QUÉ orden, sin simplificar la estrategia.
- Si el usuario dice "trabajo solo", el plan contempla eso en la ejecución pero no baja
  la vara de lo que debe lograr.
- Si el usuario no tiene presupuesto, el plan prioriza acciones de costo cero primero,
  pero siempre con estándar profesional.
- El plan es exigente, concreto y ejecutable. Nunca condescendiente.

━━━━━━━━━━━━━━━━━━━━

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
Adaptadas al tipo de negocio y canal real del usuario.

━━━━━━━━━━━━━━━━━━━━

📊 MÉTRICA QUE DEBERÍA MIRAR

1 a 3 métricas. Qué mirar, por qué importa, qué decisión tomar.
Las métricas deben ser relevantes para el canal real del negocio.

━━━━━━━━━━━━━━━━━━━━

🧠 CIERRE ESTRATÉGICO

Cierre breve, humano y firme. Sin motivación. Con dirección.
`;
}

// ── ENDPOINT PRINCIPAL ───────────────────────────────────────

app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId, consultaOriginal, respuesta1, respuesta2, respuesta3, feedback1, feedback2, feedback3 } = req.body;
    const textoConsulta = consultaOriginal || problem || "";
    const esAnalisisCompleto = typeof textoConsulta === "string" && textoConsulta.toUpperCase().includes("ANÁLISIS COMPLETO");

    const diagnostico = motorDiagnostico(textoConsulta);
    const prompt = esAnalisisCompleto
      ? crearPromptAnalisisCompleto(diagnostico, textoConsulta)
      : crearPromptDiagnostico(diagnostico, textoConsulta);

    const respuestaGemini = await llamarGemini(prompt);

    let resultadoFinal;
    let plan7Dias = [], plan30Dias = [], contenidos = [], escenarios = [], mensajes = [];

    if (esAnalisisCompleto) {
      console.log("=== ANÁLISIS COMPLETO ===");
      console.log("PRIMEROS 300 CHARS:", respuestaGemini.slice(0, 300));
      const jsonExtraido = extraerJSON(respuestaGemini);
      console.log("JSON OK:", !!jsonExtraido, "| textoNarrativo:", !!jsonExtraido?.textoNarrativo);
      console.log("=========================");

      if (jsonExtraido && jsonExtraido.textoNarrativo) {
        resultadoFinal = jsonExtraido.textoNarrativo;
        plan7Dias  = Array.isArray(jsonExtraido.plan7Dias)  ? jsonExtraido.plan7Dias  : [];
        plan30Dias = Array.isArray(jsonExtraido.plan30Dias) ? jsonExtraido.plan30Dias : [];
        contenidos = Array.isArray(jsonExtraido.contenidos) ? jsonExtraido.contenidos : [];
        escenarios = Array.isArray(jsonExtraido.escenarios) ? jsonExtraido.escenarios : [];
        mensajes   = Array.isArray(jsonExtraido.mensajes)   ? jsonExtraido.mensajes   : [];
      } else {
        resultadoFinal = respuestaGemini;
        console.warn("⚠️ Fallback activo");
      }
    } else {
      const cierre = `

━━━━━━━━━━━━━━━━━━━━

🔎 ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL

Detectar el problema es importante.

Pero el cambio aparece cuando sabés:
- qué corregir primero
- qué dejar de hacer
- cómo ordenar los próximos pasos sin seguir probando cosas al azar.

No es más información. Es dirección clara.
`;
      resultadoFinal = respuestaGemini + cierre;
    }

    try {
      const arraysEstructurados = esAnalisisCompleto && plan7Dias.length
        ? JSON.stringify({ plan7Dias, plan30Dias, contenidos, escenarios, mensajes }) : "";
      await guardarEnSheets({
        userId, tipo: esAnalisisCompleto ? "analisis_completo" : "diagnostico_inicial",
        consultaOriginal: textoConsulta,
        diagnosticoInicial: esAnalisisCompleto ? "" : resultadoFinal,
        respuesta1: respuesta1||"", respuesta2: respuesta2||"", respuesta3: respuesta3||"",
        feedback1: feedback1||"", feedback2: feedback2||"", feedback3: feedback3||"",
        analisisCompleto: esAnalisisCompleto ? resultadoFinal : "", arraysEstructurados
      });
    } catch (sheetError) { console.error("Error Sheets:", sheetError.message); }

    res.json({
      ok: true,
      diagnostico: resultadoFinal,
      ...(esAnalisisCompleto && { plan7Dias, plan30Dias, contenidos, escenarios, mensajes })
    });

  } catch (error) {
    console.error("Error diagnóstico:", error);
    res.status(500).json({ error: "Error diagnóstico", detalle: error.message });
  }
});

// ── ENDPOINTS DE DEBUG ───────────────────────────────────────

app.get("/api/test-sheets", async (req, res) => {
  try {
    await guardarEnSheets({
      userId: "test_render", tipo: "test",
      consultaOriginal: "Prueba técnica desde Render",
      diagnosticoInicial: "Conexión OK.",
      respuesta1:"", respuesta2:"", respuesta3:"",
      feedback1:"", feedback2:"", feedback3:"",
      analisisCompleto: "Prueba", arraysEstructurados: ""
    });
    res.json({ ok: true, mensaje: "Guardado confirmado en Google Sheets" });
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

app.get("/api/debug-env", (req, res) => {
  res.json({
    geminiApiKey: GEMINI_API_KEY ? "OK" : "FALTA",
    sheetId: GOOGLE_SHEET_ID ? "OK" : "FALTA",
    serviceEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL ? "OK" : "FALTA",
    privateKey: GOOGLE_PRIVATE_KEY ? "OK" : "FALTA",
    privateKeyStartsCorrectly: GOOGLE_PRIVATE_KEY ? GOOGLE_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----") : false,
    privateKeyEndsCorrectly: GOOGLE_PRIVATE_KEY ? GOOGLE_PRIVATE_KEY.trim().endsWith("-----END PRIVATE KEY-----") : false
  });
});

app.get("/api/debug-motores", (req, res) => {
  try {
    const textoTest = `EL NEGOCIO:\n1. Vendo ropa urbana.\n2. Apunto a jóvenes de 18 a 30 años.\n3. Arranqué hace 1 año.\n\nEL PROBLEMA ELEGIDO Y DETALLE:\n1. Opción 1.\n2. Me llegan mensajes preguntando el precio y después no responden más.\n\nLAS BASES DEL NEGOCIO:\n1. Defino precios mirando la competencia.\n2. Solo vendo por Instagram.\n3. Dependo del boca a boca.\n4. Trabajo completamente solo.\n\nEL PUNTO DE BLOQUEO:\n1. Opción 2.\n\nEL OBJETIVO A 90 DÍAS:\n1. Quiero tener 5 clientes fijos por mes.`;
    const resultado = motorDiagnostico(textoTest);
    res.json({ ok: true, diagnostico: resultado });
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Problema Cero v2.5 activo en puerto ${PORT}`));
