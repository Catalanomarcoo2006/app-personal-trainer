# Area cliente del prototipo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'app del cliente (`/prototipo/cliente`) completa e nello stile dell'area trainer, collegata dal vivo all'area trainer aperta in un'altra finestra dello stesso browser.

**Architecture:** Lo stato condiviso di `libs/prototipo/stato.ts` si allarga (conversazioni, avvisi, misure, documenti, consenso) e passa tra le finestre con `BroadcastChannel`, stato intero, vince il più recente. L'area cliente diventa una pagina unica come l'area trainer, una sezione per file. Leo viene diviso in pezzi comuni usati da trainer e cliente.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind 4, Motion (`motion/react`), lucide-react, pdf-lib, Vitest (nuovo).

**Spec:** `docs/specs/2026-10-22-area-cliente-design.md` (parte da `docs/specs/2026-10-21-design.md`)

## Global Constraints

- Interfaccia e commenti in italiano; commit in italiano con prefisso (`feat:`, `fix:`, `docs:`, `chore:`).
- Niente tasti neri: azione principale `btn-trainer`, voce scelta `sel-trainer`, superfici `panel` / `glass` / `glass-row` di `app/globals.css`; colori solo dai token (`--color-*`, `var(--trainer)`), così il tema scuro funziona da solo.
- Animazioni con `motion/react`; `MotionProvider` rispetta già "riduci movimento", nessuna animazione infinita senza controllare `useReducedMotion()`.
- Telefono: larghezza di riferimento 375 px; campi di testo ≥ 16 px sotto `md` (niente zoom); bersagli di tocco ≥ 44 px; `100dvh`; margini `env(safe-area-inset-*)`; niente lampeggio al tocco (`-webkit-tap-highlight-color: transparent`).
- Cliente della demo: Giulia Bianchi, id `giulia-bianchi` (`CLIENTE_DEMO`), trainer Marco Rossi.
- Niente diete: alimentazione solo come rimando al PDF del nutrizionista; il PDF finto della dieta non contiene un piano alimentare.
- Solo dati finti; nessuna chiamata di rete; `"use client"` sui componenti interattivi.
- Verifica di base di ogni task: `npx tsc --noEmit` senza errori e `npm test` verde.

## Review Focus

- **Ordine di apertura delle finestre**: aperta prima l'area cliente e usata, poi l'area trainer → il trainer parte dallo stato del cliente, non dai dati finti → test di `unisci` (Task 1) e verifica manuale (Task 2).
- **Doppio tocco**: spuntare tutti gli esercizi, togliere una spunta e rimetterla, oppure premere due volte "Invia" → un solo avviso → test di `segnaAllenamento` e di `chiediSpostamento` (Task 1).
- **File non adatti**: foto HEIC dell'iPhone, `.docx`, PDF da 40 MB → messaggio chiaro, niente blocchi → test di `controllaFile` (Task 1).
- **Numeri scritti al telefono**: "68,5", "68.5", " 68 ", "abc", "0", "500" nel foglio delle misure → virgola accettata, valori assurdi rifiutati con un messaggio sotto il campo → test di `leggiNumero` e `misuraValida` (Task 1).
- **Testo vuoto o lunghissimo** in chat, spostamento e Leo → tasto spento se vuoto; parole lunghe vanno a capo dentro la bolla (`break-words`) → test di `inviaMessaggio` (Task 1) e verifica a 375 px (Task 6).

---

### Task 1: Vitest e stato condiviso allargato

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Create: `vitest.config.ts` (alias `@` → radice del progetto, ambiente `node`)
- Modify: `libs/prototipo/dati-finti.ts`, `libs/prototipo/stato.ts`
- Create: `libs/prototipo/calcoli.ts`, `libs/prototipo/file-url.ts`
- Modify: `components/prototipo/trainer/Messages.tsx`, `components/prototipo/trainer/Plans.tsx`
- Modify: `docs/plans/2026-10-21-piano-v1.md` (Task 2: Vitest già installato qui)
- Test: `tests/unit/calcoli.test.ts`, `tests/unit/stato.test.ts`

**Interfaces:**
- Produces in `dati-finti.ts`: `CLIENTE_DEMO = "giulia-bianchi"`; `Attachment = { name: string; file: Blob | string; detail: string }` (era `url`); `ChatMessage` con `tag?: "spostamento"`; `misureDemo: Misura[]`; `documentiDemo: Omit<Documento, "id">[]`; `client.goalStart = 72`, `client.goalTarget = 64`.
- Produces in `stato.ts`:
  - `type TipoAvviso = "allenamento" | "spostamento" | "dolore" | "misure" | "documento" | "messaggio"`
  - `type Avviso = { id: string; tipo: TipoAvviso; clientId: string; testo: string; ora: string }`
  - `type Misura = { data: string; peso?: number; vita?: number; fianchi?: number; petto?: number; braccio?: number; coscia?: number }`, `type CampoMisura = Exclude<keyof Misura, "data">`
  - `type Documento = { id: string; nome: string; tipo: "pdf" | "foto"; da: "nutrizionista" | "trainer" | "cliente"; data: string; file: Blob | string }`
  - `State` in più: `threads: Record<string, ChatMessage[]>`, `avvisi: Avviso[]` (il più recente per primo), `misure: Misura[]`, `documenti: Documento[]`, `spostamento: { testo: string } | null`, `allenamentoFatto: boolean`, `consenso: boolean`, `ora: number` (ms dell'ultima modifica, 0 per i dati finti)
  - `SentPlan.url` → `SentPlan.file: Blob`; `stato.addSent` aggiunge anche il messaggio con il PDF a `threads[clientId]`
  - in `stato`: `inviaMessaggio(clientId: string, msg: ChatMessage): void`, `segnaAllenamento(titolo: string): void`, `chiediSpostamento(testo: string): void`, `aggiungiMisura(m: Misura): void`, `aggiungiDocumento(d: Omit<Documento, "id">): void`, `segnalaDolore(frase: string): void`, `daiConsenso(): void`, `ricevi(remoto: State): void`
  - `type State` esportato; ogni metodo tranne `ricevi` imposta `ora = Date.now()` e chiama `notificaModifica()` (vuota fino al Task 2)
- Produces in `calcoli.ts`: `unisci<T extends { ora: number }>(locale: T, remoto: T): T`; `nonLetti(msgs: ChatMessage[], visti: number, da: ChatMessage["from"]): number`; `variazione(misure: Misura[], campo: CampoMisura): number | null`; `leggiNumero(testo: string): number | null`; `misuraValida(campo: CampoMisura, n: number): boolean` (peso 30–250 kg, circonferenze 15–200 cm); `controllaFile(f: { name: string; type: string; size: number }): { ok: true; tipo: "pdf" | "foto" } | { ok: false; motivo: string }`; `avanzamento(partenza: number, attuale: number, traguardo: number): number` (percentuale intera tra 0 e 100)
- Produces in `file-url.ts`: `useFileUrl(file: Blob | string): string` (stringa → uguale; Blob → `URL.createObjectURL`, revocato allo smontaggio)

- [ ] **Step 1:** `npm install -D vitest`; crea `vitest.config.ts`; aggiungi lo script `test`.
- [ ] **Step 2: Test** `tests/unit/calcoli.test.ts`:
  - `unisci({ ora: 5 }, { ora: 9 })` → il remoto; `unisci({ ora: 9 }, { ora: 5 })` → il locale; a parità tiene il locale.
  - `nonLetti(msgs, 2, "trainer")` conta solo i messaggi `from: "trainer"` con indice ≥ 2.
  - `variazione([{ data: "a", peso: 72, vita: 80 }, { data: "b", peso: 70 }, { data: "c", peso: 68.9, vita: 77 }], "peso")` → `-3.1` (con tolleranza); `"vita"` → `-3`; `"petto"` → `null`.
  - `leggiNumero("68,5")` → `68.5`; `"68.5"` → `68.5`; `" 68 "` → `68`; `""`, `"abc"`, `"6,8,5"` → `null`.
  - `misuraValida("peso", 0)` e `("peso", 500)` → `false`; `("peso", 68.5)` → `true`; `("vita", 10)` → `false`.
  - `controllaFile({ name: "a.pdf", type: "application/pdf", size: 2e6 })` → `{ ok: true, tipo: "pdf" }`; PDF da 40 MB → `ok: false` con `motivo` che contiene "10 MB"; `{ name: "foto.heic", type: "image/heic" }` e `.docx` → `ok: false` con `motivo` "Carica un PDF o una foto JPG o PNG"; JPEG da 3 MB → `{ ok: true, tipo: "foto" }`.
  - `avanzamento(72, 68.9, 64)` → `39`; `avanzamento(72, 75, 64)` → `0`; `avanzamento(72, 60, 64)` → `100`.
- [ ] **Step 3: Test** `tests/unit/stato.test.ts` (in `beforeEach` ricarica il modulo con `vi.resetModules()` + `await import`):
  - `segnaAllenamento("Giorno A")` due volte → un solo avviso `allenamento`, `allenamentoFatto` vero.
  - `chiediSpostamento("Sabato?")` due volte → un solo avviso `spostamento` e un solo messaggio con `tag: "spostamento"` nel thread di `CLIENTE_DEMO`.
  - `inviaMessaggio(CLIENTE_DEMO, { from: "client", text: "   ", time: "Adesso" })` → nessun messaggio; con testo → messaggio aggiunto e avviso `messaggio`; `from: "trainer"` → nessun avviso.
  - `segnalaDolore("mi fa male il ginocchio")` → avviso `dolore` con la frase nel testo e messaggio `from: "assistant"` nel thread.
  - `aggiungiMisura({ data: "Oggi", peso: 68.5 })` → in fondo a `misure`, avviso `misure`; `ora` cresce.
  - `ricevi(altro)` sostituisce lo stato.
- [ ] **Step 4:** `npm test` → FAIL (moduli mancanti).
- [ ] **Step 5:** Implementa tipi, dati e funzioni. Dati finti: `threads` iniziali da `conversations`; nel thread di Giulia togli l'ultimo messaggio ("Posso spostare la seduta…", la richiesta ora si fa dal vivo) e porta il suo `unread` a 0; in `alerts` sostituisci la riga di Giulia con "Ho fatto tutto il Giorno A 💪". `misureDemo`: 8 rilevazioni settimanali con i pesi di `client.weight`, la prima e l'ultima con vita 80/77, fianchi 104/101, petto 92/90, braccio 29/28, coscia 59/57. `documentiDemo`: "Piano alimentare.pdf" (`nutrizionista`, `/prototipo/dieta-esempio.pdf`), "Scheda di ottobre.pdf" (`trainer`, `/prototipo/scheda-esempio.pdf`), "Analisi del sangue.pdf" (`cliente`, `/prototipo/analisi-esempio.pdf`); i due PDF nuovi li crea il Task 7.
- [ ] **Step 6:** Adatta l'area trainer: `Plans.tsx` salva `file: blob`; `Messages.tsx` legge e scrive `useStato((s) => s.threads)` e `stato.inviaMessaggio` (le risposte automatiche restano), `PdfMessage` apre `useFileUrl(a.file)`. Comportamento invariato.
- [ ] **Step 7:** `npm test` → PASS; `npx tsc --noEmit` → nessun errore; nel browser `/prototipo/trainer/schede` → "Invia" → in Messaggi il PDF si apre.
- [ ] **Step 8:** Nota in `docs/plans/2026-10-21-piano-v1.md`, Task 2: "Vitest già installato il 22/10, restano solo slug e pulizia".
- [ ] **Step 9:** Commit `feat: stato condiviso allargato per l'area cliente e Vitest`.

### Task 2: Canale tra finestre

**Files:**
- Create: `libs/prototipo/canale.ts`
- Modify: `libs/prototipo/stato.ts`, `components/prototipo/trainer/Chrome.tsx` (`TrainerFrame`), `components/ui/appearance.tsx`

**Interfaces:**
- Consumes: `State`, `stato.ricevi`, `notificaModifica`, `unisci` (Task 1).
- Produces in `canale.ts`: `type Area = "trainer" | "cliente"`; `apriCanale<S>(area: Area, opts: { prendi: () => S; ricevi: (s: S) => void; presenza: (area: Area, presente: boolean) => void }): { trasmetti: (s: S) => void; chiudi: () => void } | null` (null se `BroadcastChannel` non esiste). Nome canale `"pt-prototipo"`. Messaggi: `{ tipo: "chiedo", da }`, `{ tipo: "stato", da, stato }`, `{ tipo: "ci-sono", da, area }`, `{ tipo: "esco", da, area }`; `da` è un id casuale della finestra, i propri messaggi si ignorano. All'apertura manda `chiedo` e `ci-sono`; a un `chiedo` risponde con `stato` e `ci-sono`; su `pagehide` manda `esco`.
- Produces in `stato.ts`: `useCanale(area: Area): void` (apre un solo canale per finestra; `notificaModifica` trasmette; lo stato ricevuto passa da `unisci` prima di `ricevi`); `useAreaCollegata(area: Area): boolean`.

- [ ] **Step 1:** Implementa `canale.ts` e collega `useCanale`/`useAreaCollegata` in `stato.ts`.
- [ ] **Step 2:** `TrainerFrame` chiama `useCanale("trainer")`.
- [ ] **Step 3:** `appearance.tsx`: ascolta l'evento `storage` su `KEY_ACCENT` e applica il colore (stato e `--trainer`) senza riscriverlo.
- [ ] **Step 4: Verifica manuale** con due schede su `/prototipo/trainer/messaggi`: un messaggio scritto in una compare nell'altra; aperta una terza scheda dopo, ha già quel messaggio; cambio colore in Impostazioni → l'altra scheda si ricolora; chiudendo tutte e riaprendo si riparte dai dati finti.
- [ ] **Step 5:** `npm test`, `npx tsc --noEmit` → ok. Commit `feat: stato condiviso dal vivo tra le finestre del prototipo`.

### Task 3: Leo in pezzi comuni

**Files:**
- Create: `components/prototipo/leo/CoachFace.tsx`, `components/prototipo/leo/Bubble.tsx`, `components/prototipo/leo/useLeoChat.ts`, `components/prototipo/leo/LeoThread.tsx`
- Modify: `components/prototipo/trainer/CoachAssistant.tsx`

**Interfaces:**
- Produces: `COACH_NAME`, `CoachFace({ size }: { size: number })` (spostati così come sono); `type Speech`, `SpeechIcon`, `Bubble({ speech, place, onAsk })` con `Tail` (spostati così come sono); `type LeoAnswer = { text: string; action?: { label: string; href: string } }`, `type LeoMsg = { id: number; from: "user" | "coach"; text: string; action?: LeoAnswer["action"] }`, `type LeoChat = { messages: LeoMsg[]; typing: boolean; ask: (q: string) => void }`, `useLeoChat(answer: (q: string) => LeoAnswer): LeoChat` (l'attuale `useCoachChat`, con la risposta passata da fuori); `LeoThread({ chat, intro, suggestions, onAction, placeholder }: { chat: LeoChat; intro: ReactNode; suggestions: string[]; onAction: (href: string, origin: { x: number; y: number }) => void; placeholder: string })` = elenco messaggi + "sta scrivendo" + domande pronte + campo (testo `text-[16px] md:text-[13px]`), estratto da `ChatPanel`. I link d'azione restano `<a data-macchia>` come oggi; il trainer passa `onAction = (href, origin) => navigateWithStain(href, origin, close)` (macchia d'olio, decisa il 22/10).

- [ ] **Step 1:** Sposta i pezzi; `CoachAssistant.tsx` tiene solo risposte, vignette del trainer, `SidePeek`, `ChatPanel` (intestazione + `LeoThread` con `intro` = blocco "novità"), `CoachButton`, `CoachStage`.
- [ ] **Step 2: Verifica** nel browser `/prototipo/trainer`: vignette, apertura chat, domande pronte, link d'azione, tasto col viso nelle altre pagine: tutto come prima; nessun errore in console.
- [ ] **Step 3:** `npx tsc --noEmit` → ok. Commit `refactor: Leo diviso in pezzi riusabili`.

### Task 4: Guscio dell'app cliente e Oggi

**Files:**
- Create: `components/prototipo/naviga.ts` (spostati `navigate`, `navigateWithStain` da `trainer/nav.ts` e `InstantLinks` da `Chrome.tsx`, che li reimportano)
- Delete: `app/prototipo/cliente/page.tsx`, `components/prototipo/cliente/Sections.tsx`, `components/ui/Assistant.tsx`
- Create: `app/prototipo/cliente/[[...sezione]]/page.tsx`, `components/prototipo/cliente/nav.ts`, `ClientApp.tsx`, `Shell.tsx`, `Foglio.tsx`, `Oggi.tsx` (in `components/prototipo/cliente/`)

**Interfaces:**
- Consumes: `useCanale`, `stato.segnaAllenamento`, `stato.chiediSpostamento`, `useStato` (Task 1-2).
- Produces: `navigate(href: string): void`, `navigateWithStain(href, origin, before?)` e `InstantLinks({ base }: { base: string }): null` (salta i link `data-macchia`) in `naviga.ts`; `BASE_CLIENTE = "/prototipo/cliente"`, `ROTTE_CLIENTE = { oggi, progressi, chat, documenti, profilo }` in `cliente/nav.ts`; `ClientApp()` (sezioni visitate restano montate, come `TrainerApp`; sezioni non ancora fatte → riquadro "In arrivo"); `Shell({ children })` (cornice 390 × 844 da `sm` in su, macchie di fondo come l'area trainer, intestazione, barra in basso); `Foglio({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode })` (sale dal basso, velo sfocato, chiude con velo/Esc/trascinamento verso il basso, a "riduci movimento" solo dissolvenza).

- [ ] **Step 1:** `naviga.ts`, rotte, pagina con `ClientApp`, `useCanale("cliente")` in `ClientApp`; il colore viene da `--trainer` della pagina (togli lo stile in linea con `trainer.color`).
- [ ] **Step 2:** `Shell`: intestazione (iniziali del trainer su fondo `card` nel colore del trainer; "Ciao, Giulia"; sotto "con Marco Rossi"; foto di Giulia → Profilo); barra in basso `glass` con 4 voci icona + etichetta (Oggi `House`, Progressi `ChartLine`, Chat `MessageCircle`, Documenti `FolderOpen`), voce attiva con pillola `sel-trainer` e `layoutId`; regole telefono dei Global Constraints.
- [ ] **Step 3:** `Oggi`: settimana in tinte tenui (fatto: `color-mix` del colore del trainer al 18% con spunta; oggi: `var(--trainer)` pieno; seduta: puntino), pillola "2 lezioni rimaste"; allenamento di oggi (l'attuale `WorkoutCard` + `useTodayWorkout`, rifatto in `panel`; a tutti spuntati `stato.segnaAllenamento(titolo)` e il riquadro "Allenamento completato! Marco lo vedrà nella tua scheda."); prossima seduta con "Vorrei spostarla" → `Foglio` "Sposta la seduta" con area di testo e "Invia a Marco" spento se vuoto → `stato.chiediSpostamento`; con `spostamento` presente la scheda mostra "Richiesta inviata, Marco ti risponde in chat"; obiettivo compatto (link a Progressi, percentuale da `avanzamento`); acqua (+ un bicchiere) e passi (tocco → `Foglio` con campo numerico `inputMode="numeric"`).
- [ ] **Step 4: Verifica** a 375 px e nella cornice sul computer: nessun testo sovrapposto, percentuale e barra dell'obiettivo arrivano a 39% (con la scheda del browser in primo piano), barra in basso che scivola, spostamento e completamento visibili nello stato (Task 10 li mostra al trainer), tema scuro, riduci movimento, console pulita.
- [ ] **Step 5:** `npx tsc --noEmit`, `npm test` → ok. Commit `feat: app del cliente su pagina unica con la schermata Oggi rifatta`.

### Task 5: Progressi

**Files:**
- Create: `components/prototipo/cliente/Progressi.tsx`
- Modify: `components/prototipo/cliente/ClientApp.tsx`

**Interfaces:**
- Consumes: `misure`, `stato.aggiungiMisura`, `variazione`, `leggiNumero`, `misuraValida`, `avanzamento` (Task 1); `Foglio` (Task 4); `SoftAreaChart` (`components/ui/SoftAreaChart.tsx`).

- [ ] **Step 1:** Obiettivo in grande (percentuale con `CountUp`, partenza 72 kg, oggi = ultimo peso, traguardo 64 kg, barra); peso con numero, "−3,1 kg dall'inizio" e grafico dei pesi di `misure`; misure (vita, fianchi, petto, braccio, coscia) con ultimo valore e variazione in verde se cala.
- [ ] **Step 2:** "Aggiungi misure" → `Foglio` con 6 campi `inputMode="decimal"` (vuoti ammessi, almeno uno pieno); errore sotto il campo se `leggiNumero` è null o `misuraValida` falso ("Controlla il valore: il peso va tra 30 e 250 kg"); "Salva" → `stato.aggiungiMisura({ data: "Oggi", … })`, avviso "Misure salvate: Marco le vede nella tua scheda".
- [ ] **Step 3: Verifica** a 375 px con i valori della Review Focus ("68,5", "abc", "500"); il grafico si aggiorna; la percentuale dell'obiettivo in Oggi segue il nuovo peso.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: Progressi del cliente con peso, misure e inserimento`.

### Task 6: Chat con il trainer e campanella del cliente

**Files:**
- Create: `components/prototipo/cliente/Chat.tsx`
- Modify: `components/prototipo/cliente/Shell.tsx`, `ClientApp.tsx`

**Interfaces:**
- Consumes: `threads[CLIENTE_DEMO]`, `stato.inviaMessaggio`, `nonLetti`, `useFileUrl` (Task 1).
- Produces in `Chat.tsx`: `useNonLettiCliente(): number` (messaggi del trainer non visti in questa finestra; i visti stanno in una variabile del modulo, all'apertura = tutti quelli presenti; entrando in Chat diventano tutti visti).

- [ ] **Step 1:** Chat: messaggi senza quelli `from: "assistant"`; quelli di Giulia a destra nel colore del trainer, quelli di Marco a sinistra su `soft`; allegato PDF con "Apri PDF" (`useFileUrl`); etichetta "Richiesta di spostamento" sui messaggi con `tag`; `break-words`; campo in basso sopra la barra, tasto spento se vuoto; scorre in fondo all'arrivo di un messaggio.
- [ ] **Step 2:** Barra in basso: numero sui non letti della Chat. Intestazione: campanella con lo stesso numero; aperta mostra gli ultimi messaggi non letti del trainer (anteprima di una riga), ogni voce porta alla Chat.
- [ ] **Step 3: Verifica** a 375 px: parola di 80 caratteri senza spazi resta nella bolla; con l'area trainer in un'altra finestra, un messaggio di Marco accende il numero e compare in Chat; un PDF inviato da Schede si apre dal cliente anche dopo aver chiuso la finestra del trainer.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: chat del cliente con il trainer e campanella`.

### Task 7: Documenti

**Files:**
- Create: `public/prototipo/dieta-esempio.pdf`, `public/prototipo/analisi-esempio.pdf` (una pagina ciascuno, generati una volta con pdf-lib da uno script nello scratchpad, non versionato)
- Create: `components/prototipo/cliente/Documenti.tsx`
- Modify: `libs/prototipo/stato.ts` (accanto a `shrinkPhoto`), `ClientApp.tsx`

**Interfaces:**
- Consumes: `documenti`, `sent`, `stato.aggiungiDocumento`, `controllaFile`, `useFileUrl` (Task 1).
- Produces: `rimpicciolisciFoto(file: File, lato: number): Promise<Blob>` (lato lungo ≤ `lato`, JPEG qualità 0,85; rifiuta se l'immagine non si decodifica).

- [ ] **Step 1:** I due PDF: titolo, "Documento dimostrativo", una riga che spiega cosa conterrebbe ("Qui il cliente trova il piano alimentare scritto dal suo nutrizionista" / "Qui il cliente carica le sue analisi"); nessun contenuto alimentare.
- [ ] **Step 2:** Elenco: `documenti` più le schede in `sent` per Giulia; icona per tipo, provenienza ("Dal nutrizionista", "Da Marco", "Caricato da te"), data; un tocco apre il file in una nuova scheda.
- [ ] **Step 3:** "Carica": input nascosto `accept="application/pdf,image/jpeg,image/png,image/webp"`; `controllaFile` → se no, avviso con `motivo`; foto → `rimpicciolisciFoto(file, 1600)` (errore → "Non riesco a leggere questa foto: prova con una JPG o PNG"); poi `stato.aggiungiDocumento({ da: "cliente", data: "Oggi", … })`.
- [ ] **Step 4: Verifica** con un PDF piccolo, una JPG grande, un `.docx`; il file caricato si apre; dimensione della foto salvata < 600 KB.
- [ ] **Step 5:** `npx tsc --noEmit` → ok. Commit `feat: documenti del cliente con caricamento di PDF e foto`.

### Task 8: Profilo e primo accesso

**Files:**
- Create: `components/prototipo/cliente/Profilo.tsx`, `components/prototipo/cliente/Consenso.tsx`
- Modify: `ClientApp.tsx`

**Interfaces:**
- Consumes: `consenso`, `stato.daiConsenso` (Task 1); `useTrainerPhoto`, `isSoundEnabled`/`setSoundEnabled`/`onSoundChange` (`libs/ui/sound.ts`), `useAppearance` (`components/ui/appearance.tsx`), `Toggle` (`components/ui/basics.tsx`), `Foglio` (Task 4).
- Produces: `Consenso({ readOnly, onEntra }: { readOnly?: boolean; onEntra?: () => void })`.

- [ ] **Step 1:** `Consenso`: logo del trainer, "Marco Rossi ti ha invitato", informativa in tre punti — "Cosa raccogliamo: peso, misure, allenamenti fatti e i dolori che segnali all'assistente." · "Chi li vede: solo il tuo trainer." · "Dove: su server in Unione Europea." — casella (bersaglio ≥ 44 px) "Acconsento al trattamento dei miei dati sulla salute per seguire il mio percorso"; "Entra" spento finché non è spuntata, con sotto "Senza il tuo consenso l'app non può salvare i tuoi progressi". `ClientApp` mostra `Consenso` a tutto schermo finché `consenso` è falso; "Entra" → `stato.daiConsenso()`.
- [ ] **Step 2:** `Profilo`: il tuo trainer (foto, nome, "Scrivi" → Chat); pacchetto ("Pacchetto 10 lezioni", "2 lezioni rimaste", "Scade il 30 novembre"); suoni (`Toggle`); tema chiaro/scuro (`setTheme` dal punto del tocco); "Rivedi informativa e consenso" → `Foglio` con `Consenso readOnly`.
- [ ] **Step 3: Verifica**: finestra nuova senza altre aperte → primo accesso; senza spunta non si entra; dopo, un'altra finestra cliente aperta non lo richiede (stato condiviso); suoni e tema funzionano.
- [ ] **Step 4:** `npx tsc --noEmit` → ok. Commit `feat: profilo del cliente e primo accesso con consenso`.

### Task 9: Leo per il cliente

**Files:**
- Create: `libs/prototipo/leo-cliente.ts`, `components/prototipo/cliente/LeoCliente.tsx`
- Modify: `Shell.tsx`
- Test: `tests/unit/leo-cliente.test.ts`

**Interfaces:**
- Consumes: `CoachFace`, `Bubble`, `useLeoChat`, `LeoThread` (Task 3); `Foglio` (Task 4); `stato.segnalaDolore` (Task 1); `assistantSuggestions`, `assistantAnswers`, `assistantFallback` (`dati-finti.ts`).
- Produces: `rispostaCliente(domanda: string): { text: string; dolore: boolean }`.

- [ ] **Step 1: Test** `tests/unit/leo-cliente.test.ts`:
  - ogni voce di `assistantSuggestions` → il testo corrispondente di `assistantAnswers`.
  - "Mi fa male il ginocchio" → `dolore: true`; "ho un fastidio alla schiena" → `dolore: true` e testo con "medico".
  - "Cosa mangio stasera?" e "Quante proteine devo prendere?" → `dolore: false` e testo che contiene "nutrizionista".
  - "Chi ha vinto la partita?" → testo che contiene "allenamento".
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementa `rispostaCliente`: domanda pronta esatta → sua risposta; dolore (`/male|dolor|fastidi|ginocch|schiena|spalla/i`) → risposta del ginocchio se c'è "ginocch", altrimenti "Fermati con l'esercizio che ti dà fastidio e fai solo quelli senza dolore. Se è forte o non passa in qualche giorno, senti un medico. Ho avvisato Marco, che ti scriverà."; alimentazione (`/mangi|dieta|aliment|cena|pranzo|colazion|protein|carboidrat|integrator/i`) → `assistantFallback`; altro → "Posso aiutarti con il tuo allenamento, gli esercizi e le abitudini. Per tutto il resto scrivi a Marco in chat."
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** `LeoCliente`: viso in cerchio `glass` da 52 px sopra la barra, a destra; vignetta di benvenuto ("Ciao Giulia! Oggi c'è il Giorno A 💪") una volta per finestra, 1,2 s dopo l'ingresso, per 4,5 s; tocco → foglio alto 80% con Leo affacciato dal bordo alto (testa e spalle di `in-piedi.webp`, come il vecchio `Peek` in `git show c1cc61c:components/prototipo/trainer/CoachAssistant.tsx`), `LeoThread` con `assistantSuggestions`; se `dolore` → `stato.segnalaDolore(domanda)`.
- [ ] **Step 6: Verifica** a 375 px: il foglio non copre la tacca, il campo non fa zoom, "Mi fa male il ginocchio" mette l'avviso nello stato.
- [ ] **Step 7:** `npx tsc --noEmit` → ok. Commit `feat: Leo nell'app del cliente`.

### Task 10: L'area trainer riceve dal vivo, verifica finale

**Files:**
- Modify: `components/prototipo/trainer/Urgent.tsx`, `TopBarTools.tsx`, `Cards.tsx` (`MessagesCard`), `Messages.tsx`, `libs/prototipo/dati-finti.ts` (`UrgentKind` + `"spostamento"`, `NotificationKind` + `"documento"`)
- Modify: `PROGRESS.md`

**Interfaces:**
- Consumes: `avvisi`, `threads`, `useAreaCollegata` (Task 1-2).

- [ ] **Step 1:** Urgenti: in cima gli avvisi `dolore` ("Dolore segnalato", con la frase) e `spostamento` ("Chiede di spostare la seduta", con il messaggio), nuovo gruppo "Richieste di spostamento" (icona `CalendarClock`, colore `#2f7dac`); il numero sul campanello li conta; ogni voce porta a `ROUTES.messaggi?cliente=giulia-bianchi`.
- [ ] **Step 2:** Campanella in alto: in cima `allenamento` ("ha completato Giorno A · Gambe e glutei"), `misure` ("ha aggiornato peso e misure"), `documento` ("ha caricato un documento: nome"), `when: "Adesso"`; il pallino si riaccende a ogni nuovo avviso; `documento` con icona `FileUp`.
- [ ] **Step 3:** Scheda Messaggi della home: in cima l'ultimo `messaggio`/`spostamento`/`dolore` di Giulia (con "dolore" in rosso), al posto della sua riga fissa.
- [ ] **Step 4:** Messaggi: etichetta "Richiesta di spostamento" sui messaggi con `tag`; non letti calcolati con `nonLetti` e un contatore "visti" per conversazione; con `useAreaCollegata("cliente")` vero niente risposte automatiche nel thread di Giulia (risponde la persona vera); suono `tap` all'arrivo di un messaggio del cliente.
- [ ] **Step 5: Verifica finale** con trainer e cliente in due finestre affiancate: allenamento completato, spostamento, messaggio, "Mi fa male il ginocchio", misure, documento → ognuno compare al trainer al posto giusto; messaggio e scheda del trainer → compaiono al cliente; cambio colore → il cliente si ricolora; chiudendo tutto si riparte puliti. Poi `npm test`, `npx tsc --noEmit` e `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build` → senza errori.
- [ ] **Step 6:** `PROGRESS.md`: area cliente completata, prossimo passo; changelog.
- [ ] **Step 7:** Commit `feat: l'area trainer riceve dal vivo gli avvisi del cliente`.
