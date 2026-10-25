# APP PERSONAL TRAINER

> Questo file viene caricato a ogni sessione (import `@PROGRESS.md` nel CLAUDE.md): tienilo sotto le 60 righe. Lo storico vecchio va in `docs/STORICO.md`, che NON viene importato.

**Ultimo aggiornamento:** 2026-10-25

## Obiettivo
App per personal trainer con il marchio del trainer: gestionale da computer (e versione minima da telefono) per il trainer, web app per i clienti con assistente virtuale. Demo "wow" e primo trainer pagante entro 4-6 settimane.

## Stato attuale (Completato)
- Brainstorming, design approvato (`docs/specs/2026-10-21-design.md`), setup con boilerplate ZeroToShip, sito su Vercel.
- Area trainer del prototipo: tutte le sezioni, Leo con AI (presentazione alla prima apertura, identikit dalla "i" con Leo che si siede, luce intermittente sulla home).
- **Leo agisce e fa tutto** (spec `docs/specs/2026-10-24-leo-azioni-design.md` e `2026-10-25-leo-fa-tutto-design.md`, piani in `docs/plans/`): sedute, messaggi (anche a più clienti, con `{nome}`), soldi (segna pagato, registra, rinnova con pagamento da incassare, sollecito), dati del cliente (misure, obiettivo, note, nuovo cliente con email scritta dal trainer), aspetto e notifiche; legge PDF con testo, CSV e TXT allegati (prima → dopo da confermare). "Conferma tutte", parti non capite segnalate. Dati dei clienti nella forma del database (`libs/dati/`: tipi, sportello con annulla, selettori; controlli in `libs/domain/`): con Supabase cambia solo lo sportello. Ramo `leo-fa-tutto`, 221 test.
- Piano Fase 1: Task 2 (pulizia boilerplate: via Stripe, blog, Crisp, GPT, testimonianze; slug) e Task 5 (logica di dominio in `libs/domain/`) fatti; del Task 6 c'è `resolveRoute` (`libs/auth/routing.ts`), manca il collegamento al middleware. 58 test Vitest.
- Benvenuto del trainer (`/prototipo/benvenuto`, spec `docs/specs/2026-10-23-benvenuto-trainer-design.md`): primo passo finito e approvato da Marco (password, codice di 4 cifre con la verifica del video di riferimento, sveglia di Leo con lo stacco da terra, scritte subito e "Iniziamo" a ~3,7 s); vetrina con le grafiche dell'app che si scostano dal cursore. "Salta per ora" porta alla dashboard; nel prototipo ogni aggiornamento della pagina riparte dal primo passo (`?riprendi` riparte dal passo salvato).

## In corso
- Benvenuto: passi 2-5 fatti (marchio, privacy, primo cliente, conosci Leo); "Conosci Leo" (`passi/ConosciLeo.tsx`, `LeoPiegamenti.tsx`: piegamenti sul bianco, poi Leo piccolo e chat col tono) **da ultimare**, Marco lo riprende più avanti. Finale fatto (`passi/Finale.tsx`, `Coriandoli.tsx`: riepilogo, Leo con "Tutto pronto!", in dashboard le schede cadono come meteoriti (`trainer/Meteora.tsx`)); manca la verifica finale (Task 10).
- Area cliente (in attesa, dopo il benvenuto): spec `docs/specs/2026-10-22-area-cliente-design.md` e piano `docs/plans/2026-10-22-area-cliente.md` (10 task) pronti, **in attesa del via di Marco**; esecuzione consigliata: inline, un task alla volta.

## Da fare (TODO)
- Leo: foto e scansioni (serve un modello che vede le immagini), import dei clienti a fine onboarding con inviti (spec sua, serve il backend), area trainer da telefono.
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
- Azioni di Leo: tool calling con un solo giro verso l'AI (l'app controlla ed esegue, niente secondo giro); risposta della rotta in NDJSON (testo + azioni). Ragionamento acceso anche con i tools (verificato il 24/10). Leo del trainer risponde con DeepSeek (`deepseek-flash`, ~0,04 cent di dollaro a domanda, misurato il 25/10: 0,04 $ per 107 chiamate, ~5.900 token l'una): `app/prototipo/api/leo`, Leo vede i nomi dei clienti (dal 24/10, niente più codici [C1]: li capisce anche scritti male), mai email e telefoni; senza chiave o se l'AI non risponde usa le risposte fisse.
- Area trainer = una pagina sola (`TrainerApp.tsx`, cambio sezione con `history.pushState`). Nessun tasto nero: `btn-trainer` / `sel-trainer` / `glass` in `globals.css`.
- Animazioni di Leo seduto: ritagliate dal video con ffmpeg + Python (sfondo tolto), WebP animate in `public/prototipo/coach/`, ripartono con un indirizzo blob nuovo.
- Benvenuto: niente asterisco (somigliava al logo di Claude), icona del passo al suo posto; niente macchia d'olio verso la dashboard, schede a meteoriti (scelta di Marco del 24/10). Niente pallina (tolta da Marco); casetta come MP4 vero (960 × 720) su fondo bianco, non con trasparenza: niente righe ai bordi né perdita di qualità (`IMMAGINI APP/pulisci-casa.py`). Niente filtri `blur` CSS sugli aloni (Chrome su Windows li taglia in linee dritte). Sorgenti Gemini in `IMMAGINI APP/` (esclusa da git), nomi in maiuscolo.

## Problemi noti / blocchi
- Licenza ZeroToShip da verificare con Alberto Ravasini prima di vendere.
- Partita IVA da aprire prima del primo incasso.
- Fornitore AI in UE da scegliere prima del primo cliente vero: strade possibili DeepSeek ospitato in UE da un provider europeo (modello aperto: stesso Leo, dati in UE; verificare versione, DPA e tool calling), Mistral, o i grandi modelli su server UE. Cambiano solo le variabili AI_*.
- Informativa, DPA e termini da far rivedere a un professionista; l'informativa deve dire che l'assistente (fornitore UE) tratta nomi e dati dei clienti.
- Nome del prodotto da scegliere.
- Nota nel vault non creata: il brain è stato azzerato il 2026-10-21; aggiungerla quando la nuova struttura è pronta.

## Prossimi passi immediati
- Marco prova "Leo fa tutto" (blocchi 2-5 sul ramo `leo-fa-tutto`, non ancora online) e dà l'ok al push; poi benvenuto: verifica completa (Task 10) e ultimare "Conosci Leo"; poi area cliente, poi backend.
- Marco: creare il progetto Supabase di sviluppo (UE) in parallelo, per il Task 3 subito dopo.

## Contesto tecnico utile
- Online: https://app-personal-trainer-kappa.vercel.app (progetto Vercel `app-personal-trainer`). Codice su GitHub privato `Catalanomarcoo2006/app-personal-trainer`. Pubblicare: `git push` sul ramo `setup-iniziale`, Vercel pubblica da solo. Chiavi: elenco senza valori in `docs/chiavi.md`.
- Build come su Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`. In locale, senza chiavi Supabase, il middleware lascia passare (niente più errore 500 su `/signin` e simili).
- Riferimenti di stile: `docs/riferimenti/` (registrazioni con ffmpeg, escluse da git); `animazione-login.mp4` è il riferimento del benvenuto.
- Verifiche delle animazioni: Playwright con `channel: "msedge"` (riproduce gli MP4; il pannello del browser non disegna se la finestra non è in vista).

## Changelog
- 2026-10-25: Leo fa tutto (soldi, dati dei clienti, file allegati, aspetto e notifiche, conferma tutte, messaggi a più clienti); dati dei clienti condivisi tra le pagine ("Segna pagato" e "Sollecita" veri, "Da incassare" apre l'elenco); costo misurato di Leo ~0,04 cent di dollaro a domanda.
- 2026-10-24 (3): animazioni di Leo nel calendario più lente e visibili: la seduta cancellata diventa rossa, trema e si spezza in 6 pezzi; la seduta nuova compare verde con alone e sfuma nel suo colore; Leo vede i nomi dei clienti (via i codici [C1], capisce anche nomi scritti male), mai email e telefoni; regole, spec e testi dell'app aggiornati. Chat di Leo: campo che si accende mentre scrivi, messaggio che vola su all'invio.
