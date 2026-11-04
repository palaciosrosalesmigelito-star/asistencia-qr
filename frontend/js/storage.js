// Almacenamiento local (demo). Se reemplazará por Supabase.
const STORAGE_KEYS = {
  SESSIONS: "sessions",
  ATTENDANCE: "attendance"
};

function getSessions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]");
}
function saveSessions(list) {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));
}
function getAttendance() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
}
function saveAttendance(list) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
}
function newSessionCode() {
  return "SES-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}