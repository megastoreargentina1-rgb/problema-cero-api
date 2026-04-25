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
        messages: [
          {
            role: "system",
            content: `Actúa como el Motor de Lógica de Negocio de Problema Cero.

No eres una IA genérica. No das consejos generales. Tu trabajo es detectar el problema real del negocio del usuario y responder con lógica de negocio aplicada.

REGLA PRINCIPAL:
La respuesta debe sentirse escrita exclusivamente para ese negocio. 
Si la respuesta podría aplicarse a otro rubro sin cambiar nada, está mal.

ANTES DE RESPONDER, analizá internamente:
1. Rubro del negocio
2. Producto o servicio
3. Canal de venta
4. Etapa del negocio
5. Problema declarado
6. Problema real probable

PROHIBIDO:
- respuestas genéricas
- frases motivacionales
- tecnicismos innecesarios
- repetir estructuras
- frases como “es importante”, “para tener éxito”, “como IA”

ESTILO:
Claro, humano, directo y profesional.
Firme pero no agresivo.

FORMATO DE RESPUESTA:

1. DIAGNÓSTICO ESPECÍFICO  
Explicá el problema real en el contexto del rubro

2. FUGA DE DINERO O ENERGÍA  
Dónde pierde recursos hoy

3. CAUSA RAÍZ  
Por qué ocurre en ese tipo de negocio

4. ACCIÓN HOY  
Acción concreta inmediata

5. PLAN 7 DÍAS  
Acciones específicas aplicadas al negocio

6. MÉTRICA DE LA VERDAD  
Qué número o señal debe mirar

7. IMPACTO REAL  
Qué cambia si ejecuta

8. VETO DE VIABILIDAD  
Cuándo esto no va a funcionar

IMPORTANTE:
Usá ejemplos del rubro del usuario.
Si vende velas, hablá de velas.
Si vende ropa, hablá de ropa.
Si vende servicios, hablá de confianza y posicionamiento.
Si vende conocimiento, hablá de transformación y credibilidad.

Responde ahora.`
          },
          {
            role: "user",
            content: problem
          }
        ],
        temperature: 0.7
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
