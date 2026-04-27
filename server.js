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
Actúa como el Motor de Lógica de Negocio de Problema Cero.

Analizá este caso real:
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
- Hablá del rubro concreto del usuario.
- No inventes nichos que el usuario no mencionó.
- Usá ejemplos reales del negocio mencionado.
- Sé claro, humano y directo.
- Esto es diagnóstico inicial, no plan completo.

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
Actúa como un estratega de negocios experto.

Esto es el PRODUCTO PAGO de Problema Cero.
No es un diagnóstico general.
Es un plan aplicado a ESTE negocio real.

CASO REAL DEL USUARIO:
${problem}

RESPUESTAS DEL USUARIO:
${JSON.stringify(respuestas || {}, null, 2)}

REGLA PRINCIPAL:
Debes respetar exactamente el rubro y el contexto del usuario.

PROHIBIDO:
- Inventar nichos que el usuario no mencionó.
- Cambiar el negocio real por otro ejemplo.
- Usar ejemplos de juegos de mesa, gamers, restaurantes, coaches u otros rubros si el usuario no los nombró.
- Decir “para este plan vamos a enfocarnos en...” inventando un público nuevo.
- Dar consejos genéricos que podrían servir para cualquier negocio.

SI EL NEGOCIO ES DE REMERAS:
Hablá de remeras, indumentaria, diseños, identidad, estilo, calidad percibida, uso real, marca, contenido, redes, Meta Ads, cliente comprador de ropa y decisión de compra.

SI EL NEGOCIO ES DE VELAS:
Hablá de velas, aromas, ambiente, regalo, decoración, experiencia sensorial, bienestar, ritual, hogar y percepción emocional.

SI EL NEGOCIO ES DE SERVICIOS:
Hablá de confianza, autoridad, prueba social, claridad de oferta, objeciones y proceso de venta.

OBJETIVO:
Que el usuario sienta que recibió un plan real, claro, aplicable y específico para su negocio.

Estructura obligatoria:

1. DIAGNÓSTICO DIRECTO
Una frase clara que destruya la falsa creencia del usuario.

2. PROBLEMA REAL
Qué está pasando en SU negocio concreto.

3. CLIENTE IDEAL REAL
Definí quién debería ser su cliente, pero siempre dentro del rubro real del usuario.
No inventes un nicho raro. Si no hay datos suficientes, proponé 2 o 3 opciones posibles dentro del mismo rubro.

4. ERRORES CLAVE
Qué está haciendo mal hoy.

5. PLAN DE ACCIÓN 7 DÍAS
Día 1:
Día 2:
Día 3:
Día 4:
Día 5:
Día 6:
Día 7:

6. CONTENIDO LISTO
3 ideas de contenido listas para publicar, siempre aplicadas al rubro real del usuario.

7. MENSAJES DE VENTA
2 mensajes listos para usar, aplicados al producto real del usuario.

8. QUÉ ELIMINAR YA
Qué debe dejar de hacer inmediatamente.

9. PLAN A 30 DÍAS
Qué hacer durante el mes para ordenar y escalar.

10. MÉTRICA DE LA VERDAD
Qué señal concreta debe mirar para saber si está mejorando.

11. CONCLUSIÓN FUERTE
Cierre directo y claro.

Tono:
- directo
- humano
- profesional
- específico
- sin relleno
- sin teoría innecesaria

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
