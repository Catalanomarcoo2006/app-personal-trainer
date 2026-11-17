-- Sedute e avvisi dal vivo (17/11): come i messaggi (migrazione 7), anche sedute e avvisi nella pubblicazione di
-- Realtime. Il cliente vede subito una seduta nuova, spostata o annullata dal trainer; il trainer vede subito un
-- dolore segnalato o una richiesta di spostamento. Realtime applica le stesse regole di accesso delle tabelle.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions') then
      alter publication supabase_realtime add table public.sessions;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alerts') then
      alter publication supabase_realtime add table public.alerts;
    end if;
  end if;
end $$;
