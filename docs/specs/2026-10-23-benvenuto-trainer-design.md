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

**Metà sinistra: la vetrina del trainer.** Gradiente caldo nel **colore del trainer** con macchie sfumate che si muovono piano. Sopra fluttuano schede in vetro della sua app, sfalsate e con un leggero ondeggiare: "Incassi del mese" con numero e linea che cresce, un cliente con l'anello di avanzamento, "Prossima seduta", e una notifica che cambia da sola ogni pochi secondi ("Giulia ha completato il Giorno A", "Luca ha rinnovato il pacchetto", …). In basso una frase grande ("L'app dei tuoi clienti, con il tuo marchio."). Dal passo Marchio in poi compare anche il **telefono con l'app del cliente**, che cambia a ogni passo. Cambiando colore si ricolora tutta la metà (gradiente, schede, telefono) con la macchia d'olio.

**Metà destra: il passo.** Fondo `card`, asterisco nel colore del trainer, titolo, sottotitolo, campi; in alto la barra a 5 tratti (Accesso · Marchio · Privacy · Primo cliente · Leo) che si riempiono nel colore del trainer, e "Indietro". Cambiando passo i contenuti spariscono sfumando (anche con sfocatura leggera) e i nuovi entrano dal basso, uno dopo l'altro.

**La pallina di Leo, la mascotte.** Una sfera lucida con la faccina (`public/prototipo/coach/pallina.webp`, sorgente in `IMMAGINI APP/`), colorata in codice nel colore del trainer, con un alone luminoso: come la sfera del riferimento fluttua e gira piano intorno alle schede della metà sinistra e **vola** sopra il modulo quando serve (codice, accordi), con una pillola nel colore del trainer ("Inserisci il codice", "Leggi con calma"); saltello quando qualcosa riesce, si scuote su un errore; poi torna al suo posto. Un solo elemento con `layoutId`, così il volo è continuo.

**Leo esce dalla pallina** (decisione di Marco del 23/10). Dopo la verifica la pallina va al centro della metà sinistra e parte l'animazione `public/prototipo/coach/esce.webp` (circa 3,5 s, WebP animata con trasparenza, ricavata da `IMMAGINI APP/LEO ENTRA NELLA PALLINA.mp4` girato al contrario e senza sfondo): scintille, lampo con scie di luce, Leo appare luminoso, prende colore, la pallina sale sulla sua mano aperta. Nell'animazione la pallina è bianca: all'ultimo fotogramma si passa con una dissolvenza breve all'immagine ferma di Leo (`coach/con-pallina.webp`, da `LEO CON PALLA IN MANO.jpg`) con sopra la pallina colorata. Da lì Leo resta in piedi nella vetrina con la pallina in mano fino al finale; la pallina si illumina quando Leo parla o un passo è completato. Con "riduci movimento": niente animazione, dissolvenza diretta sull'immagine ferma.

**Tasti:** nel colore del trainer (`btn-trainer`), grigi e non cliccabili quando sono spenti; mai neri. Suoni del prototipo a ogni tocco, `confirm` a fine passo, `complete` alla verifica e nel finale. Con "riduci movimento": niente voli, ondeggiamenti e coriandoli, solo dissolvenze.

## 4. Il flusso

1. **Accesso.**
   - *Scegli la password.* "Ciao Marco, il tuo account è pronto: scegli una password" (email precompilata e bloccata), password con occhio mostra/nascondi; sotto, tre regole che si spuntano dal vivo (almeno 8 caratteri, una lettera, un numero); "Continua" spento finché non sono tutte spuntate; premuto → "Invio il codice…" con la rotellina.
   - *Controlla la tua email.* "Ti abbiamo mandato un codice di 6 cifre a marco.rossi@esempio.it". Nel prototipo il codice arriva da una **finta notifica email** che scivola nella metà sinistra ("Nuova email · Il tuo codice è 482 915"), codice casuale. 6 caselle: quella attiva evidenziata, le cifre entrano con uno scatto, si va avanti da soli, Backspace torna indietro, incolla riempie tutto, solo cifre. "Il codice scade tra 1:00" che scende; a zero "Rimanda il codice" (nuovo codice e nuova notifica). Tasto spento finché le caselle non sono piene; con le 6 cifre la verifica parte da sola ("Verifico…"). Codice sbagliato → le caselle tremano in rosso, Leo scuote la testa, "Codice non corretto, riprova", caselle svuotate. Codice giusto → **le caselle si fondono in un unico quadrato verde con la spunta**, il tasto diventa verde "✓ Email verificata", il resto sfuma.
   - *Saluto.* Leo esce dalla pallina (sezione 3) e saluta: "Benvenuto, Marco! In 2 minuti prepariamo l'app dei tuoi clienti." → "Iniziamo".
2. **Il tuo marchio** (si può saltare: "Lo faccio dopo"). Nome dello studio, logo (caricato, oppure le iniziali nel colore), gli 8 colori di Impostazioni, la foto del trainer. Il telefono e la metà sinistra si aggiornano dal vivo.
3. **Privacy e accordi** (obbligatorio). Tre schede in parole semplici: "I dati dei tuoi clienti sono tuoi: sei il titolare del trattamento"; "Noi li custodiamo per te, con un accordo scritto (DPA)"; "Server in Unione Europea, dati sulla salute protetti". "Leggi termini e accordo" apre un foglio con il testo segnaposto. Casella "Ho letto e accetto i termini di servizio e l'accordo sul trattamento dei dati (DPA)"; "Avanti" spento finché non è spuntata, con sotto il perché ("Serve per poter seguire i dati sulla salute dei tuoi clienti"). Il telefono mostra il consenso che vedranno i clienti.
4. **Primo cliente** (si può saltare). Nome ed email, oppure "Prova con un cliente di esempio" (Giulia Bianchi). Compare il link `nomeprodotto.it/marco-rossi` con "Copia" e "Invia invito" (finto: "Invito pronto! Nel prodotto vero parte un'email a …"). Il telefono mostra il benvenuto che riceve il cliente ("Marco Rossi ti ha invitato").
5. **Conosci Leo** (si può saltare). Leo, nella vetrina, si presenta con tre battute (da `LeoPresentazione.tsx`, adattate); il trainer sceglie il tono: amichevole, professionale, motivante. Nel telefono una vignetta di Leo con una frase d'esempio che cambia con il tono.
6. **Finale.** "La tua app è pronta!", Leo saluta con la pallina in mano, coriandoli nel colore del trainer, riepilogo (colore, studio, primo cliente, tono di Leo), "Entra nella tua dashboard" → `/prototipo/trainer` con la macchia d'olio.

## 5. Architettura

**Pagina a sé**, `app/prototipo/benvenuto/page.tsx`, fuori dal layout del trainer: `TrainerFrame` rimpicciolisce tutto su una tela di 1303 px e porta barra laterale e Leo, che qui non servono. `TrainerFrame` controlla all'apertura: se il benvenuto non è fatto, porta a `/prototipo/benvenuto`.

**File** in `components/prototipo/benvenuto/`:
- `Benvenuto.tsx`: regia (passo corrente, avanti/indietro, barra a 5 tratti, due metà su computer, una colonna sotto `lg`);
- `Vetrina.tsx`: metà sinistra (gradiente, schede in vetro, notifiche, telefono);
- `AnteprimaTelefono.tsx`: telefono con una versione ridotta dell'app del cliente (intestazione con logo, saluto, obiettivo, consenso, invito, vignetta di Leo); separato dall'app del cliente vera;
- `Pallina.tsx`: la pallina colorata, posizione (vetrina o modulo), pillola, umore (`calmo`, `contento`, `no`);
- `LeoEsce.tsx`: animazione di Leo che esce dalla pallina e immagine ferma con la pallina in mano;
- `CodiceOtp.tsx`: le 6 caselle con scadenza, verifica e fusione nel verde;
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

- Leo e la pallina sono generati con Gemini: verificare le condizioni d'uso commerciale prima di vendere.
- Piano dell'area cliente: Task 1, Task 4 e il primo accesso del cliente (Task 8) restano in attesa, dopo il benvenuto del trainer.
