/*
 * script.js
 * Portal de resultados (solo lectura) — English III Environmental Writing.
 *
 * El filtrado por estudiante ocurre en el BACKEND (Apps Script), no aquí.
 * Este archivo nunca recibe ni maneja los datos de otros estudiantes: la
 * respuesta del servidor solo trae la fila que coincide con el correo y
 * el código enviados.
 */

// =========================================================================
// 1. CONFIGURACIÓN — reemplaza esto con la URL de tu Web App de Apps Script
// =========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxFJhBHsojuXd7KqQOvDZ0QdtTnWnVckPddAG8bT25RVhPp2nuUY9aed-xwvs3T19zUhA/exec";
const ALLOWED_EMAIL_DOMAIN = "correounivalle.edu.co";

// =========================================================================
// 2. NAVEGACIÓN ENTRE PANTALLAS
// =========================================================================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// =========================================================================
// 3. LOGIN (correo + código)
// =========================================================================
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");
const btnLogin = document.getElementById("btn-login");

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  // .replace(/\s+/g, "") elimina espacios internos que a veces inserta el
  // teclado predictivo del celular (autocorrección) al escribir el correo
  // o el código.
  const studentCode = document.getElementById("studentCode").value.replace(/\s+/g, "").trim();
  const email = document.getElementById("email").value.replace(/\s+/g, "").trim().toLowerCase();

  if (!studentCode) {
    loginError.textContent = "Por favor escribe tu código estudiantil.";
    return;
  }
  if (!email.endsWith("@" + ALLOWED_EMAIL_DOMAIN)) {
    loginError.textContent = "Debes usar tu correo institucional (@" + ALLOWED_EMAIL_DOMAIN + ").";
    return;
  }

  showScreen("screen-loading");
  btnLogin.disabled = true;

  try {
    const result = await callBackend({ action: "lookup", email, studentCode });
    if (result && result.found) {
      renderResults(result.data);
      showScreen("screen-results");
    } else if (result && result.error === "SERVER_ERROR") {
      // Error real del backend (p. ej. algo mal configurado en el Sheet),
      // no simplemente "no encontrado". Se muestra el mensaje para poder
      // diagnosticarlo sin depender de la consola del navegador.
      console.error("Error del backend:", result.message);
      showScreen("screen-login");
      loginError.textContent = "Error del servidor: " + (result.message || "desconocido") + ". Avisa a tu profesor.";
    } else {
      showScreen("screen-notfound");
    }
  } catch (err) {
    console.error(err);
    showScreen("screen-login");
    loginError.textContent = "No se pudo consultar tus resultados (" + err.message + "). Intenta de nuevo.";
  } finally {
    btnLogin.disabled = false;
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  formLogin.reset();
  showScreen("screen-login");
});

document.getElementById("btn-retry").addEventListener("click", () => {
  showScreen("screen-login");
});

// =========================================================================
// 4. RENDER DE RESULTADOS
// =========================================================================
function renderResults(data) {
  document.getElementById("res-name").textContent = data.fullName || "—";
  document.getElementById("res-code").textContent = data.studentCode || "—";
  document.getElementById("res-email").textContent = data.email || "—";
  document.getElementById("res-words").textContent = data.words || "—";
  document.getElementById("res-final-grade").textContent = data.finalGrade || "—";
  document.getElementById("res-submission").textContent = data.submission || "—";

  const list = document.getElementById("criteria-list");
  list.innerHTML = "";

  (data.criteria || []).forEach(c => {
    const pct = Math.max(0, Math.min(100, (parseFloat(c.score) / 5) * 100));

    const wrap = document.createElement("div");
    wrap.className = "criterion";

    const top = document.createElement("div");
    top.className = "criterion-top";
    top.innerHTML =
      '<span class="criterion-name">' + escapeHtml(c.name) +
      ' <span class="criterion-weight">(' + escapeHtml(c.weight) + '%)</span></span>' +
      '<span class="criterion-score">' + escapeHtml(c.score) + '/5</span>';

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = pct + "%";
    track.appendChild(fill);

    const feedback = document.createElement("p");
    feedback.className = "criterion-feedback";
    feedback.textContent = c.feedback || "";

    wrap.appendChild(top);
    wrap.appendChild(track);
    wrap.appendChild(feedback);
    list.appendChild(wrap);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

// =========================================================================
// 5. COMUNICACIÓN CON EL BACKEND (Google Apps Script)
// =========================================================================
async function callBackend(payload) {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR")) {
    throw new Error("WEB_APP_URL no configurada en script.js");
  }
  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("HTTP " + res.status);
  }
  return res.json();
}
