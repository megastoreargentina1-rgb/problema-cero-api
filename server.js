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

app.post("/api/diagnostico", async (req, res) => {

  const { problem } = req.body;

  try{

    const prompt = `
Actúa como un consultor experto en negocios reales.

PROBLEMA:
${problem}

Explica:

1. Diagnóstico
2. Fuga
3. Causa real
4. Acción hoy
5. Plan 7 días
6. Impacto

No seas genérico.
Habla claro.
`;

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          contents:[
            {
              parts:[{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await aiRes.json();

    const diagnostico =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar diagnóstico.";

    res.json({ diagnostico });

  }catch(e){

    res.json({
      diagnostico:"Error generando diagnóstico."
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
