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

function maskSecret(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 12) return `len:${trimmed.length}`;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)} (len:${trimmed.length})`;
}

app.get("/", (req, res) => {
  res.send("Problema Cero API activa (PRO)");
});

app.get("/debug-env", async (req, res) => {
  return res.json({
    SUPABASE_URL,
    SUPABASE_KEY_present: !!SUPABASE_KEY,
    SUPABASE_KEY_masked: maskSecret(SUPABASE_KEY),
    GEMINI_API_KEY_present: !!GEMINI_API_KEY,
    GEMINI_API_KEY_masked: maskSecret(GEMINI_API_KEY)
  });
});

app.get("/debug-supabase", async (req, res) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/usuarios?select=*`;
    const response = await fetch(url, { headers });
    const rawText = await response.text();

    return res.json({
      ok: response.ok,
      status: response.status,
      url,
      SUPABASE_KEY_masked: maskSecret(SUPABASE_KEY),
      raw: rawText
    });
  } catch (error) {
    return res.status(500).json({
      error: "Fallo en debug-supabase",
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
      diagnostico: diagnosticoIA
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

    const userUrl = `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`;
    const userResponse = await fetch(userUrl, { headers });
    const rawUserText = await userResponse.text();

    let userData;
    try {
      userData = JSON.parse(rawUserText);
    } catch {
      return res.status(500).json({
        error: "Supabase no devolvió JSON válido",
        detalle: rawUserText
      });
    }

    if (!Array.isArray(userData)) {
      return res.status(500).json({
        error: "Supabase devolvió una respuesta inesperada",
        detalle: userData
      });
    }

    if (userData.length === 0) {
      const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          creditos: 5,
          total_consultas: 0
        })
      });

      const createRaw = await createResponse.text();

      return res.status(500).json({
        error: "Usuario no existía; intento de creación realizado",
        detalle: createRaw
      });
    }

    const user = userData[0];

    return res.json({
      ok: true,
      mensaje: "Usuario leído correctamente",
      user
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
