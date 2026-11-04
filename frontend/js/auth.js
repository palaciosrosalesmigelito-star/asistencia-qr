// Autenticación + transiciones con mascota
const DEMO_USERS = [
  { email: "docente@instituto.edu", password: "docente123", role: "docente", name: "Docente Demo" },
  { email: "estudiante@instituto.edu", password: "estudiante123", role: "estudiante", name: "Estudiante Demo" }
];

function currentUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}
function requireRole(role) {
  const u = currentUser();
  if (!u || u.role !== role) { window.location.href = "../index.html"; return null; }
  return u;
}

// Splash screen: ocultar tras 2s
document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash");
  if (splash) {
    setTimeout(() => splash.classList.add("hide"), 2000);
  }

  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const msg = document.getElementById("msg");

    const found = DEMO_USERS.find(u => u.email === email && u.password === password && u.role === role);
    if (!found) {
      msg.textContent = "Credenciales o rol incorrectos.";
      msg.className = "msg error";
      return;
    }
    localStorage.setItem("user", JSON.stringify(found));
    msg.textContent = "Procesando acceso...";
    msg.className = "msg ok";

    const overlay = document.getElementById("transitionOverlay");
    if (overlay) overlay.classList.add("active");

    setTimeout(() => {
      if (role === "docente") window.location.href = "pages/dashboard-docente.html";
      else window.location.href = "pages/dashboard-estudiante.html";
    }, 1200);
  });
});