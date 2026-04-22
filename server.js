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
  res.send("Problema Cero API activa (PRO)");
});

app.get("/test-db", async (req, res) => {
  try {
    const userId = "hernan_test_1";

    let userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
      { headers }
    );

    let userData = await userResponse.json();

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

      return res.json({
        ok: true,
        mensaje: "Usuario creado correctamente en Supabase",
        userId
      });
    }

    return res.json({
      ok: true,
      mensaje: "Usuario ya existe en Supabase",
      user: userData[0]
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al conectar con Supabase",
      detalle: error.message
    });
  }
});

app.get("/test-ai", async (req, res) => {
  try {
    const problem = "Tengo un negocio de ropa y no vendo";

    const prompt = `
Actúa como un Chief Product Officer (CPO) y consultor estratégico de negocios.

Analiza este problema: "${problem}"

Respondé con esta estructura obligatoria:
1. DIAGNÓSTICO SIN FILTRO
2. FUGA DE DINERO ESPECÍFICA
3. CAUSA RAÍZ
4. ACCIÓN OBLIGATORIA HOY
5. PLAN DE 7 DÍAS
6. IMPACTO REAL

Reglas:
- Nada de generalidades
- Nada de consejos vacíos
- Sé claro, directo y útil
- Máximo 300 palabras
`;

    const geminiResponse = await fetch(
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

    const geminiData = await geminiResponse.json();

    const diagnosticoIA =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar el diagnóstico.";

    return res.json({
      ok: true,
      diagnostico: diagnosticoIA,
      raw: geminiData
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error en test-ai",
      detalle: error.message
    });
  }
});

app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    if (!problem || !userId) {
      return res.status(400).json({ error: "Faltan datos." });
    }

    let userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
      { headers }
    );

    let userData = await userResponse.json();

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

      userData = [{ creditos: 5, total_consultas: 0 }];
    }

    if (userData[0].creditos <= 0) {
      return res.status(403).json({
        error: "Sin créditos disponibles"
      });
    }

    const prompt = `
Actúa como un Chief Product Officer (CPO) y consultor estratégico de negocios.

Analiza este problema: "${problem}"

Respondé con esta estructura obligatoria:
1. DIAGNÓSTICO SIN FILTRO
2. FUGA DE DINERO ESPECÍFICA
3. CAUSA RAÍZ
4. ACCIÓN OBLIGATORIA HOY
5. PLAN DE 7 DÍAS
6. IMPACTO REAL

Reglas:
- Nada de generalidades
- Nada de consejos vacíos
- Sé claro, directo y útil
- Máximo 300 palabras
`;

    const geminiResponse = await fetch(
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

    const geminiData = await geminiResponse.json();

    const diagnosticoIA =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar el diagnóstico.";

    await fetch(`${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        creditos: userData[0].creditos - 1,
        total_consultas: (userData[0].total_consultas || 0) + 1
      })
    });

    return res.json({
      ok: true,
      diagnostico: diagnosticoIA,
      creditos_restantes: userData[0].creditos - 1
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
  console.log(`Servidor PRO activo en puerto ${PORT}`);
});
