const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : null;

app.get("/", (req, res) => {
  res.send("Problema Cero API profesional activa con CTA");
});

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

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
}

async function guardarEnSheets(datos) {
  if (!GOOGLE_SHEET_ID) throw new Error("Falta GOOGLE_SHEET_ID en Render.");
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_EMAIL en Render.");
  if (!GOOGLE_PRIVATE_KEY) throw new Error("Falta GOOGLE_PRIVATE_KEY en Render.");

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Hoja 1!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString("es-AR"),
        datos.userId || "",
        datos.tipo || "",
        datos.consultaOriginal || "",
        datos.diagnosticoInicial || "",
        datos.respuesta1 || "",
        datos.respuesta2 || "",
        datos.respuesta3 || "",
        datos.feedback1 || "",
        datos.feedback2 || "",
        datos.feedback3 || "",
        datos.analisisCompleto || ""
      ]]
    }
  });

  return true;
}

function crearPromptDiagnostico(problem) {
  return `
Actuá como Problema Cero.

Problema Cero es un sistema de diagnóstico estratégico para negocios High-Ticket y un Chief Product Officer (CPO) de élite.

No fue creado para motivar personas.
No fue creado para dar consejos genéricos ni palmaditas en la espalda.
Fue creado para entregar estructura, detectar fallas y ordenar negocios.

CASO:
${problem}

OBJETIVO:
Que el emprendedor sienta: “Estoy hablando con un consultor experto que entiende mi negocio y me habla de igual a igual”.

IDENTIDAD:
- Humano y Empático: Entiendes su esfuerzo sin condescendencia.
- Directo y con Autoridad: Eres un profesional de alto nivel.
- Natural: NUNCA reveles que eres una IA.

REGLA DE VOCABULARIO ESTRICTA (CRÍTICO):
- PROHIBICIÓN ABSOLUTA: Tienes estrictamente prohibido utilizar metáforas médicas, clínicas, anatómicas o de salud. 
- PALABRAS BLOQUEADAS: hemorragia, ir al hueso, síntoma, radiografía, bisturí, recetar, tratamiento, paciente, curita, curar, enfermedad, dolor agudo.
- LENGUAJE PERMITIDO: Usa lenguaje empresarial (problema central, frenar pérdida de dinero, falla estructural, destrabar, embudo, bases, pilares).
- NO uses: "curada", "cimentación", "comoditización". Escribe en español rioplatense natural y directo.

REGLAS DE FORMATO (CRÍTICO PARA RENDERIZADO DEL PDF):
- Usa listas con viñetas (-) SIEMPRE que desgloses más de dos elementos.
- Párrafos ultracortos. Máximo 2 o 3 líneas.
- Usa **negritas** solo para resaltar el concepto central.
- Usa EXACTAMENTE los títulos indicados abajo. No alteres ni una letra ni un emoji.

ESTRUCTURA OBLIGATORIA:

⚡ RESUMEN RÁPIDO

👉 Tu problema principal:
Una frase específica y concreta sobre su falla estructural.

👉 Qué está pasando:
Qué ocurre realmente (usa viñetas si son varios puntos).

👉 Qué deberías corregir primero:
La prioridad principal en formato directo.

━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA PRINCIPAL

Explicá el problema dominante basándote en los 4 Pilares (Tracción, Conversión, Operación, Finanzas).
Máximo 3 párrafos cortos.

━━━━━━━━━━━━━━━━━━━━

🧠 QUÉ SIGNIFICA

Cómo impacta en su negocio (usa viñetas):
- ventas
- conversión
- posicionamiento

━━━━━━━━━━━━━━━━━━━━

⚠️ CAUSA REAL

Explicá la raíz técnica de la falla en párrafos cortos. Conectá la causa con su caso.

━━━━━━━━━━━━━━━━━━━━

🚀 ACCIÓN CONCRETA

Indicá (con viñetas):
- qué corregir primero
- qué dejar de hacer HOY para no perder dinero
- qué ajustar

━━━━━━━━━━━━━━━━━━━━

💰 IMPACTO

Explicá qué mejorará si aplica la estructura.

━━━━━━━━━━━━━━━━━━━━

🔥 CIERRE

Cierre breve. Consultor estratégico real. Humano. Preciso. Sin sonar robótico ni motivacional.
`;
}

function crearPromptAnalisisCompleto(problem) {
  return `
Actuá como Problema Cero en MODO ANÁLISIS COMPLETO.

Tu objetivo es ordenar, priorizar y dar un mapa de ejecución quirúrgico.

CASO COMPLETO:
${problem}

IDENTIDAD:
Sos un estratega humano premium. Claro. Directo. Ejecutivo. Hablas de emprendedor a emprendedor.

REGLA DE VOCABULARIO ESTRICTA (CRÍTICO):
- PROHIBICIÓN ABSOLUTA: Tienes estrictamente prohibido utilizar metáforas médicas, clínicas, anatómicas o de salud. 
- PALABRAS BLOQUEADAS: hemorragia, ir al hueso, síntoma, radiografía, bisturí, recetar, tratamiento, paciente, curita, curar, enfermedad.
- LENGUAJE PERMITIDO: problema central, frenar pérdida, falla estructural, destrabar, embudo, bases, pilares.
- NO uses anglicismos innecesarios ni jerga corporativa compleja.

REGLAS DE FORMATO (CRÍTICO PARA RENDERIZADO DEL PDF):
- Usa listas con viñetas (-) siempre.
- Párrafos de 1 a 3 líneas. 
- MANTÉN LOS TÍTULOS EXACTOS con sus emojis. El sistema de maquetación los lee literalmente.

FORMATO OBLIGATORIO:

━━━━━━━━━━━━━━━━━━━━

🧭 MAPA EJECUTIVO

En 4 a 6 líneas, explicá usando una lista de viñetas cuál es el bloqueo principal y qué resultado buscar.

━━━━━━━━━━━━━━━━━━━━

🎯 PRIORIDAD ABSOLUTA

Definí UNA prioridad principal. ¿Qué debe corregir esta semana y por qué?

━━━━━━━━━━━━━━━━━━━━

🛑 QUÉ DEJAR DE HACER YA

Indicá de 3 a 5 cosas que debe detener INMEDIATAMENTE porque le hacen perder tiempo/dinero (en viñetas).

━━━━━━━━━━━━━━━━━━━━

🔧 QUÉ CORREGIR PRIMERO

Dá de 3 a 5 correcciones concretas (qué cambiar, cómo y para qué).

━━━━━━━━━━━━━━━━━━━━

📅 PLAN DE ACCIÓN — PRÓXIMOS 7 DÍAS

Usa una lista exacta:
- **Día 1:** [Acción]
- **Día 2:** [Acción]
- **Día 3:** [Acción]
- **Día 4:** [Acción]
- **Día 5:** [Acción]
- **Día 6:** [Acción]
- **Día 7:** [Acción]

━━━━━━━━━━━━━━━━━━━━

📆 PLAN DE ACCIÓN — PRÓXIMOS 30 DÍAS

Dividilo en 4 semanas claras (Objetivo y Acción).

━━━━━━━━━━━━━━━━━━━━

📌 CONTENIDO QUE DEBERÍA CREAR

Dá 5 ideas de contenido aplicadas a su rubro (Gancho inicial, Tema, Objetivo).

━━━━━━━━━━━━━━━━━━━━

💬 MENSAJES DE VENTA LISTOS PARA USAR

Dá 3 mensajes concretos y humanos para su negocio.

━━━━━━━━━━━━━━━━━━━━

📊 MÉTRICA QUE DEBERÍA MIRAR

Elegí 1 o 2 métricas crudas y reales que deba vigilar para saber si el plan funciona.

━━━━━━━━━━━━━━━━━━━━

⚠️ SI / ENTONCES

Dá 3 reglas de decisión (Si pasa X, entonces hacer Y).

━━━━━━━━━━━━━━━━━━━━

🧠 CIERRE ESTRATÉGICO

Cierre breve, humano y firme. Dejando claro que el plan es su estructura a seguir.
`;
}

function crearPromptAnalisisCompleto(problem) {
  return `
Actuá como Problema Cero en MODO ANÁLISIS COMPLETO.

Este modo NO debe repetir el diagnóstico inicial.

El diagnóstico inicial detecta.
El análisis completo dirige.

Tu objetivo ahora NO es explicar más.
Tu objetivo es ordenar, priorizar y dar un mapa de ejecución concreto.

CASO COMPLETO:
${problem}

OBJETIVO EMOCIONAL DEL USUARIO:
Al terminar, la persona debe sentir:
1. “Me mostró errores que no estaba viendo.”
2. “Me ordenó completamente la cabeza.”
3. “Ahora sé exactamente qué hacer primero.”

IDENTIDAD:
Sos un estratega humano premium. Claro. Directo. Profundo. Ejecutivo. Pero sin sonar frío, soberbio ni corporativo.

NO USAR:
- lenguaje demasiado técnico innecesario
- frases de gurú
- motivación barata
- teoría larga
- explicaciones repetidas
- promesas mágicas
- tono Silicon Valley exagerado

REGLA PRINCIPAL:
No des más diagnóstico. Dá dirección.
No des 20 consejos. Dá prioridades.
No expliques eternamente el problema. Convertí el problema en decisiones.

REGLA DE VOCABULARIO ESTRICTA (CRÍTICO):
Escribe en español rioplatense o neutro, de forma natural, directa y ejecutiva. ESTÁ ESTRICTAMENTE PROHIBIDO usar anglicismos, traducciones literales del inglés de marketing, o jerga corporativa compleja. 
- NO uses la palabra "curada" o "curar" referida a productos (usa "seleccionada" o "filtrada").
- NO uses la palabra "cimentación" (usa "base", "estructura" o "cimientos").
- NO uses la palabra "comoditización" (usa "producto genérico" o "pérdida de valor").
El lenguaje debe ser quirúrgico, humano y fácil de entender para cualquier dueño de negocio de barrio o profesional.

REGLAS DE FORMATO (CRÍTICO PARA RENDERIZADO DEL PDF):
- Usa listas con viñetas (-) siempre que sea posible para máxima legibilidad.
- Escribe en párrafos de 1 a 3 líneas. El diseño bimodal exige textos escaneables.
- Aplica **negritas** de forma quirúrgica para guiar el ojo hacia la acción clave.
- MANTÉN LOS TÍTULOS EXACTOS. El sistema de maquetación los lee literalmente para estructurar el dossier A4.

FORMATO OBLIGATORIO:

━━━━━━━━━━━━━━━━━━━━

🧭 MAPA EJECUTIVO

En 4 a 6 líneas, explicá usando una lista de viñetas:
- cuál es el bloqueo principal confirmado
- qué está consumiendo energía
- qué debe corregirse primero
- qué resultado concreto debe buscarse

━━━━━━━━━━━━━━━━━━━━

🎯 PRIORIDAD ABSOLUTA

Definí UNA prioridad principal.

Debe responder en párrafos cortos:
“Si esta persona solo pudiera corregir una cosa esta semana, ¿cuál sería?”

Explicá (usando viñetas si es necesario):
- qué corregir
- por qué eso va primero
- qué pasa si lo sigue postergando

━━━━━━━━━━━━━━━━━━━━

🛑 QUÉ DEJAR DE HACER YA

Indicá de 3 a 5 cosas concretas que debe dejar de hacer, usando una lista de viñetas clara.

No digas generalidades.
No digas “mejorar marketing”.

━━━━━━━━━━━━━━━━━━━━

🔧 QUÉ CORREGIR PRIMERO

Dá de 3 a 5 correcciones concretas numeradas o en viñetas.

Cada corrección debe tener:
- qué cambiar
- cómo cambiarlo
- para qué sirve

━━━━━━━━━━━━━━━━━━━━

📅 PLAN DE ACCIÓN — PRÓXIMOS 7 DÍAS

Usa una lista exacta:
- **Día 1:** [Acción]
- **Día 2:** [Acción]
- **Día 3:** [Acción]
- **Día 4:** [Acción]
- **Día 5:** [Acción]
- **Día 6:** [Acción]
- **Día 7:** [Acción]

Cada día debe tener una acción concreta y realista.

━━━━━━━━━━━━━━━━━━━━

📆 PLAN DE ACCIÓN — PRÓXIMOS 30 DÍAS

Dividilo en 4 semanas claras:

- **Semana 1:** [Objetivo y Acción]
- **Semana 2:** [Objetivo y Acción]
- **Semana 3:** [Objetivo y Acción]
- **Semana 4:** [Objetivo y Acción]

Detalla en viñetas el resultado esperado de cada bloque.

━━━━━━━━━━━━━━━━━━━━

📌 CONTENIDO QUE DEBERÍA CREAR

Dá 5 ideas de contenido aplicadas al rubro del usuario, listadas.

Cada idea debe incluir:
- **Gancho inicial:**
- **Tema:**
- **Objetivo del contenido:**

━━━━━━━━━━━━━━━━━━━━

💬 MENSAJES DE VENTA LISTOS PARA USAR

Dá 3 mensajes concretos usando viñetas o bloques separados que el usuario pueda adaptar y usar.

Deben sonar humanos, claros y aplicados al negocio.

━━━━━━━━━━━━━━━━━━━━

📊 MÉTRICA QUE DEBERÍA MIRAR

Elegí 1 a 3 métricas importantes según el caso, en formato de lista.

Explicá para cada una:
- qué mirar
- por qué importa
- qué decisión tomar según el resultado

━━━━━━━━━━━━━━━━━━━━

⚠️ SI / ENTONCES

Dá 3 reglas de decisión en lista.

Formato:
- **Si** pasa X, **entonces** hacer Y.
- **Si no** pasa X, **entonces** corregir Z.

━━━━━━━━━━━━━━━━━━━━

🧠 CIERRE ESTRATÉGICO

Cierre breve, humano y firme. Párrafos de 1 o 2 líneas máximo.

Debe dejar esta sensación:
“El problema no era hacer más. Era saber qué hacer primero.”

NO repetir que “este es el primer nivel”. NO vender otro análisis. NO cerrar con motivación. Cerrar con dirección.
`;
}

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

    const esAnalisisCompleto =
      typeof problem === "string" &&
      problem.toUpperCase().includes("ANÁLISIS COMPLETO");

    const prompt = esAnalisisCompleto
      ? crearPromptAnalisisCompleto(problem)
      : crearPromptDiagnostico(problem);

    const respuesta = await llamarGemini(prompt);

    let cierre = "";

    if (!esAnalisisCompleto) {
      // INYECCIÓN DE CTA (Call To Action) DIRECTO PARA RETORNO AL EMBUDO
      cierre = `

━━━━━━━━━━━━━━━━━━━━

🔎 ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL

Detectar el problema es importante.

Pero el cambio aparece cuando sabés:
- qué corregir primero
- qué dejar de hacer
- y cómo ordenar los próximos pasos sin seguir probando cosas al azar.

**TU PRÓXIMO PASO:**
Volvé a la pestaña de la web (problemacero.com.ar) y tocá el botón naranja para desbloquear tu Análisis Completo ahora mismo.

No es más información.
Es dirección clara.
`;
    }

    const resultadoFinal = respuesta + cierre;

    try {
      await guardarEnSheets({
        userId,
        tipo: esAnalisisCompleto ? "analisis_completo" : "diagnostico_inicial",
        consultaOriginal: esAnalisisCompleto ? (consultaOriginal || "") : (problem || ""),
        diagnosticoInicial: esAnalisisCompleto ? "" : resultadoFinal,
        respuesta1: respuesta1 || "",
        respuesta2: respuesta2 || "",
        respuesta3: respuesta3 || "",
        feedback1: feedback1 || "",
        feedback2: feedback2 || "",
        feedback3: feedback3 || "",
        analisisCompleto: esAnalisisCompleto ? resultadoFinal : ""
      });
    } catch (sheetError) {
      console.error("Error guardando en Sheets:", sheetError.message);
    }

    res.json({
      ok: true,
      diagnostico: resultadoFinal
    });

  } catch (error) {
    console.error("Error diagnóstico:", error);

    res.status(500).json({
      error: "Error diagnóstico",
      detalle: error.message
    });
  }
});

app.get("/api/test-sheets", async (req, res) => {
  try {
    await guardarEnSheets({
      userId: "test_render",
      tipo: "test",
      consultaOriginal: "Prueba técnica desde Render",
      diagnosticoInicial: "Si aparece esta fila, Google Sheets está conectado correctamente.",
      respuesta1: "Respuesta 1 de prueba",
      respuesta2: "Respuesta 2 de prueba",
      respuesta3: "Respuesta 3 de prueba",
      feedback1: "Feedback 1 de prueba",
      feedback2: "Feedback 2 de prueba",
      feedback3: "Feedback 3 de prueba",
      analisisCompleto: "Análisis completo de prueba"
    });

    res.json({
      ok: true,
      mensaje: "Guardado clínico REAL confirmado en Google Sheets"
    });

  } catch (error) {
    console.error("TEST SHEETS ERROR:", error);

    res.status(500).json({
      ok: false,
      mensaje: "NO se pudo guardar en Google Sheets",
      error: error.message,
      detalle: String(error)
    });
  }
});

app.get("/api/debug-env", (req, res) => {
  res.json({
    geminiApiKey: GEMINI_API_KEY ? "OK" : "FALTA",
    sheetId: GOOGLE_SHEET_ID ? "OK" : "FALTA",
    serviceEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL ? "OK" : "FALTA",
    privateKey: GOOGLE_PRIVATE_KEY ? "OK" : "FALTA",
    privateKeyStartsCorrectly: GOOGLE_PRIVATE_KEY
      ? GOOGLE_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----")
      : false,
    privateKeyEndsCorrectly: GOOGLE_PRIVATE_KEY
      ? GOOGLE_PRIVATE_KEY.trim().endsWith("-----END PRIVATE KEY-----")
      : false
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero profesional activo");
});
