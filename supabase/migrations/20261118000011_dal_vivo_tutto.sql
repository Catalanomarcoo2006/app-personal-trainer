-- Tutto dal vivo (18/11): trainer e cliente non devono ricaricare la pagina. Oltre a messaggi, sedute e avvisi
-- (migrazioni 7 e 10), anche le tabelle da cui l'app rilegge i dati quando cambiano: pacchetti, pagamenti, misure,
-- schede, allenamenti, documenti, video degli esercizi e clienti. Realtime applica le stesse regole di accesso delle
-- tabelle: ognuno riceve solo ciò che può già leggere.

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['packages', 'payments', 'measurements', 'workout_plans', 'plan_days', 'plan_exercises', 'workout_logs', 'documents', 'exercise_videos', 'clients'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
