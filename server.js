const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
  res.send("Problema Cero API activa");
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

app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem } = req.body;

    const prompt = `
Actuá como un estratega de negocios experto.

Analizá este caso real:
${problem}

Reglas:
- No seas genérico
- No inventes nichos
- Si el usuario menciona un nicho, profundizalo
- Adaptá el lenguaje al tipo de negocio (ej: clientas, pacientes, alumnos, pedidos, turnos, etc)
- Hablá como una persona real, no como IA

Estructura:
1. DIAGNÓSTICO
2. FUGA
3. CAUSA REAL
4. ACCIÓN HOY
5. IMPACTO
`;

    const diagnosticoBase = await llamarGemini(prompt);

    const cierre = `

Esto que acabás de ver es solo la superficie.

El problema real no es lo que estás viendo ahora.
Es que estás operando sin una estructura que convierta.

Si seguís haciendo lo mismo:
más contenido, más esfuerzo… mismo resultado.

El plan completo no explica más.
Te dice exactamente qué cambiar, qué eliminar y qué hacer esta semana.

No es información.
Es ejecución.
`;

    res.json({
      ok: true,
      diagnostico: diagnosticoBase + cierre
    });

  } catch (error) {
    res.status(500).json({ error: "Error diagnóstico", detalle: error.message });
  }
});

app.post("/api/plan", async (req, res) => {
  try {
    const { problem, respuestas } = req.body;

    const promptPlan = `
Actuá como un equipo de consultores senior.

CASO:
${problem}

RESPUESTAS:
${JSON.stringify(respuestas || {}, null, 2)}

REGLA CLAVE DE LENGUAJE:
Debés adaptar TODAS las palabras al tipo de negocio.

Ejemplos:
- servicios → clientas, turnos, agenda, fidelización
- productos → ventas, pedidos, clientes
- educación → alumnos, inscripciones
- salud → pacientes
- fitness → alumnos, clases

PROHIBIDO:
- usar palabras genéricas si hay un contexto claro
- sonar como IA
- respuestas estándar

OBLIGATORIO:
- hablar como si conocieras el negocio
- usar lenguaje natural del rubro
- bajar a ejemplos reales

ESTRUCTURA:

1. DIAGNÓSTICO DIRECTO
2. RADIOGRAFÍA
3. ERROR PRINCIPAL
4. ERRORES
5. EJEMPLOS REALES
6. PRIORIDAD
7. PLAN 7 DÍAS
8. CONTENIDO
9. MENSAJES
10. ELIMINAR
11. PLAN 30 DÍAS
12. MÉTRICA
13. CONCLUSIÓN

TONO:
humano, directo, específico.
`;

    const plan = await llamarGemini(promptPlan);

    res.json({ ok: true, plan });

  } catch (error) {
    res.status(500).json({ error: "Error plan", detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo");
});
