# Leo fa tutto: piano di implementazione

> **Per chi esegue:** sotto-skill richiesta: superpowers:executing-plans (consigliata qui, inline) o superpowers:subagent-driven-development. I passi usano le caselle (`- [ ]`).

**Obiettivo:** Leo esegue soldi e pacchetti, dati dei clienti, impostazioni, messaggi a più clienti e legge i file allegati, sullo stesso meccanismo di azioni del 24/10, con i dati in una forma pronta per Supabase.

**Architettura:** i dati dei clienti passano in forma "da database" (`libs/dati/tipi.ts`) nello store condiviso; ogni modifica passa da uno sportello asincrono (`libs/dati/sportello.ts`) che usa i controlli puri di `libs/domain/` e restituisce l'inversa per "Annulla". Le pagine leggono con selettori che ricostruiscono la vista di oggi (`ClienteVista`, stessa forma di `Client`), così il loro markup cambia poco. Le azioni di Leo sono voci in più dello stesso menu, eseguite dallo sportello.

**Stack:** Next.js 15, React 19, TypeScript, zod 3, Motion, Vitest 5, pdfjs-dist 6, DeepSeek (API compatibile OpenAI, tool calling).

**Spec:** `docs/specs/2026-10-25-leo-fa-tutto-design.md` (e, per quello che non cambia, `docs/specs/2026-10-24-leo-azioni-design.md`).

## Vincoli globali

- Importi sempre in centesimi nei dati (`amountCents`, `priceCents`); gli argomenti dell'AI sono in euro e si convertono con `Math.round(euro * 100)`.
- Verso l'AI mai email e telefoni: tutto quello che va alla rotta passa da `ripulisci`; il browser non manda `email`/`phone` dei clienti.
- Dati finti soltanto (DeepSeek ha server in Cina).
- Conferma: `scrivi_a_piu`, `segna_pagato`, `registra_pagamento`, `rinnova_pacchetto`, `sollecita`, `nuovo_cliente`, e **ogni** azione sui dati in una risposta a un messaggio con allegato. Subito + Annulla: `aggiorna_misure`, `aggiorna_obiettivo`, `aggiungi_nota`, `cambia_aspetto`, `imposta_notifiche`.
- Limiti: importo 1-5.000 €; lezioni 1-50; mesi 1-12; peso 30-250 kg; circonferenze 15-200 cm; misura non nel futuro (oggi della demo `2026-10-21`); testo messaggi 1-1.000 caratteri; destinatari 1-50; `MAX_AZIONI = 10`; file max 5 MB, testo max 6.000 caratteri.
- Interfaccia e testi in italiano; commit in italiano con prefisso (`feat:`, `fix:`, `docs:`, `chore:`).
- Animazioni con Motion, rispetto di `prefers-reduced-motion`, niente `blur` CSS, nessun tasto nero (`btn-trainer`).
- Ogni file nuovo sotto ~400 righe; `CoachAssistant.tsx` (1.209 righe) non deve crescere di più di ~60 righe: la logica nuova va nei moduli `libs/`.
- Dopo i task 6, 8, 10, 11 e 12: **fermarsi**, `git push` solo con l'ok di Marco, Marco prova sul sito.

## Punti da guardare in revisione

1. **Annulla dopo una modifica a mano:** Leo aggiorna il peso, poi il trainer segna a mano un'altra misura; "Annulla" di Leo deve togliere solo la riga di Leo. Test nel Task 3.
2. **Stesso pagamento segnato due volte:** il trainer tocca "Segna pagato" in Pagamenti mentre la scheda di Leo per lo stesso pagamento è da confermare; alla conferma la scheda dice "Il pagamento è già segnato" e non raddoppia l'incasso. Test nel Task 7.
3. **Nome del cliente creato da Leo:** dopo `nuovo_cliente` "Sara Conti" la frase seguente "fissa Sara giovedì" deve trovare il cliente nuovo (o chiedere se è ambiguo con un'altra Sara). Test nel Task 9 (`clienteDa` con l'elenco attuale).
4. **Importi con la virgola e simboli:** "450,50 €" o `"450"` (stringa) dall'AI devono diventare 45050 / 45000 centesimi, non NaN. Test nel Task 7.
5. **File con nomi di clienti in maiuscolo o al contrario** ("CONTI SARA"): il testo arriva a Leo così com'è; la scheda mostra il cliente giusto o un errore "Cliente non trovato", mai un altro cliente. Test nel Task 9 (`clienteDa("CONTI SARA")` → `sara-conti`).

---

## Base

### Task 1: Forme dei dati e conversione dai dati finti

**File:**
- Crea: `libs/dati/tipi.ts`, `libs/dati/iniziali.ts`
- Test: `tests/unit/dati-iniziali.test.ts`

**Interfacce:**
- Produce (`tipi.ts`):
  - `ClienteDati = { id: string; name: string; gender: "donna" | "uomo"; initials: string; photo?: string; tone: Tone; since: string; goalLabel: string; goalUnit: string; goalStart: number; goalCurrent: number; goalTarget: number; notes: string; lastWorkout: string; needsAttention: boolean; plan: string; questions: string[]; email?: string; phone?: string }`
  - `Pacchetto = { id: string; clientId: string; kind: PackageKind; label: string; lessonsTotal: number | null; lessonsUsed: number; startsOn: string; endsOn: string | null; priceCents: number }` (`PackageKind` da `libs/domain/packages.ts`)
  - `Pagamento = { id: string; clientId: string; packageId: string | null; description: string; amountCents: number; dueOn: string; paidOn: string | null }`
  - `Misura = { id: string; clientId: string; takenOn: string; weightKg?: number; waistCm?: number; hipsCm?: number; chestCm?: number; armCm?: number; thighCm?: number }`
  - `Notifiche = { dolore: boolean; spostamento: boolean; pacchetti: boolean; riepilogo: boolean; avvisoDolori: boolean }`
  - `DatiClienti = { clienti: ClienteDati[]; pacchetti: Pacchetto[]; pagamenti: Pagamento[]; misure: Misura[]; notifiche: Notifiche }`
- Produce (`iniziali.ts`): `datiIniziali(): DatiClienti`; `dataDaBreve(s: "07 Set", anno = 2026): string` → `"2026-09-07"`.

- [ ] **Passo 1: test che falliscono** in `tests/unit/dati-iniziali.test.ts`:
  - `dataDaBreve("07 Set")` → `"2026-09-07"`, `dataDaBreve("03 Ott")` → `"2026-10-03"`.
  - Antonella: 2 pagamenti, `P…` unici, `{ description: "Pacchetto 10 lezioni", amountCents: 45000, paidOn: "2026-09-07" }` e `{ description: "Valutazione posturale", amountCents: 4000, paidOn: null, dueOn: "2026-10-03" }`.
  - Pacchetto di Giulia: `{ kind: "lessons", lessonsTotal: 10, lessonsUsed: 8 }` (da "2 lezioni rimaste"); quello "Mensile · Scade il 31 ottobre": `{ kind: "time", lessonsTotal: null, endsOn: "2026-10-31" }`; "Online · 8 sedute · 5 sedute rimaste" → `lessonsTotal: 8, lessonsUsed: 3`.
  - Misure di Giulia: 8 righe con `weightKg` uguali a `clients[giulia].weights` in ordine, una a settimana fino a `2026-10-21`; la prima ha anche `waistCm: 86` … `thighCm: 60`, l'ultima `waistCm: 82` … `thighCm: 58`.
  - Notifiche iniziali: tutte `true` tranne `riepilogo: false` (come oggi in Impostazioni).
  - Nessun `ClienteDati` ha campi con `undefined` al posto di `email`/`phone` per i clienti demo (li copia).
- [ ] **Passo 2:** `npm test -- dati-iniziali` → FALLISCE (modulo mancante).
- [ ] **Passo 3: implementare** `tipi.ts` (solo tipi) e `iniziali.ts`. Conversione di `pkg.left` con regex su "(\d+) (lezion|sedut)" e "Scade il (\d+) (mese)"; `id` dei pacchetti `K1…`, pagamenti `P1…` in ordine di cliente, misure `M1…`; `startsOn` = data dello `since`.
- [ ] **Passo 4:** `npm test -- dati-iniziali` → PASSA.
- [ ] **Passo 5: commit** `feat: dati dei clienti nella forma del database (centesimi, pacchetti, misure datate)`

### Task 2: Controlli di dominio

**File:**
- Crea: `libs/domain/payments.ts`, `libs/domain/measurements.ts`, `libs/domain/clients.ts`
- Test: `tests/unit/domain-leo.test.ts`

**Interfacce:**
- Produce: `type Verifica = { ok: true } | { ok: false; motivo: string }` (spostato qui da `leo-azioni.ts`, che lo riesporta).
- `payments.ts`: `euroInCentesimi(v: unknown): number | null` (accetta `450`, `"450"`, `"450,50"`, `"€ 450"`); `controllaImporto(cents: number): Verifica` (100-500.000); `controllaPagabile(p: Pagamento | undefined): Verifica`; `outstandingCents(pagamenti: Pagamento[]): number`; `collectedCents(pagamenti: Pagamento[], monthKey: string): number` (usa `monthRevenueCents` con `paid_on`).
- `measurements.ts`: `controllaMisura(m: Omit<Misura, "id">, oggi: string): Verifica` (almeno un valore; peso 30-250; circonferenze 15-200; `takenOn <= oggi`); `ultimaMisura(misure: Misura[], clientId: string): Misura | undefined`.
- `clients.ts`: `idDaNome(nome: string, esistenti: string[]): string` (`"Sara Conti"` → `"sara-conti"`, accenti tolti, `-2`, `-3` se esiste); `controllaNuovoCliente(nome: string, esistenti: ClienteDati[]): Verifica`.

- [ ] **Passo 1: test che falliscono** con questi casi: `euroInCentesimi("450,50")` → 45050, `("€ 450")` → 45000, `("abc")` → null, `(-3)` → -300 (lo rifiuta `controllaImporto`); `controllaImporto(50)` → motivo "L'importo va da 1 € a 5.000 €"; `controllaPagabile` di un pagamento con `paidOn` → motivo "Il pagamento è già segnato"; `controllaMisura({ weightKg: 680, … })` → motivo che contiene "680"; misura senza valori → "Nessun valore da salvare"; data `2026-10-22` → "La data è nel futuro"; `idDaNome("Niccolò Rè", [])` → `"niccolo-re"`; `idDaNome("Sara Conti", ["sara-conti"])` → `"sara-conti-2"`; `controllaNuovoCliente("  ", …)` → "Manca il nome"; nome uguale (senza maiuscole e spazi) a un cliente esistente → "Esiste già un cliente con questo nome".
- [ ] **Passo 2:** `npm test -- domain-leo` → FALLISCE.
- [ ] **Passo 3: implementare** i tre file (funzioni pure, nessun import da `libs/prototipo/`).
- [ ] **Passo 4:** `npm test` → PASSA tutto (anche `domain.test.ts` di prima).
- [ ] **Passo 5: commit** `feat: controlli di dominio per pagamenti, misure e clienti`

### Task 3: Store e sportello dei dati

**File:**
- Modifica: `libs/prototipo/stato.ts` (aggiunge `DatiClienti` allo `State` e le mutazioni grezze)
- Crea: `libs/dati/sportello.ts`, `libs/dati/selettori.ts`
- Test: `tests/unit/sportello.test.ts`

**Interfacce:**
- Consuma: Task 1 e 2.
- `stato.ts`: `State` riceve `dati: DatiClienti` (da `datiIniziali()`); `stato.setDati(fn: (d: DatiClienti) => DatiClienti)`; `stato.reset()` solo per i test (riporta lo stato iniziale).
- `sportello.ts` — ogni funzione `async`, ritorna `Promise<Esito>` con `type Esito = { ok: true; annulla?: () => Promise<Verifica>; id?: string } | { ok: false; motivo: string }`:
  - `segnaPagato(pagamentoId: string, oggi?: string)` (annulla → `paidOn: null`)
  - `registraPagamento(p: { clientId: string; amountCents: number; description: string; paidOn: string })`
  - `rinnovaPacchetto(r: { clientId: string; lezioni?: number; mesi?: number; amountCents: number; oggi?: string })` → aggiunge lezioni (`lessonsTotal += lezioni`) o sposta `endsOn` di `mesi` (da `max(endsOn, oggi)`), e crea un `Pagamento` da incassare `{ dueOn: oggi, paidOn: null, packageId }`; annulla toglie entrambi.
  - `aggiungiMisura(m: Omit<Misura, "id">)` → nuova riga; se `weightKg` e `goalUnit === "kg"` aggiorna `goalCurrent`; annulla toglie **solo** quella riga e rimette `goalCurrent`.
  - `aggiornaObiettivo(clientId, patch: { goalLabel?: string; goalTarget?: number; goalUnit?: string })`
  - `aggiungiNota(clientId, testo, oggi?)` → aggiunge `"\n21/10 · " + testo` in fondo a `notes`; annulla rimette il testo di prima solo se `notes` non è cambiato nel frattempo, altrimenti motivo "Le note sono cambiate nel frattempo".
  - `creaCliente(c: { name: string; gender: "donna" | "uomo"; email?: string; goalLabel?: string })` → `ClienteDati` con tono a rotazione, `since: "Dal 21 Ott 2026"`, obiettivo "Da definire" se manca, misure vuote; ritorna `id`.
  - `inviaMessaggio(clientId, testo)` → `stato.addMessage` (niente annulla).
  - `impostaNotifica(tipo: keyof Notifiche, attiva: boolean)`
  - `oggi` vale `ADESSO.data` (`"2026-10-21"`) se non passato.
- `selettori.ts`:
  - `type ClienteVista = Client` (la forma di oggi) e `vistaCliente(d: DatiClienti, id: string): ClienteVista | undefined`: `weights` dalle ultime 8 misure con peso, `measures` da prima e ultima misura con quel valore, `pkg.left` ricalcolato ("2 lezioni rimaste", "Scade il 31 ottobre"), `pkg.expiring` da `isPackageExpiring`, `payments` con `amount` in euro, `paid`, `date` breve ("07 Set").
  - hook: `useClienti(): ClienteVista[]`, `useCliente(id): ClienteVista | undefined`, `usePagamenti(): Pagamento[]`, `useNotifiche(): Notifiche`, `useIncassi(): { collectedCents: number; outstandingCents: number }` (ottobre = `revenue.collected * 100 - pagatiDemoOttobre + collectedCents(pagamenti, "2026-10")`, così all'avvio dà 2.840 € come oggi).
  - funzione non-hook `clientiAttuali(): ClienteVista[]` per i moduli fuori da React.

- [ ] **Passo 1: test che falliscono**, con `stato.reset()` in `beforeEach`:
  - `segnaPagato` del pagamento aperto di Antonella → `paidOn: "2026-10-21"`, `useIncassi` equivalente (`calcolaIncassi(dati)` esportato e testato) sale di 4.000 e "da incassare" scende di 4.000; `annulla()` → stato identico (`toEqual` dello snapshot iniziale).
  - `segnaPagato` due volte → la seconda `{ ok: false, motivo: "Il pagamento è già segnato" }`.
  - `rinnovaPacchetto({ clientId: "giulia-bianchi", lezioni: 10, amountCents: 45000 })` → `lessonsTotal: 20`, vista "12 lezioni rimaste", un pagamento da incassare di 45000; annulla → identico.
  - rinnovo a tempo `mesi: 1` su `endsOn: "2026-10-31"` → `"2026-11-30"`.
  - `aggiungiMisura({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 68 })` → `goalCurrent: 68`, vista `weights` finisce con 68; poi misura a mano con `weightKg: 67.5`; annulla di Leo → resta la riga 67.5 e `goalCurrent` resta 67.5 (punto 1 della revisione: annulla rimette `goalCurrent` solo se è ancora quello scritto da Leo).
  - `aggiungiNota` + modifica a mano di `notes` + annulla → `{ ok: false, motivo: "Le note sono cambiate nel frattempo" }`.
  - `creaCliente({ name: "Sara Conti", gender: "donna" })` con `sara-conti` esistente → `{ ok: false, motivo: "Esiste già un cliente con questo nome" }`; con "Marta Neri" → `{ ok: true, id: "marta-neri" }` e `clientiAttuali()` lo include.
- [ ] **Passo 2:** `npm test -- sportello` → FALLISCE.
- [ ] **Passo 3: implementare** `stato.setDati`/`reset`, `sportello.ts`, `selettori.ts`. Ogni funzione: controlli → `stato.setDati` → inversa che ricontrolla.
- [ ] **Passo 4:** `npm test` → PASSA tutto.
- [ ] **Passo 5: commit** `feat: sportello dei dati (operazioni con annulla) e selettori per le pagine`

### Task 4: Pagine sullo store

**File:**
- Modifica: `components/prototipo/trainer/ClientList.tsx`, `ClientProfile.tsx`, `Payments.tsx`, `Revenue.tsx`, `Cards.tsx`, `Urgent.tsx`, `TopBarTools.tsx`, `Settings.tsx` (sezione notifiche), `Messages.tsx` e `WeekCalendar.tsx` solo dove leggono `clients`/`clientById` per nomi e foto.

**Interfacce:**
- Consuma: `useClienti`, `useCliente`, `usePagamenti`, `useIncassi`, `useNotifiche`, sportello (`segnaPagato`, `impostaNotifica`).
- Produce: le pagine mostrano i dati dello store; "Segna pagato" (Profilo e Pagamenti) chiama `segnaPagato`; "Sollecita" chiama `inviaMessaggio` con il testo di `testoSollecito(p, cliente)` (in `libs/dati/testi.ts`: `"Ciao Giulia, ti ricordo il pagamento di € 40 per la valutazione posturale. Grazie!"`); gli interruttori delle notifiche usano `impostaNotifica`.
- I riquadri "Urgenti" di tipo `pagamento` e `pacchetto` si calcolano dai dati (pagamenti aperti, pacchetti in scadenza); `imminente` e `dolore` restano quelli fissi.

- [ ] **Passo 1:** sostituire gli import di `clients`/`clientById`/`revenue.collected`/`revenue.outstanding` con i selettori; togliere gli `useState` locali dei pagamenti in `ClientProfile.tsx` (riga 82) e `Payments.tsx` (riga 38).
- [ ] **Passo 2:** `npx tsc --noEmit` → nessun errore; `npm test` → PASSA.
- [ ] **Passo 3: verifica nel browser** (`preview_start`, `/prototipo/trainer`): Home, Clienti, profilo di Giulia, Pagamenti, Incassi mostrano gli stessi numeri di prima (2.840 € incassati, 160 € da incassare); "Segna pagato" sul pagamento di Antonella in Pagamenti → si aggiorna anche il profilo di Antonella e il riquadro Urgenti; "Sollecita" → messaggio nella chat di Antonella; nessun errore in console.
- [ ] **Passo 4: commit** `feat: pagine dell'area trainer sui dati condivisi; segna pagato e sollecita veri`

### Task 5: Leo vede i dati aggiornati

**File:**
- Modifica: `libs/prototipo/leo-contesto.ts`, `app/prototipo/api/leo/route.ts`, `libs/prototipo/leo-flusso.ts`, `libs/prototipo/leo-azioni.ts` (`MAX_AZIONI = 10`), `components/prototipo/trainer/CoachAssistant.tsx` (corpo della richiesta e evento nuovo)
- Test: `tests/unit/leo-contesto.test.ts`, `tests/unit/leo-flusso.test.ts`, `tests/unit/leo-route.test.ts`

**Interfacce:**
- `leo-contesto.ts`: `ClienteContesto` (schema zod, campi di `ClienteVista` senza `email`/`phone`/`photo`, più `pagamentiAperti: { id, descrizione, euro, scadenza }[]` e `ultimaMisura`); `perContesto(v: ClienteVista[], pagamenti: Pagamento[]): ClienteContesto[]`; `contestoLeo(sedute?: Seduta[], clienti?: ClienteContesto[], extra?: { aspetto?: { colore: string; tema: Theme }; notifiche?: Notifiche }): string`; `clienteDa(valore: string, elenco: { id: string; name: string }[] = clients): string | undefined`.
- Righe del contesto per i pagamenti aperti: `- P7 · Valutazione posturale € 40 · scadenza 03/10 · DA PAGARE`, dentro la riga del cliente.
- `leo-flusso.ts`: `EventoLeo` aggiunge `{ tipo: "azione-scartata"; nome: string }`; `raccoglitoreAzioni().azioni()` diventa `risultato(): { azioni: AzioneLeo[]; scartate: string[] }`.
- Rotta: `Richiesta` aggiunge `clienti: z.array(ClienteContesto).max(60).optional()`, `aspetto`, `notifiche`; manda una riga `azione-scartata` per ogni scartata.
- Chat: per ogni `azione-scartata` una scheda `stato: "errore"`, titolo "Non ho capito questa parte", motivo "Riprova con altre parole".

- [ ] **Passo 1: test che falliscono:** `contestoLeo(sedute, clienti)` con Giulia a 68 kg contiene `"ora 68"`; con un cliente creato ("Marta Neri") contiene `id marta-neri`; non contiene `@` né numeri di telefono anche se un `ClienteContesto` arriva con `"note": "scrivimi a a@b.it"`; contiene `P` + id del pagamento aperto di Antonella; `clienteDa("Marta", [...clients, marta])` → `"marta-neri"`; raccoglitore con un'azione dagli argomenti rotti → `scartate: ["fissa_appuntamento"]`; rotta: `clienti` con 61 elementi → 400.
- [ ] **Passo 2:** `npm test` → FALLISCONO quelli nuovi.
- [ ] **Passo 3: implementare;** in `CoachAssistant.tsx` il corpo diventa `{ messages, calendario, clienti: perContesto(clientiAttuali(), stato.get().dati.pagamenti), aspetto, notifiche }`, e `inChiaro` usa l'elenco attuale.
- [ ] **Passo 4:** `npm test` → PASSA; prova a mano con la chiave: "quanto pesa Giulia?" dopo aver segnato una misura a mano risponde con il valore nuovo.
- [ ] **Passo 5: commit** `feat: Leo riceve i dati aggiornati dei clienti e segnala le azioni non capite`

---

## Blocco 1: conferme e messaggi a più clienti

### Task 6: "Conferma tutte" e `scrivi_a_piu`

**File:**
- Modifica: `libs/prototipo/leo-azioni.ts`, `libs/prototipo/leo-esegui.ts`, `libs/prototipo/leo-viaggio.ts`, `libs/prototipo/stato.ts` (`FocusLeo`), `components/prototipo/trainer/LeoAzioni.tsx`, `CoachAssistant.tsx`, `Messages.tsx`
- Test: `tests/unit/leo-azioni.test.ts`, `tests/unit/leo-esegui.test.ts`

**Interfacce:**
- `type DatiLeo = { sedute: Seduta[]; dati: DatiClienti }`; `verificaAzione(a, d: DatiLeo, adesso?)` e `riassunto(a, d: DatiLeo)` prendono `DatiLeo` al posto di `sedute` (aggiornare i test esistenti).
- `eseguiAzione(a): Promise<Esito>` (asincrona, passa dallo sportello per le azioni nuove); `SchedaAzione.annulla` diventa `() => Promise<{ ok: boolean; motivo?: string }>`.
- `AzioneLeo` aggiunge `{ nome: "scrivi_a_piu"; dati: { clienti: string[]; testo: string } }`; `personalizza(testo: string, nome: string): string` sostituisce `{nome}` col nome (primo nome).
- Scheda: lista con spunte (tutte accese), testo modificabile, anteprima "Ciao Giulia, …" col primo spuntato, tasto "Invia a tutti (N)"; il conferma passa `{ testo, clienti }`.
- `FocusLeo.tipo` aggiunge `"multiplo"` con `clientiIds: string[]`; `sezioneDi(scrivi_a_piu)` → Messaggi della prima conversazione; dopo l'invio un'etichetta "Inviato a N clienti".
- "Conferma tutte (N)": in `LeoAzioni.tsx` un componente `ConfermaTutte({ n, onConferma })` sopra le schede del messaggio quando ≥ 2 sono `da-confermare`; in `CoachAssistant.tsx` `confermaTutte(msgId)` porta tutte le `da-confermare` a `in-corso` (con i testi correnti delle schede) e chiama `procedi`.
- Suoni: `SUONI.scrivi_a_piu = "confirm"`.

- [ ] **Passo 1: test che falliscono:** `leggiAzione("scrivi_a_piu", { clienti: ["giulia-bianchi","sara"], testo: "Ciao {nome}, ..." })` + `inChiaro` → `clienti: ["giulia-bianchi","sara-conti"]`; un cliente sconosciuto nell'elenco → `inChiaro` null; 51 destinatari → `verificaAzione` motivo "Al massimo 50 clienti"; `{cognome}` nel testo → motivo "Uso solo {nome} nel testo"; `personalizza("Ciao {nome}!", "Giulia Bianchi")` → `"Ciao Giulia!"`; `eseguiAzione` → 3 messaggi in 3 conversazioni, ognuno col proprio nome; `daConfermare(scrivi_a_piu)` true.
- [ ] **Passo 2:** `npm test` → FALLISCONO.
- [ ] **Passo 3: implementare** azione, menu (`description`: "Lo stesso messaggio a più clienti; scrivi {nome} dove va il nome del cliente"), esecuzione, scheda, "Conferma tutte", focus in `Messages.tsx`.
- [ ] **Passo 4:** `npm test` → PASSA; `npx tsc --noEmit` pulito.
- [ ] **Passo 5: verifica nel browser** con la chiave: "cancella tutte le sedute di Sara la prossima settimana" → "Conferma tutte (N)" esegue tutto in fila; "scrivi a Giulia e Sara che domani la palestra apre alle 9" → una scheda, togliere la spunta a Sara, "Invia a tutti (1)" → solo Giulia riceve. Screenshot a 1440 e 375 px.
- [ ] **Passo 6: commit** `feat: Leo, conferma tutte e messaggio a più clienti`. **Fermarsi:** Marco prova (push con il suo ok).

---

## Blocco 2: soldi

### Task 7: Azioni dei soldi (logica)

**File:**
- Modifica: `libs/prototipo/leo-azioni.ts` (o crea `libs/prototipo/leo-azioni-soldi.ts` se `leo-azioni.ts` supera 400 righe, riesportato da `leo-azioni.ts`), `libs/prototipo/leo-esegui.ts`
- Test: `tests/unit/leo-soldi.test.ts`

**Interfacce:**
- `AzioneLeo` aggiunge:
  - `segna_pagato: { pagamento: string }`
  - `registra_pagamento: { cliente: string; importo: number /* centesimi dopo lo schema */; descrizione: string; data?: string }`
  - `rinnova_pacchetto: { cliente: string; lezioni?: number; mesi?: number; importo: number }` (esattamente uno tra `lezioni` e `mesi`)
  - `sollecita: { pagamento: string; testo?: string }`
- Gli schemi zod trasformano `importo` con `euroInCentesimi`; il menu per l'AI lo descrive in euro.
- `riassunto`: "Segno pagato · Antonella Russo · € 40 (valutazione posturale)", "Registro € 120 da Luca Ferri · mensile di novembre", "Rinnovo Giulia Bianchi · +10 lezioni · € 450 da incassare", "Sollecito ad Antonella Russo · € 40".
- `sollecita` senza `testo` usa `testoSollecito` (Task 4).
- `daConfermare` true per tutte e quattro. `notaPerLeo` le descrive ("fatto: segnato pagato P7").

- [ ] **Passo 1: test che falliscono:** `leggiAzione("registra_pagamento", { cliente: "luca", importo: "120,00", descrizione: "Mensile" })` → `importo: 12000`; `rinnova_pacchetto` con sia `lezioni` sia `mesi` → null; con nessuno dei due → null; `verificaAzione(segna_pagato P inesistente)` → "Pagamento non trovato"; `segna_pagato` su pagamento già pagato (dopo `segnaPagato` a mano) → "Il pagamento è già segnato" e incassato invariato (punto 2 della revisione); `eseguiAzione(rinnova_pacchetto)` + `annulla()` → dati identici; `sollecita` → messaggio nella conversazione con l'importo "€ 40".
- [ ] **Passo 2:** `npm test -- leo-soldi` → FALLISCE.
- [ ] **Passo 3: implementare** schemi, controlli (via `libs/domain/payments.ts`), riassunti, voci del menu, esecuzione con lo sportello.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5: commit** `feat: azioni di Leo per pagamenti, rinnovi e solleciti`

### Task 8: Soldi, schede e viaggio

**File:**
- Modifica: `libs/prototipo/stato.ts` (`FocusLeo.tipo` + `"pagato" | "pagamento" | "rinnovo"`, campo `pagamentoId`), `libs/prototipo/leo-viaggio.ts`, `LeoAzioni.tsx` (icone `Wallet`, `CircleDollarSign`, `PackagePlus`, `BellRing`), `Payments.tsx`, `ClientProfile.tsx`, `CoachAssistant.tsx` (`SUONI`)

**Interfacce:**
- `sezioneDi`: `segna_pagato`/`registra_pagamento`/`rinnova_pacchetto` → `ROUTES.incassi`; `sollecita` → Messaggi del cliente (come `scrivi_messaggio`, testo che si scrive da solo).
- Pagamenti: la riga col `focus.pagamentoId` si illumina col colore del trainer e diventa verde (stato "pagato"); "Incassato" e "Da incassare" con `CountUp` dal valore vecchio al nuovo; riga nuova (registra/rinnovo) entra dall'alto con un pop. Con riduci movimento: evidenza ferma e dissolvenza.
- Suoni: `segna_pagato`/`registra_pagamento` → `"complete"`, `rinnova_pacchetto` → `"confirm"`, `sollecita` → `"confirm"`.

- [ ] **Passo 1:** implementare focus e animazioni in `Payments.tsx` (nessuna logica nuova, solo lettura di `focus`).
- [ ] **Passo 2:** `npx tsc --noEmit` pulito; `npm test` → PASSA.
- [ ] **Passo 3: verifica nel browser** con la chiave: "Antonella ha pagato la valutazione" → conferma → Pagamenti, riga verde, incassato 2.840 → 2.880; "rinnova Giulia 10 lezioni a 450" → riga nuova da incassare e profilo "12 lezioni rimaste"; "sollecita Luca" → messaggio nella sua chat. 1440 e 375 px, chiaro e scuro, riduci movimento.
- [ ] **Passo 4: commit** `feat: Leo nei pagamenti (riga che diventa verde, conti che salgono)`. **Fermarsi:** Marco prova.

---

## Blocco 3: dati del cliente

### Task 9: Azioni sui dati del cliente (logica)

**File:**
- Crea (se `leo-azioni.ts` supera 400 righe): `libs/prototipo/leo-azioni-clienti.ts`
- Modifica: `libs/prototipo/leo-azioni.ts`, `leo-esegui.ts`, `leo-contesto.ts` (`clienteDa` più tollerante)
- Test: `tests/unit/leo-clienti.test.ts`

**Interfacce:**
- `AzioneLeo` aggiunge:
  - `aggiorna_misure: { cliente: string; data?: string; peso?: number; vita?: number; fianchi?: number; petto?: number; braccio?: number; coscia?: number }` (numeri con la virgola accettati: `z.preprocess` che cambia `","` in `"."`)
  - `aggiorna_obiettivo: { cliente: string; descrizione?: string; traguardo?: number; unita?: string }` (almeno uno)
  - `aggiungi_nota: { cliente: string; testo: string }` (1-500 caratteri)
  - `nuovo_cliente: { nome: string; genere: "donna" | "uomo"; obiettivo?: string }`
- `daConfermare(a, conAllegato = false)`: `nuovo_cliente` sempre; le altre tre solo se `conAllegato`.
- `primaDopo(a, d: DatiLeo): { voce: string; prima?: string; dopo: string }[]` per `aggiorna_misure` e `aggiorna_obiettivo` (es. `{ voce: "Vita", prima: "82 cm", dopo: "79 cm" }`), usato dalla scheda.
- `clienteDa` accetta anche "Cognome Nome" e maiuscole (`"CONTI SARA"` → `sara-conti`).
- Esecuzione `nuovo_cliente`: riceve `email` dalla scheda (campo del trainer) → `creaCliente({ name, gender, email, goalLabel })`.

- [ ] **Passo 1: test che falliscono:** `leggiAzione("aggiorna_misure", { cliente: "giulia", peso: "68,4" })` → `peso: 68.4`; senza valori → `verificaAzione` "Nessun valore da salvare"; `peso: 680` → motivo con "680"; `primaDopo` di vita 79 per Giulia → `[{ voce: "Vita", prima: "82 cm", dopo: "79 cm" }]`; `daConfermare(aggiorna_misure)` false, `daConfermare(aggiorna_misure, true)` true; `clienteDa("CONTI SARA")` → `"sara-conti"`; `clienteDa("Sara")` con due Sara → undefined (punto 3 e 5 della revisione); `nuovo_cliente` "Marta Neri" eseguito → poi `inChiaro(fissa_appuntamento cliente "Marta")` → `marta-neri`; `aggiungi_nota` + annulla → note identiche.
- [ ] **Passo 2:** `npm test -- leo-clienti` → FALLISCE.
- [ ] **Passo 3: implementare.** Istruzioni del menu: "aggiorna_misure: solo valori che il trainer ha detto o che leggi nel file; non stimare".
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5: commit** `feat: azioni di Leo su misure, obiettivo, note e nuovo cliente`

### Task 10: Dati del cliente, schede e viaggio

**File:**
- Modifica: `stato.ts` (`FocusLeo.tipo` + `"misure" | "obiettivo" | "nota" | "cliente"`), `leo-viaggio.ts`, `LeoAzioni.tsx`, `ClientProfile.tsx`, `ClientList.tsx`, `CoachAssistant.tsx`

**Interfacce:**
- `sezioneDi`: misure/obiettivo/nota → `ROUTES.cliente(id)`; `nuovo_cliente` → `ROUTES.clienti`.
- Scheda prima → dopo: tabella di righe "Vita 82 → 79 cm" (dopo in grassetto col colore del trainer).
- Scheda `nuovo_cliente`: nome e obiettivo modificabili, campo "Email (facoltativa)" `type="email"`, `text-[16px] md:text-[12.5px]` come il campo messaggio; la conferma passa `{ email }`.
- Profilo: numeri con `CountUp` dal valore precedente, punto nuovo del grafico che compare; nota nuova che entra in fondo. Elenco Clienti: scheda nuova con pop (scala 0,6 → 1, molla).

- [ ] **Passo 1:** implementare.
- [ ] **Passo 2:** `npx tsc --noEmit` pulito; `npm test` → PASSA.
- [ ] **Passo 3: verifica nel browser:** "Giulia oggi pesa 68" → profilo, numero che scende, Annulla che lo rimette; "segna nelle note di Luca che ha il ginocchio a posto"; "aggiungi la cliente Marta Neri, obiettivo tonificazione" → scheda con email → Clienti con Marta. 1440/375, chiaro/scuro, riduci movimento.
- [ ] **Passo 4: commit** `feat: Leo nel profilo del cliente (misure, note, nuovo cliente)`. **Fermarsi:** Marco prova.

---

## Blocco 5: file allegati

### Task 11: Leo legge i file

**File:**
- Crea: `libs/prototipo/leo-file.ts`
- Modifica: `libs/prototipo/pdf-scheda.ts` (esporta `testoDelPdf(data: ArrayBuffer): Promise<string>` riusabile), `CoachAssistant.tsx` (graffetta e pastiglia), `app/prototipo/api/leo/route.ts`, `leo-contesto.ts` (istruzioni con allegato)
- Test: `tests/unit/leo-file.test.ts`, `tests/unit/leo-route.test.ts`

**Interfacce:**
- `leggiFile(file: File): Promise<{ ok: true; nome: string; testo: string; tagliato: boolean } | { ok: false; motivo: string }>`: `.pdf` → `testoDelPdf`; `.csv`/`.txt` → `file.text()`; poi `ripulisci`, taglio a 6.000; oltre 5 MB → "Il file è troppo grande (massimo 5 MB)"; altro formato → "Per ora leggo PDF, CSV e TXT"; PDF con meno di 20 caratteri di testo → "Questo PDF è una foto: per ora leggo solo PDF con testo".
- `bloccoAllegato(nome: string, testo: string): string` → `Allegato "misure.pdf":\n<testo>`; il messaggio dell'utente verso la rotta = testo scritto + `\n\n` + blocco. `MAX_CARATTERI` della rotta sale a 8.000 **solo** per il messaggio che contiene `Allegato "`.
- Nella chat: pastiglia col nome del file sopra il messaggio del trainer; la scheda segna `conAllegato = true` per tutte le azioni di quella risposta (`daConfermare(a, true)`).
- Istruzioni (in `ISTRUZIONI`): "Se il messaggio contiene un allegato, leggi i valori, associa ogni valore al cliente giusto (dal nome nel file o dal messaggio) e usa aggiorna_misure, aggiorna_obiettivo o aggiungi_nota. Non inventare valori che non ci sono; se qualcosa non è chiaro dillo nella frase."

- [ ] **Passo 1: test che falliscono:** `leggiFile(new File(["Giulia Bianchi;vita;79\n…"], "misure.csv"))` → `ok`, testo invariato; file con `a@b.it` → testo con `[email]`; testo di 7.000 caratteri → 6.000 e `tagliato: true`; `.docx` → motivo formati; 6 MB → motivo dimensione; rotta: messaggio con allegato di 7.500 caratteri accettato intero, senza allegato tagliato a 2.000.
- [ ] **Passo 2:** `npm test -- leo-file` → FALLISCE.
- [ ] **Passo 3: implementare;** graffetta `Paperclip` a sinistra del campo, `accept=".pdf,.csv,.txt"`, un file per messaggio, pastiglia con "×" per toglierlo prima dell'invio.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5: verifica con DeepSeek vero:** 3 file finti in `docs/riferimenti/` (non versionati): PDF con le misure di Giulia, CSV con 3 clienti, PDF di sola immagine. Attesi: scheda prima → dopo corretta per Giulia; tre schede per il CSV; messaggio "Questo PDF è una foto…" senza chiamare l'AI.
- [ ] **Passo 6: commit** `feat: Leo legge PDF, CSV e TXT allegati e propone gli aggiornamenti`. **Fermarsi:** Marco prova.

---

## Blocco 4: impostazioni

### Task 12: Aspetto e notifiche

**File:**
- Crea: `libs/dati/aspetto.ts`
- Modifica: `components/ui/appearance.tsx` (registra il ponte), `libs/prototipo/leo-azioni.ts`, `leo-esegui.ts`, `leo-viaggio.ts`, `LeoAzioni.tsx`, `Settings.tsx`
- Test: `tests/unit/leo-aspetto.test.ts`

**Interfacce:**
- `aspetto.ts`: `registraAspetto(p: { leggi(): { colore: string; tema: Theme }; setAccent(c: string): void; setTheme(t: Theme): void } | null)`; `cambiaAspetto(patch: { colore?: string; tema?: Theme; suoni?: boolean }): Promise<Esito>` (suoni via `setSoundEnabled`; annulla rimette i valori di prima). Senza ponte registrato → `{ ok: false, motivo: "Impostazioni non disponibili" }`.
- `AzioneLeo` aggiunge `cambia_aspetto: { colore?: string; tema?: "chiaro" | "scuro"; suoni?: boolean }` (colore: uno di `ACCENTS` o `#rrggbb`; nomi comuni "rosso", "blu", "verde"… mappati sugli `ACCENTS` con una tabella in `leo-azioni`) e `imposta_notifiche: { tipo: keyof Notifiche; attiva: boolean }`.
- Viaggio: `cambia_aspetto` resta nella sezione corrente (`sezioneDi` → `null`, niente cambio pagina); `imposta_notifiche` → `ROUTES.impostazioni`, interruttore che scatta.

- [ ] **Passo 1: test che falliscono:** colore `"blu"` → uno degli `ACCENTS`; `"#12345"` → null; con ponte finto: `cambiaAspetto({ colore })` + `annulla()` → colore di prima; `imposta_notifiche riepilogo true` + annulla → `false`; senza ponte → motivo.
- [ ] **Passo 2:** `npm test -- leo-aspetto` → FALLISCE.
- [ ] **Passo 3: implementare.**
- [ ] **Passo 4:** `npm test` → PASSA; browser: "metti il colore blu e il tema scuro" → l'app cambia dal vivo, Annulla rimette; "spegni il riepilogo del lunedì" → Impostazioni, interruttore spento.
- [ ] **Passo 5: commit** `feat: Leo cambia colore, tema, suoni e notifiche`. **Fermarsi:** Marco prova.

---

## Chiusura

### Task 13: Prova completa e documenti

**File:**
- Modifica: `docs/plans/2026-10-21-piano-v1.md` (Task 3: `payments.due_on`, `payments.paid_on` annullabile, `clients.notes`), `docs/DA-CAMBIARE.md` (spunta "Conferma tutte", "Leo fa tutto", "Leo legge i file" con data; rifinitura "azione malformata" fatta), `PROGRESS.md`

- [ ] **Passo 1: prova con DeepSeek vero** (dati finti), ~20 frasi: una per azione nuova, 3 ambigue ("segna pagato", "rinnova Sara" senza importo, "aggiorna le misure"), 3 solo domande ("quanto ho incassato?"), 2 file. Atteso: azioni giuste; sulle ambigue Leo chiede; sulle domande nessuna azione. Annotare costo medio per domanda dal pannello DeepSeek.
- [ ] **Passo 2: Playwright** (`channel: "msedge"`): un viaggio per blocco a 1440 e 375 px, chiaro e scuro, riduci movimento; nessun errore in console.
- [ ] **Passo 3:** `npm test`, `npx tsc --noEmit`, build come su Vercel (`NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`) → tutto verde.
- [ ] **Passo 4:** aggiornare i documenti.
- [ ] **Passo 5: commit** `docs: Leo fa tutto, prova completa, schema aggiornato e stato`. Push solo con l'ok di Marco.
