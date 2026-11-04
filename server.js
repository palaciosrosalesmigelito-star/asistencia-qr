// Servidor Node (sin dependencias externas) para Registro de Asistencia QR
const http = require("http");
const fs = require("fs");
const path = require("path");

// Cargar .env manualmente
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  });
}

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Almacenamiento en memoria (demo). Reemplazar por Supabase en producción.
const db = { users: [], sessions: [], attendance: [] };

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*" });
  res.end(typeof data === "string" ? data : JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
  });
}

// Helpers Supabase REST
async function sb(pathname, method = "GET", body) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const r = await fetch(SUPABASE_URL + "/rest/v1" + pathname, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(await r.text());
  return r.status === 204 ? null : await r.json();
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    });
    return res.end();
  }

  const url = new URL(req.url, "http://" + req.headers.host);
  const pathname = url.pathname;

  // API routes
  if (pathname.startsWith("/api/")) {
    try {
      if (pathname === "/api/health" && req.method === "GET") {
        return send(res, 200, { ok: true, supabase: !!SUPABASE_URL });
      }

      if (pathname === "/api/login" && req.method === "POST") {
        const { email, password, role } = await parseBody(req);
        const demo = [
          { email: "docente@instituto.edu", password: "docente123", role: "docente", name: "Docente Demo" },
          { email: "estudiante@instituto.edu", password: "estudiante123", role: "estudiante", name: "Estudiante Demo" }
        ];
        const found = demo.find(u => u.email === email && u.password === password && u.role === role);
        if (!found) return send(res, 401, { error: "Credenciales inválidas" });
        return send(res, 200, found);
      }

      if (pathname === "/api/sessions" && req.method === "GET") {
        const data = await sb("/sessions?select=*") || db.sessions;
        return send(res, 200, data);
      }
      if (pathname === "/api/sessions" && req.method === "POST") {
        const body = await parseBody(req);
        const session = { code: body.code, course: body.course, date: body.date, docente: body.docente, created_at: new Date().toISOString() };
        if (SUPABASE_URL) await sb("/sessions", "POST", session);
        else db.sessions.push(session);
        return send(res, 201, session);
      }

      if (pathname === "/api/attendance" && req.method === "GET") {
        const data = await sb("/attendance?select=*") || db.attendance;
        return send(res, 200, data);
      }
      if (pathname === "/api/attendance" && req.method === "POST") {
        const body = await parseBody(req);
        const record = { code: body.code, student: body.student, date: body.date, time: body.time };
        if (SUPABASE_URL) await sb("/attendance", "POST", record);
        else db.attendance.push(record);
        return send(res, 201, record);
      }

      return send(res, 404, { error: "Ruta no encontrada" });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  // Static files
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(__dirname, filePath);
  if (!filePath.startsWith(__dirname)) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("Servidor en http://localhost:" + PORT);
  console.log("Supabase:", SUPABASE_URL ? "configurado" : "no configurado (modo demo)");
});