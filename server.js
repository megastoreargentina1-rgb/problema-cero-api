const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Problema Cero API activa");
});

// Ruta principal
app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    if (!problem || !userId) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    return res.json({
      ok: true,
      mensaje: "Backend funcionando correctamente",
      recibido: { problem, userId }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
