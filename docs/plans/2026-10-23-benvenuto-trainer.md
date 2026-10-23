# Benvenuto del trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Il percorso di primo accesso del trainer (`/prototipo/benvenuto`): password e codice via email, marchio, accordi, primo cliente, Leo, finale; due metà con la vetrina nel colore del trainer e la pallina di Leo.

**Architecture:** Pagina a sé fuori da `TrainerFrame`. Logica pura e salvataggio in `libs/prototipo/benvenuto.ts` (testati con Vitest), componenti in `components/prototipo/benvenuto/`, un file per passo. Colore e foto riusano `setAccent` e `setTrainerPhoto`; il "fatto" sta in `localStorage`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind 4, Motion (`motion/react`), lucide-react, Vitest; ffmpeg + Python (Pillow, numpy) per preparare le animazioni, fuori dal repo.

**Spec:** `docs/specs/2026-10-23-benvenuto-trainer-design.md` · riferimento di stile `docs/riferimenti/animazione-login.mp4`

## Global Constraints

- Priorità computer: verifiche a 1280 e 1440 px; sotto `lg` una colonna che funziona, senza rifiniture.
- Interfaccia e commenti in italiano; commit in italiano con prefisso (`feat:`, `fix:`, `docs:`, `chore:`).
- Niente tasti neri: azione principale `btn-trainer`, voce scelta `sel-trainer`, superfici `panel` / `glass` (`app/globals.css`); colori solo dai token (`--color-*`, `var(--trainer)`); tasti spenti grigi (`bg-soft text-muted`, `cursor-not-allowed`).
- Animazioni con `motion/react`; ogni movimento continuo (fluttuare, girare, ondeggiare, coriandoli, animazione di Leo) spento con `useReducedMotion()`: restano le dissolvenze.
- Suoni con `playSound` (`libs/ui/sound.ts`): `tap` ai tocchi, `confirm` a fine passo, `complete` alla verifica del codice e nel finale.
- Solo dati finti, nessuna chiamata di rete, nessuna email vera; la password non si salva da nessuna parte.
- Campi: testo ≥ 16 px sotto `md`, bersagli ≥ 44 px, `100dvh`.
- Trainer della demo: Marco Rossi, `marco.rossi@esempio.it`, link `nomeprodotto.it/` + `slugify(trainer.name)` (`libs/slug.ts`).
- Sorgenti di immagini e video in `IMMAGINI APP/` (esclusa da git); file usati dall'app in `public/prototipo/coach/`.
- Verifica di base di ogni task: `npx tsc --noEmit` senza errori e `npm test` verde.

## Review Focus

- **Codice incollato o scritto male**: "482 915", "482915\n", "48a915", 7 cifre incollate → si tengono solo le prime 6 cifre; lettere ignorate → test di `pulisciCodice` (Task 1).
- **Ricarica a metà**: chiudere la pagina sul passo Accordi o dopo la verifica → si riparte da lì; dopo il "fatto" la dashboard non rimanda più al benvenuto → test di `passoDiRipartenza` (Task 1) e verifica (Task 3).
- **Salvataggio rotto**: `localStorage` assente, JSON rovinato o di una versione vecchia → si riparte dall'inizio senza errori → test di `leggiBenvenuto` (Task 1).
- **Logo sbagliato**: HEIC, PDF, PNG da 12 MB → messaggio chiaro, restano le iniziali → test di `controllaLogo` (Task 1).
- **Doppio tocco**: premere due volte "Continua" o "Verifica" mentre gira la rotellina, o cliccare "Avanti" durante l'animazione di Leo → un solo invio, un solo passo avanti → stato `occupato` che spegne il tasto (Task 5, Task 6).

---

### Task 1: Logica e salvataggio del benvenuto

**Files:**
- Create: `libs/prototipo/benvenuto.ts`
- Test: `tests/unit/benvenuto.test.ts`

**Interfaces:**
- Produces:
  - `type Tono = "amichevole" | "professionale" | "motivante"`
  - `const PASSI = ["accesso", "marchio", "accordi", "cliente", "leo", "finale"] as const`; `type Passo = 0 | 1 | 2 | 3 | 4 | 5`
  - `type Benvenuto = { v: 1; fatto: boolean; passo: Passo; verificato: boolean; studio: string; logo: string | null; accordi: { quando: string } | null; primoCliente: { nome: string; email: string; esempio: boolean } | null; tono: Tono }`
  - `BENVENUTO_INIZIALE: Benvenuto` (`v: 1`, `passo: 0`, tutto falso/null, `studio: ""`, `tono: "amichevole"`)
  - `regolePassword(p: string): { lunghezza: boolean; lettera: boolean; numero: boolean }` (≥ 8 caratteri, almeno una lettera, almeno una cifra); `passwordValida(p: string): boolean`
  - `nuovoCodice(rand: () => number = Math.random): string` (6 cifre, può iniziare con 0)
  - `pulisciCodice(t: string): string` (solo cifre, al massimo 6); `codiceGiusto(inserito: string, atteso: string): boolean`
  - `emailValida(e: string): boolean` (forma `x@y.z`, spazi ai lati ignorati)
  - `controllaLogo(f: { name: string; type: string; size: number }): { ok: true; vettoriale: boolean } | { ok: false; motivo: string }`
  - `passoDiRipartenza(b: Benvenuto): Passo`
  - `leggiBenvenuto(storage: Pick<Storage, "getItem"> | null): Benvenuto`
  - Hook e azioni (in fondo al file, `useSyncExternalStore` come `libs/prototipo/stato.ts`): `useBenvenuto(): Benvenuto`, `aggiornaBenvenuto(parte: Partial<Benvenuto>): void`, `completaBenvenuto(): void`, `azzeraBenvenuto(): void`; chiave `localStorage` `"benvenuto"`; scrittura in `try/catch`.

- [ ] **Step 1: Test** in `tests/unit/benvenuto.test.ts`:
  - `regolePassword("abc")` → tutto falso tranne `lettera`; `passwordValida("allenamento1")` → `true`; `"12345678"` → `false`; `"allenamento"` → `false`.
  - `nuovoCodice(() => 0)` → `"000000"`; `nuovoCodice(() => 0.999999)` → `"999999"`; lunghezza sempre 6 con `Math.random`.
  - `pulisciCodice("482 915")` → `"482915"`; `"48a915"` → `"48915"`; `"1234567"` → `"123456"`; `"482915\n"` → `"482915"`.
  - `codiceGiusto("482 915", "482915")` → `true`; `codiceGiusto("48291", "482915")` → `false`.
  - `emailValida(" giulia@esempio.it ")` → `true`; `"giulia@"`, `"giulia.it"`, `""` → `false`.
  - `controllaLogo({ name: "logo.png", type: "image/png", size: 2e6 })` → `{ ok: true, vettoriale: false }`; `.svg` con `image/svg+xml` → `vettoriale: true`; PNG da 12 MB → `ok: false`, `motivo` contiene `"5 MB"`; `foto.heic` (`image/heic`) e `a.pdf` → `ok: false`, `motivo` = `"Carica un logo PNG, JPG, WebP o SVG"`.
  - `passoDiRipartenza({ ...BENVENUTO_INIZIALE, passo: 3 })` → `0` (non verificato); `{ verificato: true, passo: 3 }` → `3`; `{ verificato: true, passo: 5, accordi: null }` → `2`.
  - `leggiBenvenuto(null)` → `BENVENUTO_INIZIALE`; storage con `"{rotto"` → `BENVENUTO_INIZIALE`; con `{ v: 0, … }` → `BENVENUTO_INIZIALE`; con un oggetto valido → quello, con i campi mancanti presi da `BENVENUTO_INIZIALE`.
- [ ] **Step 2:** `npm test -- benvenuto` → FAIL (modulo mancante).
- [ ] **Step 3:** Implementa `libs/prototipo/benvenuto.ts`.
- [ ] **Step 4:** `npm test` → PASS (tutti); `npx tsc --noEmit` → ok.
- [ ] **Step 5:** Commit `feat: logica e salvataggio del benvenuto del trainer`.

### Task 2: Animazioni di Leo e della pallina

**Files:**
- Create: `public/prototipo/coach/esce.webp`, `public/prototipo/coach/con-pallina.webp` (script nello scratchpad, non versionato)
- Modify: `IMMAGINI APP/LEGGIMI.md`
- Create: `components/prototipo/benvenuto/misure-leo.ts`

**Interfaces:**
- Produces in `misure-leo.ts`: `LEO = { larghezza: number; altezza: number; pallina: { x: number; y: number; r: number } }` (dimensioni delle due WebP in px; centro e raggio della pallina nell'ultimo fotogramma, in frazioni di larghezza/altezza), `DURATA_ESCE_MS: number`.

- [ ] **Step 1:** Dal video `IMMAGINI APP/LEO ENTRA NELLA PALLINA.mp4` (720 × 1280, 24 fps, fondo grigio (125,125,125)): prendi da 0 a 3,58 s, giralo al contrario, togli lo sfondo come nella prova del 23/10 (alpha = max(smoothstep(distanza dal grigio, 10, 42), (luminosità − 125) / 130 × 1,5); colore ricavato togliendo il grigio), ritaglia al riquadro che contiene tutti i fotogrammi, larghezza 360 px, 15 fps, WebP animata con trasparenza, una sola riproduzione (`-loop 1`). Peso < 3 MB.
- [ ] **Step 2:** `con-pallina.webp`: il primo fotogramma del video (= ultimo dell'animazione), stesso ritaglio e stessa larghezza, sfondo tolto allo stesso modo.
- [ ] **Step 3:** Misura centro e raggio della pallina nell'ultimo fotogramma e scrivi `misure-leo.ts`; `DURATA_ESCE_MS` = durata reale dell'animazione.
- [ ] **Step 4: Verifica:** sopra un fondo nel colore del trainer (prova come quella mandata a Marco), l'ultimo fotogramma di `esce.webp` e `con-pallina.webp` coincidono; nessun bordo grigio intorno a Leo.
- [ ] **Step 5:** Aggiorna `IMMAGINI APP/LEGGIMI.md` (`LEO ENTRA NELLA PALLINA.mp4` → `esce.webp`, `con-pallina.webp`). Commit `feat: animazione di Leo che esce dalla pallina`.

### Task 3: Pagina, regia e vetrina

**Files:**
- Create: `app/prototipo/benvenuto/page.tsx`, `components/prototipo/benvenuto/Benvenuto.tsx`, `components/prototipo/benvenuto/Vetrina.tsx`, `components/prototipo/benvenuto/ui.tsx`
- Modify: `components/prototipo/trainer/Chrome.tsx` (`TrainerFrame`), `components/prototipo/trainer/Settings.tsx`

**Interfaces:**
- Consumes: `useBenvenuto`, `aggiornaBenvenuto`, `passoDiRipartenza`, `azzeraBenvenuto`, `Tono`, `PASSI` (Task 1).
- Produces:
  - `BENVENUTO = "/prototipo/benvenuto"` (in `Benvenuto.tsx`)
  - `Benvenuto()`: legge `useBenvenuto()`, mostra il passo `passoDiRipartenza(b)`; `vai(p: Passo)` salva `passo` e cambia schermata (uscita: dissolvenza + `blur(4px)` 180 ms; entrata dei figli dal basso 12 px, uno dopo l'altro ogni 50 ms); da `lg` due metà (vetrina 46%, passo 54%) dentro una scheda `rounded-[28px]` su fondo neutro, sotto `lg` solo il passo.
  - in `ui.tsx`: `TestaPasso({ titolo, sotto }: { titolo: string; sotto?: ReactNode })` (asterisco `✱` nel colore del trainer, titolo 28 px bold, sottotitolo `text-muted`); `Tasto({ children, onClick, spento, occupato, verde }: { children: ReactNode; onClick: () => void; spento?: boolean; occupato?: string; verde?: boolean })` (pieno largo, alto 48 px, `btn-trainer`; `occupato` = testo con rotellina e tasto non cliccabile; `verde` = `bg-ok` con spunta); `Barra({ passo }: { passo: Passo })` (5 tratti per i passi 0–4, riempiti nel colore del trainer, il corrente si riempie con una transizione).
  - `Vetrina({ passo, children }: { passo: Passo; children?: ReactNode })`: gradiente nel colore del trainer con 3 macchie sfumate che si muovono piano; schede in vetro (`glass`) che ondeggiano sfalsate: "Incassi di ottobre" con `€ 3.840` e una linea che si disegna, Giulia Bianchi con anello al 39%, "Prossima seduta · Ven 18:00"; notifica che cambia ogni 3,5 s tra 4 frasi finte; frase in basso "L'app dei tuoi clienti, con il tuo marchio."; `children` in primo piano (pallina, Leo, telefono, notifica email).
  - `TrainerFrame`: se `useBenvenuto().fatto` è falso dopo il montaggio → `window.location.replace(BENVENUTO)`.
  - Impostazioni: card "Assistente virtuale" usa `useBenvenuto().tono` / `aggiornaBenvenuto({ tono })` al posto dello `useState`; card "Il tuo profilo" ha il tasto "Rivedi il benvenuto" → `azzeraBenvenuto()` + vai a `BENVENUTO`.

- [ ] **Step 1:** Pagina, `Benvenuto` con i 6 passi come riquadri provvisori ("Passo: marchio" + "Avanti"), `Barra`, `Tasto`, `TestaPasso`.
- [ ] **Step 2:** `Vetrina` completa.
- [ ] **Step 3:** Rimando da `TrainerFrame` e collegamenti in Impostazioni.
- [ ] **Step 4: Verifica** nel browser a 1440 e 1280 px: `/prototipo/trainer` porta al benvenuto; avanti fino in fondo, ricarica a metà → stesso passo; passi provvisori fino al finale, `completaBenvenuto()` da console → la dashboard resta; "Rivedi il benvenuto" riporta al primo passo; cambio colore in Impostazioni → la vetrina è nel nuovo colore; tema scuro; riduci movimento (schede ferme); console pulita.
- [ ] **Step 5:** `npx tsc --noEmit`, `npm test` → ok. Commit `feat: pagina del benvenuto con regia e vetrina`.

### Task 4: La pallina

**Files:**
- Create: `components/prototipo/benvenuto/Pallina.tsx`
- Modify: `components/prototipo/benvenuto/Benvenuto.tsx`

**Interfaces:**
- Produces: `type UmorePallina = "calmo" | "contento" | "no"`; `Pallina({ dove, scritta, umore, size }: { dove: "vetrina" | "modulo" | "centro" | "nascosta"; scritta?: string; umore?: UmorePallina; size?: number })`.
  - Colore: `<img src="/prototipo/coach/pallina.webp">` con sopra uno strato `background: var(--trainer)` in `mix-blend-mode: color` tagliato con `mask-image` della stessa immagine, intensità 85%; alone `drop-shadow` nel colore del trainer.
  - `dove`: lo stesso elemento (`layoutId="pallina"`) si sposta tra un segnaposto nella vetrina e uno sopra il `TestaPasso`; in "vetrina" gira piano su un'ellisse (raggio 40 × 18 px, 9 s) e fluttua (±6 px, 3 s).
  - `scritta`: pillola `btn-trainer` sopra la pallina con la punta in basso, entra con una molla.
  - `umore`: `contento` = saltello (y −14 px e ritorno, molla); `no` = scossa orizzontale (±8 px, 3 volte, 360 ms); poi torna `calmo`.
- [ ] **Step 1:** Implementa `Pallina` e il suo contesto in `Benvenuto` (`usePallina(): { mostra: (p: { dove; scritta?; umore? }) => void }`, così i passi la comandano).
- [ ] **Step 2: Verifica** nel browser: con gli 8 colori di Impostazioni la pallina ha il colore giusto e la faccina resta chiara, su tema chiaro e scuro; il volo vetrina → modulo è continuo; riduci movimento → niente giri e saltelli.
- [ ] **Step 3:** `npx tsc --noEmit` → ok. Commit `feat: pallina di Leo nel colore del trainer`.

### Task 5: Accesso: password e codice via email

**Files:**
- Create: `components/prototipo/benvenuto/passi/Accesso.tsx`, `components/prototipo/benvenuto/CodiceOtp.tsx`, `components/prototipo/benvenuto/EmailFinta.tsx`

**Interfaces:**
- Consumes: `regolePassword`, `passwordValida`, `nuovoCodice`, `pulisciCodice`, `codiceGiusto`, `aggiornaBenvenuto` (Task 1); `TestaPasso`, `Tasto` (Task 3); `usePallina` (Task 4).
- Produces:
  - `CodiceOtp({ atteso, onGiusto, onSbagliato, scadenza }: { atteso: string; onGiusto: () => void; onSbagliato: () => void; scadenza: number })`: 6 caselle `inputMode="numeric"` (`autoComplete="one-time-code"` sulla prima), avanti da sole, Backspace su casella vuota torna indietro, incolla in qualsiasi casella → `pulisciCodice` e riempie; a 6 cifre parte da sola "Verifico…" (700 ms); sbagliato → caselle bordo rosso che tremano, "Codice non corretto, riprova", svuotate, fuoco sulla prima; giusto → le caselle si stringono verso il centro e diventano un unico quadrato `bg-ok` 64 px con la spunta (molla), il tasto diventa `verde` "Email verificata".
  - `EmailFinta({ codice }: { codice: string | null })`: notifica in vetro che scivola dall'alto nella vetrina: icona busta, "Nuova email", "Il tuo codice è 482 915" (cifre a gruppi di 3).
- [ ] **Step 1:** Fase *password*: "Ciao Marco, il tuo account è pronto: scegli una password", email `marco.rossi@esempio.it` bloccata, password con occhio, tre regole che si spuntano dal vivo, "Continua" spento finché `passwordValida` è falso; premuto → `occupato="Invio il codice…"` 900 ms → fase codice.
- [ ] **Step 2:** Fase *codice*: `nuovoCodice()`, `EmailFinta` dopo 1,2 s, pallina in `modulo` con "Inserisci il codice"; conto alla rovescia da 1:00; a zero "Rimanda il codice" (nuovo codice, nuova notifica, si riparte da 1:00); sbagliato → pallina `no`; giusto → `playSound("complete")`, pallina `contento`, `aggiornaBenvenuto({ verificato: true })`, dopo 1,4 s parte la scena di Leo (Task 6).
- [ ] **Step 3: Verifica** nel browser: password "abc" / "allenamento" / "allenamento1"; doppio clic su "Continua" → un solo codice; codice sbagliato, giusto, incollato con lo spazio, scaduto e rimandato (il vecchio non vale più); tema scuro; riduci movimento.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: accesso del trainer con password e codice via email`.

### Task 6: Leo esce dalla pallina, saluto — controllo con Marco

**Files:**
- Create: `components/prototipo/benvenuto/LeoEsce.tsx`
- Modify: `components/prototipo/benvenuto/passi/Accesso.tsx`, `Benvenuto.tsx`

**Interfaces:**
- Consumes: `LEO`, `DURATA_ESCE_MS` (Task 2); `Pallina`, `usePallina` (Task 4).
- Produces: `LeoEsce({ fase, onFine }: { fase: "esce" | "fermo"; onFine?: () => void })`: in `esce` mostra `esce.webp` (indirizzo con `?t=` nuovo a ogni montaggio, così riparte), a `DURATA_ESCE_MS` passa a `con-pallina.webp` e sopra la sua pallina mette la `Pallina` colorata (posizione da `LEO.pallina`, dissolvenza 200 ms), poi `onFine`; in `fermo` solo l'immagine ferma con la pallina colorata che fluttua (±4 px) e si illumina quando `Benvenuto` lo chiede. Riduci movimento → sempre `fermo`.
- [ ] **Step 1:** Scena: dopo la verifica la pallina va al `centro` della vetrina, poi `LeoEsce fase="esce"`; il passo mostra il *saluto* "Benvenuto, Marco! In 2 minuti prepariamo l'app dei tuoi clienti." e "Iniziamo" (attivo solo dopo `onFine`) → passo Marchio. Da qui in poi Leo resta `fermo` nella vetrina fino al finale.
- [ ] **Step 2: Verifica** a 1440 e 1280 px: l'animazione parte una volta, il passaggio all'immagine ferma non si vede, la pallina colorata copre esattamente quella bianca; ricarica dopo la verifica → Leo già fermo nella vetrina; riduci movimento.
- [ ] **Step 3: Controllo con Marco:** screenshot e prova nel browser a misura di computer dell'accesso completo fino al saluto; si va avanti solo con il suo ok (eventuali correzioni qui).
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: Leo esce dalla pallina nel benvenuto`.

### Task 7: Telefono d'anteprima e passo Marchio

**Files:**
- Create: `components/prototipo/benvenuto/AnteprimaTelefono.tsx`, `components/prototipo/benvenuto/passi/Marchio.tsx`

**Interfaces:**
- Consumes: `useBenvenuto`, `aggiornaBenvenuto`, `controllaLogo` (Task 1); `useAppearance`, `ACCENTS` (`components/ui/appearance.tsx`); `useTrainerPhoto`, `stato.setTrainerPhoto`, `shrinkPhoto` (`libs/prototipo/stato.ts`); `trainer` (`dati-finti.ts`).
- Produces:
  - `AnteprimaTelefono({ vista }: { vista: "grigia" | "home" | "consenso" | "invito" | "leo" })`: cornice di telefono 260 × 540 px, angoli 40 px, tacca; intestazione con logo (`benvenuto.logo` o iniziali su `var(--trainer)`), nome dello studio, foto del trainer; viste: `grigia` (blocchi grigi, senza colore), `home` ("Ciao, Giulia", obiettivo −8 kg con barra al 39%, allenamento di oggi), `consenso` (testi del consenso del cliente e casella), `invito` ("Marco Rossi ti ha invitato" con il nome del primo cliente), `leo` (vignetta di Leo con la frase del tono). Entra nella vetrina dal passo Marchio, con una molla; cambio vista con dissolvenza.
  - `rimpicciolisciLogo(file: File): Promise<string>` in `Marchio.tsx` (raster: lato lungo 512 px, PNG con trasparenza; SVG: letto come data URL così com'è).
- [ ] **Step 1:** `AnteprimaTelefono`.
- [ ] **Step 2:** `Marchio`: nome dello studio (segnaposto = nome del trainer), logo (anteprima, "Togli"), 8 colori come in Impostazioni (`setAccent` con la macchia d'olio dal punto toccato su tutta la vetrina), foto (`shrinkPhoto` → `setTrainerPhoto`); "Avanti" e "Lo faccio dopo"; errore del logo sotto il campo con il `motivo`.
- [ ] **Step 3: Verifica:** colore → vetrina, pallina e telefono si ricolorano; logo PNG, SVG, HEIC, 12 MB; nome vuoto → nome del trainer nel telefono; dopo, la dashboard ha colore e foto scelti.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: passo del marchio con anteprima dell'app del cliente`.

### Task 8: Accordi e primo cliente

**Files:**
- Create: `components/prototipo/benvenuto/passi/Accordi.tsx`, `components/prototipo/benvenuto/passi/PrimoCliente.tsx`

**Interfaces:**
- Consumes: `aggiornaBenvenuto`, `emailValida` (Task 1); `AnteprimaTelefono` (Task 7); `usePallina` (Task 4); `slugify` (`libs/slug.ts`).

- [ ] **Step 1:** `Accordi`: le tre schede del design (testi esatti della spec, sezione 4.3) con icone (`ShieldCheck`, `FileSignature`, `Server`); "Leggi termini e accordo" → foglio laterale (velo sfocato, chiude con velo/Esc/✕) con il titolo "Bozza da far rivedere a un professionista" e un testo segnaposto in 6 punti; casella ≥ 44 px "Ho letto e accetto i termini di servizio e l'accordo sul trattamento dei dati (DPA)"; "Avanti" spento finché non è spuntata, sotto "Serve per poter seguire i dati sulla salute dei tuoi clienti"; avanti → `aggiornaBenvenuto({ accordi: { quando: new Date().toISOString() } })`; pallina in `modulo` con "Leggi con calma" all'ingresso; telefono `consenso`.
- [ ] **Step 2:** `PrimoCliente`: nome ed email (`emailValida`, tasto spento se no), oppure "Prova con un cliente di esempio" (Giulia Bianchi, `giulia@esempio.it`); poi il link `nomeprodotto.it/marco-rossi` con "Copia" (`navigator.clipboard`, "Copiato!") e "Invia invito" → "Invito pronto! Nel prodotto vero parte un'email a {email}." e salva `primoCliente`; "Salta"; telefono `invito`.
- [ ] **Step 3: Verifica:** senza spunta non si va avanti, nemmeno ricaricando e andando al finale; email "giulia@" → spento; cliente d'esempio → il telefono mostra Giulia.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: accordi sulla privacy e primo cliente nel benvenuto`.

### Task 9: Conosci Leo e finale

**Files:**
- Create: `components/prototipo/benvenuto/passi/ConosciLeo.tsx`, `components/prototipo/benvenuto/passi/Finale.tsx`, `components/prototipo/benvenuto/Coriandoli.tsx`

**Interfaces:**
- Consumes: `useBenvenuto`, `aggiornaBenvenuto`, `completaBenvenuto`, `Tono` (Task 1); `LeoEsce` (Task 6); `AnteprimaTelefono` (Task 7); `navigateWithStain` non serve: si cambia pagina con `conMacchia` (`libs/ui/macchia.ts`) + `window.location.assign("/prototipo/trainer")`.
- Produces: `FRASI_TONO: Record<Tono, string>` in `ConosciLeo.tsx` ("Ciao Giulia! Oggi c'è il Giorno A, ce la fai alla grande 💪" · "Buongiorno Giulia. Oggi è in programma il Giorno A: 6 esercizi." · "Giulia, oggi Giorno A! Ogni ripetizione ti avvicina ai −8 kg 🔥"); `Coriandoli({ attivi }: { attivi: boolean })` (canvas a tutto schermo, 120 pezzi nel colore del trainer e in due sue tinte, 2,5 s, poi si toglie).

- [ ] **Step 1:** `ConosciLeo`: tre battute di Leo (adattate da `LeoPresentazione.tsx`: chi è, cosa fa per il trainer, cosa fa per i clienti e che i nomi non arrivano all'AI), una alla volta con "Avanti" e parole che entrano in sequenza; poi i 3 toni come scelta `sel-trainer`; la pallina in mano a Leo si illumina a ogni battuta; telefono `leo` con `FRASI_TONO[tono]`; "Salta".
- [ ] **Step 2:** `Finale`: "La tua app è pronta!", `Coriandoli`, riepilogo in 4 righe (colore con pallino, studio, primo cliente o "da aggiungere", tono di Leo), Leo `fermo` che saluta (piccola oscillazione dell'immagine); "Entra nella tua dashboard" → `completaBenvenuto()`, `playSound("complete")`, macchia d'olio, `/prototipo/trainer`.
- [ ] **Step 3: Verifica:** tono scelto qui → stesso tono in Impostazioni; finale senza accordi impossibile; dopo l'ingresso il benvenuto non ricompare; riduci movimento → niente coriandoli.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: conosci Leo e finale del benvenuto`.

### Task 10: Verifica finale e documenti

**Files:**
- Modify: `PROGRESS.md`, `docs/plans/2026-10-22-area-cliente.md` (nota in cima)

- [ ] **Step 1: Verifica finale** da zero (`azzeraBenvenuto` da Impostazioni) a 1440 e 1280 px, tema chiaro e scuro, con e senza riduci movimento: tutti i passi, avanti/indietro/salta, i casi della Review Focus; controllo veloce a 375 px (una colonna, niente sovrapposizioni); console pulita; screenshot a Marco.
- [ ] **Step 2:** `npm test`, `npx tsc --noEmit`, `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build` → senza errori.
- [ ] **Step 3:** Piano area cliente: in cima "In attesa: prima il benvenuto del trainer (`docs/plans/2026-10-23-benvenuto-trainer.md`)". `PROGRESS.md`: stato, decisioni (benvenuto a due metà, pallina di Leo, Leo che esce dalla pallina, `IMMAGINI APP/`), prossimi passi, changelog; sotto le 60 righe.
- [ ] **Step 4:** Commit `docs: benvenuto del trainer completato`.
