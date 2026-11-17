-- Video degli esercizi della libreria (17/11): il trainer collega un link (YouTube, Instagram, Drive…) a un
-- esercizio "in tutte le schede" e da lì vale per tutti i suoi clienti. Solo link: i video stanno sul canale del
-- trainer, non su Storage (spec). I video scelti per una sola riga della scheda restano in plan_exercises.notes.
--
-- exercise_key: l'id dell'esercizio della libreria base nel codice (es. "squat").

create table public.exercise_videos (
  trainer_id uuid not null references public.trainers (id) on delete cascade,
  exercise_key text not null check (exercise_key ~ '^[a-z0-9-]{1,60}$'),
  url text not null check (url ~* '^https?://\S+\.\S+$' and length(url) <= 500),
  updated_at timestamptz not null default now(),
  primary key (trainer_id, exercise_key)
);

alter table public.exercise_videos enable row level security;

-- il trainer gestisce i suoi; i suoi clienti li leggono (trainer sospeso: nessuno dei due, come per il resto)
create policy exercise_videos_trainer on public.exercise_videos for all to authenticated
  using (trainer_id = (select public.my_trainer_id()))
  with check (trainer_id = (select public.my_trainer_id()));
create policy exercise_videos_cliente on public.exercise_videos for select to authenticated
  using (trainer_id = (select public.my_client_trainer_id()));

grant select, insert, update, delete on public.exercise_videos to authenticated, service_role;
