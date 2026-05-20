const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : null;

app.get("/", (req, res) => {
  res.send("Problema Cero API profesional activa");
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

async function guardarEnSheets(datos) {
  if (!GOOGLE_SHEET_ID) throw new Error("Falta GOOGLE_SHEET_ID en Render.");
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_EMAIL en Render.");
  if (!GOOGLE_PRIVATE_KEY) throw new Error("Falta GOOGLE_PRIVATE_KEY en Render.");

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Hoja 1!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString("es-AR"),
        datos.userId || "",
        datos.tipo || "",
        datos.consultaOriginal || "",
        datos.diagnosticoInicial || "",
        datos.respuesta1 || "",
        datos.respuesta2 || "",
        datos.respuesta3 || "",
        datos.feedback1 || "",
        datos.feedback2 || "",
        datos.feedback3 || "",
        datos.analisisCompleto || ""
      ]]
    }
  });

  return true;
}

function crearPromptDiagnostico(problem) {
  return `
Actuá como Problema Cero.

Problema Cero es un sistema de diagnóstico estratégico para negocios.

No fue creado para motivar personas.
No fue creado para dar consejos genéricos.
No fue creado para sonar inteligente.

Fue creado para detectar:
- bloqueos reales
- contradicciones
- problemas de percepción
- errores estratégicos
- fricciones invisibles
- fallas de comunicación
- problemas de posicionamiento
- y decisiones que frenan crecimiento.

CASO:
${problem}

OBJETIVO:
Que la persona sienta:
“Esto entendió realmente qué está pasando en mi negocio”.

IDENTIDAD:
- Humano
- Estratégico
- Observador
- Preciso
- Claro
- Profundo
- Directo
- Premium
- Natural

REGLA CENTRAL:
No diagnostiques automáticamente.

Antes de concluir:
- evaluá distintas posibilidades
- detectá patrones
- observá contradicciones
- y priorizá el problema más sólido según el caso.

No conviertas cualquier emoción o historia personal en el centro del análisis.

El diagnóstico debe volver rápidamente a:
- percepción
- oferta
- cliente
- mensaje
- posicionamiento
- conversión
- diferenciación
- estrategia
- comunicación
- o dirección comercial

NO HACER:
- Coaching emocional
- Motivación artificial
- Frases épicas
- Explicaciones vacías
- Sobreinterpretar
- Repetir ideas
- Hablar demasiado
- Dar listas genéricas
- Sonar académico
- Sonar robótico
- Sonar como vendedor

EVITAR:
- “tu legado”
- “misión”
- “destino”
- “vas a cambiar vidas”
- “fuerza brutal”
- “IA con alma”
- “sos imparable”

ESTRUCTURA OBLIGATORIA:

⚡ RESUMEN RÁPIDO

👉 Tu problema principal:
Una frase específica y concreta.

👉 Qué está pasando:
Qué ocurre realmente.

👉 Qué deberías corregir primero:
La prioridad principal.

━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA PRINCIPAL

Explicá el problema dominante.

Mostrá:
- qué está frenando crecimiento
- qué percepción genera
- qué contradicción existe
- qué parte no está funcionando
- o qué está mal comunicado

Máximo 3 párrafos.

━━━━━━━━━━━━━━━━━━━━

🧠 QUÉ SIGNIFICA

Explicá consecuencias reales.

Cómo impacta en:
- percepción
- confianza
- ventas
- conversión
- claridad comercial
- posicionamiento

Elegí solo lo que aplique.

━━━━━━━━━━━━━━━━━━━━

⚠️ CAUSA REAL

Explicá la raíz del problema.

No des teoría vacía.

Conectá la causa directamente con el caso.

━━━━━━━━━━━━━━━━━━━━

🚀 ACCIÓN CONCRETA

Dá acciones específicas aplicadas al caso.

Indicá:
- qué corregir primero
- qué dejar de hacer
- qué mostrar más
- qué ajustar
- qué priorizar

━━━━━━━━━━━━━━━━━━━━

💰 IMPACTO

Explicá qué puede mejorar si corrige esto.

No prometas resultados mágicos.

━━━━━━━━━━━━━━━━━━━━

🔥 CIERRE

Cierre breve.
Humano.
Firme.
Claro.

No motivacional.
No épico.
No vendedor.

TONO FINAL:
Consultor estratégico real.
Humano.
Preciso.
Observador.
Natural.
Sin exagerar.
Sin sonar frío.
`;
}

function crearPromptAnalisisCompleto(problem) {
  return `
Actuá como Problema Cero en MODO ANÁLISIS COMPLETO.

Este modo NO debe repetir el diagnóstico inicial.

El diagnóstico inicial detecta.
El análisis completo dirige.

Tu objetivo ahora NO es explicar más.
Tu objetivo es ordenar, priorizar y dar un mapa de ejecución concreto.

CASO COMPLETO:
${problem}

OBJETIVO EMOCIONAL DEL USUARIO:
Al terminar, la persona debe sentir:
1. “Me mostró errores que no estaba viendo.”
2. “Me ordenó completamente la cabeza.”
3. “Ahora sé exactamente qué hacer primero.”

IDENTIDAD:
Sos un estratega humano premium.
Claro.
Directo.
Profundo.
Ejecutivo.
Pero sin sonar frío, soberbio ni corporativo.

NO USAR:
- lenguaje demasiado técnico innecesario
- frases de gurú
- motivación barata
- teoría larga
- explicaciones repetidas
- promesas mágicas
- tono Silicon Valley exagerado

REGLA PRINCIPAL:
No des más diagnóstico.
Dá dirección.

No des 20 consejos.
Dá prioridades.

No expliques eternamente el problema.
Convertí el problema en decisiones.

FORMATO OBLIGATORIO:

━━━━━━━━━━━━━━━━━━━━

🧭 MAPA EJECUTIVO

En 4 a 6 líneas, explicá:
- cuál es el bloqueo principal confirmado
- qué está consumiendo energía
- qué debe corregirse primero
- qué resultado concreto debe buscarse

━━━━━━━━━━━━━━━━━━━━

🎯 PRIORIDAD ABSOLUTA

Definí UNA prioridad principal.

Debe responder:
“Si esta persona solo pudiera corregir una cosa esta semana, ¿cuál sería?”

Explicá:
- qué corregir
- por qué eso va primero
- qué pasa si lo sigue postergando

━━━━━━━━━━━━━━━━━━━━

🛑 QUÉ DEJAR DE HACER YA

Indicá de 3 a 5 cosas concretas que debe dejar de hacer.

No digas generalidades.
No digas “mejorar marketing”.

━━━━━━━━━━━━━━━━━━━━

🔧 QUÉ CORREGIR PRIMERO

Dá de 3 a 5 correcciones concretas.

Cada corrección debe tener:
- qué cambiar
- cómo cambiarlo
- para qué sirve

━━━━━━━━━━━━━━━━━━━━

📅 PLAN DE ACCIÓN — PRÓXIMOS 7 DÍAS

Día 1:
Día 2:
Día 3:
Día 4:
Día 5:
Día 6:
Día 7:

Cada día debe tener una acción concreta y realista.

━━━━━━━━━━━━━━━━━━━━

📆 PLAN DE ACCIÓN — PRÓXIMOS 30 DÍAS

Dividilo en 4 semanas.

Semana 1:
Semana 2:
Semana 3:
Semana 4:

Cada semana debe tener:
- objetivo
- acciones
- resultado esperado

━━━━━━━━━━━━━━━━━━━━

📌 CONTENIDO QUE DEBERÍA CREAR

Dá 5 ideas de contenido aplicadas al rubro del usuario.

Cada idea debe incluir:
- gancho inicial
- tema
- objetivo del contenido

━━━━━━━━━━━━━━━━━━━━

💬 MENSAJES DE VENTA LISTOS PARA USAR

Dá 3 mensajes concretos que el usuario pueda adaptar y usar.

Deben sonar humanos, claros y aplicados al negocio.

━━━━━━━━━━━━━━━━━━━━

📊 MÉTRICA QUE DEBERÍA MIRAR

Elegí 1 a 3 métricas importantes según el caso.

Explicá:
- qué mirar
- por qué importa
- qué decisión tomar según el resultado

━━━━━━━━━━━━━━━━━━━━

⚠️ SI / ENTONCES

Dá 3 reglas de decisión.

Formato:
Si pasa X, entonces hacer Y.
Si no pasa X, entonces corregir Z.

━━━━━━━━━━━━━━━━━━━━

🧠 CIERRE ESTRATÉGICO

Cierre breve, humano y firme.

Debe dejar esta sensación:
“El problema no era hacer más. Era saber qué hacer primero.”

NO repetir que “este es el primer nivel”.
NO vender otro análisis.
NO cerrar con motivación.
Cerrar con dirección.
`;
}

/* =========================
   MOTOR PDF PREMIUM V2 CORREGIDO
   ========================= */

const PDF_COLORS = {
  dark: "#0B1120",
  dark2: "#111827",
  red: "#D32F2F",
  redSoft: "#FDECEC",
  text: "#111827",
  muted: "#6B7280",
  soft: "#F8FAFC",
  border: "#E5E7EB",
  white: "#FFFFFF"
};

function limpiarTextoPDF(texto) {
  if (!texto) return "";

  return String(texto)
    .replace(/[⚡🔴🧠⚠️🚀💰🔥🔎🧭🎯🛑🔧📅📆📌💬📊👉]/g, "")
    .replace(/━━━━━━━━━━━━━━━━━━━━/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizarTitulo(linea) {
  return limpiarTextoPDF(linea)
    .replace(/^#+\s*/g, "")
    .replace(/^\d+\.\s*/g, "")
    .trim();
}

function esTituloImportante(linea) {
  const limpia = normalizarTitulo(linea);
  if (!limpia) return false;

  const titulos = [
    "RESUMEN RÁPIDO",
    "RESUMEN RAPIDO",
    "PROBLEMA PRINCIPAL",
    "QUÉ SIGNIFICA",
    "QUE SIGNIFICA",
    "CAUSA REAL",
    "ACCIÓN CONCRETA",
    "ACCION CONCRETA",
    "IMPACTO",
    "CIERRE",
    "ESTE DIAGNÓSTICO ES SOLO EL PRIMER NIVEL",
    "ESTE DIAGNOSTICO ES SOLO EL PRIMER NIVEL",
    "MAPA EJECUTIVO",
    "PRIORIDAD ABSOLUTA",
    "QUÉ DEJAR DE HACER YA",
    "QUE DEJAR DE HACER YA",
    "QUÉ CORREGIR PRIMERO",
    "QUE CORREGIR PRIMERO",
    "PLAN DE ACCIÓN",
    "PLAN DE ACCION",
    "CONTENIDO QUE DEBERÍA CREAR",
    "CONTENIDO QUE DEBERIA CREAR",
    "MENSAJES DE VENTA LISTOS PARA USAR",
    "MÉTRICA QUE DEBERÍA MIRAR",
    "METRICA QUE DEBERIA MIRAR",
    "SI / ENTONCES",
    "CIERRE ESTRATÉGICO",
    "CIERRE ESTRATEGICO",
    "NOTA FINAL"
  ];

  return titulos.some(t => limpia.toUpperCase().includes(t));
}

function crearCodigoCaso() {
  return "PC-" + Date.now().toString().slice(-6);
}

function footer(doc) {
  const y = doc.page.height - 42;

  doc
    .strokeColor("#E5E7EB")
    .lineWidth(0.7)
    .moveTo(48, y - 12)
    .lineTo(doc.page.width - 48, y - 12)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(PDF_COLORS.muted)
    .text("Problema Cero · Interconsulta estratégica empresarial", 48, y, {
      width: 300,
      align: "left"
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(PDF_COLORS.muted)
    .text("problemacero.com.ar", 345, y, {
      width: 200,
      align: "right"
    });
}

function dibujarLogoMinimal(doc, x, y, size = 28) {
  doc.roundedRect(x, y, size, size, 7).fill(PDF_COLORS.white);

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(PDF_COLORS.dark)
    .text("P", x + 8, y + 5);

  doc
    .strokeColor(PDF_COLORS.red)
    .lineWidth(2)
    .moveTo(x + size - 12, y + size - 9)
    .lineTo(x + size - 5, y + size - 16)
    .lineTo(x + size - 2, y + size - 13)
    .stroke();
}

function nuevaPagina(doc) {
  footer(doc);
  doc.addPage();
  doc.y = 58;
}

function asegurarEspacio(doc, altura = 90) {
  if (doc.y + altura > doc.page.height - 72) {
    nuevaPagina(doc);
  }
}

function escribirTexto(doc, texto, opciones = {}) {
  const width = opciones.width || 500;
  const fontSize = opciones.fontSize || 10.8;
  const lineGap = opciones.lineGap || 4;
  const x = opciones.x || 48;

  const limpio = limpiarTextoPDF(texto);
  if (!limpio) return;

  const lineas = limpio.split("\n").filter(l => l.trim() !== "");

  lineas.forEach(linea => {
    const t = linea.trim();
    const height = doc.heightOfString(t, { width, lineGap });

    asegurarEspacio(height + 18);

    doc
      .font(opciones.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fontSize)
      .fillColor(opciones.color || PDF_COLORS.text)
      .text(t, x, doc.y, {
        width,
        align: opciones.align || "left",
        lineGap
      });

    doc.moveDown(opciones.after || 0.55);
  });
}

function bloqueEditorial(doc, titulo, texto, opciones = {}) {
  const x = 48;
  const width = 500;
  const padding = 18;
  const tituloLimpio = normalizarTitulo(titulo);
  const textoLimpio = limpiarTextoPDF(texto);

  if (!textoLimpio) return;

  const textHeight = doc.heightOfString(textoLimpio, {
    width: width - padding * 2,
    lineGap: 4
  });

  const boxHeight = Math.min(Math.max(textHeight + 68, 130), 420);

  asegurarEspacio(boxHeight + 24);

  const startY = doc.y;

  doc
    .roundedRect(x, startY, width, boxHeight, 14)
    .fillAndStroke(opciones.fondo || PDF_COLORS.soft, opciones.border || PDF_COLORS.border);

  doc
    .roundedRect(x, startY, 6, boxHeight, 3)
    .fill(opciones.acento || PDF_COLORS.red);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(PDF_COLORS.dark)
    .text(tituloLimpio.toUpperCase(), x + padding, startY + 16, {
      width: width - padding * 2
    });

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(PDF_COLORS.text)
    .text(textoLimpio, x + padding, startY + 44, {
      width: width - padding * 2,
      lineGap: 4,
      height: boxHeight - 60
    });

  doc.y = startY + boxHeight + 18;
}

function portada(doc, datos) {
  const fecha = new Date().toLocaleString("es-AR");
  const codigo = crearCodigoCaso();
  const tipo = datos.tipo === "analisis_completo"
    ? "Análisis estratégico completo"
    : "Diagnóstico inicial";

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(PDF_COLORS.white);
  doc.rect(0, 0, doc.page.width, 260).fill(PDF_COLORS.dark);

  dibujarLogoMinimal(doc, 48, 42, 34);

  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor(PDF_COLORS.white)
    .text("PROBLEMA CERO", 92, 45);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#CBD5E1")
    .text("Interconsulta estratégica empresarial", 92, 76);

  doc
    .font("Helvetica-Bold")
    .fontSize(33)
    .fillColor(PDF_COLORS.white)
    .text(tipo, 48, 132, {
      width: 470,
      lineGap: 5
    });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#D1D5DB")
    .text("Un informe diseñado para detectar el bloqueo principal, ordenar prioridades y convertir ruido en dirección.", 48, 210, {
      width: 470,
      lineGap: 4
    });

  doc
    .roundedRect(48, 310, 500, 120, 18)
    .fillAndStroke(PDF_COLORS.soft, PDF_COLORS.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(PDF_COLORS.red)
    .text("CÓDIGO DE CASO", 72, 338);

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(PDF_COLORS.dark)
    .text(codigo, 72, 356);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(PDF_COLORS.red)
    .text("FECHA", 330, 338);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(PDF_COLORS.dark)
    .text(fecha, 330, 358, {
      width: 170
    });

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(PDF_COLORS.muted)
    .text("Este documento no busca sumar información. Busca darte una lectura más clara sobre lo que puede estar frenando el negocio.", 72, 470, {
      width: 450,
      lineGap: 4
    });

  doc
    .strokeColor(PDF_COLORS.red)
    .lineWidth(2)
    .moveTo(48, 550)
    .lineTo(160, 550)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(PDF_COLORS.dark)
    .text("Claridad. Prioridad. Dirección.", 48, 570);

  footer(doc);
}

function paginaResumenCaso(doc, consultaOriginal) {
  nuevaPagina(doc);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(PDF_COLORS.dark)
    .text("El caso que analizamos", 48, doc.y);

  doc.moveDown(0.7);

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(PDF_COLORS.muted)
    .text("Antes de diagnosticar, Problema Cero parte del síntoma declarado por la persona. Ese síntoma es la puerta de entrada: no siempre es la causa real.", 48, doc.y, {
      width: 500,
      lineGap: 4
    });

  doc.moveDown(1.2);

  bloqueEditorial(doc, "Consulta original", consultaOriginal, {
    fondo: "#FFFFFF",
    border: "#E5E7EB",
    acento: PDF_COLORS.red
  });

  asegurarEspacio(145);

  const y = doc.y + 6;

  doc
    .roundedRect(48, y, 500, 116, 18)
    .fillAndStroke("#0B1120", "#0B1120");

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#FFFFFF")
    .text("LECTURA CLÍNICA", 72, y + 22);

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#E5E7EB")
    .text("El diagnóstico no se queda en lo que la persona dice que le duele. Busca qué patrón, contradicción o falla estratégica puede estar generando ese dolor.", 72, y + 48, {
      width: 445,
      lineGap: 4
    });

  doc.y = y + 140;
}

function extraerSecciones(texto) {
  const limpio = limpiarTextoPDF(texto);
  const lineas = limpio.split("\n").map(l => l.trim()).filter(Boolean);
  const secciones = [];
  let actual = { titulo: "Lectura estratégica", contenido: [] };

  lineas.forEach(linea => {
    if (esTituloImportante(linea)) {
      if (actual.contenido.length > 0) {
        secciones.push(actual);
      }
      actual = {
        titulo: normalizarTitulo(linea),
        contenido: []
      };
    } else {
      actual.contenido.push(linea);
    }
  });

  if (actual.contenido.length > 0) {
    secciones.push(actual);
  }

  return secciones;
}

function escribirSeccionesPremium(doc, tituloGeneral, texto) {
  const secciones = extraerSecciones(texto);
  if (secciones.length === 0) return;

  nuevaPagina(doc);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(PDF_COLORS.dark)
    .text(tituloGeneral, 48, doc.y);

  doc.moveDown(0.35);

  doc
    .strokeColor(PDF_COLORS.red)
    .lineWidth(2)
    .moveTo(48, doc.y)
    .lineTo(150, doc.y)
    .stroke();

  doc.moveDown(1.2);

  secciones.forEach((sec, index) => {
    const contenido = sec.contenido.join("\n");
    const esClave = index === 0 || sec.titulo.toUpperCase().includes("CAUSA") || sec.titulo.toUpperCase().includes("PRIORIDAD");

    if (esClave) {
      bloqueEditorial(doc, sec.titulo, contenido, {
        fondo: index === 0 ? PDF_COLORS.redSoft : PDF_COLORS.soft,
        border: "#E5E7EB",
        acento: PDF_COLORS.red
      });
    } else {
      asegurarEspacio(90);

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(PDF_COLORS.dark)
        .text(sec.titulo.toUpperCase(), 48, doc.y, {
          width: 500
        });

      doc.moveDown(0.25);

      doc
        .strokeColor("#E5E7EB")
        .lineWidth(0.8)
        .moveTo(48, doc.y)
        .lineTo(548, doc.y)
        .stroke();

      doc.moveDown(0.7);

      escribirTexto(doc, contenido, {
        width: 500,
        fontSize: 10.7,
        lineGap: 4,
        after: 0.5
      });

      doc.moveDown(0.6);
    }
  });
}

function paginaCierre(doc) {
  nuevaPagina(doc);

  doc
    .roundedRect(48, 90, 500, 270, 24)
    .fillAndStroke(PDF_COLORS.dark, PDF_COLORS.dark);

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(PDF_COLORS.white)
    .text("El problema no era hacer más.", 78, 135, {
      width: 440,
      lineGap: 6
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(PDF_COLORS.white)
    .text("Era saber qué mirar primero.", 78, 205, {
      width: 440,
      lineGap: 6
    });

  doc
    .strokeColor(PDF_COLORS.red)
    .lineWidth(3)
    .moveTo(78, 290)
    .lineTo(185, 290)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#D1D5DB")
    .text("Problema Cero no reemplaza la ejecución. Ordena la lectura del problema para que la próxima decisión no salga desde la confusión.", 78, 315, {
      width: 430,
      lineGap: 4
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(PDF_COLORS.dark)
    .text("Nota final", 48, 420);

  doc.moveDown(0.6);

  escribirTexto(doc, "Este informe no promete resultados mágicos. Su función es ayudarte a detectar el bloqueo principal, ordenar prioridades y tomar mejores decisiones de negocio.", {
    width: 500,
    fontSize: 10.8,
    lineGap: 4
  });
}

function generarPDFBuffer(datos) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48
    });

    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const consultaOriginal = limpiarTextoPDF(datos.consultaOriginal || "");
    const diagnosticoInicial = limpiarTextoPDF(datos.diagnosticoInicial || "");
    const analisisCompleto = limpiarTextoPDF(datos.analisisCompleto || "");

    portada(doc, datos);
    paginaResumenCaso(doc, consultaOriginal);

    if (diagnosticoInicial) {
      escribirSeccionesPremium(doc, "Diagnóstico inicial", diagnosticoInicial);
    }

    if (analisisCompleto) {
      escribirSeccionesPremium(doc, "Análisis completo", analisisCompleto);
    }

    paginaCierre(doc);

    footer(doc);

    doc.end();
  });
}

app.post("/api/generar-pdf", async (req, res) => {
  try {
    const {
      tipo,
      consultaOriginal,
      diagnosticoInicial,
      analisisCompleto
    } = req.body;

    const pdfBuffer = await generarPDFBuffer({
      tipo,
      consultaOriginal,
      diagnosticoInicial,
      analisisCompleto
    });

    const nombreArchivo =
      tipo === "analisis_completo"
        ? "Informe_Completo_ProblemaCero.pdf"
        : "Diagnostico_ProblemaCero.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nombreArchivo}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generando PDF:", error);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo generar el PDF",
      error: error.message
    });
  }
});

app.post("/api/diagnostico", async (req, res) => {
  try {
    const {
      problem,
      userId,
      consultaOriginal,
      respuesta1,
      respuesta2,
      respuesta3,
      feedback1,
      feedback2,
      feedback3
    } = req.body;

    const esAnalisisCompleto =
      typeof problem === "string" &&
      problem.toUpperCase().includes("ANÁLISIS COMPLETO");

    const prompt = esAnalisisCompleto
      ? crearPromptAnalisisCompleto(problem)
      : crearPromptDiagnostico(problem);

    const respuesta = await llamarGemini(prompt);

    let cierre = "";

    if (!esAnalisisCompleto) {
      cierre = `

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
    }

    const resultadoFinal = respuesta + cierre;

    try {
      await guardarEnSheets({
        userId,
        tipo: esAnalisisCompleto ? "analisis_completo" : "diagnostico_inicial",
        consultaOriginal: esAnalisisCompleto ? (consultaOriginal || "") : (problem || ""),
        diagnosticoInicial: esAnalisisCompleto ? "" : resultadoFinal,
        respuesta1: respuesta1 || "",
        respuesta2: respuesta2 || "",
        respuesta3: respuesta3 || "",
        feedback1: feedback1 || "",
        feedback2: feedback2 || "",
        feedback3: feedback3 || "",
        analisisCompleto: esAnalisisCompleto ? resultadoFinal : ""
      });
    } catch (sheetError) {
      console.error("Error guardando en Sheets:", sheetError.message);
    }

    res.json({
      ok: true,
      diagnostico: resultadoFinal
    });

  } catch (error) {
    res.status(500).json({
      error: "Error diagnóstico",
      detalle: error.message
    });
  }
});

app.get("/api/test-sheets", async (req, res) => {
  try {
    await guardarEnSheets({
      userId: "test_render",
      tipo: "test",
      consultaOriginal: "Prueba técnica desde Render",
      diagnosticoInicial: "Si aparece esta fila, Google Sheets está conectado correctamente.",
      respuesta1: "Respuesta 1 de prueba",
      respuesta2: "Respuesta 2 de prueba",
      respuesta3: "Respuesta 3 de prueba",
      feedback1: "Feedback 1 de prueba",
      feedback2: "Feedback 2 de prueba",
      feedback3: "Feedback 3 de prueba",
      analisisCompleto: "Análisis completo de prueba"
    });

    res.json({
      ok: true,
      mensaje: "Guardado clínico REAL confirmado en Google Sheets"
    });

  } catch (error) {
    console.error("TEST SHEETS ERROR:", error);

    res.status(500).json({
      ok: false,
      mensaje: "NO se pudo guardar en Google Sheets",
      error: error.message,
      detalle: String(error)
    });
  }
});

app.get("/api/debug-env", (req, res) => {
  res.json({
    sheetId: GOOGLE_SHEET_ID ? "OK" : "FALTA",
    serviceEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL ? "OK" : "FALTA",
    privateKey: GOOGLE_PRIVATE_KEY ? "OK" : "FALTA",
    privateKeyStartsCorrectly: GOOGLE_PRIVATE_KEY
      ? GOOGLE_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----")
      : false,
    privateKeyEndsCorrectly: GOOGLE_PRIVATE_KEY
      ? GOOGLE_PRIVATE_KEY.trim().endsWith("-----END PRIVATE KEY-----")
      : false
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor Problema Cero profesional activo");
});
