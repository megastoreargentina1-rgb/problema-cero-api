import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/diagnostico", async (req, res) => {
  const { problem } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `
Actúa como un consultor experto en negocios reales.

No eres una IA genérica.

Tu objetivo es detectar el problema real del negocio del usuario y explicarlo de forma clara, directa y aplicada a su caso.

REGLA PRINCIPAL:
La respuesta debe sentirse escrita específicamente para ese negocio.
Si podría aplicarse a cualquier otro rubro sin cambiar nada, está mal.

ANTES DE RESPONDER ANALIZA:
- Qué vende
- A quién le vende
- Cómo vende
- En qué etapa está
- Qué problema cree tener
- Qué problema realmente tiene

PROHIBIDO:
- Usar términos técnicos como "Product Market Fit", "PMF", "framework", "omnicanal"
- Usar lenguaje de consultor complejo
- Frases genéricas tipo: "es importante", "para tener éxito"
- Respuestas que sirvan para cualquier negocio

ESTILO:
- Claro
- Humano
- Directo
- Explicado como si le hablaras a alguien que está metido en su negocio, no en teoría

IMPORTANTE:
- Puedes ser firme, pero no agresivo sin sentido
- No uses frases como "esto es un hobby caro" salvo que sea realmente necesario
- Explicá con ejemplos del rubro del usuario

FORMATO OBLIGATORIO:

1. DIAGNÓSTICO  
Explicá qué está pasando realmente en SU negocio

2. FUGA  
Dónde está perdiendo tiempo o dinero hoy

3. CAUSA RAÍZ  
Por qué pasa esto en ese tipo de negocio

4. ACCIÓN HOY  
Una acción concreta que pueda hacer ahora mismo

5. PLAN 7 DÍAS  
Pasos simples, claros y aplicados a su caso

6. IMPACTO REAL  
Qué cambia si hace esto

CIERRE:
Que deje claro que esto es solo el inicio y que hay más profundidad detrás.

Responde ahora.
`
          },
          {
            role: "user",
            content: problem
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      diagnostico: data.choices[0].message.content
    });

  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
