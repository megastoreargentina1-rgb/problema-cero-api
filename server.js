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
Actuá como un consultor senior real de negocios, marketing y ventas.
No sos una IA. Sos un experto analizando un negocio puntual.

CASO:
${problem}

OBJETIVO:
Dar un diagnóstico profundo, humano, específico y accionable.

IMPORTANTE:
- No sonar genérico
- No sonar académico
- No sonar robótico
- Hablar como si estuvieras asesorando a esa persona cara a cara
- Usar el lenguaje del rubro del usuario
- Ser directo, claro y estratégico

PROHIBIDO:
- Decir “invertí en publicidad” como solución principal
- Dar consejos genéricos
- Repetir ideas
- Respuestas cortas tipo checklist

ESTRUCTURA:

⚡ RESUMEN RÁPIDO

👉 Tu problema principal:
(una frase clara y directa)

👉 Qué está pasando:
(una frase que explique la situación)

👉 Qué tenés que hacer:
(una acción concreta clara)

━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA PRINCIPAL
Frase fuerte + 2 a 4 párrafos explicando el problema en profundidad.

🧠 QUÉ SIGNIFICA
Explicar consecuencias reales en el negocio.

⚠️ CAUSA REAL
Ir a la raíz del problema.

🚀 ACCIÓN CONCRETA
Dar acciones específicas aplicadas al caso.

💰 IMPACTO
Explicar qué cambia si aplica esto.

🔥 CIERRE
Cierre humano, fuerte, que haga pensar y generar decisión.

TONO:
Consultor real, cercano, directo, humano.
`;

    const diagnosticoBase = await llamarGemini(prompt);

    const cierre = `

━━━━━━━━━━━━━━━━━━━━

🔎 ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL

Lo que acabás de leer te muestra dónde puede estar el problema.

Pero entender el problema no alcanza.

El verdadero cambio aparece cuando sabés qué hacer primero, qué dejar de hacer y cómo ordenar los próximos pasos sin seguir probando cosas al azar.

El análisis completo baja este diagnóstico a un plan concreto para tu negocio.

No es más información.
Es dirección.
`;

    res.json({
      ok: true,
      diagnostico: diagnosticoBase + cierre
    });

  } catch (error) {
    res.status(500).json({ error: "Error diagnóstico", detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo");
});
