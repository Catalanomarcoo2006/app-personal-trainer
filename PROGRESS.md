# APP PERSONAL TRAINER

> Questo file viene caricato a ogni sessione (import `@PROGRESS.md` nel CLAUDE.md): tienilo sotto le 60 righe. Lo storico vecchio va in `docs/STORICO.md`, che NON viene importato.

**Ultimo aggiornamento:** 2026-10-23

## Obiettivo
App per personal trainer con il marchio del trainer: gestionale da computer (e versione minima da telefono) per il trainer, web app per i clienti con assistente virtuale. Demo "wow" e primo trainer pagante entro 4-6 settimane.

## Stato attuale (Completato)
- Brainstorming chiuso, stile fissato su riferimenti Instagram (bozzetto vecchio scartato).
- Design approvato: `docs/specs/2026-10-21-design.md`
- Setup: cartella, git (ramo `setup-iniziale`), boilerplate ZeroToShip applicato, `npm install` fatto, build ok con chiavi finte, CLAUDE.md, PROGRESS.md, gruppo sidebar "🏋️ APP PERSONAL TRAINER".

## In corso
- Area trainer del prototipo quasi completa (Leo con AI DeepSeek anche online, suoni per azione, macchia d'olio).
- Area cliente: spec `docs/specs/2026-10-22-area-cliente-design.md` e piano `docs/plans/2026-10-22-area-cliente.md` (10 task) pronti, **in attesa del via di Marco**; esecuzione consigliata: inline, un task alla volta.
- Piano Fase 1 (fondamenta): `docs/plans/2026-10-21-piano-v1.md` (Vitest già installato).

## Da fare (TODO)
- Prototipo visivo di 2 schermate (Oggi del trainer, allenamento del cliente) da approvare.
- Pulizia boilerplate (via Stripe, blog, Crisp, gpt.ts), database con RLS, aree trainer/cliente/admin, assistente, account demo, landing.
- Marco: chiavi Supabase (progetto UE) e Resend (la chiave DeepSeek è già in `.env.local`).

## Decisioni prese
- Un'unica web app sul boilerplate, non due app né Lovable: un solo progetto, massimo controllo su animazioni.
- Libreria ~100 esercizi base + esercizi del trainer: la demo parte piena.
- Pacchetti a lezioni e a tempo + registro libero dei pagamenti.
- Calendario gestito dal trainer; il cliente chiede lo spostamento con un messaggio: semplice e senza conflitti.
- Avvisi in app + email; push solo dopo, insieme alla versione telefono completa del trainer.
- Assistente DeepSeek: costo trascurabile (~0,0007 $ a domanda), limite solo di sicurezza (300/mese).
- Dati sanitari: consenso esplicito, Supabase UE, Marco responsabile del trattamento (DPA).
- Leo del trainer risponde con DeepSeek (`deepseek-flash`, ragionamento basso, ~0,1 cent a domanda): servizio `app/prototipo/api/leo`, clienti mandati come codici [C1] (mai nomi), senza chiave o se l'AI non risponde usa le risposte fisse.
- Area trainer = una pagina sola (`app/prototipo/trainer/[[...sezione]]`, `TrainerApp.tsx`): il cambio sezione usa `history.pushState` (`nav.ts`), niente server, ~100 ms in sviluppo invece di ~1 s. Nessun tasto nero: `btn-trainer` / `sel-trainer` / `glass` in `globals.css`.

## Problemi noti / blocchi
- Licenza ZeroToShip da verificare con Alberto Ravasini prima di vendere.
- Partita IVA da aprire prima del primo incasso.
- Fornitore AI in UE da scegliere prima del primo cliente vero.
- Informativa, DPA e termini da far rivedere a un professionista.
- Nome del prodotto da scegliere.
- Nota nel vault non creata: il brain è stato azzerato il 2026-10-21; aggiungerla quando la nuova struttura è pronta.

## Prossimi passi immediati
- Chiedere a Marco il via per il piano dell'area cliente e partire dal Task 1 (stato condiviso).
- Chiavi API: elenco senza valori in `docs/chiavi.md`, da aggiornare a ogni chiave nuova.
- Marco: creare il progetto Supabase di sviluppo (UE) prima del Task 3.

## Contesto tecnico utile
- Online: https://app-personal-trainer-kappa.vercel.app (progetto Vercel `app-personal-trainer`, account catalanomarcoo2006). Codice su GitHub privato `Catalanomarcoo2006/app-personal-trainer`. Pubblicare: basta `git push` sul ramo `setup-iniziale`, Vercel è collegato a GitHub e pubblica da solo (il `vercel deploy` a mano ora risponde "Not authorized"). Online Leo usa le risposte fisse: la chiave AI non è su Vercel.
- Build senza chiavi: fallisce su `/tos` (Supabase richiede URL e chiave). Per una verifica: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.
- Riferimenti di stile: `docs/riferimenti/` (registrazioni con ffmpeg, escluse da git).

## Changelog
- 2026-10-23: pop a ogni clic con tonalità per azione (cambio sezione, apertura, chiusura); Leo più luminoso e visibile in tutte le sezioni; Leo accorda il genere; revisione del sito con rifiniture; push su GitHub.
- 2026-10-22: Leo con AI DeepSeek (codici al posto dei nomi, risposte di riserva); macchia d'olio dai link di Leo; animazioni della home a ogni ritorno; spec e piano dell'area cliente; Vitest.
- 2026-10-22: sito pubblicato su Vercel; foto profilo del trainer modificabile.
- 2026-10-22: navigazione istantanea, home senza scorrimento, agenda e calendario senza griglia oraria (giorni in lastre di vetro), ricerca (Ctrl+K) e avvisi funzionanti, via i tasti morti e i tasti neri.
- 2026-10-21: progetto avviato con /start (brainstorming, spec, setup con boilerplate, piano).
