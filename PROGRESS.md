# APP PERSONAL TRAINER

> Questo file viene caricato a ogni sessione (import `@PROGRESS.md` nel CLAUDE.md): tienilo sotto le 60 righe. Lo storico vecchio va in `docs/STORICO.md`, che NON viene importato.

**Ultimo aggiornamento:** 2026-10-24

## Obiettivo
App per personal trainer con il marchio del trainer: gestionale da computer (e versione minima da telefono) per il trainer, web app per i clienti con assistente virtuale. Demo "wow" e primo trainer pagante entro 4-6 settimane.

## Stato attuale (Completato)
- Brainstorming, design approvato (`docs/specs/2026-10-21-design.md`), setup con boilerplate ZeroToShip, sito su Vercel.
- Area trainer del prototipo: tutte le sezioni, Leo con AI (presentazione alla prima apertura, identikit dalla "i" con Leo che si siede, luce intermittente sulla home).
- **Leo agisce** (ramo `leo-azioni`, spec `docs/specs/2026-10-24-leo-azioni-design.md`, piano `docs/plans/2026-10-24-leo-azioni.md`): fissa, sposta e cancella sedute e scrive ai clienti col tool calling di DeepSeek; fissa/sposta subito con "Annulla", cancella/messaggio dopo "Conferma"; la chat si fa piccola, l'app va al calendario o ai messaggi e l'azione si vede accadere. Calendario (settimane 0 e 1) e conversazioni nello store condiviso (`libs/prototipo/stato.ts`). 116 test Vitest. **Da unire** a `setup-iniziale` e pubblicare con l'ok di Marco.
- Piano Fase 1: Task 2 (pulizia boilerplate: via Stripe, blog, Crisp, GPT, testimonianze; slug) e Task 5 (logica di dominio in `libs/domain/`) fatti; del Task 6 c'è `resolveRoute` (`libs/auth/routing.ts`), manca il collegamento al middleware. 58 test Vitest.
- Benvenuto del trainer (`/prototipo/benvenuto`, spec `docs/specs/2026-10-23-benvenuto-trainer-design.md`): primo passo finito e approvato da Marco (password, codice di 4 cifre con la verifica del video di riferimento, sveglia di Leo con lo stacco da terra, scritte subito e "Iniziamo" a ~3,7 s); vetrina con le grafiche dell'app che si scostano dal cursore. "Salta per ora" porta alla dashboard; nel prototipo ogni aggiornamento della pagina riparte dal primo passo (`?riprendi` riparte dal passo salvato).

## In corso
- Benvenuto: passi 2-5 fatti (marchio, privacy, primo cliente, conosci Leo); "Conosci Leo" (`passi/ConosciLeo.tsx`, `LeoPiegamenti.tsx`: piegamenti sul bianco, poi Leo piccolo e chat col tono) **da ultimare**, Marco lo riprende più avanti. Finale fatto (`passi/Finale.tsx`, `Coriandoli.tsx`: riepilogo, Leo con "Tutto pronto!", in dashboard le schede cadono come meteoriti (`trainer/Meteora.tsx`)); manca la verifica finale (Task 10).
- Area cliente (in attesa, dopo il benvenuto): spec `docs/specs/2026-10-22-area-cliente-design.md` e piano `docs/plans/2026-10-22-area-cliente.md` (10 task) pronti, **in attesa del via di Marco**; esecuzione consigliata: inline, un task alla volta.

## Da fare (TODO)
- Leo, opzione C: `segna_pagamento` e `aggiungi_lezioni` con lo stesso meccanismo (un'azione, un controllo, un'animazione in `libs/prototipo/leo-azioni.ts`).
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
- Azioni di Leo: tool calling con un solo giro verso l'AI (l'app controlla ed esegue, niente secondo giro: costa ~0,15-0,2 cent a domanda); risposta della rotta in NDJSON (testo + azioni). Ragionamento acceso anche con i tools (verificato il 24/10). Leo del trainer risponde con DeepSeek (`deepseek-flash`, ~0,1 cent a domanda): `app/prototipo/api/leo`, clienti come codici [C1] (mai nomi), senza chiave o se l'AI non risponde usa le risposte fisse.
- Area trainer = una pagina sola (`TrainerApp.tsx`, cambio sezione con `history.pushState`). Nessun tasto nero: `btn-trainer` / `sel-trainer` / `glass` in `globals.css`.
- Animazioni di Leo seduto: ritagliate dal video con ffmpeg + Python (sfondo tolto), WebP animate in `public/prototipo/coach/`, ripartono con un indirizzo blob nuovo.
- Benvenuto: niente asterisco (somigliava al logo di Claude), icona del passo al suo posto; niente macchia d'olio verso la dashboard, schede a meteoriti (scelta di Marco del 24/10). Niente pallina (tolta da Marco); casetta come MP4 vero (960 × 720) su fondo bianco, non con trasparenza: niente righe ai bordi né perdita di qualità (`IMMAGINI APP/pulisci-casa.py`). Niente filtri `blur` CSS sugli aloni (Chrome su Windows li taglia in linee dritte). Sorgenti Gemini in `IMMAGINI APP/` (esclusa da git), nomi in maiuscolo.

## Problemi noti / blocchi
- Licenza ZeroToShip da verificare con Alberto Ravasini prima di vendere.
- Partita IVA da aprire prima del primo incasso.
- Fornitore AI in UE da scegliere prima del primo cliente vero.
- Informativa, DPA e termini da far rivedere a un professionista.
- Nome del prodotto da scegliere.
- Nota nel vault non creata: il brain è stato azzerato il 2026-10-21; aggiungerla quando la nuova struttura è pronta.

## Prossimi passi immediati
- Benvenuto: verifica completa (Task 10 del piano: 1440/1280/375 px, chiaro/scuro, riduci movimento) e ultimare "Conosci Leo"; poi area cliente (Task 1 del suo piano), poi backend.
- Marco: creare il progetto Supabase di sviluppo (UE) in parallelo, per il Task 3 subito dopo.

## Contesto tecnico utile
- Online: https://app-personal-trainer-kappa.vercel.app (progetto Vercel `app-personal-trainer`). Codice su GitHub privato `Catalanomarcoo2006/app-personal-trainer`. Pubblicare: `git push` sul ramo `setup-iniziale`, Vercel pubblica da solo. Chiavi: elenco senza valori in `docs/chiavi.md`.
- Build come su Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`. In locale, senza chiavi Supabase, il middleware lascia passare (niente più errore 500 su `/signin` e simili).
- Riferimenti di stile: `docs/riferimenti/` (registrazioni con ffmpeg, escluse da git); `animazione-login.mp4` è il riferimento del benvenuto.
- Verifiche delle animazioni: Playwright con `channel: "msedge"` (riproduce gli MP4; il pannello del browser non disegna se la finestra non è in vista).

## Changelog
- 2026-10-24 (2): Leo agisce: azioni con controlli (sovrapposizioni, orari 6-22, due settimane), schede in chat con conferma/annulla, viaggio animato (seduta che atterra, vola o lascia il contorno; messaggio che si scrive da solo), memoria degli esiti; prova di 10 frasi con DeepSeek ok.
- 2026-10-24: finale del benvenuto (coriandoli continui, riepilogo modificabile, Leo fermo con "Tutto pronto!", ingresso in dashboard con le schede che cadono come meteoriti, con fischio e impatto); push e deploy su Vercel (commit d4dba3f); sveglia di Leo più veloce (scritte subito, "Iniziamo" a ~3,7 s); icona del passo al posto dell'asterisco.
- 2026-10-23 (3): benvenuto del trainer, primo passo (accesso, codice, sveglia di Leo), vetrina con grafiche dell'app, "Salta per ora"; Tailwind `dark:` segue la classe `.dark`.
