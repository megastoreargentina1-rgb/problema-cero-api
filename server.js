import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🔥 DIAGNÓSTICO GRATIS
app.post("/api/diagnostico", async (req, res) => {
  const { problem, userId } = req.body;

  const prompt = `
Actúa como un estratega de negocios.

Analizá este problema:

${problem}

Dame un diagnóstico claro, directo y fácil de entender.
No más de 200 palabras.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    res.json({
      diagnostico: data.choices?.[0]?.message?.content || "Error",
    });
  } catch (error) {
    res.json({ error: "No se pudo generar diagnóstico" });
  }
});

// 💣 PLAN PRO (EL PRODUCTO QUE SE VENDE)
app.post("/api/plan", async (req, res) => {
  const { problem, respuestas } = req.body;

  const prompt = `
Actúa como un estratega de negocios experto.

Este no es un análisis general.
Es un plan aplicado a ESTE negocio.

Caso:
Problema: ${problem}
Respuestas: ${JSON.stringify(respuestas)}

NO uses ejemplos genéricos.
NO hables en teoría.
NO des consejos amplios.

Quiero que hables directo, como si fueras un consultor caro.

Estructura obligatoria:

1. DIAGNÓSTICO DIRECTO
Destruir la falsa creencia del usuario en una frase clara.

2. PROBLEMA REAL
Explicar qué está pasando en SU negocio, no en general.

3. CLIENTE IDEAL REAL
Definir quién es su cliente basado en el caso.

4. ERRORES CLAVE
Lista concreta de lo que está haciendo mal.

5. PLAN DE ACCIÓN (7 DÍAS)
Día por día, acciones ejecutables.

6. CONTENIDO LISTO
3 ideas de contenido que pueda publicar mañana.

7. MENSAJES DE VENTA
2 mensajes listos para usar.

8. QUÉ ELIMINAR YA
Qué dejar de hacer inmediatamente.

9. CONCLUSIÓN FUERTE
Cerrar con impacto.

Habla directo.
Sin relleno.
Sin frases genéricas.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    res.json({
      plan: data.choices?.[0]?.message?.content || "Error generando plan",
    });
  } catch (error) {
    res.json({ error: "No se pudo generar el plan" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
