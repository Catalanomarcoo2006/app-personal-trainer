# Leo agisce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leo, l'assistente del trainer, fissa, sposta e cancella appuntamenti e scrive ai clienti tramite tool calling, e l'app porta il trainer sul posto mostrando l'azione animata.

**Architecture:** Logica pura in `libs/prototipo/` (schemi e controlli in `leo-azioni.ts`, lettura dei flussi in `leo-flusso.ts`, esecuzione sullo store in `leo-esegui.ts`), testata con Vitest. Calendario (settimane 0 e 1) e conversazioni passano nello store condiviso `stato.ts`. La rotta `app/prototipo/api/leo` manda a DeepSeek i `tools` e restituisce NDJSON (testo + azioni); il browser controlla, esegue e anima, senza secondo giro verso l'AI.

**Tech Stack:** Next.js 15, React 19, TypeScript, zod 3, Motion (`motion/react`), lucide-react, Vitest, Playwright (`channel: "msedge"`).

**Spec:** `docs/specs/2026-10-24-leo-azioni-design.md`

## Global Constraints

- Solo dati finti: DeepSeek ha i server in Cina. Mai nome o email del cliente verso l'AI: clienti come codici `[C1]`… anche nel calendario e nel testo dei messaggi; il browser rimette i nomi (`ripristinaNomi`).
- Data della demo ferma: mercoledì 21/10/2026, ore `trainer.now` (10:20). Settimana 0 = 19–25 ottobre, settimana 1 = 26 ottobre – 1 novembre (`weekOf` in `Agenda.tsx`).
- Azioni immediate (con "Annulla"): `fissa_appuntamento`, `sposta_appuntamento`. Solo dopo "Conferma": `cancella_appuntamento`, `scrivi_messaggio`.
- Controlli: inizio ≥ 06:00, fine ≤ 22:00, durata 15–180 min, nessuna sovrapposizione, solo settimane 0 e 1, non prima di adesso, messaggio 1–1.000 caratteri. Massimo 5 azioni per risposta.
- Luogo predefinito: "Fit Lab, Meolo"; "Videochiamata" per Online; "Parco di Meolo" per Corsa.
- "Annulla" in evidenza 8 s, poi resta nella scheda. Messaggio inviato: niente "Annulla".
- Niente `blur` CSS; niente tasti neri (`btn-trainer`, `sel-trainer`, `panel`, `glass`); colori dai token (`var(--trainer)`, `--color-*`).
- `useReducedMotion()`: niente voli, molle, scrittura animata; restano dissolvenze ed evidenziazione ferma.
- Suoni solo `playSound` (`tap | open | close | nav | confirm | complete`): `complete` quando una seduta atterra, `open` per il volo, `close` per la cancellazione, `confirm` per l'invio del messaggio.
- Interfaccia, commenti e commit in italiano con prefisso (`feat:`, `fix:`, `docs:`, `chore:`), con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verifica di base di ogni task: `npx tsc --noEmit` senza errori e `npm test` verde.

## Review Focus

- **Ora scritta in modo strano dall'AI** ("9:00", "18.30", "ore 18"): lo schema accetta solo `HH:MM`; `normalizzaOra` porta "9:00" e "18.30" a "09:00"/"18:30" prima della validazione, il resto si scarta → test in Task 2.
- **Cliente indicato con le parentesi o senza** (`"[C3]"`, `"C3"`, `"c3"`) → `clienteDaCodice` li accetta tutti; codice inesistente (`"C99"`) → "Cliente non trovato" → test in Task 2.
- **Spostamento sullo stesso orario o sopra sé stesso** (sposta A5 di 30 min, sovrapponendosi solo a sé) → ammesso; sopra un'altra seduta → rifiutato con il nome vero → test in Task 2.
- **Annulla dopo una modifica manuale** (Leo sposta, il trainer poi cancella a mano un'altra seduta, poi "Annulla" di Leo) → si rimette solo la seduta toccata da Leo, la cancellazione manuale resta → test in Task 3.
- **Flusso con testo e tool_calls mescolati, argomenti spezzati in mezzo a una stringa, due azioni con indici 0 e 1** → due azioni ricomposte, testo intatto → test in Task 5.

---

### Task 1: Prova di DeepSeek con strumenti e ragionamento

Verifica, con la chiave vera in `.env.local` (dati finti), se `tools` funziona insieme a `thinking: { type: "enabled" }` in streaming. Script usa e getta nello scratchpad, fuori dal repo; non legge né stampa la chiave (la carica `node --env-file=.env.local`).

**Files:**
- Create (scratchpad, non versionato): `prova-tools.mjs`

**Interfaces:**
- Produces: la decisione `THINKING_CON_TOOLS = true | false`, scritta come commento in testa a `route.ts` nel Task 5.

- [ ] **Step 1:** Scrivere `prova-tools.mjs`: una POST a `${AI_BASE_URL ?? "https://api.deepseek.com"}/chat/completions` con `model: AI_MODEL ?? "deepseek-flash"`, `stream: true`, `thinking: {type:"enabled"}`, un solo tool `sposta_appuntamento` (schema del Task 2) e il messaggio "Sposta A3 a venerdì 23 ottobre alle 10:00". Stampa i tipi di delta ricevuti (`reasoning_content`, `content`, `tool_calls`) e gli argomenti ricomposti.
- [ ] **Step 2:** Eseguire `node --env-file=.env.local <scratchpad>/prova-tools.mjs` dalla cartella del progetto. Atteso: un `tool_calls` con `{"id":"A3","data":"2026-10-23","ora":"10:00"}`. Se errore 400 o niente `tool_calls`, ripetere senza `thinking`.
- [ ] **Step 3:** Annotare l'esito (con o senza ragionamento) per il Task 5 e riferirlo a Marco in una riga. Niente commit.

---

### Task 2: Azioni, schemi e controlli (`leo-azioni.ts`)

**Files:**
- Create: `libs/prototipo/leo-azioni.ts`
- Modify: `libs/prototipo/leo-contesto.ts` (esportare `clienteDaCodice`, `codiceDi`)
- Test: `tests/unit/leo-azioni.test.ts`

**Interfaces:**
- Consumes: `Appointment`, `AppointmentType`, `clientById`, `trainer` da `dati-finti.ts`.
- Produces:
  ```ts
  export type Seduta = Appointment & { id: string; date: string }; // date "AAAA-MM-GG"
  export type AzioneLeo =
    | { nome: "fissa_appuntamento"; dati: { cliente: string; data: string; ora: string; durata: number; tipo: AppointmentType; luogo?: string } }
    | { nome: "sposta_appuntamento"; dati: { id: string; data: string; ora: string; durata?: number } }
    | { nome: "cancella_appuntamento"; dati: { id: string } }
    | { nome: "scrivi_messaggio"; dati: { cliente: string; testo: string } };
  export const LEO_TOOLS: { type: "function"; function: { name: string; description: string; parameters: object } }[];
  export const MAX_AZIONI = 5;
  export const ADESSO: { data: "2026-10-21"; ora: string }; // ora = trainer.now
  export const GIORNI_LEO: string[]; // le 14 date delle settimane 0 e 1
  export function normalizzaOra(s: string): string | null;
  export function leggiAzione(nome: string, argomenti: unknown): AzioneLeo | null; // normalizza + zod; null se malformata
  export function inChiaro(a: AzioneLeo): AzioneLeo | null; // codici → clientId, testo con ripristinaNomi; null se cliente sconosciuto
  export type Verifica = { ok: true } | { ok: false; motivo: string };
  export function verificaAzione(a: AzioneLeo, sedute: Seduta[], adesso?: typeof ADESSO): Verifica; // a già inChiaro
  export const daConfermare: (a: AzioneLeo) => boolean;
  export function luogoPredefinito(tipo: AppointmentType): string;
  export function riassunto(a: AzioneLeo, sedute: Seduta[]): string; // "Sposto Sara Conti · gio 22/10 10:00 → ven 23/10 10:00"
  export type StatoScheda = "da-confermare" | "in-corso" | "fatto" | "annullato" | "rifiutato" | "errore";
  export function notaPerLeo(schede: { azione: AzioneLeo; stato: StatoScheda; motivo?: string }[]): string; // "(fatto: …; …)" con codici, "" se vuoto
  ```
  In `leo-contesto.ts`: `export function clienteDaCodice(c: string): string | undefined` (accetta `"[C3]"`, `"C3"`, `"c3"`) e `export const codiceDi`.

- [ ] **Step 1: Test che falliscono** in `tests/unit/leo-azioni.test.ts`:
  - `normalizzaOra`: `"9:00"→"09:00"`, `"18.30"→"18:30"`, `"18:00"→"18:00"`, `"ore 18"→null`, `"25:00"→null`.
  - `leggiAzione("sposta_appuntamento", {id:"A3",data:"2026-10-23",ora:"10:00"})` → azione; `leggiAzione("vola", {})` → `null`; `leggiAzione("fissa_appuntamento", {cliente:"C1"})` → `null`; `scrivi_messaggio` con `testo: ""` → `null`, con 1.001 caratteri → `null`.
  - `clienteDaCodice("[C3]") === clienteDaCodice("c3")` ed è definito; `clienteDaCodice("C99") === undefined`; `inChiaro` con `C99` → `null`; `inChiaro` di `scrivi_messaggio` con `"Ciao [C3]"` → testo col nome vero.
  - `verificaAzione` sulle sedute di prova (una seduta A1 il 2026-10-22 alle 18:00 per 60 min con `giulia-bianchi`):
    - fissa il 2026-10-22 alle 18:30 → `{ok:false, motivo:"Si sovrappone con Giulia Bianchi alle 18:00"}`;
    - fissa alle 19:00 → ok (sedute attaccate non si sovrappongono); fissa alle 17:00 per 60 min → ok; alle 05:30 → motivo che cita le 6:00; alle 21:30 per 60 min → motivo che cita le 22:00; durata 10 o 200 → rifiutata;
    - data `2026-11-02` → rifiutata (fuori dalle due settimane); `2026-10-21` alle 09:00 → rifiutata (prima di adesso);
    - sposta A1 alle 18:30 → ok (si sovrappone solo a sé); sposta `A99` → "Appuntamento non trovato".
  - `daConfermare`: true solo per `cancella_appuntamento` e `scrivi_messaggio`.
  - `notaPerLeo` con uno spostamento fatto e un messaggio annullato → contiene `fatto: spostato A1 a 2026-10-23 10:00` e `annullato dal trainer` e il codice `[C…]`, non il nome.
- [ ] **Step 2:** `npx vitest run tests/unit/leo-azioni.test.ts` → FAIL (modulo mancante).
- [ ] **Step 3:** Implementare `leo-azioni.ts`. Lo schema zod è una `z.discriminatedUnion` costruita per nome; `LEO_TOOLS` si scrive a mano (descrizioni in italiano che dicono quando usarle; `cliente` = codice tipo "C3"; `data` in `AAAA-MM-GG`; `tipo` come enum). Date con stringhe ISO e `toMinutes` di `Agenda.tsx` (spostare `toMinutes` in `leo-azioni.ts` o in un modulo comune se `Agenda.tsx` è un client component che non si può importare in un test).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: azioni di Leo (schemi, controlli, riassunti)`.

---

### Task 3: Calendario e conversazioni nello store, esecuzione e annullamento

**Files:**
- Modify: `libs/prototipo/stato.ts`
- Create: `libs/prototipo/leo-esegui.ts`
- Modify: `components/prototipo/trainer/WeekCalendar.tsx` (settimane 0 e 1 dallo store; le altre restano locali), `components/prototipo/trainer/Messages.tsx` (thread dallo store)
- Test: `tests/unit/leo-esegui.test.ts`

**Interfaces:**
- Consumes: `Seduta`, `AzioneLeo`, `verificaAzione`, `luogoPredefinito` (Task 2); `weekOf` (`Agenda.tsx`, o la sua parte di dati spostata in `libs/`).
- Produces in `stato.ts` (stato in più: `sedute: Seduta[]`, `threads: Record<string, ChatMessage[]>`, `focus: FocusLeo | null`):
  ```ts
  export type FocusLeo = { seq: number; tipo: "fissa" | "sposta" | "cancella" | "messaggio"; id?: string; clientId?: string; da?: { date: string; time: string }; testo?: string };
  stato.addSeduta(s: Omit<Seduta, "id">): Seduta  // id "A" + progressivo
  stato.updateSeduta(id: string, patch: Partial<Omit<Seduta, "id">>): void
  stato.removeSeduta(id: string): void
  stato.putSeduta(s: Seduta): void                // rimette una seduta (annulla)
  stato.addMessage(clientId: string, m: ChatMessage): void
  stato.setFocus(f: Omit<FocusLeo, "seq"> | null): void
  ```
  `addSent` aggiunge anche il messaggio col PDF al thread (oggi lo ricostruisce `initialThreads`).
- Produces in `leo-esegui.ts`:
  ```ts
  export type Esito = { ok: true; annulla?: () => void } | { ok: false; motivo: string };
  export function eseguiAzione(a: AzioneLeo): Esito; // a già inChiaro; verifica sullo stato attuale, poi modifica + setFocus
  ```
  `annulla` tocca solo la seduta dell'azione (fissa → `removeSeduta`; sposta → `updateSeduta` ai valori di prima; cancella → `putSeduta`) e imposta un focus con il viaggio al contrario.

- [ ] **Step 1: Test che falliscono** in `tests/unit/leo-esegui.test.ts` (stato reimpostato con una funzione di test `stato.reset()` esportata solo per i test, o ricaricando il modulo con `vi.resetModules`):
  - lo store parte con le sedute delle settimane 0 e 1, id unici, date `2026-10-19`…`2026-11-01`, e il giovedì 22 ha Sara Conti alle 10:00;
  - `eseguiAzione(fissa C… 2026-10-26 09:00 60 Workout)` → seduta in più con luogo "Fit Lab, Meolo", focus `{tipo:"fissa", id}`; `annulla()` → sedute identiche a prima (`toEqual`);
  - sposta → seduta con nuova data e ora, focus con `da`; annulla → data e ora di prima;
  - cancella → seduta sparita; annulla → seduta di nuovo presente, stesso id;
  - Review Focus: sposta A_x, poi `stato.removeSeduta(A_y)` a mano, poi annulla dello spostamento → A_x torna com'era e A_y resta cancellata;
  - `scrivi_messaggio` → ultimo messaggio del thread `{from:"trainer", text, time:"Adesso"}`, nessun `annulla`;
  - azione che non passa i controlli → `{ok:false, motivo}` e stato invariato.
- [ ] **Step 2:** `npx vitest run tests/unit/leo-esegui.test.ts` → FAIL.
- [ ] **Step 3:** Implementare store e `leo-esegui.ts`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Spostare `WeekCalendar` (offset 0 e 1) e `MessagesView` sullo store con `useStato`; le modifiche manuali (nuova seduta, sposta, annulla seduta, invio messaggio, scheda inviata) passano dalle funzioni dello store. Le settimane con offset diverso da 0 e 1 restano col `edits` locale.
- [ ] **Step 6:** Prova a mano con `npm run dev` su `/prototipo/trainer/calendario` e `/messaggi`: fissare, spostare, annullare una seduta, mandare un messaggio, mandare una scheda da Schede; tutto come prima, e i cambi restano passando da una sezione all'altra.
- [ ] **Step 7:** `npx tsc --noEmit` e `npm test` verdi; commit `feat: calendario e messaggi nello stato condiviso, esecuzione delle azioni di Leo`.

---

### Task 4: Contesto di Leo con il calendario vivo e le regole delle azioni

**Files:**
- Modify: `libs/prototipo/leo-contesto.ts`
- Test: `tests/unit/leo-contesto.test.ts`

**Interfaces:**
- Consumes: `Seduta` (Task 2).
- Produces:
  ```ts
  export const SedutaContesto: z.ZodType<Seduta>; // per validare il calendario mandato dal browser (max 80)
  export function contestoLeo(sedute?: Seduta[]): string; // senza argomento: settimane 0 e 1 di weekOf, come oggi
  ```

- [ ] **Step 1: Test che falliscono** (aggiunti a `leo-contesto.test.ts`):
  - `contestoLeo(sedute)` contiene la riga di una seduta come `A3 · giovedì 22/10 · 10:00 · 60 min · workout · Fit Lab, Meolo · [C…]` e la sezione "## Calendario (questa settimana e la prossima)";
  - contiene "mercoledì 21 ottobre 2026" e l'ora della demo;
  - non contiene nessun nome di cliente (ciclo su `clients`, come i test attuali);
  - contiene le regole: frase "usa le azioni solo" e "se non è chiaro" (o le parole scelte, purché il test le fissi).
- [ ] **Step 2:** `npx vitest run tests/unit/leo-contesto.test.ts` → FAIL.
- [ ] **Step 3:** Sostituire "## Agenda della settimana" con il calendario delle due settimane da `sedute`. In `ISTRUZIONI` aggiungere: usa le azioni solo quando il trainer chiede di fare qualcosa, non per le sole domande; se cliente, giorno o seduta non sono chiari, chiedi senza agire; indica le sedute con il loro id (A…); accompagna sempre le azioni con una frase breve che dica cosa fai; nei messaggi ai clienti tono cordiale, codice del cliente, niente firma. Togliere l'etichetta `[[vai:calendario]]` quando c'è un'azione (resta per le sole domande).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: Leo vede il calendario di due settimane e sa quando agire`.

---

### Task 5: Rotta con strumenti e uscita NDJSON

**Files:**
- Create: `libs/prototipo/leo-flusso.ts`
- Modify: `app/prototipo/api/leo/route.ts`
- Test: `tests/unit/leo-flusso.test.ts`, `tests/unit/leo-route.test.ts`

**Interfaces:**
- Consumes: `LEO_TOOLS`, `leggiAzione`, `MAX_AZIONI` (Task 2); `contestoLeo(sedute)`, `SedutaContesto` (Task 4); esito del Task 1.
- Produces in `leo-flusso.ts`:
  ```ts
  export type EventoLeo = { tipo: "testo"; v: string } | ({ tipo: "azione" } & AzioneLeo) | { tipo: "errore"; v: string };
  export function raccoglitoreAzioni(): { aggiungi(toolCalls: unknown): void; azioni(): AzioneLeo[] }; // per indice; JSON.parse + leggiAzione alla fine; max MAX_AZIONI
  export function lettoreNdjson(onEvento: (e: EventoLeo) => void): { scrivi(pezzo: string): void; chiudi(): void }; // per il browser, righe spezzate a metà
  ```
  Richiesta alla rotta: `{ messages, calendario?: Seduta[] }`. Risposta: `application/x-ndjson`, una riga `EventoLeo` per evento; errori prima dello stream restano JSON con status come oggi.

- [ ] **Step 1: Test che falliscono** in `leo-flusso.test.ts`:
  - Review Focus: delta con `tool_calls` index 0 `{name:"sposta_appuntamento", arguments:'{"id":"A3","da'}` poi `'ta":"2026-10-23","ora":"10:00"}'`, index 1 `cancella_appuntamento` `'{"id":"A5"}'` → due azioni in ordine;
  - argomenti non JSON o azione sconosciuta → scartata, le altre restano; 7 azioni → 5;
  - `lettoreNdjson` con `'{"tipo":"testo","v":"Ci'` + `'ao"}\n{"tipo":"azione",...}\n'` → due eventi; riga non JSON → ignorata.
- [ ] **Step 2:** Aggiornare `leo-route.test.ts`: le risposte si leggono come NDJSON (testo concatenato degli eventi `testo` uguale a quello di oggi); nuovo test con un flusso SSE finto che contiene `tool_calls` → l'ultimo evento è `{tipo:"azione", nome:"sposta_appuntamento", …}`; la richiesta al fornitore ha `tools` e `tool_choice:"auto"`; un `calendario` con nomi nel campo `place` arriva pseudonimizzato; `calendario` con 81 elementi → 400.
- [ ] **Step 3:** `npm test` → FAIL.
- [ ] **Step 4:** Implementare `leo-flusso.ts` e la rotta: `tools: LEO_TOOLS`, `tool_choice: "auto"`, `thinking` secondo il Task 1 (commento in testa con l'esito); `delta.content` → evento `testo`; `delta.tool_calls` → raccoglitore; a fine flusso un evento `azione` per ognuna. Il `pull` deve continuare a leggere finché ha qualcosa da mandare, come ora.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: Leo riceve gli strumenti e la rotta risponde in NDJSON con testo e azioni`.

---

### Task 6: Schede delle azioni nella chat

**Files:**
- Create: `components/prototipo/trainer/LeoAzioni.tsx`
- Modify: `components/prototipo/trainer/CoachAssistant.tsx` (`useCoachChat`, `Msg`, rendering dei messaggi)

**Interfaces:**
- Consumes: `lettoreNdjson`, `EventoLeo` (Task 5); `inChiaro`, `verificaAzione`, `daConfermare`, `riassunto`, `notaPerLeo`, `StatoScheda` (Task 2); `eseguiAzione` (Task 3); `stato.get().sedute`.
- Produces:
  ```ts
  export type SchedaAzione = { key: string; azione: AzioneLeo; stato: StatoScheda; motivo?: string; annulla?: () => void; fattaAlle?: number };
  export function SchedaAzioneView(props: { scheda: SchedaAzione; onConferma(testo?: string): void; onRifiuta(): void; onAnnulla(): void; onTorna?(): void }): JSX.Element;
  ```
  `Msg` riceve `schede?: SchedaAzione[]`. `useCoachChat` espone anche `conferma(msgId, key, testo?)`, `rifiuta(msgId, key)`, `annulla(msgId, key)`.

- [ ] **Step 1:** In `useCoachChat`: mandare `calendario: stato.get().sedute` nella richiesta; leggere con `lettoreNdjson`; gli eventi `testo` fanno quello che fa oggi il testo grezzo (`estraiAzione`, `ripristinaNomi`); ogni evento `azione` → `inChiaro` (se `null`, scheda "errore" con "Cliente non trovato") → scheda in coda. A fine risposta parte la sequenza (Task 7 aggiunge il viaggio; qui `eseguiAzione` diretto): immediate → `eseguiAzione`, poi "fatto" o "rifiutato" col motivo; da confermare → la sequenza si ferma finché non arriva `conferma` o `rifiuta`.
- [ ] **Step 2:** Nella cronologia (`history.current`) il contenuto di Leo diventa `testo + " " + notaPerLeo(schede)`, aggiornato a ogni cambio di stato delle schede.
- [ ] **Step 3:** `SchedaAzioneView`: icona per tipo (lucide: `CalendarPlus`, `CalendarClock`, `CalendarX`, `Send`), riassunto, stato. Da confermare: "Conferma" (`btn-trainer`) e "Annulla"; per il messaggio una `textarea` col testo modificabile (≥ 16 px sotto `md`). Fatto: "Fatto ✓" e "Annulla" in evidenza per 8 s (poi link testuale); rifiutato/errore: motivo in rosso tenue. Ingresso con dissolvenza + leggero sollevamento (solo dissolvenza con riduci movimento).
- [ ] **Step 4:** Prova a mano (`npm run dev`, chiave in `.env.local`): "sposta Sara a venerdì alle 10", "cancella Davide di giovedì e avvisalo", "chi deve pagare?" (nessuna scheda), "sposta l'allenamento di giovedì" (Leo chiede). Controllare in Calendario e Messaggi che i dati cambino.
- [ ] **Step 5:** `npx tsc --noEmit` e `npm test` verdi; commit `feat: schede delle azioni di Leo nella chat, con conferma e annulla`.

---

### Task 7: Il viaggio (chat compatta, cambio sezione, animazioni)

**Files:**
- Create: `libs/prototipo/leo-viaggio.ts`
- Modify: `components/prototipo/trainer/CoachAssistant.tsx` (stato compatto della chat, sequenza con attese), `components/prototipo/trainer/WeekCalendar.tsx`, `components/prototipo/trainer/Messages.tsx`, `components/prototipo/trainer/nav.ts`

**Interfaces:**
- Consumes: `FocusLeo`, `stato.setFocus` (Task 3); `SchedaAzione` e la sequenza (Task 6); `navigate`, `ROUTES` (`nav.ts`).
- Produces:
  ```ts
  // leo-viaggio.ts
  export function sezioneDi(a: AzioneLeo, clientId?: string): string; // ROUTES.calendario oppure ROUTES.messaggi + "?cliente=<id>"
  export function settimanaDi(date: string): 0 | 1;
  export const TEMPI: { compatta: 350; arrivo: 450; azione: 900; ritorno: 1000; traUnaEAltra: 1200 }; // ms; con riduci movimento azione 300
  // nav.ts
  export function navigateFade(href: string): Promise<void>; // dissolvenza veloce, risolve quando la sezione è visibile (riusa sectionShown)
  ```

- [ ] **Step 1: Test** in `tests/unit/leo-azioni.test.ts` (o un file nuovo): `sezioneDi` per le quattro azioni; `settimanaDi("2026-10-25") === 0`, `settimanaDi("2026-10-26") === 1`.
- [ ] **Step 2:** Implementare `leo-viaggio.ts` e `navigateFade` (opacità 1→0→1 sul contenitore delle sezioni, ~150 ms per lato, niente macchia).
- [ ] **Step 3:** Sequenza di `CoachAssistant`: per ogni azione eseguita (o confermata), chat in stato `compatta` (striscia sul bordo destro, larghezza ~120 px, Leo resta aggrappato: `SidePeek` segue il bordo), `navigateFade(sezioneDi(...))` ricordando la sezione di partenza, `eseguiAzione`, attesa `TEMPI.azione`, poi chat grande dopo `TEMPI.ritorno`. Più azioni: `TEMPI.traUnaEAltra` tra l'una e l'altra. "Torna dov'eri" → `navigateFade(partenza)`. "Annulla" rifà lo stesso viaggio con l'`annulla()` dell'esito.
- [ ] **Step 4:** `WeekCalendar`: quando `focus.seq` cambia e il tipo è di calendario, porta `offset` a `settimanaDi`, illumina la cella (anello `var(--trainer)` che pulsa due volte) e anima: fissa → la seduta entra con scala 0,6→1 a molla e `playSound("complete")`; sposta → `layoutId={seduta.id}` sulla scheda della seduta perché voli tra le celle, `playSound("open")`; cancella → la seduta esce con scala 1→0,85 e opacità 0 lasciando per ~600 ms un contorno tratteggiato nella sua posizione, `playSound("close")`. Con riduci movimento: niente scala né volo, solo dissolvenza ed evidenziazione ferma.
- [ ] **Step 5:** `Messages`: quando `focus.tipo === "messaggio"`, apre il thread del cliente, scrive `focus.testo` nella barra a ~25 ms per carattere (tutto subito con riduci movimento), poi lo invia con `playSound("confirm")` e il fumetto entra come i messaggi normali. In questo caso `eseguiAzione` del messaggio si fa alla fine della scrittura, non all'inizio.
- [ ] **Step 6:** Sotto `md` (375 px): invece della striscia la chat si chiude (`CoachButton` resta), poi si riapre da sola dopo il ritorno.
- [ ] **Step 7:** Prova a mano delle frasi del Task 6 a 1440 px, guardando il viaggio completo e "Annulla".
- [ ] **Step 8:** `npx tsc --noEmit` e `npm test` verdi; commit `feat: Leo porta il trainer dove agisce (chat compatta, calendario e messaggi animati)`.

---

### Task 8: Prova con DeepSeek, verifica completa e chiusura

**Files:**
- Create (scratchpad): `prova-frasi.mjs`; script Playwright `verifica-leo.mjs`
- Modify: `PROGRESS.md`, `docs/chiavi.md` (solo se cambiano le variabili AI_*)

- [ ] **Step 1:** `prova-frasi.mjs`: POST alla rotta locale (`npm run dev` avviato) con il calendario iniziale e queste frasi, stampando eventi `azione` e testo:
  1. "Sposta Sara a venerdì alle 10" → `sposta_appuntamento` della seduta di Sara del 22/10;
  2. "Fissa una valutazione con Paolo lunedì prossimo alle 9" → `fissa_appuntamento` 2026-10-26 09:00 Valutazione;
  3. "Cancella Davide di giovedì e avvisalo" → `cancella_appuntamento` + `scrivi_messaggio`;
  4. "Scrivi a Luca di chiamarmi per il ginocchio" → `scrivi_messaggio`;
  5. "Chi deve pagare?" → nessuna azione;
  6. "Sposta l'allenamento di giovedì" → nessuna azione, domanda di chiarimento;
  7. "Annulla tutto venerdì" → solo `cancella_appuntamento` (da confermare);
  8. "Metti Giulia giovedì alle 18:30" → azione proposta (il controllo poi rifiuta la sovrapposizione);
  9. "Che allenamenti ho domani?" → nessuna azione;
  10. "Fissa Chiara domenica alle 23" → azione o domanda; se azione, il controllo la rifiuta.
  Se una frase sbaglia, ritoccare le descrizioni dei tool o le regole del Task 4 e ripetere (massimo due giri, poi riferire a Marco).
- [ ] **Step 2:** Playwright (`channel: "msedge"`) su `/prototipo/trainer`: frasi 1 e 3 a 1440×900 e 375×812, chiaro e scuro, e con `reducedMotion: "reduce"`; screenshot nello scratchpad a metà viaggio e alla fine; nessun errore in console.
- [ ] **Step 3:** `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build` → verde.
- [ ] **Step 4:** Aggiornare `PROGRESS.md` (stato, decisione "tool calling con un solo giro", changelog; sotto le 60 righe) e committare `docs: Leo agisce, stato e prossimi passi`. Push solo con l'ok di Marco.
