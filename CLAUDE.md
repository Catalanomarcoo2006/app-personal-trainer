# APP PERSONAL TRAINER

Piattaforma di Marco da vendere ai personal trainer: l'app del percorso del cliente, con il logo e il colore del trainer. Il trainer gestisce clienti, schede, calendario e pacchetti da computer (versione semplificata da telefono); il cliente la usa ogni giorno dal telefono, con un assistente virtuale. Prodotto personale di Marco (750 € una tantum + 200 €/anno, bonifico e fattura). Nome commerciale da definire: "APP PERSONAL TRAINER" è il nome di lavoro.

Stato di avanzamento e prossimi passi (caricati in automatico a ogni sessione, tienili sotto le 60 righe):

@PROGRESS.md

Il design approvato è in `docs/specs/2026-10-21-design.md`, il piano in `docs/plans/`.

## Idee
- All'inizio leggi `IDEE.md` (se c'è) e tieni presenti le idee "In valutazione".
- Quando Marco dice "idea: …", va in `IDEE.md`, sezione "In valutazione" (se manca, crealo con le sezioni In valutazione, Domande aperte, Bozze, Diventate progetto, Scartate).

## Stack
- Boilerplate ZeroToShip (Alberto Ravasini, licenza da verificare): Next.js 15 (App Router), React 19, TypeScript, Tailwind 4 + DaisyUI 5, Supabase (auth, database, Storage) in regione UE, Resend per le email.
- Animazioni con Motion (ex Framer Motion); assistente via API compatibile OpenAI (DeepSeek V4.1 Flash in sviluppo, fornitore UE con dati veri).
- Hosting: Vercel.

## Comandi
- Installare: `npm install`
- Avviare in locale: `npm run dev`
- Test: `npm test` (Vitest, `tests/unit/`); `npm run test:db` (schema, RLS, admin in `tests/integration/`: usa SUPABASE_TEST_* da `.env.test.local` o il Supabase locale)
- Database: `npx supabase start` (locale, Docker), `npm run db:reset` (riapplica le migrazioni), `npm run db:types` (rigenera `types/db.ts`), `npm run db:push` (sul progetto collegato). Guida: `docs/supabase.md`
- Build: `npm run build` (serve `.env.local` con le chiavi Supabase)

## Struttura
- `app/`: pagine (`/` landing, `/dashboard` trainer, `/<slug-trainer>` cliente, `/admin` Marco, `api/`)
- `components/`: componenti React
- `libs/`: client Supabase, Resend, utilità
- `config.ts`: nome app, dominio, email
- `docs/specs/`, `docs/plans/`: design e piani; `docs/riferimenti/`: registrazioni di riferimento per lo stile (non versionate)
- `docs/boilerplate-regole.md`: regole complete del boilerplate
- `docs/DA-CAMBIARE.md`: lista delle modifiche, anche piccole, che Marco vuole fare (si aggiunge man mano, si spunta quando è fatta)
- `docs/video/`: kit del video pubblicitario (brief, copione, storyboard, tecnica, reference, messaggio di avvio): si parte da `docs/video/README.md`
- `docs/chiavi.md`: elenco delle chiavi API e di dove sono usate, senza valori (da aggiornare a ogni chiave nuova)

## Convenzioni
- Interfaccia in italiano. Commit in italiano con prefisso (`feat:`, `fix:`, `docs:`, `chore:`).
- Stile: schede morbide, un solo colore forte (quello del trainer), numeri protagonisti, animazioni fluide, suoni al tocco disattivabili, `prefers-reduced-motion` rispettato (spec, sezione 9).
- Regole del boilerplate (Next.js 15):
  - `await` su `headers()`, `cookies()`, `params` (anche in `generateMetadata`).
  - Client Supabase server-side: `const supabase = await createClient()` da `@/libs/supabase/server`; lato client senza `await`.
  - Tailwind 4: configurazione in CSS (`@theme` in `app/globals.css`), niente `tailwind.config.js`; temi DaisyUI in CSS.
  - Server component di default; `"use client"` solo per interazione e API del browser.
  - Valori variabili da env, mai scritti nel codice.
- Ogni tabella Supabase ha RLS attiva con test che un trainer non vede i dati di un altro.

## Da non fare
- Non committare `.env.local` o chiavi API: le chiavi le inserisce Marco.
- Mai dati reali di clienti verso l'API ufficiale DeepSeek (server in Cina): solo dati finti finché non c'è il fornitore UE.
- Niente diete prescritte dal trainer o dall'assistente: la dieta è solo un PDF del nutrizionista.
- Niente pagamenti online, Stripe, iscrizione libera: gli account trainer li crea Marco.
- Verso l'AI mai email e telefoni dei clienti. I nomi sì (decisione di Marco del 24/10), ma con clienti veri solo con fornitore AI in UE, DPA firmato e informativa che lo dice.
- Niente vocali a Leo con clienti veri finché non c'è il trascrittore UE: la dettatura del browser manda l'audio a Google, solo dati finti.
