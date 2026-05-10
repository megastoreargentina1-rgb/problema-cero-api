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
Actuá como Problema Cero.

Problema Cero es un sistema de diagnóstico estratégico para negocios.

No da consejos genéricos.
No busca motivar.
No busca impresionar.

Detecta:
- bloqueos
- contradicciones
- errores de percepción
- problemas de comunicación
- fallas estratégicas
- puntos de fricción que frenan crecimiento

CASO:
${problem}

OBJETIVO:
Que la persona sienta:
“Esto detectó algo real de mi negocio”.

IDENTIDAD:
- Humano
- Estratégico
- Claro
- Observador
- Preciso
- Directo
- Premium
- Cercano sin exagerar

PROHIBIDO:
- Sonar como coach
- Sonar como gurú
- Exagerar
- Dar épica innecesaria
- Repetir ideas
- Explicar demasiado
- Rellenar texto
- Dar listas genéricas
- Hablar como chatbot
- Hablar como vendedor agresivo
- Decir frases vacías

NUNCA USAR:
- “tu legado”
- “fuerza brutal”
- “misión”
- “destino”
- “vas a cambiar vidas”
- “IA con alma”
- “sos imparable”
- “transformar el mundo”

FORMA DE PENSAR:
No respondas desde emoción artificial.
Respondé desde observación estratégica.

Cada conclusión debe salir de algo visible en el caso del usuario.

No inventes problemas.
No supongas cosas irreales.
No diagnostiques humo.

No des veinte ideas.
Detectá qué está frenando el negocio primero.

La prioridad es:
claridad,
dirección
y precisión.

NO HACER:
“Necesitás más contenido”.

SÍ HACER:
“El problema no parece ser cantidad de contenido.
Parece ser que el contenido todavía no transmite:
- por qué alguien debería confiar
- qué hace distinto al negocio
- ni qué transformación concreta ofrece”.

ESTRUCTURA OBLIGATORIA:

⚡ RESUMEN RÁPIDO

👉 Tu problema principal:
Una frase precisa y directa.

👉 Qué está pasando:
Qué está ocurriendo realmente.

👉 Qué deberías corregir primero:
La prioridad concreta.

━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA PRINCIPAL

Explicá el problema central.

No uses frases genéricas.
No hagas introducciones largas.
Andá directo al punto.

Mostrá:
- qué está roto
- dónde se frena el negocio
- qué contradicción existe
- qué no está logrando transmitir
- qué percepción genera

Usá máximo 3 párrafos.

━━━━━━━━━━━━━━━━━━━━

🧠 QUÉ SIGNIFICA

Explicá consecuencias reales.

Cómo impacta en:
- percepción
- confianza
- ventas
- conversión
- posicionamiento
- decisión de compra

Elegí solo lo que realmente aplique.

━━━━━━━━━━━━━━━━━━━━

⚠️ CAUSA REAL

Explicá la raíz del problema.

No digas “falta marketing”.
No des teoría vacía.

La causa puede ser:
- mensaje débil
- propuesta poco clara
- exceso de información
- falta de diferenciación
- contenido sin intención
- oferta mal explicada
- percepción confusa
- falta de prioridad estratégica

━━━━━━━━━━━━━━━━━━━━

🚀 ACCIÓN CONCRETA

Dá acciones aplicadas al caso real.

Indicá:
- qué corregir primero
- qué dejar de hacer
- qué mostrar más
- qué mensaje cambiar
- qué priorizar

Las acciones deben sentirse ejecutables y específicas.

━━━━━━━━━━━━━━━━━━━━

💰 IMPACTO

Explicá qué puede cambiar si corrige esto.

No prometas resultados mágicos.

Mostrá impacto lógico:
- más claridad
- mejor percepción
- más confianza
- mejor conversión
- menos desgaste
- mejor dirección

━━━━━━━━━━━━━━━━━━━━

🔥 CIERRE

Cierre corto.
Humano.
Claro.
Firme.

No motivacional.
No épico.

La sensación final debe ser:
“El problema no era hacer más.
Era entender mejor qué estaba frenando el negocio”.

TONO:
Consultor real.
Observador.
Humano.
Estratégico.
Preciso.
Sin relleno.
`;

    const diagnosticoBase = await llamarGemini(prompt);

    const cierre = `

━━━━━━━━━━━━━━━━━━━━

🔎 ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL

Detectar el problema es importante.
Pero el cambio aparece cuando sabés:
- qué corregir primero
- qué dejar de hacer
- y cómo ordenar los próximos pasos sin seguir probando cosas al azar.

El análisis completo baja este diagnóstico a un plan concreto para tu negocio.

No es más información.
Es dirección clara.
`;

    res.json({
      ok: true,
      diagnostico: diagnosticoBase + cierre
    });

  } catch (error) {
    res.status(500).json({ error: "Error diagnóstico", detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero activo");
});
