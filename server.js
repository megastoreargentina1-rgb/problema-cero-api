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

// Ruta de diagnóstico puro de Supabase
app.get("/debug-supabase", async (req, res) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/usuarios?select=*`;
    const response = await fetch(url, { headers });

    const rawText = await response.text();

    return res.json({
      ok: response.ok,
      status: response.status,
      url,
      raw: rawText
    });
  } catch (error) {
    return res.status(500).json({
      error: "Fallo en debug-supabase",
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
