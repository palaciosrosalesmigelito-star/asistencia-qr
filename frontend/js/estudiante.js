const user = requireRole("estudiante");
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
    ["escanear","historial"].forEach(v => {
      document.getElementById("view-" + v).classList.toggle("hidden", v !== view);
    });
    if (view === "historial") renderHistory();
  });
});

const scanMsg = document.getElementById("scanMsg");
let scanner = null;
let scanning = false;

const startBtn = document.getElementById("startScanBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (scanning) return;
    scanMsg.textContent = "Iniciando cámara...";
    scanMsg.className = "msg";
    scanner = new Html5Qrcode("reader");
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 220 },
      onScanSuccess,
      () => {}
    ).then(() => {
      scanning = true;
      startBtn.textContent = "Cámara activa";
      startBtn.disabled = true;
      scanMsg.textContent = "Apunta al código QR del docente.";
      scanMsg.className = "msg ok";
    }).catch(err => {
      scanMsg.textContent = "No se pudo iniciar la cámara: " + err;
      scanMsg.className = "msg error";
    });
  });
}

function onScanSuccess(decodedText) {
  try {
    const data = JSON.parse(decodedText);
    if (!data.code) throw new Error("invalid");
    const sessions = getSessions();
    const session = sessions.find(s => s.code === data.code);
    if (!session) {
      scanMsg.textContent = "Sesión no encontrada.";
      scanMsg.className = "msg error";
      return;
    }
    const att = getAttendance();
    const dup = att.find(a => a.code === data.code && a.student === user.name);
    if (dup) {
      scanMsg.textContent = "Ya registraste asistencia para esta sesión.";
      scanMsg.className = "msg error";
      return;
    }
    const now = new Date();
    att.push({
      code: data.code,
      student: user.name,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString()
    });
    saveAttendance(att);
    scanMsg.textContent = "Asistencia registrada: " + session.course;
    scanMsg.className = "msg ok";
  } catch (e) {
    scanMsg.textContent = "QR inválido.";
    scanMsg.className = "msg error";
  }
}

function renderHistory() {
  const tbody = document.getElementById("histBody");
  tbody.innerHTML = "";
  const sessions = getSessions();
  getAttendance().filter(a => a.student === user.name).forEach(a => {
    const s = sessions.find(x => x.code === a.code);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s ? s.course : "-"}</td><td>${a.date}</td><td>${a.time}</td>`;
    tbody.appendChild(tr);
  });
}