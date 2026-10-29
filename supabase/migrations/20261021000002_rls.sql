-- Regole di accesso (piano v1, Task 4; spec sezione 5).
-- Il trainer legge e scrive solo le righe dei propri clienti; il cliente solo le proprie (e del trainer solo
-- marchio e sedute); l'admin solo trainers e profiles. Trainer sospeso → my_trainer_id() e my_client_id()
-- diventano null alla richiesta successiva: lui e i suoi clienti non leggono più nulla, i dati restano.

-- ——— Chi sono ———
-- security definer: leggono profiles, trainers e clients senza passare dalle loro regole (che le usano).

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.my_trainer_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.trainers where user_id = auth.uid() and status = 'active';
$$;

-- Il cliente archiviato o con il trainer sospeso non ha più accesso.
create function public.my_client_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.id
  from public.clients c
  join public.trainers t on t.id = c.trainer_id
  where c.user_id = auth.uid() and c.status = 'active' and t.status = 'active';
$$;

create function public.my_client_trainer_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.trainer_id
  from public.clients c
  join public.trainers t on t.id = c.trainer_id
  where c.user_id = auth.uid() and c.status = 'active' and t.status = 'active';
$$;

create function public.is_my_client(p_client_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.clients
    where id = p_client_id and trainer_id = public.my_trainer_id()
  );
$$;

-- Tutto quello che serve al middleware per smistare (libs/auth/profile.ts, getAccess) in una sola chiamata.
create function public.my_access()
returns table (role public.user_role, trainer_active boolean, client_trainer_slug text)
language sql stable security definer set search_path = ''
as $$
  select
    p.role,
    exists (select 1 from public.trainers t where t.user_id = auth.uid() and t.status = 'active'),
    (select t.slug
       from public.clients c
       join public.trainers t on t.id = c.trainer_id
      where c.user_id = auth.uid() and c.status = 'active' and t.status = 'active')
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Il marchio del trainer per la pagina /<slug>: lo legge anche chi non ha ancora fatto l'accesso.
create function public.trainer_branding(p_slug text)
returns table (name text, logo_path text, color text, active boolean)
language sql stable security definer set search_path = ''
as $$
  select t.name, t.logo_path, t.color, t.status = 'active'
  from public.trainers t
  where t.slug = p_slug;
$$;

-- ——— Il cliente e il suo profilo ———
-- Il cliente non seleziona clients direttamente (vedrebbe le note del trainer): legge e completa il suo profilo da qui.

create function public.my_client()
returns table (
  id uuid, trainer_id uuid, name text, email text, phone text, gender text, tone text,
  goal_label text, goal_unit text, goal_start numeric, goal_current numeric, goal_target numeric,
  goal_proposed_start numeric, goal_proposed_target numeric, weigh_frequency text, consent_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select c.id, c.trainer_id, c.name, c.email, c.phone, c.gender, c.tone,
         c.goal_label, c.goal_unit, c.goal_start, c.goal_current, c.goal_target,
         c.goal_proposed_start, c.goal_proposed_target, c.weigh_frequency, c.consent_at
  from public.clients c
  where c.id = public.my_client_id();
$$;

-- Registrazione del cliente (app del cliente): consenso esplicito, dati suoi, obiettivo proposto al trainer.
create function public.complete_registration(
  p_consent boolean,
  p_gender text default null,
  p_phone text default null,
  p_weigh_frequency text default null,
  p_goal_start numeric default null,
  p_goal_target numeric default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_client uuid := public.my_client_id();
begin
  if v_client is null then
    raise exception 'Nessun cliente collegato a questo accesso' using errcode = '42501';
  end if;
  if p_consent is not true then
    raise exception 'Serve il consenso al trattamento dei dati' using errcode = '22023';
  end if;
  update public.clients set
    consent_at = coalesce(consent_at, now()),
    gender = coalesce(p_gender, gender),
    phone = coalesce(p_phone, phone),
    weigh_frequency = coalesce(p_weigh_frequency, weigh_frequency),
    goal_proposed_start = coalesce(p_goal_start, goal_proposed_start),
    goal_proposed_target = coalesce(p_goal_target, goal_proposed_target)
  where id = v_client;
end;
$$;

-- ——— Protezioni sulle colonne ———

-- Il trainer cambia nome, logo, colore, suoni e notifiche; stato, licenza, slug e utente li cambia solo l'admin
-- (o il server con la chiave di servizio).
create function public.protect_trainer_columns() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() and (
    new.status is distinct from old.status
    or new.license_expires_at is distinct from old.license_expires_at
    or new.slug is distinct from old.slug
    or new.user_id is distinct from old.user_id
  ) then
    raise exception 'Solo l''amministratore può cambiare stato, licenza o indirizzo del trainer' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger trainers_protect before update on public.trainers
for each row execute function public.protect_trainer_columns();

-- Il trainer non sposta un cliente su un altro trainer e non gli cambia l'accesso.
create function public.protect_client_columns() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and (
    new.trainer_id is distinct from old.trainer_id
    or new.user_id is distinct from old.user_id
  ) then
    raise exception 'Il cliente non si può spostare né collegare da qui' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger clients_protect before update on public.clients
for each row execute function public.protect_client_columns();

-- ——— Avvisi automatici ———

-- Una richiesta di spostamento del cliente diventa un avviso per il trainer.
create function public.alert_on_change_request() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.alerts (trainer_id, client_id, kind, text)
  select s.trainer_id, new.client_id, 'change_request', new.message
  from public.sessions s
  where s.id = new.session_id;
  return new;
end;
$$;
create trigger change_requests_alert after insert on public.change_requests
for each row execute function public.alert_on_change_request();

-- ——— Permessi sulle funzioni ———

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_admin(), public.my_trainer_id(), public.my_client_id(), public.my_client_trainer_id(),
  public.is_my_client(uuid), public.my_access(), public.my_client(),
  public.complete_registration(boolean, text, text, text, numeric, numeric)
to authenticated;
grant execute on function public.trainer_branding(text) to anon, authenticated;

-- ——— RLS su ogni tabella ———

alter table public.profiles enable row level security;
alter table public.trainers enable row level security;
alter table public.clients enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.packages enable row level security;
alter table public.sessions enable row level security;
alter table public.payments enable row level security;
alter table public.measurements enable row level security;
alter table public.habits enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.change_requests enable row level security;
alter table public.alerts enable row level security;
alter table public.ai_messages enable row level security;

-- Le funzioni nelle regole sono scritte come (select f()): Postgres le calcola una volta per richiesta, non per riga.

-- profiles: ognuno il suo; l'admin tutti.
create policy profiles_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_admin on public.profiles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- trainers: il trainer attivo la sua riga; l'admin tutte. I clienti usano trainer_branding.
create policy trainers_self_select on public.trainers for select to authenticated
  using (id = (select public.my_trainer_id()));
create policy trainers_self_update on public.trainers for update to authenticated
  using (id = (select public.my_trainer_id())) with check (id = (select public.my_trainer_id()));
create policy trainers_admin on public.trainers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- clients: solo il trainer (il cliente passa da my_client e complete_registration).
create policy clients_trainer on public.clients for all to authenticated
  using (trainer_id = (select public.my_trainer_id()))
  with check (trainer_id = (select public.my_trainer_id()));

-- exercises: libreria base per trainer e clienti; quelli del trainer per lui e i suoi clienti.
create policy exercises_read on public.exercises for select to authenticated
  using (
    (trainer_id is null and ((select public.my_trainer_id()) is not null or (select public.my_client_id()) is not null))
    or trainer_id = (select public.my_trainer_id())
    or trainer_id = (select public.my_client_trainer_id())
  );
create policy exercises_trainer_write on public.exercises for all to authenticated
  using (trainer_id = (select public.my_trainer_id()))
  with check (trainer_id = (select public.my_trainer_id()));

-- schede: il trainer le scrive, il cliente le legge.
create policy workout_plans_trainer on public.workout_plans for all to authenticated
  using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy workout_plans_client on public.workout_plans for select to authenticated
  using (client_id = (select public.my_client_id()));

create policy plan_days_trainer on public.plan_days for all to authenticated
  using (exists (select 1 from public.workout_plans p where p.id = plan_id and public.is_my_client(p.client_id)))
  with check (exists (select 1 from public.workout_plans p where p.id = plan_id and public.is_my_client(p.client_id)));
create policy plan_days_client on public.plan_days for select to authenticated
  using (exists (select 1 from public.workout_plans p where p.id = plan_id and p.client_id = (select public.my_client_id())));

create policy plan_exercises_trainer on public.plan_exercises for all to authenticated
  using (exists (
    select 1 from public.plan_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and public.is_my_client(p.client_id)))
  with check (exists (
    select 1 from public.plan_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and public.is_my_client(p.client_id)));
create policy plan_exercises_client on public.plan_exercises for select to authenticated
  using (exists (
    select 1 from public.plan_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and p.client_id = (select public.my_client_id())));

-- allenamenti fatti: li segna (e toglie) il cliente; il trainer li vede e li corregge.
create policy workout_logs_trainer on public.workout_logs for all to authenticated
  using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy workout_logs_client_select on public.workout_logs for select to authenticated
  using (client_id = (select public.my_client_id()));
create policy workout_logs_client_insert on public.workout_logs for insert to authenticated
  with check (client_id = (select public.my_client_id()));
create policy workout_logs_client_delete on public.workout_logs for delete to authenticated
  using (client_id = (select public.my_client_id()));

-- pacchetti e sedute: li gestisce il trainer, il cliente li legge.
create policy packages_trainer on public.packages for all to authenticated
  using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy packages_client on public.packages for select to authenticated
  using (client_id = (select public.my_client_id()));

create policy sessions_trainer on public.sessions for all to authenticated
  using (trainer_id = (select public.my_trainer_id()))
  with check (trainer_id = (select public.my_trainer_id()));
create policy sessions_client on public.sessions for select to authenticated
  using (client_id = (select public.my_client_id()));

-- pagamenti: registro del trainer; il cliente vede i suoi.
create policy payments_trainer on public.payments for all to authenticated
  using (trainer_id = (select public.my_trainer_id()))
  with check (trainer_id = (select public.my_trainer_id()));
create policy payments_client on public.payments for select to authenticated
  using (client_id = (select public.my_client_id()));

-- misure: il cliente scrive il peso; le circonferenze scritte da lui restano da confermare.
create policy measurements_trainer on public.measurements for all to authenticated
  using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy measurements_client_select on public.measurements for select to authenticated
  using (client_id = (select public.my_client_id()));
create policy measurements_client_insert on public.measurements for insert to authenticated
  with check (
    client_id = (select public.my_client_id())
    and (confirmed = false or coalesce(waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm) is null)
  );
create policy measurements_client_delete on public.measurements for delete to authenticated
  using (client_id = (select public.my_client_id()) and confirmed = false);

-- abitudini: tutte del cliente.
create policy habits_trainer on public.habits for select to authenticated
  using (public.is_my_client(client_id));
create policy habits_client on public.habits for all to authenticated
  using (client_id = (select public.my_client_id())) with check (client_id = (select public.my_client_id()));

-- documenti: il cliente carica e toglie i suoi; il trainer tutti quelli dei suoi clienti.
create policy documents_trainer on public.documents for all to authenticated
  using (public.is_my_client(client_id))
  with check (public.is_my_client(client_id) and uploaded_by in ('trainer', 'nutrizionista'));
create policy documents_client_select on public.documents for select to authenticated
  using (client_id = (select public.my_client_id()));
create policy documents_client_insert on public.documents for insert to authenticated
  with check (client_id = (select public.my_client_id()) and uploaded_by = 'cliente');
create policy documents_client_delete on public.documents for delete to authenticated
  using (client_id = (select public.my_client_id()) and uploaded_by = 'cliente');

-- messaggi: ognuno scrive a nome suo.
create policy messages_trainer_select on public.messages for select to authenticated
  using (public.is_my_client(client_id));
create policy messages_trainer_insert on public.messages for insert to authenticated
  with check (public.is_my_client(client_id) and sender = 'trainer');
create policy messages_trainer_update on public.messages for update to authenticated
  using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy messages_trainer_delete on public.messages for delete to authenticated
  using (public.is_my_client(client_id));
create policy messages_client_select on public.messages for select to authenticated
  using (client_id = (select public.my_client_id()));
create policy messages_client_insert on public.messages for insert to authenticated
  with check (client_id = (select public.my_client_id()) and sender = 'client');

-- richieste di spostamento: le apre il cliente (diventano un avviso), le chiude il trainer.
create policy change_requests_trainer on public.change_requests for all to authenticated
  using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy change_requests_client_select on public.change_requests for select to authenticated
  using (client_id = (select public.my_client_id()));
create policy change_requests_client_insert on public.change_requests for insert to authenticated
  with check (client_id = (select public.my_client_id()) and status = 'open');

-- avvisi: solo del trainer.
create policy alerts_trainer on public.alerts for all to authenticated
  using (trainer_id = (select public.my_trainer_id()))
  with check (trainer_id = (select public.my_trainer_id()));

-- domande all'assistente: le scrive il cliente; il trainer le legge.
create policy ai_messages_trainer on public.ai_messages for select to authenticated
  using (public.is_my_client(client_id));
create policy ai_messages_client_select on public.ai_messages for select to authenticated
  using (client_id = (select public.my_client_id()));
create policy ai_messages_client_insert on public.ai_messages for insert to authenticated
  with check (client_id = (select public.my_client_id()));
