# Area cliente del prototipo: design

**Data:** 2026-10-22 · **Stato:** approvato a voce, da rivedere per iscritto
**Parte da:** `docs/specs/2026-10-21-design.md`, sezioni 4 (Cliente), 6 (Assistente), 8 (Privacy), 9 (Stile)

## 1. Obiettivo

Portare `/prototipo/cliente` allo stesso livello dell'area trainer, per la demo: un trainer deve vedere cosa ricevono i suoi clienti, con il suo colore. Ogni tocco fa qualcosa, lo stile è quello dell'area trainer, i dati sono finti e non c'è database.

**Riuscito quando:**
- le 4 schede in basso (Oggi, Progressi, Chat, Documenti) e il Profilo funzionano, a 375 px di larghezza e dentro la cornice del telefono sul computer;
- con l'area trainer e l'area cliente aperte in due finestre dello stesso browser, quello che fa il cliente (allenamento, spostamento, messaggio, dolore, misure, documento) compare subito al trainer, e i messaggi e le schede del trainer compaiono subito al cliente;
- se il trainer cambia colore nelle Impostazioni, l'app del cliente si ricolora senza ricaricare;
- niente tasti neri, tema scuro funzionante, `prefers-reduced-motion` rispettato;
- **estetica premium allo stesso livello dell'area trainer da computer** (richiesta di Marco del 26/10, ci tiene moltissimo): stesso tema chiaro con i pastelli e stesso scuro nero pece con vetro e bordo chiaro, `glass` / `btn-trainer` / `sel-trainer`, Leo con le sue animazioni, suoni al tocco, transizioni fluide (fogli, pillola della barra, cambio sezione), cura dei dettagli come nel benvenuto. Non un'app "più semplice" del trainer: è quella che il cliente vede ogni giorno.

## 2. Fuori ambito

Scelto apposta per restare sul semplice (decisione di Marco del 22/10):
- timer di recupero e pallini per serie: una sola spunta per esercizio;
- proposte rapide nella richiesta di spostamento: solo il messaggio;
- spostamento vero della seduta nel calendario del trainer (Fase 2);
- dati che restano dopo aver chiuso le finestre, collegamento tra telefono e computer diversi (nel prodotto: Supabase Realtime);
- notifiche push, storico di acqua e passi, grafici delle misure oltre al peso.

## 3. Architettura

**Pagina unica.** Come l'area trainer: `app/prototipo/cliente/[[...sezione]]/page.tsx` monta `ClientApp`, che sceglie la sezione dall'indirizzo. Indirizzi: `/prototipo/cliente` (Oggi), `/progressi`, `/chat`, `/documenti`, `/profilo`. Il cambio sezione usa `history.pushState` (come `components/prototipo/trainer/nav.ts`): nessuna richiesta al server, le sezioni visitate restano montate.

**File.** `components/prototipo/cliente/`: `ClientApp.tsx` (sezioni), `Shell.tsx` (cornice, intestazione, barra in basso), `Oggi.tsx`, `Progressi.tsx`, `Chat.tsx`, `Documenti.tsx`, `Profilo.tsx`, `Consenso.tsx`, `LeoCliente.tsx`, `nav.ts`. L'attuale `Sections.tsx` viene smontato in questi file.

**Stato condiviso tra finestre (approccio A).** Lo stato di `libs/prototipo/stato.ts` si allarga con i dati che vedono entrambe le aree:
- `threads`: conversazioni trainer ↔ cliente (oggi stanno dentro `Messages.tsx`);
- `avvisi`: quello che il cliente manda al trainer (`allenamento`, `spostamento`, `dolore`, `misure`, `documento`), con testo, ora e "letto";
- `misure` di Giulia (peso, vita, fianchi, petto, braccio, coscia, per data);
- `documenti` del cliente (nome, tipo, chi l'ha caricato, file);
- `spostamento`: la richiesta aperta della prossima seduta;
- `consenso`: se il primo accesso è stato completato.

Ogni modifica viene trasmessa alle altre finestre con `BroadcastChannel("pt-prototipo")` come stato intero (è piccolo); chi riceve lo sostituisce senza ritrasmetterlo. Una finestra appena aperta chiede lo stato alle altre; se nessuna risponde, parte dai dati finti. Chiudendo tutte le finestre si riparte puliti. Vince l'ultima modifica: in una demo clicca una persona alla volta.

I file (PDF delle schede, documenti caricati) stanno nello stato come `Blob`, che passa da una finestra all'altra; ogni finestra crea il proprio indirizzo per aprirlo. `SentPlan.url` diventa `SentPlan.file: Blob`.

Il colore del trainer passa già da `localStorage` (`appearance.tsx`): basta ascoltare l'evento `storage` per ricolorare l'altra finestra. La foto del trainer è già nello stato.

**Leo.** Le parti comuni di `CoachAssistant.tsx` (viso, elenco messaggi con "sta scrivendo", campo di testo, logica della chat con una funzione di risposta) vanno in `components/prototipo/leo/`. Leo del trainer resta identico per chi lo usa; Leo del cliente usa gli stessi pezzi in un foglio dal basso, con risposte sue. `components/ui/Assistant.tsx` (sfera blu) non serve più e si elimina.

## 4. Schermate del cliente

> **Aggiornamento del 28/10 (decisioni di Marco, valgono sopra il resto di questa sezione):**
> - Barra in basso: pillola di vetro in rilievo (`glass glass-3d`) con 4 voci **Home · Allenamento · Progressi · Messaggi** e la goccia (`glass-drop`, come la barra laterale del trainer) che scivola sulla voce attiva; il **Profilo** si apre dalla foto in alto e contiene anche **i documenti** (niente voce Documenti nella barra).
> - Intestazione: titolo grande ("Ciao, Giulia! 👋", poi il nome della sezione) che scorrendo si **rimpicciolisce come su iOS** in una barra sottile di vetro con titolo piccolo e foto.
> - Home come `docs/riferimenti/cliente-home-mobile.png`, senza l'ultimo messaggio: allenamento di oggi con avanzamento e "Avvia allenamento", agenda con i giorni e la seduta del giorno scelto, "Chiedi a Leo" con Leo affacciato dal bordo (`spunta.webp`).
> - Ordine di lavoro: prima l'estetica di tutte le schermate con i dati finti, il collegamento dal vivo con l'area trainer dopo (con Supabase si rifà comunque).
> - Leo del cliente **con l'AI** (richiesta di Marco del 28/10, solo con dati finti come per il trainer): rotta `app/prototipo/api/leo-cliente` senza azioni, istruzioni con i dati di Giulia e le regole (niente diete, prudenza sul dolore con avviso al trainer tramite `[[avvisa-trainer]]`, 112 per le emergenze); senza chiave le risposte fisse. L'avviso al trainer per ora compare solo nella chat del cliente: arriverà al trainer con il collegamento dal vivo.
> - Fatti il 28/10: pagina unica (`app/prototipo/cliente/[[...sezione]]`), guscio (`cliente/Shell.tsx`), Home (`cliente/Home.tsx`). Allenamento e Progressi usano per ora le schede di prima (`Sections.tsx`), Messaggi e Profilo sono "in arrivo".


**Guscio.** In alto: logo del trainer nel suo colore, "Ciao, Giulia", sotto "con Marco Rossi"; a destra campanella con il numero degli avvisi per il cliente (scheda nuova, risposta del trainer), che apre l'elenco (ogni voce porta alla Chat), e foto di Giulia che apre il Profilo. In basso: pillola in vetro con 4 voci (icona + etichetta) Oggi · Progressi · Chat · Documenti; la Chat mostra i non letti; la voce attiva ha una pillola nel colore tenue del trainer che scivola da una voce all'altra. Sul telefono: niente zoom sui campi (testo ≥ 16 px), niente lampeggio al tocco, margini per la tacca, altezza `100dvh`.

**Oggi**, dall'alto:
1. settimana di 7 giorni in tinte tenui (fatto con spunta, oggi nel colore del trainer, puntino nei giorni con seduta) e "2 lezioni rimaste";
2. allenamento di oggi: una spunta per esercizio, "Guarda l'esecuzione"; a esercizi tutti spuntati "Allenamento completato" e avviso `allenamento` al trainer;
3. prossima seduta (giorno, ora, luogo) con "Vorrei spostarla": foglio con un messaggio → messaggio in chat con l'etichetta "Richiesta di spostamento" e avviso `spostamento`; la scheda mostra "Richiesta inviata, Marco ti risponde in chat";
4. obiettivo compatto (−8 kg, percentuale, barra) che porta a Progressi; corretti il titolo "Prossima seduta" sovrapposto e la percentuale ferma allo 0%;
5. acqua (+ un bicchiere) e passi (si scrivono a mano).

**Progressi:** obiettivo in grande (percentuale, partenza, oggi, traguardo); peso con numero e grafico; misure (vita, fianchi, petto, braccio, coscia) con variazione dall'inizio; "Aggiungi misure" apre un foglio, aggiorna grafico e misure e manda l'avviso `misure`.

**Chat:** la conversazione con il trainer, la stessa dei suoi Messaggi, dal vivo. Le schede inviate dal trainer arrivano come PDF da aprire. Le richieste di spostamento hanno l'etichetta. I messaggi interni di Leo al trainer non si vedono.

**Documenti:** elenco (dieta del nutrizionista in PDF, scheda del trainer, analisi); un tocco apre il file. "Carica" accetta PDF o foto; le foto vengono rimpicciolite nel browser (lato lungo 1600 px, JPEG); avviso `documento` al trainer.

**Profilo:** il tuo trainer (foto, nome, "Scrivi" → Chat); pacchetto (lezioni rimaste, scadenza); suoni sì/no; tema chiaro/scuro; "Rivedi informativa e consenso".

**Primo accesso:** schermata con logo e colore del trainer, "Marco Rossi ti ha invitato"; informativa breve (cosa si raccoglie: peso, misure, allenamenti, dolori segnalati; chi lo vede: il tuo trainer; dove: server in UE); casella del consenso esplicito ai dati sanitari, senza la quale "Entra" resta spento con la spiegazione del perché. Compare finché `consenso` non è dato.

**Leo per il cliente:** viso in un cerchio sopra la barra, a destra; al primo ingresso una vignetta ("Ciao Giulia! Oggi c'è il Giorno A 💪"). Toccato, la chat sale dal basso come foglio con Leo affacciato dal bordo alto e le 4 domande pronte di `dati-finti.ts`. "Mi fa male il ginocchio" → risposta prudente con il consiglio del medico e avviso `dolore` al trainer con la frase del cliente. Altre domande: risposte finte esistenti, alimentazione rimandata alla dieta del nutrizionista.

## 5. Cosa cambia nell'area trainer

- **Messaggi** (sezione e scheda della home): leggono e scrivono `threads` nello stato condiviso.
- **Urgenti**: aggiungono gli avvisi `dolore` e `spostamento`, con il numero sul campanello.
- **Notifiche** (campanella della barra in alto): aggiungono `allenamento`, `misure`, `documento`.
- **Invio scheda**: salva il PDF come `Blob` nello stato.

Nient'altro dell'area trainer cambia.

## 6. Verifica

- Controllo dei tipi e build con chiavi finte senza errori.
- Nel browser a 375 px: ogni scheda, ogni tasto, tema scuro, "riduci movimento"; nessun errore in console.
- Due finestre affiancate: per ognuno degli avvisi del cliente, compare al trainer; un messaggio e una scheda del trainer compaiono al cliente; cambio colore dal vivo.
- Test automatici (Vitest, introdotto qui) per le parti di logica pura: unione dello stato ricevuto da un'altra finestra e conteggio degli avvisi non letti.
