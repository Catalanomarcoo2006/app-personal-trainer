-- Rifiniture del backend (6/11): la scheda si salva in un colpo solo, l'allenamento di oggi con la data del server.

-- La scheda del cliente in una sola transazione. Prima il browser cancellava i giorni e li riscriveva uno alla
-- volta: se una scrittura falliva a metà (rete, pagina chiusa) il cliente restava con mezza scheda.
-- security invoker: valgono le regole di accesso del trainer collegato. p_days ha la forma delle pagine
-- (libs/prototipo/stato.ts, Day): [{ "label", "focus", "rows": [{ "name", "sets", "load", "rest", "notes" }] }].
create function public.save_plan(p_client_id uuid, p_days jsonb) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_plan uuid;
  v_day uuid;
  d jsonb;
  e jsonb;
  i int := 0;
  j int;
begin
  if not public.is_my_client(p_client_id) then
    raise exception 'Cliente non trovato' using errcode = '42501';
  end if;
  if jsonb_typeof(p_days) is distinct from 'array' then
    raise exception 'Scheda non valida' using errcode = '22023';
  end if;

  select id into v_plan from public.workout_plans where client_id = p_client_id and active;
  if v_plan is null then
    insert into public.workout_plans (client_id, name) values (p_client_id, 'Scheda') returning id into v_plan;
  else
    delete from public.plan_days where plan_id = v_plan;
  end if;

  for d in select value from jsonb_array_elements(p_days) loop
    insert into public.plan_days (plan_id, position, label, focus)
    values (v_plan, i, coalesce(nullif(trim(d->>'label'), ''), 'Giorno'), coalesce(d->>'focus', ''))
    returning id into v_day;
    j := 0;
    for e in select value from jsonb_array_elements(coalesce(d->'rows', '[]'::jsonb)) loop
      insert into public.plan_exercises (day_id, position, name, sets, load, rest, notes)
      values (
        v_day, j, coalesce(nullif(trim(e->>'name'), ''), 'Esercizio'),
        coalesce(e->>'sets', ''), coalesce(e->>'load', ''), coalesce(e->>'rest', ''), coalesce(e->>'notes', '')
      );
      j := j + 1;
    end loop;
    i := i + 1;
  end loop;
end;
$$;

-- Il cliente segna (o toglie) l'allenamento di oggi: una riga al giorno, con il giorno italiano del server
-- (non quello del telefono). security invoker: valgono le regole di accesso del cliente su workout_logs.
create function public.set_workout_done(p_done boolean) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_client uuid := public.my_client_id();
  v_day date := (now() at time zone 'Europe/Rome')::date;
begin
  if v_client is null then
    raise exception 'Nessun cliente collegato a questo accesso' using errcode = '42501';
  end if;
  if p_done then
    insert into public.workout_logs (client_id, done_on)
    select v_client, v_day
    where not exists (select 1 from public.workout_logs w where w.client_id = v_client and w.done_on = v_day);
  else
    delete from public.workout_logs where client_id = v_client and done_on = v_day and plan_day_id is null;
  end if;
end;
$$;

revoke execute on function public.save_plan(uuid, jsonb), public.set_workout_done(boolean) from public, anon;
grant execute on function public.save_plan(uuid, jsonb), public.set_workout_done(boolean) to authenticated, service_role;
