# Leo fa tutto: soldi, dati dei clienti, impostazioni, file (design)

**Data:** 2026-10-25 · **Stato:** approvato a voce da Marco sezione per sezione, da rileggere per iscritto · **Ambito:** prototipo dell'area trainer (dati finti), costruito per passare al backend senza riscrivere · **Parte da:** `docs/specs/2026-10-24-leo-azioni-design.md` (calendario e messaggi: menu, controlli, NDJSON, schede, viaggio restano come lì)

## 1. Obiettivo

Leo oggi fissa, sposta e cancella sedute e scrive ai clienti. Deve poter fare **tutto quello che il trainer fa a mano** (tranne le schede di allenamento): soldi e pacchetti, dati del cliente, impostazioni, messaggi a più clienti, e leggere un file allegato per aggiornare i dati senza che il trainer scriva niente a mano.

**Successo:**
- "Giulia ha pagato" → scheda da confermare; dopo "Conferma" l'app va in Pagamenti e la riga diventa verde, "da incassare" scende.
- "Rinnova il pacchetto di Giulia, 10 lezioni a 450 €" → +10 lezioni e un pagamento da incassare di 450 €.
- "Scrivi a tutti quelli col pacchetto in scadenza che c'è lo sconto" → una scheda con testo unico (`{nome}`), clienti con le spunte, "Invia a tutti (N)".
- "Giulia oggi pesa 68" → aggiornato subito, con "Annulla"; il profilo mostra il numero che scende e il grafico che si allunga.
- PDF con le misure nuove di Giulia + "leggilo e aggiorna" → scheda con prima → dopo per ogni valore; dopo "Conferma" i dati sono aggiornati.
- Più azioni da confermare → "Conferma tutte (N)".
- Quando arriva Supabase cambia solo l'interno dello "sportello dei dati" (sezione 3): Leo, pagine e controlli restano uguali.

**Ordine di costruzione (un blocco alla volta, Marco prova sul sito dopo ognuno):** base → 1 conferme e messaggi multipli → 2 soldi → 3 dati del cliente → 5 file → 4 impostazioni.

## 2. Decisioni prese (con il perché)

| Decisione | Perché |
|---|---|
| Clienti, pacchetti, pagamenti e misure nello stato condiviso, letti da tutte le pagine (approccio A) | Se Leo cambia qualcosa lo si vede ovunque; con Supabase cambia solo la sorgente |
| Forme dei dati uguali alle tabelle del database (centesimi, `lessons`/`time`, misure come righe datate) | Nessuna traduzione quando arriva il backend |
| Un solo sportello dei dati (`libs/dati/`) usato da Leo, dai tasti delle pagine e dai test | Una logica sola; per il backend si riscrive solo l'interno |
| Controlli come funzioni pure in `libs/domain/` | Riusati dal server prima di scrivere nel database |
| "Conferma tutte (N)" sopra le schede, che restano singole | Si può ancora annullarne una prima di confermare le altre |
| Messaggio a più clienti: testo unico con il nome inserito in automatico | Si rilegge una volta, costa come una domanda normale |
| Rinnovo = lezioni/mesi in più **e** pagamento da incassare | "Da incassare" resta sempre giusto; poi "ha pagato" lo chiude |
| Soldi, nuovo cliente, solleciti, messaggi multipli: con conferma. Misure, obiettivo, note, impostazioni: subito + "Annulla" | Controllo dove si tocca denaro o il cliente, velocità dove si rimedia facilmente |
| Dati letti da un file: sempre con conferma e prima → dopo | Un'AI può leggere male un numero: il trainer lo vede prima che finisca nei dati |
| L'app legge il file nel browser e toglie email e telefoni prima dell'AI | Regola del progetto: verso l'AI mai email e telefoni |
| L'email del nuovo cliente la scrive il trainer nella scheda, Leo non la vede | Stessa regola |

## 3. La base: dati condivisi, pronti per il backend

### 3.1 Forme dei dati (`libs/dati/tipi.ts`)

Stessi nomi e significati delle tabelle del piano v1 (Task 3), in camelCase lato app:

- **Cliente**: `id`, `name`, `gender`, `initials`, `photo?`, `tone`, `since`, `goalLabel`, `goalUnit`, `goalStart`, `goalTarget`, `notes` (testo, righe datate), `lastWorkout`, `needsAttention`, `plan`, `questions`, `email?`, `phone?`. Il valore attuale dell'obiettivo (`goalCurrent`) si calcola dall'ultima misura se l'unità è kg, altrimenti è un campo.
- **Pacchetto**: `id`, `clientId`, `kind: "lessons" | "time"`, `label`, `lessonsTotal | null`, `lessonsUsed` (prototipo; nel database si contano le sedute fatte con `lessonsRemaining`), `startsOn`, `endsOn | null`, `priceCents`.
- **Pagamento**: `id` (`P1`, `P2`, …), `clientId`, `packageId | null`, `description`, `amountCents`, `dueOn`, `paidOn | null` (vuoto = da incassare).
- **Misura**: `id`, `clientId`, `takenOn` (data), `weightKg?`, `waistCm?`, `hipsCm?`, `chestCm?`, `armCm?`, `thighCm?`. Il grafico del peso e le misure del profilo si costruiscono dalle righe.
- **Impostazioni notifiche**: `{ dolore, spostamento, pacchetti, riepilogo, avvisoDolori }` booleani (le voci di oggi in Impostazioni).

I dati di partenza si convertono da `dati-finti.ts` (euro → centesimi, `pkg.left` → pacchetto strutturato, `weights`/`measures` → righe datate a settimane all'indietro).

**Due aggiunte allo schema del database** da portare nel Task 3: `payments.due_on date` e `payments.paid_on` annullabile (stato "da incassare"); `clients.notes text`.

### 3.2 Lo sportello (`libs/dati/`)

Funzioni asincrone, una per operazione, con risultato `{ ok: true, ... } | { ok: false, motivo }`:

`segnaPagato(id)`, `registraPagamento(...)`, `rinnovaPacchetto(...)`, `aggiungiMisura(...)`, `aggiornaObiettivo(...)`, `aggiungiNota(...)`, `creaCliente(...)`, `inviaMessaggio(clientId, testo)`, `impostaNotifica(...)`, più quelle già esistenti del calendario.

- Oggi: chiamano i controlli di `libs/domain/` e poi lo store (`stato.ts`). Sono `async` già adesso, così chi le usa non cambia quando diventano chiamate al server.
- Con Supabase: stesse firme, dentro una server action con RLS che rifà i controlli e scrive nel database.
- Le pagine leggono con selettori (`useClienti()`, `usePagamenti()`, `useCliente(id)`…) esportati dallo stesso modulo.
- Ogni operazione che si può annullare restituisce anche l'operazione inversa (come `eseguiAzione` oggi).

**Aspetto e suoni** hanno già il loro sistema (`useAppearance`, `libs/ui/sound.ts`): lo sportello li raggiunge con un ponte che `AppearanceProvider` registra all'avvio (`registraAspetto({ setAccent, setTheme, … })`).

### 3.3 Pagine che passano allo stato condiviso

Clienti, Profilo cliente, Pagamenti, Incassi (da incassare e incassato del mese calcolati dai pagamenti con `monthRevenueCents`), Home (statistiche e riquadri), Urgenti, Impostazioni (notifiche). I tasti manuali "Segna pagato" e "Sollecita" usano lo sportello. Nessun cambio di aspetto.

### 3.4 Leo vede i dati aggiornati

Il browser manda alla rotta, oltre al calendario, i clienti con obiettivo, ultime due misure, pacchetto, pagamenti aperti con il loro id e note. Il server li controlla con `zod`, li passa in `ripulisci` e li usa in `contestoLeo` al posto dei dati fissi. Email e telefoni non partono dal browser.

## 4. Le azioni nuove

Tutte definite in `libs/prototipo/leo-azioni.ts` (o un file per blocco se supera ~400 righe): schema `zod`, voce del menu `tools`, controllo, riassunto per la scheda, nota per i turni successivi, inversa per "Annulla".

| Blocco | Azione | Argomenti | Come parte |
|---|---|---|---|
| 1 | `scrivi_a_piu` | `clienti` (id), `testo` con `{nome}` | conferma: scheda con spunte, testo modificabile, "Invia a tutti (N)" |
| 2 | `segna_pagato` | `pagamento` (id `P…`) | conferma |
| 2 | `registra_pagamento` | `cliente`, `importo` (euro), `descrizione`, `data?` (oggi) | conferma; entra già incassato |
| 2 | `rinnova_pacchetto` | `cliente`, `lezioni?` o `mesi?`, `importo` (euro) | conferma; lezioni in più o scadenza spostata + pagamento da incassare |
| 2 | `sollecita` | `pagamento`, `testo?` | conferma; messaggio vero in chat con importo e descrizione, testo modificabile |
| 3 | `aggiorna_misure` | `cliente`, `data?`, `peso?`, `vita?`, `fianchi?`, `petto?`, `braccio?`, `coscia?` | subito + Annulla; **da file: conferma** con prima → dopo per ogni valore |
| 3 | `aggiorna_obiettivo` | `cliente`, `descrizione?`, `traguardo?`, `unita?` | subito + Annulla |
| 3 | `aggiungi_nota` | `cliente`, `testo` | subito + Annulla; riga datata in fondo alle note |
| 3 | `nuovo_cliente` | `nome`, `genere`, `obiettivo?`, `pacchetto?` | conferma; la scheda ha il campo email da scrivere a mano |
| 4 | `cambia_aspetto` | `colore?` (uno di `ACCENTS` o esadecimale), `tema?`, `suoni?` | subito + Annulla |
| 4 | `imposta_notifiche` | `tipo`, `attiva` | subito + Annulla |

**"Conferma tutte (N)"**: compare sopra le schede quando almeno 2 sono "da confermare"; esegue in ordine quelle ancora in attesa, con lo stesso viaggio di una alla volta. Se una fallisce, mostra il motivo nella sua scheda e le altre vanno avanti.

**Controlli** (in `libs/domain/`, funzioni pure):
- cliente e pagamento esistenti; pagamento non già incassato;
- importo tra 1 € e 5.000 €; lezioni tra 1 e 50; mesi tra 1 e 12;
- misure plausibili: peso 30-250 kg, circonferenze 15-200 cm, data non nel futuro;
- testo dei messaggi tra 1 e 1.000 caratteri, `{nome}` unico segnaposto ammesso; da 1 a 50 destinatari;
- nome del nuovo cliente non vuoto e non uguale a uno esistente (id generato dal nome, `sara-conti`, con `-2` se serve);
- colore valido, tema `light`/`dark`.

**Limite per risposta:** `MAX_AZIONI` da 5 a 10; `scrivi_a_piu` conta come una.

## 5. File allegati

- **Dove:** graffetta nella barra della chat di Leo; un file per messaggio. Formati: PDF con testo (`pdfjs-dist`, come `libs/prototipo/pdf-scheda.ts`), CSV, TXT. Massimo 5 MB.
- **Lettura nel browser** (`libs/prototipo/leo-file.ts`): estrae il testo, lo passa in `ripulisci`, lo taglia a 6.000 caratteri e lo aggiunge al messaggio come blocco `Allegato "<nome file>": …`. Nella chat si vede solo il nome del file in una pastiglia.
- **Regola delle conferme:** se il messaggio ha un allegato, ogni azione sui dati di quella risposta diventa "da confermare", con prima → dopo ("Vita 82 → 79 cm"). Un file può riguardare più clienti (più azioni).
- **Istruzioni a Leo:** con un allegato, leggi i valori, associali al cliente giusto (dal nome nel file o dal messaggio), usa `aggiorna_misure`/`aggiorna_obiettivo`/`aggiungi_nota`; se un valore non è chiaro non inventarlo e dillo nella frase.
- **Errori:** PDF senza testo (scansione) → "Questo PDF è una foto: per ora leggo solo PDF con testo"; formato non supportato o troppo grande → messaggio nella chat, niente richiesta all'AI.
- **Dopo:** foto e scansioni con un modello che vede le immagini (fornitore UE), fuori da questa spec.

## 6. Server, contesto e costo

- `app/prototipo/api/leo/route.ts`: menu da 4 a 15 azioni, richiesta con `clienti` e `allegato` oltre a `sedute`; un solo giro verso l'AI, NDJSON come oggi.
- Le azioni con forma sbagliata non si scartano più in silenzio: la rotta manda `{"tipo":"azione-scartata","nome":"…"}` e la chat mostra "Non ho capito questa parte, riprova".
- Contesto: pagamenti aperti con id `P…`, ultime misure con data, pacchetto strutturato, notifiche attive, colore e tema attuali.
- **Costo stimato:** +~1.500 token di menu per domanda, in gran parte nella parte fissa che DeepSeek riusa (cache): ~+0,05 cent; con file ~0,3-0,5 cent a domanda. Da misurare nella prova.

## 7. Esperienza e animazioni

Stesso viaggio della spec del 24/10 (chat compatta, cambio sezione con dissolvenza, azione visibile, ritorno), con le tappe nuove:
- **soldi** → Pagamenti: la riga si illumina e diventa verde, "incassato" conta in su e "da incassare" in giù; rinnovo: pastiglia del pacchetto che si riempie; sollecito: come un messaggio (si scrive da solo nella chat del cliente);
- **misure e obiettivo** → Profilo del cliente: i numeri contano fino al valore nuovo, il grafico del peso si allunga col punto nuovo;
- **nota** → Profilo: la riga nuova entra in fondo alle note;
- **nuovo cliente** → Clienti: la scheda entra nell'elenco con un pop;
- **aspetto** → resta dove si è: il colore cambia dal vivo, il tema con la sua transizione di oggi;
- **notifiche** → Impostazioni: l'interruttore scatta.
- **Messaggio a più clienti** → Messaggi: si apre la prima conversazione, il fumetto parte, poi un contatore "Inviato a 4 clienti".

Riduci movimento, suoni e telefono (375 px) come nella spec del 24/10.

## 8. Struttura del codice

- `libs/dati/` (nuovo): `tipi.ts`, `iniziali.ts` (conversione dai dati finti), `sportello.ts` (operazioni), `selettori.ts` (hook di lettura).
- `libs/domain/`: controlli nuovi (`payments.ts`, `measurements.ts`, `clients.ts`), accanto a `packages.ts` e `revenue.ts`.
- `libs/prototipo/stato.ts`: clienti, pacchetti, pagamenti, misure, notifiche.
- `libs/prototipo/leo-azioni.ts`, `leo-esegui.ts`: azioni nuove; l'esecuzione passa dallo sportello.
- `libs/prototipo/leo-file.ts` (nuovo): lettura dei file.
- `libs/prototipo/leo-contesto.ts`: contesto dai dati mandati dal browser.
- `components/prototipo/trainer/LeoAzioni.tsx`: schede nuove (prima → dopo, spunte, email del nuovo cliente), "Conferma tutte".
- `CoachAssistant.tsx`: graffetta e pastiglia del file; il resto della logica nuova va nei file sopra, per non far crescere un file di 1.200 righe.
- Pagine elencate in 3.3: leggono dai selettori.

## 9. Test

- **Vitest:** conversione dei dati finti (euro → centesimi, pacchetti, misure); controlli di `libs/domain/`; ogni operazione dello sportello eseguita e annullata (stato identico); `{nome}` nei messaggi multipli; lettura di CSV/TXT e taglio a 6.000 caratteri; `ripulisci` sui file; azioni con forma sbagliata che diventano "azione-scartata".
- **Prova con DeepSeek vero** (dati finti): ~20 frasi (soldi, misure, note, obiettivo, nuovo cliente, aspetto, notifiche, messaggi multipli, richieste ambigue, solo domande) e 2-3 PDF finti di misure, anche con più clienti.
- **Playwright** (`channel: "msedge"`): i viaggi nuovi a 1440 e 375 px, chiaro e scuro, riduci movimento.

## 10. Fuori da questa spec

Import dei clienti a fine onboarding con inviti (spec sua: riguarda il benvenuto e richiede Resend e Supabase); foto e scansioni; schede di allenamento; vocali; esecuzione lato server con Supabase (lo sportello la prepara).
