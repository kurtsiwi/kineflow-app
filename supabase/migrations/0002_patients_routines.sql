-- KineFlow — pacientes, rutinas y seguimiento.
-- Idempotente.
--
-- Diseño de datos personales:
--   `patients`          -> alias no identificante (code). Es la tabla que usan
--                          el dashboard y el seguimiento.
--   `patient_contacts`  -> nombre y email. Solo se lee para enviar el enlace.
--   `routines` y sus hijas referencian `patients`, nunca el contacto, así que
--   el seguimiento funciona completo sin tocar datos identificantes.

-- ---------------------------------------------------------------------------
-- Pacientes
-- ---------------------------------------------------------------------------
create sequence if not exists public.patient_code_seq;

create table if not exists public.patients (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique
                default 'PAC-' || lpad(nextval('public.patient_code_seq')::text, 4, '0'),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.patient_contacts (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  full_name  text not null,
  email      text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists patient_contacts_set_updated_at on public.patient_contacts;
create trigger patient_contacts_set_updated_at
  before update on public.patient_contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rutinas
--   access_token: credencial del enlace que recibe el paciente. Lo genera la
--   app con crypto.randomBytes, no tiene default a propósito.
-- ---------------------------------------------------------------------------
create table if not exists public.routines (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients (id) on delete cascade,
  title           text not null,
  notes           text,
  access_token    text not null unique check (length(access_token) >= 32),
  status          text not null default 'activa'
                    check (status in ('activa', 'cerrada')),
  starts_on       date,
  ends_on         date,
  sent_at         timestamptz,
  first_opened_at timestamptz,
  last_opened_at  timestamptz,
  open_count      integer not null default 0,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists routines_patient_idx on public.routines (patient_id);
create index if not exists routines_status_idx on public.routines (status, created_at desc);

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ejercicios de la rutina
--   sets/reps/duration en null = usar la dosificación del ejercicio base.
-- ---------------------------------------------------------------------------
create table if not exists public.routine_items (
  id               uuid primary key default gen_random_uuid(),
  routine_id       uuid not null references public.routines (id) on delete cascade,
  exercise_id      uuid not null references public.exercises (id) on delete restrict,
  position         smallint not null,
  sets             smallint check (sets is null or sets > 0),
  reps             smallint check (reps is null or reps > 0),
  duration_seconds integer  check (duration_seconds is null or duration_seconds > 0),
  notes            text,
  unique (routine_id, position)
);

create index if not exists routine_items_routine_idx on public.routine_items (routine_id);

-- ---------------------------------------------------------------------------
-- Registro de "lo hice"
--   Append-only: el paciente puede repetir el mismo ejercicio varios días.
-- ---------------------------------------------------------------------------
create table if not exists public.routine_item_logs (
  id              uuid primary key default gen_random_uuid(),
  routine_item_id uuid not null references public.routine_items (id) on delete cascade,
  completed_at    timestamptz not null default now(),
  pain            smallint check (pain is null or pain between 0 and 10),
  effort          smallint check (effort is null or effort between 0 and 10)
);

create index if not exists routine_item_logs_item_idx
  on public.routine_item_logs (routine_item_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- RLS: todo es del administrador. El paciente nunca toca estas tablas, entra
-- por las funciones security definer de más abajo.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'patients', 'patient_contacts', 'routines', 'routine_items', 'routine_item_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Solo admins" on public.%I', t);
    execute format(
      'create policy "Solo admins" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$$;
