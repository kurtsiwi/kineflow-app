-- KineFlow — acceso del paciente por token.
--
-- El paciente no se loguea: el enlace del email ES la credencial. Por eso no
-- se le da ningún permiso de RLS sobre las tablas y todo pasa por estas tres
-- funciones `security definer`, que son la única superficie expuesta a `anon`.
-- Ninguna devuelve nombre ni email: el paciente solo ve su alias.
--
-- Todas llevan `set search_path = ''` y referencias calificadas, para que un
-- search_path manipulado no pueda redirigirlas a otras tablas.

-- ---------------------------------------------------------------------------
-- Lectura de la rutina
-- ---------------------------------------------------------------------------
create or replace function public.routine_by_token(p_token text)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_routine public.routines;
begin
  -- Corta el paso a tokens triviales antes de ir a la tabla.
  if p_token is null or length(p_token) < 32 then
    return null;
  end if;

  select * into v_routine
  from public.routines
  where access_token = p_token;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_routine.id,
    'title', v_routine.title,
    'notes', v_routine.notes,
    'status', v_routine.status,
    'starts_on', v_routine.starts_on,
    'ends_on', v_routine.ends_on,
    'patient_code', (
      select p.code from public.patients p where p.id = v_routine.patient_id
    ),
    'items', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', ri.id,
                 'position', ri.position,
                 'sets', coalesce(ri.sets, e.sets),
                 'reps', coalesce(ri.reps, e.reps),
                 'duration_seconds', coalesce(ri.duration_seconds, e.duration_seconds),
                 'notes', ri.notes,
                 'name', e.name,
                 'description', e.description,
                 'category', e.category,
                 'body_area', e.body_area,
                 'difficulty', e.difficulty,
                 'image_url', e.image_url,
                 'video_url', e.video_url,
                 'logs', coalesce((
                   select jsonb_agg(
                            jsonb_build_object(
                              'completed_at', l.completed_at,
                              'pain', l.pain,
                              'effort', l.effort
                            )
                            order by l.completed_at desc
                          )
                   from public.routine_item_logs l
                   where l.routine_item_id = ri.id
                 ), '[]'::jsonb)
               )
               order by ri.position
             )
      from public.routine_items ri
      join public.exercises e on e.id = ri.exercise_id
      where ri.routine_id = v_routine.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Registro de apertura del enlace
--   Solo cuenta mientras la rutina está activa. Esto es la "confirmación de
--   que el paciente abrió el enlace".
-- ---------------------------------------------------------------------------
create or replace function public.register_routine_open(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token is null or length(p_token) < 32 then
    return;
  end if;

  update public.routines
  set open_count      = open_count + 1,
      first_opened_at = coalesce(first_opened_at, now()),
      last_opened_at  = now()
  where access_token = p_token
    and status = 'activa';
end;
$$;

-- ---------------------------------------------------------------------------
-- Registro de "lo hice"
-- ---------------------------------------------------------------------------
create or replace function public.log_routine_item(
  p_token   text,
  p_item_id uuid,
  p_pain    integer default null,
  p_effort  integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_routine_id uuid;
begin
  select r.id into v_routine_id
  from public.routines r
  where r.access_token = p_token
    and r.status = 'activa';

  if not found then
    raise exception 'Esta rutina ya no está disponible';
  end if;

  -- El item tiene que pertenecer a la rutina del token: si no, un enlace
  -- válido podría registrar avance en la rutina de otro paciente.
  if not exists (
    select 1
    from public.routine_items ri
    where ri.id = p_item_id
      and ri.routine_id = v_routine_id
  ) then
    raise exception 'El ejercicio no pertenece a esta rutina';
  end if;

  -- `greatest`/`least` ignoran los NULL en Postgres, así que sin el `case` un
  -- "no indico" se guardaría como 0, que es un valor clínico distinto.
  insert into public.routine_item_logs (routine_item_id, pain, effort)
  values (
    p_item_id,
    case when p_pain is null then null
         else least(greatest(p_pain, 0), 10)::smallint end,
    case when p_effort is null then null
         else least(greatest(p_effort, 0), 10)::smallint end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos: `anon` solo puede ejecutar estas tres funciones, nada más.
-- ---------------------------------------------------------------------------
revoke all on function public.routine_by_token(text) from public;
revoke all on function public.register_routine_open(text) from public;
revoke all on function public.log_routine_item(text, uuid, integer, integer) from public;

grant execute on function public.routine_by_token(text) to anon, authenticated;
grant execute on function public.register_routine_open(text) to anon, authenticated;
grant execute on function public.log_routine_item(text, uuid, integer, integer) to anon, authenticated;
