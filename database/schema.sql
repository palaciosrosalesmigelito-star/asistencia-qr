-- =========================================================
-- BASE DE DATOS COMPLETA: Registro de Asistencia con QR
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ---------- ROLES ----------
create table if not exists public.roles (
  id serial primary key,
  name text unique not null
);
insert into public.roles (name) values ('docente'), ('estudiante'), ('admin')
on conflict (name) do nothing;

-- ---------- PERFILES / USUARIOS ----------
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  role text not null default 'estudiante' check (role in ('docente','estudiante','admin')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- CURSOS / ASIGNATURAS ----------
create table if not exists public.courses (
  id bigserial primary key,
  code text unique,
  name text not null,
  docente_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- MATRÍCULA / INSCRIPCIÓN ----------
create table if not exists public.enrollments (
  id bigserial primary key,
  course_id bigint references public.courses(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (course_id, student_id)
);

-- ---------- SESIONES DE CLASE (QR) ----------
create table if not exists public.sessions (
  id bigserial primary key,
  code text unique not null,
  course text not null,
  course_id bigint references public.courses(id) on delete set null,
  date date not null,
  docente text,
  docente_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- ASISTENCIA ----------
create table if not exists public.attendance (
  id bigserial primary key,
  session_code text references public.sessions(code) on delete cascade,
  code text,
  student text not null,
  student_id uuid references public.profiles(id) on delete set null,
  date text,
  time text,
  created_at timestamptz default now()
);

-- ---------- ÍNDICES ----------
create index if not exists idx_sessions_code on public.sessions(code);
create index if not exists idx_sessions_date on public.sessions(date);
create index if not exists idx_attendance_code on public.attendance(code);
create index if not exists idx_attendance_student on public.attendance(student);
create index if not exists idx_profiles_email on public.profiles(email);

-- ---------- RLS ----------
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;

-- Políticas permisivas para demo (ajustar en producción)
create policy "roles_read_all" on public.roles for select using (true);
create policy "profiles_all" on public.profiles for all using (true) with check (true);
create policy "courses_all" on public.courses for all using (true) with check (true);
create policy "enrollments_all" on public.enrollments for all using (true) with check (true);
create policy "sessions_all" on public.sessions for all using (true) with check (true);
create policy "attendance_all" on public.attendance for all using (true) with check (true);

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.attendance;

-- ---------- DATOS DEMO ----------
insert into public.profiles (email, full_name, role) values
  ('docente@instituto.edu', 'Docente Demo', 'docente'),
  ('estudiante@instituto.edu', 'Estudiante Demo', 'estudiante')
on conflict (email) do nothing;