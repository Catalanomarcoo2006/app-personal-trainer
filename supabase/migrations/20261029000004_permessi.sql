-- Permessi di base sulle tabelle (29/10). I progetti Supabase nuovi non li danno più da soli alle tabelle create
-- con SQL: senza questi il server (chiave segreta) e gli utenti collegati ricevono "permission denied" prima
-- ancora di arrivare alle regole di accesso. Chi vede cosa lo decidono sempre le regole (RLS, migrazione 2).

grant usage on schema public to anon, authenticated, service_role;

-- utenti collegati e server: le tabelle, filtrate dalle regole di accesso (il server le salta, come previsto)
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

-- funzioni: il server tutte; gli utenti collegati e i visitatori quelle della migrazione 2 (ripetute qui, non fa male)
grant execute on all functions in schema public to service_role;
grant execute on function
  public.is_admin(), public.my_trainer_id(), public.my_client_id(), public.my_client_trainer_id(),
  public.is_my_client(uuid), public.my_access(), public.my_client(),
  public.complete_registration(boolean, text, text, text, numeric, numeric), public.report_pain(text)
to authenticated;
grant execute on function public.trainer_branding(text) to anon, authenticated;

-- le tabelle che verranno aggiunte in futuro partono con gli stessi permessi
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant execute on functions to service_role;
