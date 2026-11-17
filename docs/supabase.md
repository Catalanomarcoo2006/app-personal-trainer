# Supabase: database, accessi e come collegarlo

Stato al 29/10/2026: schema, regole di accesso (RLS), smistamento per ruolo, pannello admin e **versione vera
delle tre app** (trainer da computer, trainer da telefono, app del cliente) sono pronti e provati con un
**Supabase locale** (Docker). Manca solo il progetto vero in UE, che crea Marco.

## I sei "siti"

| | Demo (dati finti, si riparte ricaricando) | Versione vera (database) |
|---|---|---|
| Trainer da computer | `/demo/trainer` | `/dashboard` (dopo il login) |
| Trainer da telefono | `/demo/telefono` | `/dashboard` dal telefono (o `?telefono`) |
| App del cliente | `/demo/cliente` | `/<slug-del-trainer>` (dal link d'invito) |

La pagina `/` le elenca tutte. Le pagine sono le stesse del prototipo: nella versione vera `AvvioVero`
(components/vera) le avvia con l'orologio di adesso (`libs/orologio.ts`), i dati letti dal database
(`libs/vera/carica.ts` + `mappa.ts`) e il salvataggio continuo delle modifiche (`libs/vera/salva.ts`).
Con dati veri Leo non chiama l'AI e la dettatura è spenta (CLAUDE.md, "Da non fare"): nuovo cliente,
pagamento e pacchetto si fanno dalle finestre (`components/vera/Moduli.tsx`); il trainer invita il cliente
dalla sua scheda ("Invita nell'app").

## Cosa c'è

- `supabase/migrations/20261021000001_schema.sql`: le tabelle della spec (sezione 5) più `messages` (chat
  trainer-cliente) e le colonne del prototipo (`libs/dati/tipi.ts`): genere, colore, frequenza della pesata,
  obiettivo proposto dal cliente, misure da confermare, notifiche del trainer. Importi in centesimi.
- `supabase/migrations/20261021000002_rls.sql`: RLS su ogni tabella e le funzioni che usano:
  - `my_trainer_id()`, `my_client_id()`: null se il trainer è sospeso (o il cliente archiviato) → non si legge più nulla, i dati restano.
  - `my_access()`: ruolo e stato in una chiamata, per il middleware (`libs/auth/profile.ts`).
  - `trainer_branding(slug)`: nome, logo e colore, leggibile anche senza accesso (pagina `/<slug>`).
  - `my_client()`: il cliente legge il suo profilo da qui (non vede le note del trainer); `complete_registration(...)` con consenso obbligatorio.
  - Trigger: il trainer non cambia da solo stato, licenza o slug; una richiesta di spostamento diventa un avviso.
- `supabase/migrations/20261029000003_versione_vera.sql`: `report_pain(testo)` (il dolore detto a Leo diventa un
  avviso per il trainer) e la data d'inizio nel profilo del cliente (`my_client`).
- `supabase/migrations/20261029000004_permessi.sql`: permessi di base sulle tabelle. I progetti Supabase nuovi
  non li danno più da soli: senza, "permission denied for table …" (trovato il 29/10 creando il primo trainer).
- `supabase/migrations/20261106000005_scheda_e_allenamenti.sql`: `save_plan(cliente, giorni)` (la scheda in una sola
  transazione: niente mezze schede se la rete cade) e `set_workout_done(fatto)` (l'allenamento di oggi del cliente,
  con il giorno italiano del server). Provata su PGlite (Postgres in memoria) perché sul computer di Marco non c'è Docker.
- `supabase/migrations/20261106000006_storage_documenti.sql`: bucket privato `documenti` (10 MB, PDF e foto), un file
  per documento in `<trainer>/<cliente>/<id>.<pdf|jpg>`. Il trainer legge, carica e toglie i file dei suoi clienti; il
  cliente legge i suoi e toglie solo quelli caricati da lui; le righe di `documents` puntano solo alla cartella giusta.
  Provata su PGlite con uno Storage finto (21 controlli, anche trainer sospeso).
- `supabase/migrations/20261117000007_marchio_e_dal_vivo.sql`: bucket **pubblico** `marchi` (2 MB, PNG/JPG/WebP) per foto e
  logo del trainer, un file per caricamento in `<trainer>/<foto|logo>-<numero>.<ext>` (il nome cambia: niente immagini
  vecchie in memoria); scrive solo il trainer nella sua cartella. `trainers.photo_path`, `trainer_branding()` con la foto
  (la pagina `/<slug>` mostra il logo prima del login), `messages` nella pubblicazione di Realtime (messaggi dal vivo).
  Provata su PGlite (14 controlli). Il codice legge la riga del trainer con `select("*")`: se la migrazione manca, la
  dashboard si apre lo stesso, ma foto e logo non si salvano.
- `supabase/migrations/20261117000008_avvisi.sql`: `alerts.package_id` (un solo avviso per pacchetto, indice unico) e
  `alerts.emailed_at` (vuoto = da mandare per email). Gli avvisi già esistenti si segnano come mandati. Provata su PGlite.
- `supabase/migrations/20261117000009_video_esercizi.sql`: `exercise_videos` (trainer, id dell'esercizio della libreria, link):
  i video "in tutte le schede" scelti dal trainer; li legge anche l'app dei suoi clienti. Solo link (YouTube, Instagram,
  Drive), niente file su Storage. Provata su PGlite (9 controlli).
- `types/db.ts`: tipi generati (`npm run db:types` con il locale acceso).
- Pagine: `/signin` (trainer e admin, email + password), `/nuova-password` (dopo l'invito o "password dimenticata"),
  `/<slug>` (login del cliente col marchio, link via email), `/sospeso`, `/admin` (crea, rinnova, sospendi, link d'accesso).
- Rotte: `/api/auth/confirm` (link delle email con `token_hash`), `/api/auth/callback` (codice), `/api/auth/signout`.

## Provare in locale (serve Docker)

```bash
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,supavisor,postgres-meta,mailpit
npm run test:db      # 23 test: schema, RLS (anche trainer sospeso con sessione aperta), admin
```

Per aprire l'app sul locale, in `.env.local` metti i valori di `npx supabase status -o env`
(`API_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`). `npm run db:reset` riapplica le migrazioni da zero.

## Collegare il progetto vero (Marco)

1. **Crea il progetto** su supabase.com, regione **EU (Frankfurt o Paris)**. Uno di sviluppo per ora.
2. **Chiavi** (Project Settings → API) in `.env.local` sul computer e su Vercel → Environment Variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (questa solo Secret, mai `NEXT_PUBLIC_`).
   Aggiorna `docs/chiavi.md`.
3. **Carica lo schema** (o, senza terminale: SQL Editor → incolla ed esegui i file di `supabase/migrations/`, in ordine):
   ```bash
   npx supabase login
   ```
   ```bash
   npx supabase link --project-ref <ref-del-progetto>
   ```
   ```bash
   npm run db:push
   ```
4. **Authentication → Sign In / Providers**: togli "Allow new users to sign up" (niente iscrizione libera: i trainer li crea l'admin, i clienti il trainer).
5. **Authentication → URL Configuration**: Site URL = l'indirizzo online (oggi `https://app-personal-trainer-kappa.vercel.app`);
   Redirect URLs: lo stesso con `/**` e `http://localhost:3000/**`.
6. **Authentication → Emails → Templates** (i link devono funzionare anche aperti dall'app della posta del telefono):
   - *Magic Link* (accesso dei clienti): `<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email">Entra nell'app</a>`
   - *Reset Password* (trainer): `<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Scegli una nuova password</a>`
   - Testi in italiano. L'invito dei trainer non usa i modelli di Supabase: il link lo crea il pannello admin.
7. **Il tuo account admin**: Authentication → Users → Add user (la tua email, una password, "Auto confirm"), poi in SQL Editor:
   ```sql
   insert into public.profiles (id, role)
   select id, 'admin' from auth.users where email = 'LA-TUA-EMAIL';
   ```
   Da lì entri da `/signin` e arrivi su `/admin`.
8. **Email con Resend** (dal 17/11 le manda l'app, in italiano, e funzionano anche aperte dall'app della posta):
   crea l'account su resend.com, aggiungi e verifica il dominio del prodotto (record DNS), crea una chiave. Su Vercel:
   `RESEND_API_KEY`, `EMAIL_FROM` (es. `Spotter <ciao@dominio.it>`) e `CRON_SECRET`, poi Redeploy. Da lì partono
   dall'app: invito del trainer e del cliente, link d'accesso del cliente (`chiediLinkAction`), password dimenticata
   (`passwordDimenticataAction`), avvisi e riepilogo del lunedì (`/api/cron/avvisi`, ogni mattina alle 7). Senza la
   chiave tutto resta come prima (link da copiare, email di Supabase). Il mittente `onboarding@resend.dev` manda solo
   all'email del proprietario dell'account Resend: per i trainer serve il dominio.
   Prima, finché non c'è Resend (`RESEND_API_KEY`), il pannello admin mostra il link d'invito da copiare e mandare al trainer.
   Le email di Supabase (link dei clienti, password dimenticata) con il server di posta incluso hanno limiti bassi:
   prima dei clienti veri serve un SMTP (Resend) in Authentication → Emails → SMTP Settings.

9. **Ridistribuisci** su Vercel (Deployments → Redeploy) dopo aver messo le chiavi: da lì `/dashboard` e le pagine
   dei trainer usano il database. Con le chiavi segnaposto le demo funzionano e le versioni vere mostrano il login.

## Ancora da fare (fasi successive)

- Resend attivo: servono il dominio, la chiave ed `EMAIL_FROM` (passo 8). Il codice c'è dal 17/11.
- Aggiornamento dal vivo anche di sedute e avvisi (dal 17/11 sono dal vivo solo i messaggi).
- Leo con dati veri: quando c'è il fornitore AI in UE (e il trascrittore per i vocali), si toglie il blocco
  `inDemo()` in `useChatLeo.ts`, `LeoCliente.tsx` e `leo-voce-browser.ts`.
