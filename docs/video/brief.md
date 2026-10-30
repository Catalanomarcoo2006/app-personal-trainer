# Brief del video

## Obiettivo
Un video breve da mandare **a uno a uno** su LinkedIn e WhatsApp a personal trainer, per incuriosirli su come funziona l'app nel dettaglio e far nascere la richiesta di una demo (e poi l'acquisto). Non è un video da pubblicità a pagamento: è il "guarda cosa ho fatto" che apri da una chat.

Deve far dire "wow" nei primi 3 secondi e far capire in un minuto tre cose:
1. **Leo fa il lavoro al posto tuo**: gli parli o scrivi e lui modifica davvero la dashboard (sposta sedute, scrive ai clienti, segna pagamenti, aggiorna misure da un file).
2. **I tuoi clienti hanno un'app bella, con il tuo marchio**: scheda, video degli esercizi, progressi, chat, Leo che risponde e ti avvisa se c'è un dolore.
3. **È fatta per te**: in italiano, con il tuo logo e il tuo colore, si paga una volta (non abbonamento mensile come Trainerize, TrueCoach, Everfit).

## Pubblico
Personal trainer italiani, 25-45 anni, lavorano da soli o in piccoli studi, gestiscono i clienti con WhatsApp, Excel e PDF. Guardano dal telefono, spesso **senza audio** all'inizio (LinkedIn parte muto): i sottotitoli sono obbligatori.

## Tono
Energico ma pulito, da prodotto premium (come i video di presentazione Apple e delle app fitness), mai da televendita. Frasi corte, seconda persona ("tu"), concrete: azioni vere, non aggettivi.

## Messaggio in una frase
"Spotter è l'app dei tuoi clienti con il tuo marchio, e Leo è l'assistente che gestisce agenda, messaggi e pagamenti al posto tuo."

## Formato (proposta: da confermare con Marco)
- **Principale**: verticale **9:16, 1080 × 1920, 30 fps**, H.264 + AAC. Durata **55-65 secondi**.
- **Seconda versione**: quadrata **1:1, 1080 × 1080** per il feed di LinkedIn (stesse scene, inquadrature adattate).
- Peso **sotto i 16 MB** (WhatsApp lo manda come video senza ricomprimerlo troppo) e comunque sotto i 20 MB (spec di progetto).
- **Sottotitoli impressi** nel video (non file a parte), grandi, in basso ma sopra l'area dei controlli.
- Prima immagine (copertina) forte: è quella che si vede in chat prima di premere play.

## Chiusura e invito
Ultima scena: logo di Spotter, frase "Vuoi vederla con i tuoi clienti?" e il contatto di Marco (da chiedere: numero, LinkedIn o email). Niente prezzo nel video (la spec di vendita dice niente prezzi in vetrina); si può dire "si paga una volta, niente abbonamento mensile" se Marco è d'accordo.

## Decisioni prese
- Il video si costruisce con **Remotion** (React), animazioni con le sue primitive (`spring`, `interpolate`) e, dove serve, Motion. Le schermate sono **quelle vere dell'app**, registrate con Playwright, non ridisegnate.
- Il protagonista è **Leo** che agisce sulla dashboard: è la cosa che nessun concorrente ha.
- Nome del prodotto nel video: **Spotter** (provvisorio, PROGRESS.md). Logo: `public/brand/logo-leo-anello.svg`.

## Decisioni da confermare con Marco (chiedere all'inizio della sessione)
1. Formato: va bene 9:16 principale + 1:1? Durata 55-65 s?
2. **Voce**: la registra Marco sul copione (più autentica), oppure voce sintetica italiana (es. ElevenLabs, serve un account e la chiave API di Marco, e il dominio va aperto nella rete dell'ambiente)?
3. **Musica**: brano con licenza commerciale (Pixabay Music gratis; Artlist o Epidemic Sound a pagamento). Lo sceglie Marco o se ne propongono 3?
4. Contatto finale e se dire "si paga una volta".
5. Il nome "Spotter" e il logo sono quelli definitivi per il video?
