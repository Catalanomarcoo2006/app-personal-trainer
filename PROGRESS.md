# APP PERSONAL TRAINER

> Questo file viene caricato a ogni sessione (import `@PROGRESS.md` nel CLAUDE.md): tienilo sotto le 60 righe. Lo storico vecchio va in `docs/STORICO.md`, che NON viene importato.

**Ultimo aggiornamento:** 2026-10-23

## Obiettivo
App per personal trainer con il marchio del trainer: gestionale da computer (e versione minima da telefono) per il trainer, web app per i clienti con assistente virtuale. Demo "wow" e primo trainer pagante entro 4-6 settimane.

## Stato attuale (Completato)
- Brainstorming, design approvato (`docs/specs/2026-10-21-design.md`), setup con boilerplate ZeroToShip, sito su Vercel.
- Area trainer del prototipo: tutte le sezioni, Leo con AI (presentazione alla prima apertura, identikit dalla "i" con Leo che si siede, luce intermittente sulla home).
- Piano Fase 1: Task 2 (pulizia boilerplate: via Stripe, blog, Crisp, GPT, testimonianze; slug) e Task 5 (logica di dominio in `libs/domain/`) fatti; del Task 6 c'è `resolveRoute` (`libs/auth/routing.ts`), manca il collegamento al middleware. 43 test Vitest.

## In corso
- Area cliente: spec `docs/specs/2026-10-22-area-cliente-design.md` e piano `docs/plans/2026-10-22-area-cliente.md` (10 task) pronti, **in attesa del via di Marco**; esecuzione consigliata: inline, un task alla volta.

## Da fare (TODO)
- Fase 1, con le chiavi Supabase: schema (Task 3), RLS con test (Task 4), `getAccess` e middleware (Task 6), pannello admin (Task 7).
- Poi: aree trainer/cliente su database, assistente, account demo, landing vera (oggi `/` porta al prototipo; la landing è ancora quella in inglese del boilerplate).
- Marco: chiavi Supabase (progetto UE) e Resend; email di supporto e dominio del prodotto (`config.ts`).

## Decisioni prese
- Un'unica web app sul boilerplate, non due app né Lovable: un solo progetto, massimo controllo su animazioni.
- Libreria ~100 esercizi base + esercizi del trainer: la demo parte piena.
- Pacchetti a lezioni e a tempo + registro libero dei pagamenti; importi in centesimi, mesi nel fuso `Europe/Rome`.
- Calendario gestito dal trainer; il cliente chiede lo spostamento con un messaggio: semplice e senza conflitti.
- Avvisi in app + email; push solo dopo, insieme alla versione telefono completa del trainer.
- Dati sanitari: consenso esplicito, Supabase UE, Marco responsabile del trattamento (DPA).
- Leo del trainer risponde con DeepSeek (`deepseek-flash`, ~0,1 cent a domanda): `app/prototipo/api/leo`, clienti come codici [C1] (mai nomi), senza chiave o se l'AI non risponde usa le risposte fisse.
- Area trainer = una pagina sola (`TrainerApp.tsx`, cambio sezione con `history.pushState`). Nessun tasto nero: `btn-trainer` / `sel-trainer` / `glass` in `globals.css`.
- Animazioni di Leo seduto: ritagliate dal video con ffmpeg + Python (sfondo tolto), WebP animate in `public/prototipo/coach/`, ripartono con un indirizzo blob nuovo.

## Problemi noti / blocchi
- Licenza ZeroToShip da verificare con Alberto Ravasini prima di vendere.
- Partita IVA da aprire prima del primo incasso.
- Fornitore AI in UE da scegliere prima del primo cliente vero.
- Informativa, DPA e termini da far rivedere a un professionista.
- Nome del prodotto da scegliere.
- Nota nel vault non creata: il brain è stato azzerato il 2026-10-21; aggiungerla quando la nuova struttura è pronta.

## Prossimi passi immediati
- Chiedere a Marco il via per il piano dell'area cliente e partire dal Task 1 (stato condiviso).
- Marco: creare il progetto Supabase di sviluppo (UE) per il Task 3.

## Contesto tecnico utile
- Online: https://app-personal-trainer-kappa.vercel.app (progetto Vercel `app-personal-trainer`). Codice su GitHub privato `Catalanomarcoo2006/app-personal-trainer`. Pubblicare: `git push` sul ramo `setup-iniziale`, Vercel pubblica da solo. Chiavi: elenco senza valori in `docs/chiavi.md`.
- Build come su Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`. In locale, senza chiavi Supabase, il middleware lascia passare (niente più errore 500 su `/signin` e simili).
- Riferimenti di stile: `docs/riferimenti/` (registrazioni con ffmpeg, escluse da git).

## Changelog
- 2026-10-23 (2): Leo si presenta alla prima apertura; identikit dalla "i" con Leo che si siede; luce intermittente su Leo in home; revisione del sito (prova di tutti i pulsanti, plurali, 404 ed errore in italiano, middleware senza chiavi); pulizia del boilerplate, slug, logica di dominio e smistamento per ruolo con test.
- 2026-10-23: pop a ogni clic con tonalità per azione; Leo più luminoso e visibile in tutte le sezioni; Leo accorda il genere; revisione del sito; push su GitHub.
- 2026-10-22: Leo con AI DeepSeek (codici al posto dei nomi, risposte di riserva); macchia d'olio; spec e piano dell'area cliente; Vitest; sito su Vercel; foto del trainer modificabile.
- 2026-10-22: navigazione istantanea, agenda e calendario in lastre di vetro, ricerca (Ctrl+K) e avvisi funzionanti.
- 2026-10-21: progetto avviato con /start (brainstorming, spec, setup con boilerplate, piano).
