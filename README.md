# Registro de Asistencia (QR)

Sistema de registro de asistencia para colegio/instituto/universidad mediante código QR.

## Roles
- **Docente**: genera códigos QR por sesión de clase y consulta asistencia.
- **Estudiante**: escanea el QR y registra su asistencia.

## Tecnologías
- Frontend: HTML, CSS, JavaScript
- Backend (próxima etapa): Node/Express
- Base de datos: Supabase

## Ejecución local
```bash
node server.js
```
Abrir http://localhost:3000. Usuarios demo:
- Docente: `docente@instituto.edu` / `docente123`
- Estudiante: `estudiante@instituto.edu` / `estudiante123`

## Supabase
1. Crear proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL Editor.
3. Copiar `.env.example` a `.env` y completar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

## Despliegue
### GitHub
```bash
git remote add origin https://github.com/USUARIO/registro-asistencia-qr.git
git push -u origin main
```
### Railway
1. Crear proyecto en Railway desde el repo de GitHub.
2. Configurar variables de entorno (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Railway ejecutará `node server.js` automáticamente.