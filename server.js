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

  const data = await aiRes.json();

  if (data.error) {
    throw new Error(JSON.stringify(data.error));
  }

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No se pudo generar respuesta."
  );
}

app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem) {
      return res.status(400).json({
        error: "Falta el problema del negocio."
      });
    }

    const prompt = `
Actúa como un consultor experto en negocios reales.

Tu rol es ser el Motor de Lógica de Negocio de Problema Cero.

PROBLEMA DEL USUARIO:
"${problem}"

OBJETIVO:
Que el usuario piense:
"esto me está pasando a mí".

REGLAS:
- No uses lenguaje técnico.
- No seas genérico.
- Hablá del rubro concreto del usuario.
- Usá ejemplos reales.
- Sé firme, pero no agresivo.
- Esto es solo el diagnóstico inicial, no el plan completo.

FORMATO:

1. DIAGNÓSTICO
Debe incluir:
- una frase fuerte y clara
- explicación aplicada al rubro
- un ejemplo real
- una conclusión clara

2. FUGA
Dónde está perdiendo tiempo, dinero o energía.

3. CAUSA REAL
Por qué pasa esto en ese tipo de negocio.

4. ACCIÓN HOY
Una acción simple y concreta.

5. PLAN 7 DÍAS
Pasos claros y aplicados.

6. IMPACTO
Qué cambia si lo hace.

CIERRE:
Dejá claro que esto es solo el comienzo y que el plan completo profundiza mucho más.

Respondé ahora.
`;

    const diagnostico = await llamarGemini(prompt);

    return res.json({
      ok: true,
      diagnostico
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error generando diagnóstico",
      detalle: error.message
    });
  }
});

app.post("/api/plan", async (req, res) => {
  try {
    const { problem, respuestas } = req.body;

    if (!problem) {
      return res.status(400).json({
        error: "Falta el problema del negocio."
      });
    }

    const promptPlan = `
Actúa como un consultor experto en negocios reales.

El usuario ya recibió un diagnóstico inicial.
Ahora necesita el PLAN COMPLETO aplicado a su negocio.

PROBLEMA DEL USUARIO:
"${problem}"

RESPUESTAS ADICIONALES:
${JSON.stringify(respuestas || {}, null, 2)}

OBJETIVO:
Crear un plan claro, accionable y personalizado.
Esto es el producto pago, por lo tanto debe sentirse mucho más profundo que el diagnóstico inicial.

REGLAS:
- No seas genérico.
- Hablá del rubro específico.
- Usá ejemplos concretos.
- No uses lenguaje técnico innecesario.
- No des teoría.
- Decí exactamente qué hacer.
- El usuario debe sentir que recibió un plan real, no una respuesta de IA.

FORMATO OBLIGATORIO:

1. PROBLEMA REAL PROFUNDO
Explicá con más profundidad qué está frenando el negocio.

2. BLOQUEO PRINCIPAL
Definí un solo bloqueo central que debe resolver primero.

3. PRIORIDAD ABSOLUTA
Decí qué debe hacer primero y por qué.

4. QUÉ CAMBIAR
Mostrá qué parte del negocio debe modificar.

5. QUÉ ELIMINAR
Decí qué acciones debe dejar de hacer porque no ayudan.

6. PLAN DE ACCIÓN 7 DÍAS
Día 1:
Día 2:
Día 3:
Día 4:
Día 5:
Día 6:
Día 7:

7. EJEMPLOS APLICADOS
Mostrá ejemplos concretos de contenido, mensaje, oferta o acción según su negocio.

8. ERRORES A EVITAR
Lista clara de errores que lo van a mantener estancado.

9. PLAN A 30 DÍAS
Qué hacer durante el mes para consolidar el cambio.

10. MÉTRICA DE LA VERDAD
Qué señal concreta debe mirar para saber si está mejorando.

11. DECISIÓN FINAL
Cierre firme y claro.

Respondé ahora con el plan completo.
`;

    const plan = await llamarGemini(promptPlan);

    return res.json({
      ok: true,
      plan
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error generando plan",
      detalle: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo en puerto " + PORT);
});
