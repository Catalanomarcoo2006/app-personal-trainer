# Leo agisce: azioni dal calendario e dai messaggi (design)

**Data:** 2026-10-24 · **Aggiornamento 24/10 sera:** niente più codici [C1]: Leo vede i nomi, nelle azioni il cliente è il suo id (`sara-conti`), riconosciuto anche per nome; email e telefoni tolti da `ripulisci`. · **Stato:** approvato a voce da Marco, da rileggere per iscritto · **Ambito:** prototipo dell'area trainer (dati finti)

## 1. Obiettivo

Oggi Leo, l'assistente del trainer, risponde e al massimo propone di aprire una sezione (`[[vai:…]]`). Deve poter **agire in prima persona** nella piattaforma: fissare, spostare e cancellare appuntamenti e scrivere ai clienti, con un'esperienza da demo "wow" (l'app si sposta da sola dove succede l'azione e la si vede accadere).

**Versione 1 (questa spec):** calendario + messaggi (opzione "B").
**Dopo (opzione "C"):** pagamenti e pacchetti (`segna_pagamento`, `aggiungi_lezioni`) con lo stesso meccanismo; non fanno parte di questo lavoro, ma il design deve permetterle aggiungendo solo un'azione, un controllo e un'animazione.

**Successo:**
- "Sposta Sara a venerdì alle 10" → Leo risponde con una frase, l'app va al calendario e la seduta vola nella cella nuova; "Annulla" la riporta indietro.
- "Cancella Davide di giovedì e avvisalo" → due schede da confermare (cancellazione, messaggio); dopo le conferme la seduta sparisce dal calendario e il messaggio compare nella chat di Davide.
- Richieste ambigue → Leo chiede, non agisce.
- Costo per domanda da ~0,1 a ~0,15–0,2 cent (nessun secondo giro verso l'AI).

## 2. Decisioni prese (con il perché)

| Decisione | Perché |
|---|---|
| Tool calling vero (`tools` dell'API compatibile OpenAI), non etichette nel testo | Argomenti strutturati e validabili; aggiungere azioni = aggiungere una voce al menu |
| Un solo giro verso l'AI: l'app esegue, l'AI non riceve il risultato | Metà costo e più veloce; i controlli li fa l'app e i messaggi d'errore li scrive l'app |
| Conferma secondo l'azione: fissa e sposta subito con "Annulla"; cancella e messaggio solo con conferma | Velocità dove si rimedia facilmente, controllo dove si tocca il cliente |
| Leo "porta" il trainer sul posto (chat compatta, cambio sezione, animazione) | È il momento che vende la demo |
| Lo stato di calendario e messaggi va nello store condiviso | Calendario, Messaggi e Leo devono leggere e scrivere gli stessi dati |
| Controlli come funzioni pure in `libs/` | Testabili con Vitest e riusabili lato server quando arriva Supabase |

## 3. Dati e stato

- `libs/prototipo/stato.ts` riceve:
  - **appuntamenti**: per settimana (offset 0 e 1, cioè la settimana demo del 19–25 ottobre e la successiva), ognuno con **id stabile** (`A1`, `A2`, …) oltre ai campi di `Appointment` (`time`, `minutes`, `clientId`, `type`, `place`). Si inizializzano da `weekOf(offset)` come oggi.
  - **conversazioni**: i thread di `Messages.tsx` (oggi stato locale), con un'azione per aggiungere un messaggio del trainer.
- `WeekCalendar.tsx` e `Messages.tsx` leggono e scrivono lo store (`useStato`) invece del loro `useState`; le modifiche manuali del trainer passano dalle stesse funzioni usate da Leo.
- Le settimane oltre la prossima restano come oggi (generate al volo, modifiche manuali possibili): Leo agisce solo su offset 0 e 1.

## 4. Il menu delle azioni (v1)

| Azione | Argomenti | Esecuzione |
|---|---|---|
| `fissa_appuntamento` | `cliente` (codice `C3`), `data` (`AAAA-MM-GG`), `ora` (`HH:MM`), `durata` (minuti), `tipo` (`Workout`/`Valutazione`/`Online`/`Corsa`), `luogo` (facoltativo; se manca: "Fit Lab, Meolo", "Videochiamata" per Online, "Parco di Meolo" per Corsa) | subito, con "Annulla" |
| `sposta_appuntamento` | `id`, `data`, `ora`, `durata` (facoltativa) | subito, con "Annulla" |
| `cancella_appuntamento` | `id` | dopo "Conferma" |
| `scrivi_messaggio` | `cliente`, `testo` | dopo "Conferma"; il testo è modificabile nella scheda |

Le definizioni (nome, descrizione, schema JSON) stanno in un solo file, `libs/prototipo/leo-azioni.ts`, insieme agli schemi `zod` e ai controlli: server e browser importano da lì.

**Controlli dell'app** (funzione pura `verificaAzione(azione, stato) → ok | motivo`):
- cliente esistente; id dell'appuntamento esistente;
- data nella settimana corrente o nella prossima, e non prima di adesso (la demo è ferma a mercoledì 21/10, `trainer.now`);
- inizio dalle 06:00, fine entro le 22:00; durata tra 15 e 180 minuti;
- nessuna sovrapposizione con altre sedute (escludendo quella che si sta spostando);
- testo del messaggio non vuoto e al massimo 1.000 caratteri.

Se un controllo fallisce, l'azione non parte e la scheda mostra il motivo in italiano, per esempio "Si sovrappone con Giulia Bianchi alle 18:00". Le azioni successive della stessa risposta continuano.

**Annulla:** ogni azione eseguita salva lo stato precedente della parte toccata; "Annulla" lo rimette, con l'animazione al contrario. È in evidenza per 8 secondi e poi resta nella scheda (finché la scheda è nella chat). Per il messaggio inviato non c'è "Annulla" (è stato confermato e mandato).

## 5. Il server (`app/prototipo/api/leo/route.ts`)

**Richiesta a DeepSeek:** come oggi (ultimi 10 messaggi pseudonimizzati, contesto di `contestoLeo()`), più `tools` (le 4 azioni) e `tool_choice: "auto"`.

**Contesto in più** (`libs/prototipo/leo-contesto.ts`):
- data e ora attuali della demo ("mercoledì 21 ottobre 2026, ore …");
- il calendario delle due settimane: una riga per seduta con id, giorno e data, ora, durata, tipo, luogo e codice del cliente. Il browser lo manda nella richiesta (lo stato vive lì), il server lo controlla con `zod` e lo pseudonimizza come il resto;
- regole nuove nelle istruzioni: usa le azioni solo se il trainer chiede di fare qualcosa; se cliente, giorno o seduta non sono chiari, chiedi invece di agire; accompagna sempre le azioni con una frase breve; nei messaggi ai clienti usa il loro codice, tono cordiale, firma del trainer non necessaria.

**Risposta al browser:** righe JSON (NDJSON, `Content-Type: application/x-ndjson`), un evento per riga:
- `{"tipo":"testo","v":"…"}`: pezzi della frase, man mano che arrivano;
- `{"tipo":"azione","nome":"…","dati":{…}}`: solo ad azione completa. Il server accumula `delta.tool_calls[i].function.arguments` per indice, alla fine fa `JSON.parse` e la validazione con `zod`; un'azione malformata si scarta con `console.warn`;
- `{"tipo":"errore","v":"…"}`: interruzione a metà.

Al massimo 5 azioni per risposta (le altre si scartano). Il ragionamento (`reasoning_content`) resta sul server come oggi.

**Memoria delle azioni:** quando il browser rimanda la conversazione, al messaggio di Leo aggiunge una nota testuale con l'esito, per esempio `(fatto: spostato A12 a 2026-10-23 10:00; messaggio a [C3] annullato dal trainer)`. Niente messaggi `tool` nella cronologia.

**Ragionamento + strumenti:** primo passo dell'implementazione, verificare che DeepSeek accetti `tools` con `thinking` attivo e che le azioni arrivino nel flusso. Se no, `thinking` disattivato su questa rotta e istruzioni più dettagliate.

**Senza chiave o con errore dell'AI:** restano le risposte fisse di `CoachAssistant.tsx`, senza azioni.

**Con Supabase (dopo):** l'esecuzione passa a funzioni server con RLS che riusano gli stessi schemi e controlli; menu e flusso NDJSON non cambiano.

## 6. Esperienza e animazioni

**Schede nella chat** (sotto la frase di Leo, una per azione): icona, riassunto con il nome vero del cliente ("Sposto **Sara Conti** · gio 22/10 10:00 → ven 23/10 10:00").
- immediate: "In corso…" → "Fatto ✓" + "Annulla"; errore: motivo in rosso tenue;
- da confermare: "Conferma" / "Annulla" (`btn-trainer`); la scheda del messaggio mostra il testo in un campo modificabile;
- "Torna dov'eri" riporta alla sezione da cui si era partiti.

**Il viaggio** (azione immediata, o subito dopo "Conferma"):
1. la chat si rimpicciolisce in una striscia sul lato destro (Leo resta aggrappato al bordo); l'app passa alla sezione con una dissolvenza veloce (niente macchia d'olio) e, per il calendario, alla settimana giusta;
2. la cella interessata si illumina col colore del trainer, poi:
   - **fissa:** la seduta atterra (scala 0,6 → 1 con molla, un pop);
   - **sposta:** la seduta vola dalla cella vecchia alla nuova (`layoutId` di Motion), con il suono del fruscio;
   - **cancella:** la seduta si restringe e sbiadisce lasciando un contorno tratteggiato per un attimo (niente `blur`);
   - **messaggio:** si apre la conversazione del cliente, il testo si scrive da solo nella barra, parte con il suono d'invio e compare il fumetto;
3. dopo ~1 s la chat torna grande; si resta nella sezione dell'azione.

**Più azioni:** una dopo l'altra (~1,2 s ciascuna) nell'ordine di Leo; una da confermare ferma la sequenza finché il trainer non tocca "Conferma" o "Annulla".

**Annulla:** stesso viaggio al contrario.

**Riduci movimento:** niente voli, molle o scrittura animata; cambio di sezione immediato, cella evidenziata ferma per un attimo, contenuto che cambia con una dissolvenza.

**Suoni:** quelli esistenti (`playSound`, tonalità per azione), disattivabili come oggi.

**Telefono (375 px):** la chat si chiude invece di rimpicciolirsi, l'animazione si vede a schermo intero, poi la chat si riapre.

## 7. Struttura del codice

- `libs/prototipo/leo-azioni.ts` (nuovo): definizioni `tools`, schemi `zod`, `verificaAzione`, `eseguiAzione` / `annullaAzione` sullo store, riassunti in italiano per le schede.
- `libs/prototipo/stato.ts`: appuntamenti con id e conversazioni; funzioni per aggiungere, spostare, cancellare, scrivere.
- `libs/prototipo/leo-contesto.ts`: data della demo, calendario delle due settimane, regole delle azioni.
- `app/prototipo/api/leo/route.ts`: `tools`, lettura dei `tool_calls`, uscita NDJSON.
- `components/prototipo/trainer/CoachAssistant.tsx`: lettura NDJSON, schede delle azioni, sequenza, chat compatta. Le schede vanno in un file a parte (`LeoAzioni.tsx`) per non far crescere ancora un file di 900 righe.
- `WeekCalendar.tsx`, `Messages.tsx`: leggono lo store, mostrano evidenziazione e animazioni delle azioni di Leo.
- `TrainerApp.tsx`: cambio sezione con dissolvenza su richiesta di Leo.

## 8. Test

- **Vitest** (`tests/unit/`): `verificaAzione` (sovrapposizioni, limiti di orario e data, id e clienti inesistenti), esegui → annulla che riporta lo stato identico, ricomposizione dei `tool_calls` a pezzi e scarto di quelli malformati, pseudonimizzazione del calendario e del testo dei messaggi.
- **Prova con DeepSeek vero** (dati finti): una decina di frasi tipo (fissa, sposta, cancella, avvisa, richieste ambigue, solo domande) controllando che le azioni siano giuste e che sulle sole domande non ne parta nessuna.
- **Playwright** (`channel: "msedge"`): il viaggio completo a 1440 e 375 px, chiaro e scuro, con riduci movimento.

## 9. Fuori da questa versione

Pagamenti e pacchetti (opzione C); azioni sulle schede di allenamento; azioni su settimane oltre la prossima; Leo del cliente; esecuzione lato server con Supabase.
