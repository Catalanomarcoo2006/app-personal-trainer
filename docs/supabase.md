# Supabase: database, accessi e come collegarlo

Stato al 29/10/2026: schema, regole di accesso (RLS), smistamento per ruolo e pannello admin sono pronti e
provati con un **Supabase locale** (Docker). Manca solo il progetto vero in UE, che crea Marco.

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
3. **Carica lo schema**:
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
8. **Email**: finché non c'è Resend (`RESEND_API_KEY`), il pannello admin mostra il link d'invito da copiare e mandare al trainer.
   Le email di Supabase (link dei clienti, password dimenticata) con il server di posta incluso hanno limiti bassi:
   prima dei clienti veri serve un SMTP (Resend) in Authentication → Emails → SMTP Settings.

## Ancora da fare (fasi successive)

- Bucket privato di Storage per documenti e loghi, con le sue regole (Fase 3).
- Collegare `libs/dati/sportello.ts` alle tabelle (Fase 2): oggi l'area trainer e l'app del cliente usano ancora i dati finti del prototipo.
- Inviti dei clienti dal trainer (server action con la chiave di servizio, come `libs/admin/trainers.ts`).
- Avvisi automatici dei pacchetti in scadenza e del dolore (Fase 2 e 4).
