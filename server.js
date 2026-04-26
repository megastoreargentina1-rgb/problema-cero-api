const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

app.get("/", (req, res) => {
  res.send("Problema Cero API activa");
});

app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    if (!problem || !userId) {
      return res.status(400).json({
        error: "Faltan datos.",
        detalle: "Se requiere problem y userId."
      });
    }

    let userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
      { headers }
    );

    let userData = await userRes.json();

    if (!Array.isArray(userData)) {
      return res.status(500).json({
        error: "Respuesta inesperada de Supabase",
        detalle: userData
      });
    }

    if (userData.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          creditos: 5,
          total_consultas: 0
        })
      });

      userRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
        { headers }
      );

      userData = await userRes.json();
    }

    const user = userData[0];

    if (user.creditos <= 0) {
      return res.status(403).json({
        error: "Sin créditos disponibles"
      });
    }

    const prompt = `
Actúa como un consultor experto en negocios reales.

Tu rol es ser el Motor de Lógica de Negocio de Problema Cero.

Tu trabajo es detectar qué está frenando realmente el negocio del usuario y explicarlo de forma clara, humana y aplicada a su caso.

PROBLEMA DEL USUARIO:
"${problem}"

OBJETIVO:
Que el usuario piense:
"esto me está pasando a mí".

REGLAS:
- No uses lenguaje técnico.
- No uses palabras como Product Market Fit, PMF, framework u omnicanal.
- No des respuestas genéricas.
- Hablá del rubro concreto del usuario.
- Usá ejemplos reales.
- Sé firme, pero no agresivo.
- No entregues todo resuelto; esto es solo el diagnóstico inicial.

FORMATO OBLIGATORIO:

1. DIAGNÓSTICO
Debe incluir:
- una frase fuerte y clara
- explicación concreta aplicada al rubro
- un ejemplo real
- una conclusión clara

2. FUGA
Dónde está perdiendo tiempo, dinero o energía hoy.

3. CAUSA REAL
Por qué pasa esto en su tipo de negocio.

4. ACCIÓN HOY
Una acción simple y concreta.

5. PLAN 7 DÍAS
Pasos claros y aplicados.

6. IMPACTO
Qué cambia si lo hace.

CIERRE:
Debe dejar la sensación de que esto es solo el comienzo y que el plan completo profundiza mucho más.

Respondé ahora.
`;

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const aiData = await aiRes.json();

    if (aiData.error) {
      return res.status(500).json({
        error: "Gemini devolvió un error",
        detalle: aiData.error
      });
    }

    const diagnostico =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!diagnostico) {
      return res.status(500).json({
        error: "Gemini no devolvió diagnóstico",
        detalle: aiData
      });
    }

    await fetch(`${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        creditos: user.creditos - 1,
        total_consultas: (user.total_consultas || 0) + 1
      })
    });

    return res.json({
      ok: true,
      diagnostico,
      creditos_restantes: user.creditos - 1
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error interno",
      detalle: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo en puerto " + PORT);
});
