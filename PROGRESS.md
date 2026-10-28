# APP PERSONAL TRAINER

> Questo file viene caricato a ogni sessione (import `@PROGRESS.md` nel CLAUDE.md): tienilo sotto le 60 righe. Lo storico vecchio va in `docs/STORICO.md`, che NON viene importato.

**Ultimo aggiornamento:** 2026-10-26

## Obiettivo
App per personal trainer con il marchio del trainer: gestionale da computer (e versione minima da telefono) per il trainer, web app per i clienti con assistente virtuale. Demo "wow" e primo trainer pagante entro 4-6 settimane.

## Stato attuale (Completato)
- Brainstorming, design approvato (`docs/specs/2026-10-21-design.md`), setup con boilerplate ZeroToShip, sito su Vercel.
- Area trainer del prototipo: tutte le sezioni, Leo con AI (presentazione alla prima apertura, identikit dalla "i" con Leo che si siede, luce intermittente sulla home).
- **Leo agisce e fa tutto** (spec `docs/specs/2026-10-24-leo-azioni-design.md` e `2026-10-25-leo-fa-tutto-design.md`, piani in `docs/plans/`): sedute, messaggi (anche a più clienti, con `{nome}`), soldi (segna pagato, registra, rinnova con pagamento da incassare, sollecito), dati del cliente (misure, obiettivo, note, nuovo cliente con email scritta dal trainer), aspetto e notifiche; legge PDF con testo, CSV e TXT allegati (prima → dopo da confermare). "Conferma tutte", parti non capite segnalate. Dati dei clienti nella forma del database (`libs/dati/`: tipi, sportello con annulla, selettori; controlli in `libs/domain/`): con Supabase cambia solo lo sportello. Online dal 25/10 (unito a `setup-iniziale`), 230 test; revisione finale fatta (5 correzioni, 7 dettagli minori in `docs/DA-CAMBIARE.md`). Dopo: file Excel (.xlsx) letti, dettagli della revisione sistemati e **vocali** (si tocca il microfono nella chat: un tocco inizia, uno finisce; per ora con la dettatura del browser, provati da Marco con la voce vera il 25/10: vanno come voleva; scelta "invia subito / rivedi prima" al primo vocale e nelle Impostazioni; spec e piano `2026-10-25-vocali-leo`).
- Piano Fase 1: Task 2 (pulizia boilerplate: via Stripe, blog, Crisp, GPT, testimonianze; slug) e Task 5 (logica di dominio in `libs/domain/`) fatti; del Task 6 c'è `resolveRoute` (`libs/auth/routing.ts`), manca il collegamento al middleware. 58 test Vitest.
- **Estetica dell'area trainer (26/10)**: tema scuro rifatto (nero pece, vetro con bordo chiaro, colori schiariti, chat col colore del cliente); barra in alto con azioni rapide (Nuova seduta, Scrivi, Pagamento e Nuovo cliente con Leo), ricerca nella barra (Ctrl+K), suoni; "Novità" negli Urgenti; testa di Leo dentro la barra laterale; cambio tema con l'onda del video (`libs/ui/onda.ts`); Clienti che scorrono con avviso del cliente nuovo. 297 test.
- Benvenuto del trainer (`/prototipo/benvenuto`, spec `docs/specs/2026-10-23-benvenuto-trainer-design.md`): primo passo finito e approvato da Marco (password, codice di 4 cifre con la verifica del video di riferimento, sveglia di Leo con lo stacco da terra, scritte subito e "Iniziamo" a ~3,7 s); vetrina con le grafiche dell'app che si scostano dal cursore. "Salta per ora" porta alla dashboard; nel prototipo ogni aggiornamento della pagina riparte dal primo passo (`?riprendi` riparte dal passo salvato).

## In corso (il benvenuto è finito)
- **Benvenuto del trainer completato** (Marco, 25/10): tutti i passi (marchio, privacy, primo cliente, conosci Leo); "Conosci Leo" rifatto il 25/10 (`passi/ConosciLeo.tsx`: Leo in piedi con le schede di quello che fa, capacità a righe, poi scelta del tono). Finale fatto (`passi/Finale.tsx`, `Coriandoli.tsx`: riepilogo, Leo con "Tutto pronto!", in dashboard le schede cadono come meteoriti (`trainer/Meteora.tsx`)).
- Area cliente (è il prossimo lavoro): spec `docs/specs/2026-10-22-area-cliente-design.md` e piano `docs/plans/2026-10-22-area-cliente.md` (10 task) pronti, **in attesa del via di Marco**; esecuzione consigliata: inline, un task alla volta.

## Da fare (TODO)
- Leo: foto e scansioni (serve un modello che vede le immagini), import dei clienti a fine onboarding con inviti (spec sua, serve il backend), trascrittore dei vocali sul server UE (`MediaRecorder` + rotta `api/leo/voce`, variabili `AI_STT_*`), area trainer da telefono.
- Fase 1, con le chiavi Supabase: schema (Task 3), RLS con test (Task 4), `getAccess` e middleware (Task 6), pannello admin (Task 7).
- Poi: aree trainer/cliente su database, assistente, account demo, landing vera (oggi `/` porta al prototipo; la landing è ancora quella in inglese del boilerplate); video con Opus per presentare la piattaforma (da fare quando l'app è pronta, utile anche per la landing).
- Marco: chiavi Supabase (progetto UE) e Resend; email di supporto e dominio del prodotto (`config.ts`).

## Decisioni prese
- Un'unica web app sul boilerplate, non due app né Lovable: un solo progetto, massimo controllo su animazioni.
- Libreria ~100 esercizi base + esercizi del trainer: la demo parte piena.
- Pacchetti a lezioni e a tempo + registro libero dei pagamenti; importi in centesimi, mesi nel fuso `Europe/Rome`.
- Calendario gestito dal trainer; il cliente chiede lo spostamento con un messaggio: semplice e senza conflitti. Avvisi in app + email; push solo dopo, con la versione telefono del trainer.
- Dati sanitari: consenso esplicito, Supabase UE, Marco responsabile del trattamento (DPA).
- Azioni di Leo: tool calling con un solo giro verso l'AI (l'app controlla ed esegue, niente secondo giro); risposta della rotta in NDJSON (testo + azioni). Ragionamento acceso anche con i tools (verificato il 24/10). Leo del trainer risponde con DeepSeek (`deepseek-flash`, ~0,04 cent di dollaro a domanda, misurato il 25/10: 0,04 $ per 107 chiamate, ~5.900 token l'una): `app/prototipo/api/leo`, Leo vede i nomi dei clienti (dal 24/10, niente più codici [C1]: li capisce anche scritti male), mai email e telefoni; senza chiave o se l'AI non risponde usa le risposte fisse.
- Vocali: si toccano (un tocco inizia, uno finisce), testo dal vivo in una casella che cresce, scelta "invia subito / rivedi prima" al primo vocale. Trascrizione con la dettatura del browser (solo dati finti), poi un trascrittore UE con la stessa forma (`Trascrittore`). Con più azioni la chat porta alla prima e "Conferma tutte" sta in fondo.
- Area trainer = una pagina sola (`TrainerApp.tsx`, cambio sezione con `history.pushState`). Nessun tasto nero: `btn-trainer` / `sel-trainer` / `glass` in `globals.css`.
- Animazioni di Leo seduto: ritagliate dal video con ffmpeg + Python (sfondo tolto), WebP animate in `public/prototipo/coach/`, ripartono con un indirizzo blob nuovo.
- Colori (26/10): il tema chiaro resta com'è (pastelli per cliente, piace a Marco; provata e scartata una versione neutra). Tema scuro = stessi colori schiariti su nero pece con vetro: sul nero un colore a metà sembra sporco. Barra in alto senza effetto "Apple" (lineetta/elastico provati e tolti: non coerenti). Macchia tonda resta per marchio e link di Leo, l'onda solo per il cambio tema.
- Benvenuto: niente asterisco (somigliava al logo di Claude), icona del passo al suo posto; niente macchia d'olio verso la dashboard, schede a meteoriti (scelta di Marco del 24/10). Niente pallina (tolta da Marco); casetta come MP4 vero (960 × 720) su fondo bianco, non con trasparenza: niente righe ai bordi né perdita di qualità (`IMMAGINI APP/pulisci-casa.py`). Niente filtri `blur` CSS sugli aloni (Chrome su Windows li taglia in linee dritte). Sorgenti Gemini in `IMMAGINI APP/` (esclusa da git), nomi in maiuscolo.

## Problemi noti / blocchi
- Licenza ZeroToShip da verificare con Alberto Ravasini prima di vendere; partita IVA da aprire prima del primo incasso.
- Fornitore AI in UE da scegliere prima del primo cliente vero: strade possibili DeepSeek ospitato in UE da un provider europeo (modello aperto: stesso Leo, dati in UE; verificare versione, DPA e tool calling), Mistral, o i grandi modelli su server UE. Cambiano solo le variabili AI_*.
- Informativa, DPA e termini da far rivedere a un professionista; l'informativa deve dire che l'assistente (fornitore UE) tratta nomi e dati dei clienti. Anche la voce dei vocali: **niente vocali con clienti veri finché non c'è il trascrittore UE** (la dettatura del browser manda l'audio a Google).

## Prossimi passi immediati (da qui si riparte)
1. Area cliente: in corso il brainstorming dell'estetica da telefono (27/10). Scelte di Marco: estetica premium e coerente col PC; barra in basso = pillola `glass-3d` con goccia, 4 voci Home · Allenamento · Progressi · Messaggi (Profilo dalla foto in alto); tasto principale a colore pieno (`btn-trainer`), secondari in vetro; home come il riferimento `docs/riferimenti/cliente-home-mobile.png` ma senza ultimo messaggio e con il nostro Leo affacciato dalla scheda "Chiedi a Leo". Modello da telefono "non male": https://claude.ai/artifact/HRTkmKRdBiY2y1Es2xLT3g. Da decidere: intestazione quando si scorre, poi fogli, campi, schermate; poi spec estetica, aggiornare piano (vecchio: usa `stato.ts`, non `libs/dati/`; Leo ora in `trainer/leo/`). Font vero dell'app: Inter.
   Nome del prodotto (27/10): **Spotter** provvisorio (Marco, 27/10; dominio e marchio da controllare, si può ancora cambiare) (piace a Marco; scartati Vetta, Grinta, Hey Leo, Fulcro, Forge e simili). Da controllare dominio e marchio. Logo provvisorio (da rivedere col nome definitivo), scelto da Marco: Leo dentro anello di avanzamento arancione, vetro su salvia (`public/brand/logo-leo-anello.svg`, vettoriale; prove in https://claude.ai/artifact/JnpHq7uPDrLLRMF5Ykgj5a). Frecce provate con Gemini: scartate (sembrano borsa/upload).
2. Poi backend: Marco crea il progetto Supabase UE → schema, RLS con test, accessi, admin → aree su database → assistente, account demo → landing vera → area trainer da telefono.
3. Prima del primo cliente vero: ricerca e scelta fornitore AI + trascrizione in UE (la fa Claude se Marco la chiede), DPA, informativa, partita IVA, licenza ZeroToShip, nome del prodotto, chiavi Resend, dominio.
4. Estetica che resta: Leo che si siede al buio (chiazze del pavimento; una pulizia dei fotogrammi rovinava il chiaro, tornati agli originali), fluidità, area trainer da telefono. Voci in `docs/DA-CAMBIARE.md`.

## Contesto tecnico utile
- Online: https://app-personal-trainer-kappa.vercel.app (progetto Vercel `app-personal-trainer`). Codice su GitHub privato `Catalanomarcoo2006/app-personal-trainer`. Pubblicare: `git push` sul ramo `setup-iniziale`, Vercel pubblica da solo. Chiavi: elenco senza valori in `docs/chiavi.md`.
- Build come su Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`. In locale, senza chiavi Supabase, il middleware lascia passare (niente più errore 500 su `/signin` e simili).
- Riferimenti di stile: `docs/riferimenti/` (registrazioni con ffmpeg, escluse da git); `animazione-login.mp4` è il riferimento del benvenuto.
- Verifiche delle animazioni: Playwright con `channel: "msedge"` (riproduce gli MP4; il pannello del browser non disegna se la finestra non è in vista).

## Changelog
- 2026-10-26: cambio tema con l'onda del video; testa di Leo nella barra laterale; tema scuro rifatto (nero pece, vetro, colori schiariti, chat colorate); barra in alto con azioni rapide, ricerca nella barra e suoni, novità negli Urgenti; Clienti con scorrimento e avviso del cliente nuovo; provati e scartati: colori neutri nel chiaro, effetto "Apple" della barra, pulizia di Leo seduto.
