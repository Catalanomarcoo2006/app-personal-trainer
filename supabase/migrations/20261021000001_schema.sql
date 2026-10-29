-- Schema del database (piano v1, Task 3; spec 2026-10-21-design.md, sezione 5).
-- Le colonne seguono le forme del prototipo (libs/dati/tipi.ts) in snake_case: importi in centesimi,
-- date "AAAA-MM-GG" come date, orari come timestamptz. Le regole di accesso (RLS) sono nella migrazione dopo.

-- ——— Tipi ———

create type public.user_role as enum ('admin', 'trainer', 'client');
create type public.trainer_status as enum ('active', 'suspended');
create type public.client_status as enum ('active', 'archived');
create type public.session_status as enum ('scheduled', 'done', 'cancelled');
create type public.package_kind as enum ('lessons', 'time');
create type public.request_status as enum ('open', 'handled');
create type public.alert_kind as enum ('pain', 'change_request', 'package_expiring');
create type public.ai_role as enum ('user', 'assistant');

-- ——— Persone ———

-- Un profilo per ogni utente di Supabase Auth: dice che ruolo ha.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.trainers (
  id uuid primary key default gen_random_uuid(),
  -- restrict: cancellare l'utente non deve portarsi via i clienti del trainer per sbaglio
  user_id uuid not null unique references auth.users (id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 80),
  -- stessa regola di libs/slug.ts (validateSlug); i nomi riservati li controlla l'app
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
  logo_path text,
  color text not null default '#FF6B2C' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.trainer_status not null default 'active',
  license_expires_at date not null,
  sounds_enabled boolean not null default true,
  -- le stesse chiavi di Notifiche in libs/dati/tipi.ts
  notifications jsonb not null default '{"dolore": true, "spostamento": true, "pacchetti": true, "riepilogo": false, "avvisoDolori": true}',
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers (id) on delete cascade,
  -- vuoto finché il cliente non ha un accesso (link via email)
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 80),
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  -- solo per accordare l'italiano nelle risposte dell'assistente
  gender text check (gender in ('donna', 'uomo')),
  tone text not null default 'peach' check (tone in ('peach', 'sky', 'rose', 'violet', 'mint')),
  goal_label text not null default '',
  goal_unit text not null default 'kg',
  goal_start numeric,
  goal_current numeric,
  goal_target numeric,
  -- l'obiettivo proposto dal cliente alla registrazione: vale quando il trainer lo conferma
  goal_proposed_start numeric,
  goal_proposed_target numeric,
  weigh_frequency text check (weigh_frequency in ('giorno', 'settimana', 'mese')),
  -- note del trainer: il cliente non le vede (legge il suo profilo con my_client())
  notes text not null default '' check (length(notes) <= 500),
  consent_at timestamptz,
  status public.client_status not null default 'active',
  created_at timestamptz not null default now(),
  -- serve alle chiavi esterne doppie qui sotto: una seduta o un pagamento non può puntare al cliente di un altro trainer
  unique (id, trainer_id)
);
create index clients_trainer_idx on public.clients (trainer_id);
create unique index clients_trainer_email_idx on public.clients (trainer_id, lower(email)) where email is not null;

-- ——— Esercizi e schede ———

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  -- null = libreria base, uguale per tutti
  trainer_id uuid references public.trainers (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  muscle_group text not null,
  equipment text not null default '',
  description text not null default '',
  video_url text,
  created_at timestamptz not null default now()
);
create index exercises_trainer_idx on public.exercises (trainer_id);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null default 'Scheda',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index workout_plans_client_idx on public.workout_plans (client_id);
-- una sola scheda attiva per cliente
create unique index workout_plans_one_active_idx on public.workout_plans (client_id) where active;

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  position int not null check (position >= 0),
  label text not null,
  focus text not null default '',
  unique (plan_id, position)
);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.plan_days (id) on delete cascade,
  -- un esercizio della libreria, oppure solo il nome (righe lette da un PDF)
  exercise_id uuid references public.exercises (id) on delete set null,
  name text,
  position int not null check (position >= 0),
  sets text not null default '',
  load text not null default '',
  rest text not null default '',
  notes text not null default '',
  check (exercise_id is not null or name is not null)
);
create index plan_exercises_day_idx on public.plan_exercises (day_id);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_day_id uuid references public.plan_days (id) on delete set null,
  done_on date not null,
  created_at timestamptz not null default now(),
  unique (client_id, plan_day_id, done_on)
);
create index workout_logs_client_idx on public.workout_logs (client_id, done_on);

-- ——— Pacchetti, sedute, pagamenti ———

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind public.package_kind not null,
  label text not null default '',
  -- solo i pacchetti a lezioni hanno un numero di lezioni
  lessons_total int check (lessons_total > 0),
  starts_on date not null,
  ends_on date,
  price_cents int not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  check ((kind = 'lessons') = (lessons_total is not null)),
  check (ends_on is null or ends_on >= starts_on),
  unique (id, client_id)
);
create index packages_client_idx on public.packages (client_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null,
  client_id uuid not null,
  starts_at timestamptz not null,
  duration_min int not null check (duration_min between 5 and 600),
  -- Workout, Valutazione, Online, Corsa (AppointmentType del prototipo)
  kind text not null default 'Workout',
  place text not null default '',
  online boolean not null default false,
  status public.session_status not null default 'scheduled',
  -- il pacchetto da cui si scala la lezione, se c'è
  package_id uuid,
  created_at timestamptz not null default now(),
  foreign key (client_id, trainer_id) references public.clients (id, trainer_id) on delete cascade,
  foreign key (package_id, client_id) references public.packages (id, client_id) on delete set null (package_id),
  unique (id, client_id)
);
create index sessions_trainer_idx on public.sessions (trainer_id, starts_at);
create index sessions_client_idx on public.sessions (client_id, starts_at);
create index sessions_package_idx on public.sessions (package_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers (id) on delete cascade,
  client_id uuid,
  package_id uuid,
  amount_cents int not null check (amount_cents > 0),
  due_on date not null,
  -- vuoto = da incassare
  paid_on date,
  description text not null check (length(trim(description)) between 1 and 200),
  created_at timestamptz not null default now(),
  foreign key (client_id, trainer_id) references public.clients (id, trainer_id) on delete cascade,
  foreign key (package_id, client_id) references public.packages (id, client_id) on delete set null (package_id),
  check (package_id is null or client_id is not null)
);
create index payments_trainer_idx on public.payments (trainer_id, paid_on);
create index payments_client_idx on public.payments (client_id);

-- ——— Progressi del cliente ———

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  taken_on date not null,
  weight_kg numeric check (weight_kg between 20 and 400),
  waist_cm numeric check (waist_cm between 20 and 300),
  hips_cm numeric check (hips_cm between 20 and 300),
  chest_cm numeric check (chest_cm between 20 and 300),
  arm_cm numeric check (arm_cm between 5 and 100),
  thigh_cm numeric check (thigh_cm between 10 and 150),
  -- le circonferenze scritte dal cliente valgono quando il trainer le accetta (daConfermare nel prototipo)
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  check (coalesce(weight_kg, waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm) is not null)
);
create index measurements_client_idx on public.measurements (client_id, taken_on);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  day date not null,
  water_ml int check (water_ml between 0 and 20000),
  steps int check (steps between 0 and 200000),
  unique (client_id, day)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  uploaded_by text not null check (uploaded_by in ('nutrizionista', 'trainer', 'cliente')),
  -- percorso nel bucket privato di Storage (Fase 3)
  storage_path text not null unique,
  name text not null,
  kind text not null check (kind in ('pdf', 'foto')),
  created_at timestamptz not null default now()
);
create index documents_client_idx on public.documents (client_id);

-- ——— Comunicazioni ———

-- Chat fra trainer e cliente (sezione Messaggi del prototipo).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  sender text not null check (sender in ('trainer', 'client')),
  -- lo stesso limite di MAX_MESSAGGIO in libs/dati/sportello.ts
  body text not null check (length(body) between 1 and 1000),
  document_id uuid references public.documents (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_client_idx on public.messages (client_id, created_at);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  client_id uuid not null,
  message text not null check (length(message) between 1 and 1000),
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  foreign key (session_id, client_id) references public.sessions (id, client_id) on delete cascade
);
create index change_requests_client_idx on public.change_requests (client_id);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers (id) on delete cascade,
  client_id uuid,
  kind public.alert_kind not null,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (client_id, trainer_id) references public.clients (id, trainer_id) on delete cascade
);
create index alerts_trainer_idx on public.alerts (trainer_id, read);

-- Domande e risposte dell'assistente: il trainer le vede, e contano per il limite mensile.
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  role public.ai_role not null,
  -- la rete di sicurezza taglia i messaggi oltre 2.000 caratteri
  content text not null check (length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index ai_messages_client_idx on public.ai_messages (client_id, created_at);
