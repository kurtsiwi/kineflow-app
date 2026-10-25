-- KineFlow — vista de seguimiento.
--
-- Los conteos y el "hace cuántos días" se calculan en Postgres a propósito:
-- con Cache Components, un `Date.now()` en el render obliga a marcar la ruta
-- como dinámica y ensucia el prerender. Acá `now()` queda del lado de la base.
--
-- `security_invoker = on` hace que la vista respete el RLS de quien consulta,
-- así que sigue siendo solo para `authenticated`. No expone `access_token`.

create or replace view public.routine_tracking
with (security_invoker = on) as
select
  r.id,
  r.patient_id,
  p.code                as patient_code,
  r.title,
  r.status,
  r.starts_on,
  r.ends_on,
  r.sent_at,
  r.first_opened_at,
  r.last_opened_at,
  r.open_count,
  r.created_at,
  (
    select count(*)
    from public.routine_items ri
    where ri.routine_id = r.id
  )::int                as item_count,
  (
    select count(*)
    from public.routine_item_logs l
    join public.routine_items ri on ri.id = l.routine_item_id
    where ri.routine_id = r.id
  )::int                as log_count,
  (
    select count(*)
    from public.routine_item_logs l
    join public.routine_items ri on ri.id = l.routine_item_id
    where ri.routine_id = r.id
      and l.completed_at > now() - interval '7 days'
  )::int                as logs_last_7d,
  (
    select max(l.completed_at)
    from public.routine_item_logs l
    join public.routine_items ri on ri.id = l.routine_item_id
    where ri.routine_id = r.id
  )                     as last_log_at,
  case
    when r.sent_at is null then null
    else floor(extract(epoch from (now() - r.sent_at)) / 86400)::int
  end                   as days_since_sent
from public.routines r
join public.patients p on p.id = r.patient_id;
