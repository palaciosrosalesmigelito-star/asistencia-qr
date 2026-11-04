const user = requireRole("docente");
if (!user) throw new Error("no auth");

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
});

document.querySelectorAll(".sidebar a").forEach(a => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".sidebar a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    const view = a.dataset.view;
    ["generar","sesiones","asistencia"].forEach(v => {
      document.getElementById("view-" + v).classList.toggle("hidden", v !== view);
    });
    if (view === "sesiones") renderSessions();
    if (view === "asistencia") renderAttendance();
  });
});

const API = (path) => fetch(path).then(r => r.ok ? r.json() : Promise.reject(r));

async function useSupabase() {
  try {
    const h = await fetch("../api/health").then(r => r.json());
    return !!h.supabase;
  } catch { return false; }
}

// --- Generar QR ---
let qrInstance = null;
document.getElementById("genBtn").addEventListener("click", async () => {
  const course = document.getElementById("course").value.trim();
  const date = document.getElementById("sessionDate").value;
  if (!course || !date) {
    document.getElementById("qrInfo").textContent = "Completa curso y fecha.";
    document.getElementById("qrInfo").className = "msg error";
    return;
  }
  const code = newSessionCode();
  const session = { code, course, date, docente: user.name };

  if (await useSupabase()) {
    try {
      await fetch("../api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session)
      });
    } catch (e) { console.warn("API error", e); }
  } else {
    const sessions = getSessions();
    sessions.push({ ...session, createdAt: new Date().toISOString() });
    saveSessions(sessions);
  }

  const payload = JSON.stringify({ code, course, date });
  const qrEl = document.getElementById("qrcode");
  qrEl.innerHTML = "";
  qrInstance = new QRCode(qrEl, {
    text: payload,
    width: 260,
    height: 260,
    correctLevel: QRCode.CorrectLevel.H
  });

  setTimeout(() => {
    const canvas = qrEl.querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const size = canvas.width * 0.26;
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    };
    img.src = "../assets/face.jpg";
  }, 50);

  document.getElementById("qrInfo").textContent = "Sesión creada: " + code;
  document.getElementById("qrInfo").className = "msg ok";
});

// --- Sesiones ---
async function renderSessions() {
  const tbody = document.getElementById("sessionsBody");
  tbody.innerHTML = "";
  let sessions = [];
  if (await useSupabase()) {
    try { sessions = await API("../api/sessions"); } catch { sessions = getSessions(); }
  } else {
    sessions = getSessions();
  }
  const att = (await useSupabase()) ? await API("../api/attendance").catch(() => getAttendance()) : getAttendance();
  sessions.filter(s => !s.docente || s.docente === user.name).forEach(s => {
    const count = att.filter(a => a.code === s.code).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.course}</td><td>${s.date}</td><td>${s.code}</td><td>${count}</td>`;
    tbody.appendChild(tr);
  });
}

// --- Asistencia en tiempo real ---
function initials(name) {
  return (name || "?").split(" ").map(p => p[0]).join("").substring(0,2).toUpperCase();
}

async function renderAttendance() {
  const list = document.getElementById("attList");
  const empty = document.getElementById("attEmpty");
  if (!list) return;
  list.innerHTML = "";
  let items = [];
  let sessions = [];
  if (await useSupabase()) {
    try { items = await API("../api/attendance"); } catch { items = getAttendance(); }
    try { sessions = await API("../api/sessions"); } catch { sessions = getSessions(); }
  } else {
    items = getAttendance();
    sessions = getSessions();
  }
  if (items.length === 0) {
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  items.forEach(a => {
    const s = sessions.find(x => x.code === a.code);
    const item = document.createElement("div");
    item.className = "live-item";
    item.innerHTML = `
      <div class="avatar">${initials(a.student)}</div>
      <div class="live-info">
        <div class="live-name">${a.student}</div>
        <div class="live-meta">${s ? s.course : "-"} · ${a.date} ${a.time}</div>
      </div>
      <span class="pulse-dot" title="Presente"></span>
    `;
    list.appendChild(item);
  });
}

// Botones del módulo QR
const downloadQrBtn = document.getElementById("downloadQrBtn");
const fullscreenQrBtn = document.getElementById("fullscreenQrBtn");

if (downloadQrBtn) {
  downloadQrBtn.addEventListener("click", () => {
    const canvas = document.querySelector("#qrcode canvas");
    const img = document.querySelector("#qrcode img");
    let url = null;
    if (canvas) url = canvas.toDataURL("image/png");
    else if (img) url = img.src;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "codigo-qr-asistencia.png";
    a.click();
  });
}

if (fullscreenQrBtn) {
  fullscreenQrBtn.addEventListener("click", () => {
    const frame = document.querySelector(".qr-frame");
    if (frame && frame.requestFullscreen) frame.requestFullscreen();
  });
}