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

    const prompt = `
Actuá como un estratega de negocios experto.

Analizá este caso real:
${problem}

Reglas:
- No seas genérico
- No inventes nichos
- Si el usuario menciona un nicho, profundizalo
- Hablá del negocio real
- Sé claro y directo

Estructura:
1. DIAGNÓSTICO
2. FUGA
3. CAUSA REAL
4. ACCIÓN HOY
5. IMPACTO

Esto es diagnóstico inicial.
`;

    const diagnostico = await llamarGemini(prompt);

    res.json({ ok: true, diagnostico });

  } catch (error) {
    res.status(500).json({ error: "Error diagnóstico", detalle: error.message });
  }
});

app.post("/api/plan", async (req, res) => {
  try {
    const { problem, respuestas } = req.body;

    const promptPlan = `
Actuá como un equipo de consultores senior (negocio, marketing, ventas y ejecución).

CASO REAL:
${problem}

RESPUESTAS:
${JSON.stringify(respuestas || {}, null, 2)}

REGLA MADRE:
Trabajá SOLO con lo que el usuario dijo.
- No inventes nichos
- No cambies el rubro
- Si hay un nicho específico, profundizalo
- Si no lo hay, no inventes uno

FORMA DE PENSAR (OBLIGATORIO):
Antes de responder, analizá:
- qué está haciendo
- por qué no vende
- dónde se rompe la conversión
- qué cree que funciona pero no funciona

Luego decidí:
- cuál es el problema principal
- qué se ataca primero

CRITERIO:
Esto debe sentirse como una consultoría paga real.

PROHIBIDO:
- contenido genérico
- frases de marketing básicas
- teoría sin acción
- suavizar errores
- hablar como IA

OBLIGATORIO:
- bajar a ejemplos concretos
- criticar con claridad
- explicar por qué no funciona
- dar acciones ejecutables

ESTRUCTURA:

1. DIAGNÓSTICO DIRECTO
Una frase que rompa su idea actual.

2. RADIOGRAFÍA DEL NEGOCIO
Qué está pasando realmente y por qué no convierte.

3. ERROR PRINCIPAL (UNO SOLO)
Elegí el problema más importante y explicalo.

4. ERRORES SECUNDARIOS
Lista clara de lo que también está mal.

5. EJEMPLOS REALES
Bajalo a situaciones concretas (contenido, ventas, producto).

6. PRIORIDAD ABSOLUTA
Qué tiene que cambiar primero y por qué.

7. PLAN 7 DÍAS
Día por día con acciones reales.

8. CONTENIDO LISTO
3 piezas específicas aplicadas a su negocio.

9. MENSAJES DE VENTA
2 textos listos para usar.

10. QUÉ ELIMINAR YA

11. PLAN 30 DÍAS

12. MÉTRICA REAL

13. CONCLUSIÓN FUERTE

TONO:
Directo.
Profesional.
Claro.
Incómodo cuando haga falta.
Sin relleno.

Esto no es contenido.
Es una decisión.
`;

    const plan = await llamarGemini(promptPlan);

    res.json({ ok: true, plan });

  } catch (error) {
    res.status(500).json({ error: "Error plan", detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo");
});
