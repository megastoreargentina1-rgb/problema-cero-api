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

    if (!problem) {
      return res.status(400).json({ error: "Falta el problema del negocio." });
    }

    const prompt = `
Actúa como el Motor de Lógica de Negocio de Problema Cero.

Analizá este caso:
${problem}

Respondé con:
1. DIAGNÓSTICO
2. FUGA
3. CAUSA REAL
4. ACCIÓN HOY
5. PLAN 7 DÍAS
6. IMPACTO

Reglas:
- No seas genérico.
- Hablá del rubro concreto.
- Usá ejemplos reales.
- Sé claro, humano y directo.
- Esto es diagnóstico inicial, no plan completo.
`;

    const diagnostico = await llamarGemini(prompt);

    res.json({ ok: true, diagnostico });

  } catch (error) {
    res.status(500).json({
      error: "Error generando diagnóstico",
      detalle: error.message
    });
  }
});

app.post("/api/plan", async (req, res) => {
  try {
    const { problem, respuestas } = req.body;

    if (!problem) {
      return res.status(400).json({ error: "Falta el problema del negocio." });
    }

    const promptPlan = `
Actúa como un estratega de negocios experto.

Esto es el PRODUCTO PAGO de Problema Cero.
No es un diagnóstico general.
Es un plan aplicado a ESTE negocio.

CASO:
${problem}

RESPUESTAS DEL USUARIO:
${JSON.stringify(respuestas || {}, null, 2)}

Objetivo:
Que el usuario sienta que recibió un plan real, claro y ejecutable.

Reglas:
- No seas genérico.
- No uses teoría.
- Hablá del rubro específico.
- Usá ejemplos concretos.
- Decí exactamente qué hacer.
- No des frases motivacionales vacías.

Estructura obligatoria:

1. DIAGNÓSTICO DIRECTO
Una frase clara que destruya la falsa creencia del usuario.

2. PROBLEMA REAL
Qué está pasando en SU negocio.

3. CLIENTE IDEAL REAL
Quién debería ser su cliente según el caso.

4. ERRORES CLAVE
Qué está haciendo mal.

5. PLAN DE ACCIÓN 7 DÍAS
Día 1:
Día 2:
Día 3:
Día 4:
Día 5:
Día 6:
Día 7:

6. CONTENIDO LISTO
3 ideas de contenido listas para publicar.

7. MENSAJES DE VENTA
2 mensajes listos para usar.

8. QUÉ ELIMINAR YA
Qué debe dejar de hacer inmediatamente.

9. PLAN A 30 DÍAS
Qué hacer durante el mes.

10. MÉTRICA DE LA VERDAD
Qué señal concreta debe mirar.

11. CONCLUSIÓN FUERTE
Cierre directo.

Respondé ahora con el plan completo.
`;

    const plan = await llamarGemini(promptPlan);

    res.json({ ok: true, plan });

  } catch (error) {
    res.status(500).json({
      error: "Error generando plan",
      detalle: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo en puerto " + PORT);
});
