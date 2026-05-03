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
Actuá como un equipo senior de diagnóstico de negocios, marketing, ventas y estrategia.

Analizá este caso real:
${problem}

OBJETIVO:
Dar un diagnóstico profundo, específico y accionable, pero presentado en formato escaneable.
No quiero respuestas cortas tipo checklist.
Quiero riqueza, contexto, ejemplos y profundidad, pero ordenado en bloques visuales.

REGLA CENTRAL:
No achiques el análisis.
Empaquetalo mejor.

FORMATO OBLIGATORIO:
Cada sección debe tener:
1. Un título fuerte con emoji
2. Una frase de impacto
3. Entre 2 y 4 párrafos enriquecidos
4. Acciones concretas aplicadas al rubro

ESTILO:
- Humano
- Directo
- Estratégico
- Incómodo cuando sea necesario
- Específico al negocio mencionado
- No sonar como IA
- No usar lenguaje genérico si el usuario dio contexto

ADAPTACIÓN DE LENGUAJE:
Usá el vocabulario del rubro.
Ejemplos:
- uñas / estética → clientas, turnos, agenda, experiencia, confianza, fidelización
- salud → pacientes, consultas, confianza, continuidad, derivaciones
- educación → alumnos, inscripciones, autoridad, comunidad
- productos físicos → clientes, pedidos, oferta, stock, percepción, conversión
- indumentaria → estilo, comunidad, identidad, marca, contenido, compra
- servicios → agenda, confianza, proceso, cierre, recomendación

PROHIBIDO:
- Decir “invertí 50 a 100 dólares en publicidad”
- Recomendar publicidad como primera acción si antes no está corregida la oferta, mensaje o conversión
- Dar consejos vagos como “mejorá tu marketing”
- Dar listas frías sin explicación
- Inventar datos
- Repetir lo mismo con otras palabras

ESTRUCTURA EXACTA:

🔴 PROBLEMA PRINCIPAL
Una frase fuerte que diga el problema real.
Luego 2 a 4 párrafos profundos explicando qué está pasando.

🧠 QUÉ SIGNIFICA
Explicá por qué eso importa.
Mostrá la consecuencia real para el negocio.
Bajalo a lenguaje del rubro.

⚠️ CAUSA REAL
Explicá la causa de fondo.
No te quedes en la superficie.
Si el problema parece ventas, buscá si en realidad es confianza, oferta, mensaje, posicionamiento, conversión, experiencia o falta de dirección.

🚀 ACCIÓN CONCRETA
Dá acciones específicas.
No digas “publicá más”.
Decí qué tipo de contenido, qué mensaje, qué cambio, qué canal, qué prueba concreta.
Incluí ejemplos aplicables al rubro mencionado.

💰 IMPACTO
Explicá qué puede cambiar si aplica esto.
Hablá de agenda, ventas, clientes, percepción, confianza o conversión según corresponda.

🔥 CIERRE
Cerrá con fuerza.
Que la persona sienta:
“Ahora entiendo el problema, pero necesito el plan completo para ejecutarlo bien”.

TONO FINAL:
Debe sentirse como un consultor experto hablándole a ese negocio específico, no como una respuesta genérica.
`;

    const diagnosticoBase = await llamarGemini(prompt);

    const cierre = `

━━━━━━━━━━━━━━━━━━━━

🔎 ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL

Lo que acabás de leer te muestra dónde puede estar el problema.

Pero entender el problema no alcanza.

El verdadero cambio aparece cuando sabés qué hacer primero, qué dejar de hacer y cómo ordenar los próximos pasos sin seguir probando cosas al azar.

El análisis completo baja este diagnóstico a un plan concreto para tu negocio.

No es más información.
Es dirección.
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
Actuá como un equipo senior de consultores de negocio, marketing, ventas, contenido y estrategia.

CASO:
${problem}

RESPUESTAS DEL USUARIO:
${JSON.stringify(respuestas || {}, null, 2)}

OBJETIVO:
Crear un plan profundo, específico, aplicable y ordenado.
No quiero respuestas genéricas.
No quiero teoría.
No quiero listas frías.
Quiero un plan que parezca hecho por un equipo real para ese negocio.

REGLA CENTRAL:
Profundidad + claridad visual.
Cada sección debe ser escaneable, pero rica.

ADAPTACIÓN DE LENGUAJE:
Usá el vocabulario del negocio.
Si es uñas: clientas, turnos, agenda, confianza, experiencia.
Si es producto: clientes, pedidos, oferta, conversión.
Si es salud: pacientes, confianza, continuidad.
Si es educación: alumnos, inscripción, autoridad.
Si es servicio: agenda, proceso, confianza, cierre.

PROHIBIDO:
- Dar presupuestos genéricos de publicidad
- Recomendar Meta Ads como primera solución si antes no se corrigió oferta/mensaje/conversión
- Usar frases vagas como “mejorar presencia digital”
- Decir obviedades sin bajarlas a acciones
- Sonar como ChatGPT

ESTRUCTURA OBLIGATORIA:

🔴 1. PROBLEMA PRINCIPAL
Explicá cuál es el problema real del negocio.
Profundo, claro, incómodo si hace falta.

🧠 2. QUÉ ESTÁ PASANDO EN EL FONDO
Explicá la raíz.
Mostrá lo que la persona probablemente no está viendo.

⚠️ 3. QUÉ ESTÁ HACIENDO MAL SIN DARSE CUENTA
No ataques. Diagnóstico directo.
Explicá hábitos, mensajes, decisiones o enfoques que están frenando.

🚀 4. QUÉ HACER PRIMERO
Dá prioridad.
Una sola prioridad principal.
Explicá por qué esa va primero.

📅 5. PLAN DE 7 DÍAS
Día por día.
Acciones concretas.
Nada genérico.

📆 6. PLAN DE 30 DÍAS
Semana por semana.
Qué construir, medir y ajustar.

📲 7. CONTENIDO QUE DEBERÍA HACER
Ideas concretas de contenido.
Con ejemplos de títulos, enfoques, reels, historias o publicaciones según rubro.

💬 8. MENSAJES DE VENTA LISTOS
Mensajes concretos que pueda usar.
WhatsApp, Instagram, bio, historias o publicaciones.

🧹 9. QUÉ ELIMINAR
Qué dejar de hacer porque consume energía y no acerca al resultado.

📊 10. MÉTRICA PRINCIPAL
Qué debe medir.
Una métrica simple y clara.

🔥 11. CIERRE ESTRATÉGICO
Cerrá con una conclusión fuerte y humana.
Que sienta claridad y urgencia de ejecutar.

IMPORTANTE:
Este plan debe sentirse específico al negocio del usuario.
No menciones remeras, uñas, salud, educación o cualquier rubro si el usuario no lo mencionó.
Usá solo el rubro real del caso.
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
