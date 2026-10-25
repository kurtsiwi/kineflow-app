-- KineFlow — esquema base
-- Ejecutable varias veces sin romper nada (idempotente).

-- ---------------------------------------------------------------------------
-- Tabla de ejercicios
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  category         text,
  body_area        text,
  difficulty       text not null default 'principiante'
                     check (difficulty in ('principiante', 'intermedio', 'avanzado')),
  sets             smallint check (sets is null or sets > 0),
  reps             smallint check (reps is null or reps > 0),
  duration_seconds integer  check (duration_seconds is null or duration_seconds > 0),
  video_url        text,
  image_url        text,
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists exercises_published_name_idx
  on public.exercises (published, name);
create index if not exists exercises_category_idx
  on public.exercises (category);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--   anon          -> solo lee ejercicios publicados (el home de la página)
--   authenticated -> lee y escribe todo (el panel de administración)
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;

drop policy if exists "Ejercicios publicados son públicos" on public.exercises;
create policy "Ejercicios publicados son públicos"
  on public.exercises for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Admins leen todos los ejercicios" on public.exercises;
create policy "Admins leen todos los ejercicios"
  on public.exercises for select
  to authenticated
  using (true);

drop policy if exists "Admins crean ejercicios" on public.exercises;
create policy "Admins crean ejercicios"
  on public.exercises for insert
  to authenticated
  with check (true);

drop policy if exists "Admins editan ejercicios" on public.exercises;
create policy "Admins editan ejercicios"
  on public.exercises for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins borran ejercicios" on public.exercises;
create policy "Admins borran ejercicios"
  on public.exercises for delete
  to authenticated
  using (true);
