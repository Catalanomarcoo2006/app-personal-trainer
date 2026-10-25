# Vocali a Leo: piano di implementazione

> **Per chi esegue:** sotto-skill richiesta: superpowers:executing-plans (consigliata qui, inline) o superpowers:subagent-driven-development. I passi usano le caselle (`- [ ]`).

**Obiettivo:** il trainer tiene premuto il microfono nella chat di Leo, parla, e il testo trascritto va a Leo (subito o dopo una rilettura, a sua scelta) come un messaggio scritto.

**Architettura:** un "trascrittore" con una forma unica (`avvia`, `ferma`, `annulla`); una sessione pura (`creaSessioneVoce`) che gestisce il gesto, il limite di tempo e gli errori; il primo trascrittore usa la dettatura del browser. La scelta "subito / rivedi" si ricorda in `localStorage`. Il tasto e le sue schede stanno in un componente nuovo; `CoachAssistant.tsx` riceve poche righe.

**Stack:** Next.js 15, React 19, TypeScript, Motion, Vitest 5 (ambiente node: la logica va testata in moduli senza DOM).

**Spec:** `docs/specs/2026-10-25-vocali-leo-design.md`.

## Vincoli globali

- Massimo `MAX_MS_VOCALE = 60_000` ms per vocale.
- Lingua della dettatura `it-IT`; risultati provvisori attivi (testo dal vivo).
- Il testo trascritto passa dal percorso dei messaggi scritti (`ask`): email e telefoni li toglie già `ripulisci`. Nessun altro canale verso Leo.
- Le azioni di Leo non cambiano: cancellazioni, messaggi ai clienti, soldi e nuovo cliente si confermano sempre nelle loro schede.
- L'audio non si salva; resta solo il testo.
- Con la dettatura del browser l'audio passa da Google: solo dati finti. Niente vocali con clienti veri finché non c'è il trascrittore UE (non fa parte di questo piano).
- Testi in italiano; commit in italiano con prefisso (`feat:`, `docs:`).
- `prefers-reduced-motion`: il microfono non pulsa. Nessun tasto nero (`btn-trainer`, `glass`).
- File nuovi sotto ~300 righe; `CoachAssistant.tsx` non cresce più di ~20 righe.
- `git push` solo con l'ok di Marco. Dopo il Task 4 e dopo il Task 6 **fermarsi**: la prova con la voce vera la fa Marco in Chrome o Edge.

## Punti da guardare in revisione

1. **Tocco velocissimo** sul microfono (premi e lasci subito): nessun testo, nessun blocco, messaggio "Non ho sentito niente, riprova". Test nel Task 1.
2. **Lasci mentre il browser sta ancora chiedendo il permesso** (primo uso): non si resta bloccati in ascolto; se il permesso è negato, errore chiaro. Test nel Task 1 e nel Task 3.
3. **Il dito scivola, la finestra perde il fuoco, `pointercancel`**: il vocale si annulla e la barra torna com'era. Verifica nel Task 4.
4. **C'è già del testo scritto nella barra** quando si parla: non si perde e "Invia subito" non manda mai un testo misto (va in rilettura). Test nel Task 1.
5. **`localStorage` non disponibile** (navigazione privata): la scelta vale solo per la pagina, niente errori. Test nel Task 2.

---

### Task 1: sessione del vocale (logica pura)

**Files:**
- Create: `libs/prototipo/leo-voce.ts`
- Test: `tests/unit/leo-voce.test.ts`

**Interfaces:**
- Produces (tutto esportato da `leo-voce.ts`):
  ```ts
  export type ErroreVoce = "permesso" | "nessun-microfono" | "nessuna-voce" | "non-supportato" | "interrotto";
  export class VoceErrore extends Error { constructor(readonly codice: ErroreVoce) }
  export type Dettato = { testo: string; parziale: boolean }; // parziale: il riconoscimento si è interrotto a metà
  export type Trascrittore = {
    avvia(onTesto: (testo: string) => void): Promise<void>; // rifiuta con VoceErrore
    ferma(): Promise<Dettato>; // rifiuta con VoceErrore
    annulla(): void;
  };
  export type SceltaVocali = "subito" | "rivedi" | null; // null: non ancora scelto
  export type StatoVoce = { fase: "fermo" | "in-ascolto"; testo: string; errore: ErroreVoce | null };
  export const MAX_MS_VOCALE = 60_000;
  export function creaSessioneVoce(t: Trascrittore, o: { onStato(s: StatoVoce): void; onFine(d: Dettato | null): void; maxMs?: number }): { premi(): Promise<void>; lascia(): Promise<void>; annulla(): void };
  export function cosaFare(scelta: SceltaVocali, d: Dettato, giaScritto: boolean): "invia" | "rivedi" | "chiedi";
  export function unisciTesto(base: string, dettato: string): string;
  export function messaggioErrore(e: ErroreVoce): string;
  ```

- [ ] **Step 1: scrivere i test** in `tests/unit/leo-voce.test.ts` con un trascrittore finto (`avvia`, `ferma`, `annulla` come `vi.fn`, con la possibilità di ritardare o rifiutare) e `vi.useFakeTimers()`. Casi, ognuno con le sue asserzioni:
  - `premi` → `onStato` riceve `{ fase: "in-ascolto", testo: "", errore: null }`; quando il trascrittore chiama `onTesto("Luca ha pagato")` lo stato ha quel testo.
  - `lascia` → chiama `ferma` una volta, `onFine({ testo: "Luca ha pagato", parziale: false })` (testo senza spazi ai bordi), stato `fermo` senza errore.
  - `lascia` con testo vuoto o solo spazi → `onFine(null)`, stato `{ fase: "fermo", testo: "", errore: "nessuna-voce" }`.
  - `avvia` rifiuta con `VoceErrore("permesso")` → stato `fermo` con `errore: "permesso"`; un `lascia` dopo non chiama `ferma` e dà `onFine(null)`.
  - `lascia` chiamato prima che `avvia` sia risolta: aspetta `avvia`, poi chiama `ferma` (nessun blocco in ascolto). Stesso caso con `avvia` che poi rifiuta.
  - `annulla` → `t.annulla` chiamato, stato `fermo` senza errore, `onFine` mai chiamata; un `onTesto` che arriva dopo l'annulla è ignorato; un `lascia` dopo non fa niente.
  - `premi` mentre è già in ascolto: `avvia` resta chiamata una sola volta.
  - dopo `maxMs` (fake timers, `maxMs: 1000`) parte da sola come un `lascia`: `ferma` chiamata e `onFine` con il testo.
  - `ferma` rifiuta con `VoceErrore("interrotto")` → `onFine(null)`, stato `fermo` con `errore: "interrotto"`.
  - `cosaFare`: `("subito", {testo:"x", parziale:false}, false)` → `"invia"`; `("rivedi", …, false)` → `"rivedi"`; `(null, …, false)` → `"chiedi"`; con `parziale: true` → `"rivedi"` per qualunque scelta; con `giaScritto: true` → `"rivedi"` per qualunque scelta.
  - `unisciTesto("", "ciao")` → `"ciao"`; `unisciTesto("Segna 77 kg ", "a Sara")` → `"Segna 77 kg a Sara"`.
  - `messaggioErrore`: i cinque testi esatti (vedi sotto).
- [ ] **Step 2: eseguire** `npx vitest run tests/unit/leo-voce.test.ts` → FAIL (modulo mancante).
- [ ] **Step 3: scrivere `libs/prototipo/leo-voce.ts`** con le firme sopra. Una "generazione" (contatore) invalida i risultati di una sessione annullata o già finita. Testi di `messaggioErrore`:
  - `permesso`: "Serve il permesso del microfono: abilitalo dal lucchetto vicino all'indirizzo"
  - `nessun-microfono`: "Non trovo un microfono"
  - `nessuna-voce`: "Non ho sentito niente, riprova"
  - `non-supportato`: "Questo browser non ascolta la voce: prova con Chrome o Edge"
  - `interrotto`: "Il vocale si è interrotto: controlla il testo prima di mandarlo"
- [ ] **Step 4: eseguire** il file di test → PASS; `npx tsc --noEmit` → nessun errore.
- [ ] **Step 5: commit** `feat: sessione del vocale di Leo (gesto, limite di tempo, errori)`.

### Task 2: scelta "subito / rivedi" ricordata

**Files:**
- Create: `libs/prototipo/leo-voce-scelta.ts`
- Test: `tests/unit/leo-voce-scelta.test.ts`

**Interfaces:**
- Consumes: `SceltaVocali` (Task 1).
- Produces:
  ```ts
  type Magazzino = Pick<Storage, "getItem" | "setItem" | "removeItem">;
  export function creaArchivioScelta(storage?: Magazzino): { leggi(): SceltaVocali; scrivi(s: SceltaVocali): void; iscriviti(fn: () => void): () => void };
  export function useSceltaVocali(): [SceltaVocali, (s: SceltaVocali) => void]; // useSyncExternalStore, null lato server
  ```
  Chiave `leo-vocali`; valori salvati `"subito"` / `"rivedi"`; `scrivi(null)` toglie la chiave.

- [ ] **Step 1: scrivere i test** con un magazzino finto in memoria: parte `null`; dopo `scrivi("subito")` `leggi()` dà `"subito"` e la chiave `leo-vocali` vale `"subito"`; un valore sconosciuto nel magazzino (`"boh"`) si legge come `null`; `scrivi(null)` toglie la chiave; `iscriviti` avvisa a ogni `scrivi` e dopo la disiscrizione non più; con un magazzino che lancia in `getItem` e `setItem` (come la navigazione privata) `leggi()` dà `null` senza errori e dopo `scrivi("rivedi")` `leggi()` dà `"rivedi"` (la scelta vale in memoria).
- [ ] **Step 2: eseguire** → FAIL.
- [ ] **Step 3: scrivere `leo-voce-scelta.ts`**; l'archivio di default usa `window.localStorage` (letto dentro `try`, perché anche solo accedervi può lanciare) e tiene il valore in memoria.
- [ ] **Step 4: eseguire** → PASS; `npx tsc --noEmit`.
- [ ] **Step 5: commit** `feat: la scelta dei vocali si ricorda nel browser`.

### Task 3: trascrittore del browser

**Files:**
- Create: `libs/prototipo/leo-voce-browser.ts`
- Test: `tests/unit/leo-voce-browser.test.ts`

**Interfaces:**
- Consumes: `Trascrittore`, `VoceErrore`, `ErroreVoce` (Task 1).
- Produces:
  ```ts
  export function erroreDaBrowser(codice: string): ErroreVoce;
  export function testoDaRisultati(r: ArrayLike<ArrayLike<{ transcript: string }>>): string;
  export function dettaturaDisponibile(): boolean;
  export function trascrittoreBrowser(): Trascrittore;
  ```
  Il costruttore (`SpeechRecognition` o `webkitSpeechRecognition`) si cerca su `globalThis` **a ogni chiamata**, non al caricamento del modulo (i test e la verifica nel browser ne inseriscono uno finto).

- [ ] **Step 1: scrivere i test.** Funzioni pure: `erroreDaBrowser("not-allowed")` e `("service-not-allowed")` → `"permesso"`; `("audio-capture")` → `"nessun-microfono"`; `("no-speech")` → `"nessuna-voce"`; `("language-not-supported")` → `"non-supportato"`; `("network")`, `("aborted")` e un codice qualunque → `"interrotto"`. `testoDaRisultati([[{transcript:" Luca ha pagato"}],[{transcript:" e Sara 77 kg"}]])` → `"Luca ha pagato e Sara 77 kg"`. Con una classe finta su `globalThis.SpeechRecognition` (con `start`, `stop`, `abort`, e i gestori `onstart`, `onresult`, `onerror`, `onend` che il test richiama):
  - senza costruttore su `globalThis`: `dettaturaDisponibile()` è `false` e `avvia` rifiuta con `VoceErrore("non-supportato")`;
  - flusso normale: `avvia` si risolve su `onstart`; un `onresult` chiama `onTesto` col testo provvisorio; `ferma` chiama `stop` e si risolve su `onend` con `{ testo: <ultimo testo>, parziale: false }`; la lingua impostata è `it-IT` e `interimResults` è `true`;
  - `onerror` con `not-allowed` prima di `onstart`: `avvia` rifiuta con `VoceErrore("permesso")`;
  - `onerror` con `network` dopo del testo: `ferma` si risolve con quel testo e `parziale: true`;
  - `onerror` con `no-speech`: `ferma` si risolve con `{ testo: "", parziale: false }`;
  - `annulla` chiama `abort` e i risultati che arrivano dopo sono ignorati.
- [ ] **Step 2: eseguire** → FAIL.
- [ ] **Step 3: scrivere `leo-voce-browser.ts`** con le firme sopra (`continuous: true`, `interimResults: true`, `lang: "it-IT"`).
- [ ] **Step 4: eseguire** → PASS; `npx tsc --noEmit`.
- [ ] **Step 5: commit** `feat: trascrittore della voce con la dettatura del browser`.

### Task 4: il microfono nella chat di Leo

**Files:**
- Create: `components/prototipo/trainer/MicrofonoLeo.tsx`
- Modify: `components/prototipo/trainer/CoachAssistant.tsx` (la barra, intorno a `const [draft, setDraft]` e al `<form ref={campo}>`)

**Interfaces:**
- Consumes: `creaSessioneVoce`, `cosaFare`, `unisciTesto`, `messaggioErrore` (Task 1); `useSceltaVocali` (Task 2); `trascrittoreBrowser`, `dettaturaDisponibile` (Task 3).
- Produces (da `MicrofonoLeo.tsx`):
  ```ts
  export type VoceLeo = { disponibile: boolean; inAscolto: boolean; errore: string | null; inAttesa: string | null; scegli(s: "subito" | "rivedi"): void; tasto: { onPointerDown; onPointerUp; onPointerCancel; onKeyDown } };
  export function useVoceLeo(o: { bloccato: boolean; draft: string; setDraft(t: string): void; invia(testo: string): void }): VoceLeo;
  export function TastoMicrofono({ voce }: { voce: VoceLeo }): JSX.Element | null; // null se !disponibile
  export function VoceStato({ voce }: { voce: VoceLeo }): JSX.Element | null; // errore sopra la barra e scheda della prima scelta
  ```

- [ ] **Step 1: scrivere `useVoceLeo`**:
  - `onStato` in ascolto → `setDraft(unisciTesto(draftDiPartenza, stato.testo))` (il testo dal vivo; `draftDiPartenza` è quello della barra al `premi`).
  - `onFine(d)`: se `null` → rimette `draftDiPartenza` nella barra. Altrimenti `cosaFare(scelta, d, draftDiPartenza.trim() !== "")`: `"invia"` → `setDraft("")` + `invia(d.testo)`; `"rivedi"` → `setDraft(unisciTesto(draftDiPartenza, d.testo))`; `"chiedi"` → rimette `draftDiPartenza` nella barra e salva `inAttesa = d.testo`.
  - `scegli(s)`: salva la scelta con `useSceltaVocali`, poi esegue il vocale in attesa come "invia" o "rivedi" e azzera `inAttesa`.
  - `bloccato` (Leo sta lavorando) ferma il tasto; il gesto usa le pointer events con `setPointerCapture`: al `pointerup` fuori dal tasto (margine 8 px) → `annulla`; `onPointerCancel`, `blur` della finestra ed `Esc` → `annulla`.
  - `errore` = `messaggioErrore(stato.errore)` quando c'è.
- [ ] **Step 2: scrivere `TastoMicrofono` e `VoceStato`** nello stile della barra: tasto rotondo da 26 px accanto al tasto "Allega"; in ascolto il microfono pulsa col colore del trainer (fermo se `useReducedMotion()`); `aria-label="Tieni premuto per parlare a Leo"`, `aria-pressed={inAscolto}`. `VoceStato`: l'errore come la riga rossa dei file (`text-[#d43b4f]`, stessa posizione di `erroreFile`); la scheda della prima scelta ha il testo trascritto tra virgolette e due tasti: "Mandalo subito a Leo (da ora sempre così)" e "Fammelo rivedere (da ora sempre così)".
- [ ] **Step 3: collegare in `CoachAssistant.tsx`**: `const voce = useVoceLeo({ bloccato: thinking, draft, setDraft, invia: (t) => ask(t) })`; `<TastoMicrofono voce={voce} />` dopo il tasto "Allega"; `<VoceStato voce={voce} />` accanto al blocco di `file`/`erroreFile`. Niente altra logica nel file.
- [ ] **Step 4: verificare** `npx tsc --noEmit` e `npm test` (tutto verde).
- [ ] **Step 5: verificare nel browser** con `preview_start` (`sviluppo`) e un trascrittore finto: prima di premere, con `javascript_tool` si definisce `globalThis.SpeechRecognition` come classe che emette `onstart`, poi due `onresult` ("Segna pagato Luca") e `onend` allo `stop`. Si inviano gli eventi `pointerdown` / `pointerup` sul tasto. Controlli: (a) premi → il testo compare dal vivo nella barra; (b) prima volta, lascia → scheda con due tasti, nessun invio; "subito" → il testo parte e Leo prepara le schede, la scelta resta dopo un ricaricamento; (c) con scelta "rivedi" → il testo resta nella barra; (d) con testo già scritto → mai invio diretto; (e) `pointerup` fuori dal tasto, `pointercancel` ed `Esc` → barra com'era; (f) senza `SpeechRecognition` il tasto non compare; (g) tap velocissimo → "Non ho sentito niente, riprova"; (h) niente errori in console.
- [ ] **Step 6: commit** `feat: il microfono nella chat di Leo`. **Fermarsi**: Marco prova con la voce vera in Chrome o Edge; `git push` solo con il suo ok.

### Task 5: Impostazioni e testi del benvenuto

**Files:**
- Modify: `components/prototipo/trainer/Settings.tsx` (scheda "Assistente virtuale", dopo il tono)
- Modify: `components/prototipo/benvenuto/passi/ConosciLeo.tsx:22`

**Interfaces:**
- Consumes: `useSceltaVocali` (Task 2).

- [ ] **Step 1: in `Settings.tsx`** aggiungere sotto "Tono delle risposte" una riga "Vocali a Leo" con il `Segmented` esistente (`id="vocali"`, opzioni "Invia subito" / "Rivedi prima") e, sotto, una riga di spiegazione: "Il tuo assistente Leo. Le azioni da confermare restano da confermare." Se la scelta è ancora `null`, nessuna opzione è evidenziata e il testo dice "Da scegliere al primo vocale". Il `Segmented` evidenzia solo il valore uguale a `value`: passare `value={scelta ?? ""}` e tipizzare `T` come `"subito" | "rivedi" | ""` senza mettere `""` tra le opzioni. Cambiare scelta suona `playSound("tap")`. Controllare a occhio che la scheda (`h-full`, con il riquadro "Rete di sicurezza" in basso) non si rompa su schermi bassi.
- [ ] **Step 2: in `ConosciLeo.tsx:22`** cambiare "quando lo lasci, il vocale parte" in un testo vero per entrambe le scelte: "Tieni premuto il microfono e parla: Leo scrive per te e prepara le azioni da confermare."
- [ ] **Step 3: verificare** `npx tsc --noEmit`, `npm test`; nel browser: la riga compare, la scelta fatta dal vocale si vede qui e viceversa; il passo "Conosci Leo" mostra il testo nuovo senza tagli.
- [ ] **Step 4: commit** `feat: scelta dei vocali nelle Impostazioni e testo del benvenuto`.

### Task 6: documenti, controlli finali

**Files:**
- Modify: `docs/specs/2026-10-25-vocali-leo-design.md` (la riga degli errori: il messaggio sta in una riga rossa sopra la barra, come l'errore dei file, non in un messaggio di Leo nella chat)
- Modify: `PROGRESS.md`, `CLAUDE.md` (sezione "Da non fare"), `docs/DA-CAMBIARE.md`, `IDEE.md`

- [ ] **Step 1: `CLAUDE.md`** → in "Da non fare": "Niente vocali con clienti veri finché non c'è il trascrittore UE (la dettatura del browser manda l'audio a Google): solo dati finti." `PROGRESS.md` → "Problemi noti": stessa regola, più "informativa: dire che la voce viene trascritta dal fornitore UE"; "Stato": vocali fatti con la dettatura del browser; "Da fare": trascrittore del server UE (`MediaRecorder` + rotta `app/prototipo/api/leo/voce`, variabili `AI_STT_*`); changelog.
- [ ] **Step 2: `docs/DA-CAMBIARE.md`** → spuntare "Vocali a Leo" e "Vocali a Leo dal telefono del trainer" (annotando che resta da fare il trascrittore UE); **`IDEE.md`** → spostare "Vocali a Leo dal telefono del trainer" in "Diventate progetto".
- [ ] **Step 3: controlli finali**: `npm test` (tutti verdi), `npx tsc --noEmit`, `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.
- [ ] **Step 4: commit** `docs: vocali a Leo, stato e regola sulla privacy`. **Fermarsi**: push solo con l'ok di Marco.
