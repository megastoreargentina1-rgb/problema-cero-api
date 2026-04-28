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

    const diagnosticoBase = await llamarGemini(prompt);

    const cierre = `

Esto que acabás de ver es solo la superficie.

El problema real no es que vendas poco.
Es que estás operando sin una estructura que convierta.

Hoy estás invirtiendo tiempo, contenido y dinero…
pero sin una dirección clara que transforme eso en ventas.

Y eso tiene una consecuencia simple:
vas a seguir haciendo más esfuerzo para obtener el mismo resultado.

Más publicaciones.
Más publicidad.
Más desgaste.

Y las mismas pocas ventas.

El punto no es trabajar más.
Es dejar de trabajar a ciegas.

Porque si no corregís esto ahora,
en 3 meses vas a estar exactamente en el mismo lugar donde estás hoy.

El plan completo no te da más teoría.

Te muestra exactamente:
- qué cambiar
- qué eliminar
- qué hacer esta semana
- y dónde estás perdiendo ventas sin darte cuenta

No es información.
Es ejecución.

La diferencia entre seguir intentando…
o empezar a destrabar el negocio de verdad.
`;

    res.json({
      ok: true,
      diagnostico: diagnosticoBase + cierre
    });

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

FORMA DE PENSAR:
Analizá:
- qué está haciendo
- por qué no vende
- dónde se rompe la conversión

Luego decidí:
- problema principal
- prioridad

CRITERIO:
Esto debe sentirse como una consultoría paga real.

PROHIBIDO:
- contenido genérico
- teoría sin acción
- suavizar errores

OBLIGATORIO:
- bajar a ejemplos reales
- explicar por qué no funciona
- dar acciones ejecutables

ESTRUCTURA:

1. DIAGNÓSTICO DIRECTO
2. RADIOGRAFÍA DEL NEGOCIO
3. ERROR PRINCIPAL
4. ERRORES SECUNDARIOS
5. EJEMPLOS REALES
6. PRIORIDAD ABSOLUTA
7. PLAN 7 DÍAS
8. CONTENIDO LISTO
9. MENSAJES DE VENTA
10. QUÉ ELIMINAR YA
11. PLAN 30 DÍAS
12. MÉTRICA REAL
13. CONCLUSIÓN FUERTE

TONO:
Directo, profesional, claro.
Sin relleno.

Esto no es contenido.
Es decisión.
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
