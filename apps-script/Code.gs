/**
 * Code.gs — Backend del portal de resultados (SOLO LECTURA)
 * English III - Environmental Writing Task - Univalle
 *
 * Este backend es distinto a los otros: no recibe envíos de estudiantes,
 * solo CONSULTA resultados que tú ya calificaste y cargaste en el Sheet
 * (importando resultados_english_III_writing.csv).
 *
 * SEGURIDAD: doPost busca la fila que coincide EXACTAMENTE con el correo
 * Y el código enviados, y devuelve SOLO esa fila — nunca el resto de la
 * hoja. No existe ninguna acción que liste o exporte todos los
 * estudiantes desde el frontend. Aun así, el "login" es solo correo +
 * código (no hay contraseña real), así que no es una autenticación fuerte
 * — ver la advertencia en el README antes de publicar.
 *
 * Nota: a diferencia del portal de English IV, este dataset no trae un
 * "comentario general" aparte — solo los 4 criterios (con su nota y
 * retroalimentación) y la nota final.
 *
 * Ver README.md para el paso a paso de despliegue, y muy especialmente
 * la sección sobre los códigos estudiantiles que deben verificarse antes
 * de publicar.
 */

const SHEET_NAME = "Resultados";
const ALLOWED_DOMAIN = "correounivalle.edu.co";

const CRITERIA_DEFS = [
  { key: "tac", name: "Task Achievement & Content Development", weight: "35" },
  { key: "oc", name: "Organization & Cohesion", weight: "20" },
  { key: "vra", name: "Vocabulary Range & Appropriacy", weight: "20" },
  { key: "gra", name: "Grammatical Range & Accuracy", weight: "25" }
];

// Índices de columna (1-based) tal como los deja el CSV importado.
const COLS = {
  fullName: 1,
  studentCode: 2,
  email: 3,
  words: 4,
  submission: 5,
  tacScore: 6, tacFeedback: 7,
  ocScore: 8, ocFeedback: 9,
  vraScore: 10, vraFeedback: 11,
  graScore: 12, graFeedback: 13,
  finalGradeRaw: 14,
  finalGradeRounded: 15,
  verifyFlag: 16
};

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error("No existe la hoja '" + SHEET_NAME + "'. Importa primero el CSV de resultados.");
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Google Sheets a veces "adivina" que una nota como 4.1 o 4.4 es en
 * realidad una fecha corta en formato día.mes (locale es-CO) y la
 * convierte en un objeto Date al importar el CSV — ahí es cuando en la
 * página aparece algo como "2026-04-04T05:00:00.000Z" en vez de "4.4".
 *
 * Esta función revierte esa conversión: si la celda quedó como fecha,
 * reconstruye el número original a partir del día y el mes (que es
 * justamente lo que Sheets usó para generar esa fecha). Si la celda ya
 * es un número o texto normal, la devuelve tal cual.
 */
function normalizeScoreCell_(v) {
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) {
    const day = v.getDate();
    const month = v.getMonth() + 1;
    return day + "." + month;
  }
  return v;
}

function doPost(e) {
  // El cuerpo va envuelto en try/catch: si algo falla adentro (por
  // ejemplo, no encuentra la hoja, o algún dato viene en un formato
  // inesperado), Apps Script normalmente lanza el error "crudo" fuera de
  // la función — y esas páginas de error de Google no traen encabezados
  // CORS, así que el navegador lo reporta como un bloqueo de CORS en vez
  // de mostrar el error real. Atrapándolo aquí, SIEMPRE devolvemos una
  // respuesta JSON válida (con CORS funcionando) que trae el mensaje de
  // error real, visible en la página o en la consola del navegador.
  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse_({ found: false, error: "INVALID_JSON" });
    }

    if (data.action !== "lookup") {
      return jsonResponse_({ found: false, error: "UNKNOWN_ACTION" });
    }

    // .replace(/\s+/g, "") por si el teclado del celular insertó espacios.
    const email = (data.email || "").replace(/\s+/g, "").toLowerCase().trim();
    const studentCode = (data.studentCode || "").replace(/\s+/g, "").trim();

    if (!email.endsWith("@" + ALLOWED_DOMAIN) || !studentCode) {
      return jsonResponse_({ found: false });
    }

    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse_({ found: false });

    const values = sheet.getRange(2, 1, lastRow - 1, 16).getValues();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const rowEmail = (row[COLS.email - 1] || "").toString().toLowerCase().trim();
      const rowCode = (row[COLS.studentCode - 1] || "").toString().trim();

      if (rowEmail === email && rowCode === studentCode) {
        const result = {
          fullName: row[COLS.fullName - 1],
          studentCode: row[COLS.studentCode - 1],
          email: row[COLS.email - 1],
          words: row[COLS.words - 1],
          submission: row[COLS.submission - 1],
          criteria: [
            { name: CRITERIA_DEFS[0].name, weight: CRITERIA_DEFS[0].weight, score: normalizeScoreCell_(row[COLS.tacScore - 1]), feedback: row[COLS.tacFeedback - 1] },
            { name: CRITERIA_DEFS[1].name, weight: CRITERIA_DEFS[1].weight, score: normalizeScoreCell_(row[COLS.ocScore - 1]), feedback: row[COLS.ocFeedback - 1] },
            { name: CRITERIA_DEFS[2].name, weight: CRITERIA_DEFS[2].weight, score: normalizeScoreCell_(row[COLS.vraScore - 1]), feedback: row[COLS.vraFeedback - 1] },
            { name: CRITERIA_DEFS[3].name, weight: CRITERIA_DEFS[3].weight, score: normalizeScoreCell_(row[COLS.graScore - 1]), feedback: row[COLS.graFeedback - 1] }
          ],
          finalGrade: normalizeScoreCell_(row[COLS.finalGradeRounded - 1])
        };
        // No se devuelve nada del resto de las filas: 'values' nunca sale de esta función.
        return jsonResponse_({ found: true, data: result });
      }
    }

    return jsonResponse_({ found: false });
  } catch (err) {
    return jsonResponse_({ found: false, error: "SERVER_ERROR", message: String(err && err.message || err) });
  }
}

/**
 * doGet no expone ningún dato — solo confirma que el backend está activo.
 */
function doGet(e) {
  return ContentService.createTextOutput("Portal de resultados English III activo (solo lectura, sin datos públicos).");
}
