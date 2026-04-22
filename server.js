const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const SUPABASE_KEY = 
const SUPABASE_KEY = 

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

// Ruta test
app.get("/", (req, res) => {
  res.send("Problema Cero API activa (PRO)");
});
app.get("/test-db", async (req, res) => {
  try {
    const userId = "hernan_test_1";

    let userResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`, {
      headers
    });

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
// Diagnóstico con control de créditos
app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    if (!problem || !userId) {
      return res.status(400).json({ error: "Faltan datos." });
    }

    // 1. Buscar usuario
    let userResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`, {
      headers
    });

    let userData = await userResponse.json();

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

      userData = [{
       creditos: 5
      }];
    }

    // 3. Validar créditos
    if (userData[0].creditos <= 0) {
      return res.status(403).json({
        error: "Sin creditos"
      });
    }

    // 4. Restar crédito
    await fetch(`${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
       creditos: userData[0].creditos - 1,
        total_consultas: (userData[0].total_consultas || 0) + 1
      })
    });

    // 5. Respuesta (placeholder por ahora)
    return res.json({
      ok: true,
      mensaje: "Diagnóstico generado",
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
