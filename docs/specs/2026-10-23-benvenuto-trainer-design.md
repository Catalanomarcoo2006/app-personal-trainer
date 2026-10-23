# Benvenuto del trainer (onboarding): design

**Data:** 2026-10-23 · **Stato:** approvato a voce, da rivedere per iscritto
**Parte da:** `docs/specs/2026-10-21-design.md` (sezioni Trainer, Accesso, Privacy, Stile)
**Riferimento di stile:** `docs/riferimenti/animazione-login.mp4` (login e codice OTP, scelto da Marco il 23/10; estetica e animazioni, non contenuto)

## 1. Obiettivo

La prima volta che il trainer entra (account creato da Marco, arriva dall'email d'invito), un percorso guidato a tutto schermo gli fa: scegliere la password e confermare l'email con un codice, preparare l'app che riceveranno i suoi clienti (marchio), accettare gli accordi sulla privacy, aggiungere il primo cliente, conoscere Leo. È il momento "wow" della demo: il trainer vede nascere la *sua* app mentre la configura.

**Priorità: computer** (decisione di Marco del 23/10). Schermo di riferimento 1280–1440 px; il telefono deve solo funzionare (una colonna), senza rifiniture.

**Riuscito quando:**
- al primo accesso a `/prototipo/trainer` si apre il benvenuto; finito, non ricompare più (anche ricaricando); "Rivedi il benvenuto" in Impostazioni lo riapre;
- il codice via email si comporta come nel riferimento (caselle, scadenza, verifica, fusione nel verde);
- ogni scelta (colore, logo, foto, nome dello studio, tono di Leo) si vede subito nel pannello di sinistra e poi nella dashboard;
- senza accettare gli accordi non si arriva alla dashboard;
- niente tasti neri, tema scuro funzionante, suoni al tocco, `prefers-reduced-motion` rispettato, console pulita.

## 2. Fuori ambito

- Rifiniture per il telefono del trainer (resta una colonna funzionante).
- Autenticazione vera, invio vero di email (codice e invito), registrazione libera: solo dati finti, nessuna chiamata di rete. Nel prodotto: invito di Supabase, password, codice OTP via email di Supabase.
- Testi legali veri di termini e DPA: nel prototipo un riassunto in parole semplici con un testo segnaposto dichiarato ("bozza da far rivedere a un professionista").
- Onboarding del cliente (Task 8 del piano dell'area cliente): resta nel suo piano, dopo.

## 3. Aspetto: due metà

Pagina a tutto schermo, `/prototipo/benvenuto`, fondo neutro con una grande scheda arrotondata divisa in due (come il riferimento).

**Metà sinistra: la vetrina del trainer** (rivista il 23/10 sera). Gradiente caldo nel **colore del trainer** con macchie sfumate (sfumature pure, niente filtro blur: Chrome su Windows lo taglia in linee dritte). Niente intestazione in alto a sinistra e niente Leo. Sopra fluttuano, su due colonne con spazi fissi di 22 px (e si scostano dolcemente dal cursore, come acque che si aprono, al massimo 13 px), schede in vetro con grafiche vere dell'app: "Incassi di ottobre" con le colonne dei 6 mesi, una notifica che cambia ogni 3,5 s, "Agenda di oggi" con la seduta in corso, "Giulia · peso" con grafico e anello dell'obiettivo, "Questa settimana" con i giorni e le sedute, "Scheda inviata a Giulia". In basso: "Tutto il tuo lavoro in un posto" e, grande, "Clienti, schede, agenda e incassi, con il tuo marchio." Dal passo Marchio in poi le schede lasciano il posto al **telefono con l'app del cliente**.

**Metà destra: il passo.** Fondo `card`, asterisco nel colore del trainer, titolo, sottotitolo, campi; in alto la barra a 5 tratti (Accesso · Marchio · Privacy · Primo cliente · Leo) che si riempiono nel colore del trainer, e "Indietro". Cambiando passo i contenuti spariscono sfumando (anche con sfocatura leggera) e i nuovi entrano dal basso, uno dopo l'altro.

**Niente pallina** (decisione di Marco del 23/10 sera: la pallina e Leo che ne esce sono stati tolti).

**La sveglia di Leo** (rivista il 23/10 notte). Dopo la verifica, nella metà destra al posto del titolo, compare la casetta: il video vero `public/prototipo/coach/casa.mp4` (da `IMMAGINI APP/VIDEO CASETTA.mp4`, 960 × 720, fondo portato al bianco esatto e ombre sfumate lontano dai bordi con `IMMAGINI APP/pulisci-casa.py`). La casetta resta ferma e sotto lo spazio è riservato: quando Leo esce (3 s) compare "Ciao Marco, eccomi!" parola per parola, quando si appoggia alla casa (5,2 s) "Sono Leo, il tuo assistente. Ti accompagno nei primi passi: in 2 minuti la tua app è pronta.", quando sorride (8,2 s) il tasto "Iniziamo". I tempi seguono il video (timeupdate). Dopo "Iniziamo" la casa sparisce. Ricaricando dopo la verifica, o con "riduci movimento": immagine ferma `casa-fine.webp` e tutto già visibile.

**Tasti:** nel colore del trainer (`btn-trainer`), grigi e non cliccabili quando sono spenti; mai neri. Suoni del prototipo a ogni tocco, `confirm` a fine passo, `complete` alla verifica e nel finale. Con "riduci movimento": niente voli, ondeggiamenti e coriandoli, solo dissolvenze.

## 4. Il flusso

1. **Accesso.**
   - *Scegli la password.* "Ciao Marco, il tuo account è pronto: scegli una password" (email precompilata e bloccata), password con occhio mostra/nascondi; sotto, tre regole che si spuntano dal vivo (almeno 8 caratteri, una lettera, un numero); "Continua" spento finché non sono tutte spuntate; premuto → "Invio il codice…" con la rotellina.
   - *Controlla la tua email.* Codice di **4 cifre** (come nel riferimento) dalla finta notifica email nella metà sinistra ("Il tuo codice è 48 29"). 4 caselle: quella attiva evidenziata, le cifre entrano con uno scatto, si va avanti da soli, Backspace torna indietro, incolla riempie tutto. "Il codice scade tra 1:00"; a zero "Rimanda il codice". Con le 4 cifre la verifica parte da sola. Verifica, fedele al riferimento: 0,9 s di "Verifico…" con il bordo delle caselle che si scalda e pulsa; poi le cifre sfumano, le caselle scivolano al centro impilandosi un po' storte, resta una casella bianca inclinata che diventa a scatto un quadrato verde, oscilla fino a raddrizzarsi e disegna la spunta; il tasto diventa verde "Email verificata" (a scatto); titolo e testo sfumano e il titolo diventa "Ci sei!". Sbagliato → caselle rosse che tremano e si svuotano, "Codice non corretto, riprova".
   - *Sveglia.* La casetta e i testi che compaiono seguendo il video (sezione 3), poi "Iniziamo".
2. **Il tuo marchio** (si può saltare: "Lo faccio dopo"). Nome dello studio, logo (caricato, oppure le iniziali nel colore), gli 8 colori di Impostazioni, la foto del trainer. Il telefono e la metà sinistra si aggiornano dal vivo.
3. **Privacy e accordi** (obbligatorio). Tre schede in parole semplici: "I dati dei tuoi clienti sono tuoi: sei il titolare del trattamento"; "Noi li custodiamo per te, con un accordo scritto (DPA)"; "Server in Unione Europea, dati sulla salute protetti". "Leggi termini e accordo" apre un foglio con il testo segnaposto. Casella "Ho letto e accetto i termini di servizio e l'accordo sul trattamento dei dati (DPA)"; "Avanti" spento finché non è spuntata, con sotto il perché ("Serve per poter seguire i dati sulla salute dei tuoi clienti"). Il telefono mostra il consenso che vedranno i clienti.
4. **Primo cliente** (si può saltare). Nome ed email, oppure "Prova con un cliente di esempio" (Giulia Bianchi). Compare il link `nomeprodotto.it/marco-rossi` con "Copia" e "Invia invito" (finto: "Invito pronto! Nel prodotto vero parte un'email a …"). Il telefono mostra il benvenuto che riceve il cliente ("Marco Rossi ti ha invitato").
5. **Conosci Leo** (si può saltare). Leo, nella vetrina, si presenta con tre battute (da `LeoPresentazione.tsx`, adattate); il trainer sceglie il tono: amichevole, professionale, motivante. Nel telefono una vignetta di Leo con una frase d'esempio che cambia con il tono.
6. **Finale.** "La tua app è pronta!", Leo saluta (posizione da decidere), coriandoli nel colore del trainer, riepilogo (colore, studio, primo cliente, tono di Leo), "Entra nella tua dashboard" → `/prototipo/trainer` con la macchia d'olio.

## 5. Architettura

**Pagina a sé**, `app/prototipo/benvenuto/page.tsx`, fuori dal layout del trainer: `TrainerFrame` rimpicciolisce tutto su una tela di 1303 px e porta barra laterale e Leo, che qui non servono. `TrainerFrame` controlla all'apertura: se il benvenuto non è fatto, porta a `/prototipo/benvenuto`.

**File** in `components/prototipo/benvenuto/`:
- `Benvenuto.tsx`: regia (passo corrente, avanti/indietro, barra a 5 tratti, due metà su computer, una colonna sotto `lg`);
- `Vetrina.tsx`: metà sinistra (gradiente, schede in vetro, notifiche, telefono);
- `AnteprimaTelefono.tsx`: telefono con una versione ridotta dell'app del cliente (intestazione con logo, saluto, obiettivo, consenso, invito, vignetta di Leo); separato dall'app del cliente vera;
- `passi/Accesso.tsx` contiene anche la sveglia (casetta, frase che si scrive, pannello di inizio);
- `CodiceOtp.tsx`: le 4 caselle e l'animazione della verifica;
- `passi/Accesso.tsx`, `Marchio.tsx`, `Accordi.tsx`, `PrimoCliente.tsx`, `ConosciLeo.tsx`, `Finale.tsx`;
- `Coriandoli.tsx`.

**Dati**, `libs/prototipo/benvenuto.ts`, salvati nel browser (`localStorage`, chiave `benvenuto`), perché lo stato in memoria si azzera ricaricando:
- `type Tono = "amichevole" | "professionale" | "motivante"`
- `type Benvenuto = { fatto: boolean; passo: number; verificato: boolean; studio: string; logo: string | null; accordi: { quando: string } | null; primoCliente: { nome: string; email: string; esempio: boolean } | null; tono: Tono }`
- `useBenvenuto()`, `aggiornaBenvenuto(parte)`, `completaBenvenuto()`, `azzeraBenvenuto()`; storage non disponibile → vale per la visita.
- Logica pura (testabile): `regolePassword(p)`, `nuovoCodice()`, `codiceGiusto(inserito, atteso)`, `emailValida(e)`, `controllaLogo(f)`, `passoDiRipartenza(b)`.
- Colore e foto riusano quello che c'è: `setAccent` (`components/ui/appearance.tsx`) e `setTrainerPhoto` (`libs/prototipo/stato.ts`). Il tono di Leo in Impostazioni legge e scrive `benvenuto.tono`. La password non si salva da nessuna parte.

**Regole:**
- Si riparte dal passo salvato; senza `verificato` si riparte dall'Accesso; il finale si raggiunge solo con `accordi` presente.
- Logo: PNG, JPG, WebP o SVG fino a 5 MB; le immagini raster rimpicciolite nel browser (lato lungo 512 px); file sbagliato → messaggio chiaro, restano le iniziali.
- Nome dello studio vuoto → nome del trainer. Email del cliente: controllo solo della forma; tasto spento se non valida.
- Campi ≥ 16 px sotto `md`, bersagli ≥ 44 px, `100dvh`; codice con `inputMode="numeric"` e `autoComplete="one-time-code"`.

**Nel prodotto vero:** `Benvenuto` diventa colonne di `trainers` (`studio`, `logo`, `accordi_accettati_il`, `tono_assistente`, `benvenuto_fatto`); password e codice passano da Supabase Auth; il primo cliente è una riga di `clients` con il magic link.

## 6. Verifica

- Vitest (`tests/unit/benvenuto.test.ts`): regole della password, codice (giusto, sbagliato, con spazi), email, file del logo, passo di ripartenza, salvataggio con storage rotto.
- Nel browser su computer (1280 e 1440 px): tutti i passi, avanti/indietro/salta; password debole; codice sbagliato, scaduto, incollato; accordi non spuntati; tema scuro, riduci movimento, suoni; ricarica a metà e alla fine; "Rivedi il benvenuto"; console pulita; screenshot a Marco.
- Controllo veloce a 375 px: una colonna, niente sovrapposizioni.
- `npx tsc --noEmit`, `npm test`, build con chiavi finte senza errori.

## 7. Note

- Leo e la casetta sono generati con Gemini: verificare le condizioni d'uso commerciale prima di vendere.
- Piano dell'area cliente: Task 1, Task 4 e il primo accesso del cliente (Task 8) restano in attesa, dopo il benvenuto del trainer.
