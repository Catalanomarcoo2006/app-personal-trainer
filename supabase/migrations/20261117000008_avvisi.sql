-- Avvisi al trainer (17/11): pacchetti in scadenza e email delle notifiche.
--
-- Ogni mattina il controllo automatico (/api/cron/avvisi, chiave di servizio) crea un avviso per ogni pacchetto
-- che sta finendo (2 lezioni o 7 giorni) e manda per email gli avvisi non ancora mandati, secondo le notifiche
-- scelte dal trainer nelle Impostazioni. Il dolore va anche subito (dopo report_pain).
--
-- alerts.package_id: il pacchetto dell'avviso; un solo avviso per pacchetto (niente doppioni ogni mattina).
-- alerts.emailed_at: quando l'avviso è partito per email (vuoto = da mandare, se il trainer lo vuole).

alter table public.alerts add column package_id uuid references public.packages (id) on delete cascade;
alter table public.alerts add column emailed_at timestamptz;

create unique index alerts_un_avviso_per_pacchetto on public.alerts (package_id) where kind = 'package_expiring';
create index alerts_da_mandare_idx on public.alerts (trainer_id) where emailed_at is null;

-- Gli avvisi già esistenti non partono per email tutti insieme la prima mattina.
update public.alerts set emailed_at = created_at where emailed_at is null;
