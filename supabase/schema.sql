-- Esquema para Registro de Asistencia QR
create table if not exists public.sessions (
  id bigserial primary key,
  code text unique not null,
  course text not null,
  date date not null,
  docente text,
  created_at timestamptz default now()
);

create table if not exists public.attendance (
  id bigserial primary key,
  code text references public.sessions(code) on delete cascade,
  student text not null,
  date text,
  time text,
  created_at timestamptz default now()
);

-- Habilitar RLS (ajustar políticas según necesidad)
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;

create policy "sessions_read_all" on public.sessions for select using (true);
create policy "sessions_insert_all" on public.sessions for insert with check (true);
create policy "attendance_read_all" on public.attendance for select using (true);
create policy "attendance_insert_all" on public.attendance for insert with check (true);