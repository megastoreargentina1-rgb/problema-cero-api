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
  res.send("Problema Cero API activa");
});

app.post("/api/diagnostico", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    if (!problem || !userId) {
      return res.status(400).json({
        error: "Faltan datos.",
        detalle: "Se requiere problem y userId."
      });
    }

    let userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
      { headers }
    );

    let userData = await userRes.json();

    if (!Array.isArray(userData)) {
      return res.status(500).json({
        error: "Respuesta inesperada de Supabase",
        detalle: userData
      });
    }

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

      userRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`,
        { headers }
      );

      userData = await userRes.json();
    }

    const user = userData[0];

    if (user.creditos <= 0) {
      return res.status(403).json({
        error: "Sin créditos disponibles"
      });
    }

    const prompt = `
Actúa como un experto en negocios reales.

No eres una IA genérica.
Eres el Motor de Lógica de Negocio de Problema Cero.

Tu trabajo no es dar consejos generales.
Tu trabajo es detectar qué está frenando realmente el negocio del usuario y explicarlo de una forma clara, humana y aplicada a su caso.

PROBLEMA DEL USUARIO:
"${problem}"

OBJETIVO PRINCIPAL:
La respuesta debe hacer que el usuario piense:
"Esto me está pasando a mí".

REGLAS PRINCIPALES:

1. La respuesta debe sentirse específica para ese negocio.
Si podría servir igual para otro rubro, está mal.

2. Antes de responder, analizá internamente:
- Qué vende
- A quién podría venderle
- Cómo vende
- En qué etapa parece estar
- Qué problema cree tener
- Qué problema real probablemente tiene

3. Usá lenguaje humano y simple.
No uses palabras como:
- Product Market Fit
- PMF
- framework
- omnicanal
- validación fallida
- modelo de negocio complejo

4. No seas agresivo sin sentido.
Podés ser firme, pero no humillante.

5. No uses frases genéricas como:
- "es importante"
- "para tener éxito"
- "como IA"
- "te recomiendo mejorar tu estrategia"

6. Hablá del rubro concreto.
Si vende remeras, hablá de remeras, diseño, identidad, estilo, marca, público y uso real.
Si vende velas, hablá de ambiente, regalo, experiencia, aroma, decoración, emoción y diferenciación.
Si vende servicios, hablá de confianza, autoridad, prueba, claridad de oferta y percepción.
Si vende conocimiento, hablá de promesa, transformación, credibilidad y resultado.

FORMATO OBLIGATORIO:

1. DIAGNÓSTICO
Empezá con una frase fuerte, clara y simple.
Explicá qué está pasando realmente en SU negocio.

2. FUGA
Mostrá dónde está perdiendo tiempo, plata o energía hoy.

3. CAUSA REAL
Explicá por qué le pasa esto en su tipo de negocio.

4. ACCIÓN HOY
Una acción concreta que pueda hacer hoy mismo.

5. PLAN 7 DÍAS
Dale pasos simples, específicos y aplicados a su caso.

6. IMPACTO
Explicá qué cambia si lo hace.

CIERRE:
Cerrá dejando claro que esto es solo el diagnóstico inicial y que hay más profundidad detrás.
Debe generar ganas de ver el plan completo.

IMPORTANTE:
No entregues una respuesta académica.
No entregues una respuesta genérica.
No expliques como profesor.
Hablá como alguien que entiende negocios reales y ve rápido dónde está el bloqueo.

Respondé ahora.
`;

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

    const aiData = await aiRes.json();

    const diagnostico =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar diagnóstico.";

    await fetch(`${SUPABASE_URL}/rest/v1/usuarios?user_id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        creditos: user.creditos - 1,
        total_consultas: (user.total_consultas || 0) + 1
      })
    });

    return res.json({
      ok: true,
      diagnostico,
      creditos_restantes: user.creditos - 1
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
  console.log("Servidor Problema Cero activo en puerto " + PORT);
});
