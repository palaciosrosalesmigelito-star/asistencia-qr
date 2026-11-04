const user = requireRole("docente");
if (!user) throw new Error("no auth");

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
});

// navegación
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

let qrInstance = null;
document.getElementById("genBtn").addEventListener("click", () => {
  const course = document.getElementById("course").value.trim();
  const date = document.getElementById("sessionDate").value;
  if (!course || !date) {
    document.getElementById("qrInfo").textContent = "Completa curso y fecha.";
    document.getElementById("qrInfo").className = "msg error";
    return;
  }
  const code = newSessionCode();
  const session = { code, course, date, docente: user.name, createdAt: new Date().toISOString() };
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);

  const payload = JSON.stringify({ code, course, date });
  document.getElementById("qrcode").innerHTML = "";
  qrInstance = new QRCode(document.getElementById("qrcode"), {
    text: payload,
    width: 220,
    height: 220
  });
  document.getElementById("qrInfo").textContent = "Sesión creada: " + code;
  document.getElementById("qrInfo").className = "msg ok";
});

function renderSessions() {
  const tbody = document.getElementById("sessionsBody");
  tbody.innerHTML = "";
  const att = getAttendance();
  getSessions().filter(s => s.docente === user.name).forEach(s => {
    const count = att.filter(a => a.code === s.code).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.course}</td><td>${s.date}</td><td>${s.code}</td><td>${count}</td>`;
    tbody.appendChild(tr);
  });
}

function renderAttendance() {
  const tbody = document.getElementById("attBody");
  tbody.innerHTML = "";
  const sessions = getSessions();
  getAttendance().forEach(a => {
    const s = sessions.find(x => x.code === a.code);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.student}</td><td>${s ? s.course : "-"}</td><td>${a.date}</td><td>${a.time}</td>`;
    tbody.appendChild(tr);
  });
}