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

// ENDPOINT PRINCIPAL
app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    if (!problem || !userId) {
      return res.status(400).json({ error: "Faltan datos." });
    }

    // 1. Buscar usuario
    let userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
      { headers }
    );

    let userData = await userRes.json();

    // 2. Crear usuario si no existe
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

      // volver a buscar
      userRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
        { headers }
      );

      userData = await userRes.json();
    }

    const user = userData[0];

    // 3. Validar créditos
    if (user.creditos <= 0) {
      return res.status(403).json({
        error: "Sin créditos disponibles"
      });
    }

    // 4. Prompt IA
    const prompt = `
Actúa como un Chief Product Officer (CPO) experto en negocios.

Analiza este problema:
"${problem}"

Respondé con esta estructura:

1. DIAGNÓSTICO SIN FILTRO
2. FUGA DE DINERO
3. CAUSA RAÍZ
4. ACCIÓN HOY
5. PLAN 7 DÍAS
6. IMPACTO REAL

Reglas:
- Sé directo
- Nada de motivación vacía
- Máximo 250 palabras
`;

    // 5. Llamada a Gemini
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

    const diagnostico =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar diagnóstico.";

    // 6. Descontar crédito
    await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          creditos: user.creditos - 1,
          total_consultas: (user.total_consultas || 0) + 1
        })
      }
    );

    // 7. Respuesta final
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
  console.log("Servidor PRO activo");
});
