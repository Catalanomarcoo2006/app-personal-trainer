# Area trainer da telefono

**Data:** 2026-10-29 · **Stato:** fatta (prototipo, dati finti)

## Scelte di Marco (29/10)
- Solo l'ottimizzazione per il telefono: niente Incassi e niente Schede (restano sul computer).
- Sezioni: Oggi · Clienti · Messaggi · Calendario (barra in basso a pillola, come l'app del cliente).
- Leo completo: chat con le azioni, vocali e file, senza le azioni sui soldi.

## Come funziona
- Stessi indirizzi del computer (`/prototipo/trainer/...`): `TrainerFrame` (`trainer/Chrome.tsx`) sceglie la forma con `useForma` (`trainer/telefono/forma.ts`): telefono se lo schermo è largo al massimo 700 px, oppure `?telefono` nell'indirizzo (resta per la scheda del browser; `?computer` torna alla tela larga). Incassi, Schede e Impostazioni da telefono mostrano Oggi.
- Guscio comune con il cliente (`cliente/Shell.tsx`, `Guscio`): voci della barra, foto in alto e freccia "indietro" le passa chi lo usa. La foto del trainer apre il foglio dell'account con "Passa alla versione da computer".
- **Oggi**: tasto luminoso "Chiedi a Leo", "Da fare subito" (avvisi senza i pagamenti + proposte dei clienti da confermare), sedute di oggi (finite spente, "Adesso" su quella in corso).
- **Clienti**: ricerca, filtro "Da seguire", profilo con Scrivi, Seduta, Chiama; proposte da confermare (`DaConfermare` nella pagina), obiettivo con barra e pesi, misure, prossime sedute, pacchetto (senza importi), note, contatti.
- **Messaggi**: elenco con i non letti (`telefono/nonLetti.ts`: sale anche coi messaggi dall'app del cliente), chat con casella fissa in basso; le note di Leo si vedono come "solo per te"; quando Leo scrive, il testo compare nella casella.
- **Calendario**: 14 giorni in due righe, sedute del giorno, foglio di una seduta (profilo, scrivi, cancella con doppio tocco), foglio "Nuova seduta" (cliente, giorno, ora a rotelle, durata, tipo, posto) con gli stessi controlli di Leo (`verificaAzione`).
- **Leo** (`telefono/LeoTelefono.tsx`): foglio con Leo affacciato dal bordo (la foto del cliente), `useCoachChat({ senzaSoldi: true })`: le azioni sui soldi diventano schede rifiutate ("Pagamenti e pacchetti si gestiscono dal computer"). Durante il viaggio il foglio scende, l'app va nella sezione giusta (la sezione da telefono porta `data-sezione` per `navigateFade`), il calendario apre il giorno e accende la seduta; poi il foglio risale. Tasto tondo con il viso di Leo sopra la barra, tranne nella chat con un cliente.

## Dopo
- Notifiche push, quando c'è il backend; spostare una seduta trascinandola; Leo che sa di essere sul telefono (oggi non lo sa: le azioni sui soldi si fermano nell'app).
