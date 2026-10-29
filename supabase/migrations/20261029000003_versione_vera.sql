-- Versione vera (29/10): avviso di dolore dal cliente e data d'inizio nel suo profilo.

-- Il cliente segnala un dolore a Leo: l'avviso arriva al suo trainer (spec, sezione 6: "dolore → avviso").
-- Il cliente non scrive direttamente negli avvisi; passa da qui, che sa chi è il suo trainer.
create function public.report_pain(p_text text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_client uuid := public.my_client_id();
begin
  if v_client is null then
    raise exception 'Nessun cliente collegato a questo accesso' using errcode = '42501';
  end if;
  insert into public.alerts (trainer_id, client_id, kind, text)
  select c.trainer_id, c.id, 'pain', left(trim(p_text), 500)
  from public.clients c
  where c.id = v_client;
end;
$$;

revoke execute on function public.report_pain(text) from public, anon;
grant execute on function public.report_pain(text) to authenticated;

-- Il profilo del cliente con la data d'inizio ("Con Giulia dal 5 ott"): si cambia il tipo restituito.
drop function public.my_client();
create function public.my_client()
returns table (
  id uuid, trainer_id uuid, name text, email text, phone text, gender text, tone text,
  goal_label text, goal_unit text, goal_start numeric, goal_current numeric, goal_target numeric,
  goal_proposed_start numeric, goal_proposed_target numeric, weigh_frequency text, consent_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select c.id, c.trainer_id, c.name, c.email, c.phone, c.gender, c.tone,
         c.goal_label, c.goal_unit, c.goal_start, c.goal_current, c.goal_target,
         c.goal_proposed_start, c.goal_proposed_target, c.weigh_frequency, c.consent_at, c.created_at
  from public.clients c
  where c.id = public.my_client_id();
$$;
revoke execute on function public.my_client() from public, anon;
grant execute on function public.my_client() to authenticated;
