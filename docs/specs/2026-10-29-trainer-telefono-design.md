# Area trainer da telefono

**Data:** 2026-10-29 · **Stato:** fatta (prototipo, dati finti)

## Scelte di Marco (29/10)
- Solo l'ottimizzazione per il telefono: niente Incassi e niente Schede (restano sul computer).
- Sezioni: Oggi · Clienti · Messaggi · Calendario (barra in basso a pillola, come l'app del cliente).
- Leo completo: chat con le azioni, vocali e file, senza le azioni sui soldi.

## Come funziona
- Stessi indirizzi del computer (`/prototipo/trainer/...`): `TrainerFrame` (`trainer/Chrome.tsx`) sceglie la forma con `useForma` (`trainer/telefono/forma.ts`): telefono se lo schermo è largo al massimo 700 px, oppure `?telefono` nell'indirizzo (resta per la scheda del browser; `?computer` torna alla tela larga). Incassi, Schede e Impostazioni da telefono mostrano Oggi.
- Guscio comune con il cliente (`cliente/Shell.tsx`, `Guscio`): voci della barra, foto in alto e freccia "indietro" le passa chi lo usa. La foto del trainer apre il foglio dell'account con "Passa alla versione da computer".
- **Oggi** (rifatta il 30/10, Marco: "il calendario al centro", gli avvisi non sono urgenze): in alto la prossima seduta in grande (ora protagonista, "tra 40 minuti", cliente con foto), poi "La tua giornata" su una linea del tempo con il segno "Adesso · 10:20", in fondo "Da tenere d'occhio" in vetro chiaro e piccolo, senza numeri rossi (proposte da confermare, dolori, pacchetti quasi finiti; la seduta imminente non si ripete). Tolto il riquadro "Chiedi a Leo": c'è la faccia di Leo.
- **Clienti**: ricerca, filtro "Da seguire", profilo con Scrivi, Seduta, Chiama; proposte da confermare (`DaConfermare` nella pagina), obiettivo con barra e pesi, misure, prossime sedute, pacchetto (senza importi), note, contatti.
- **Messaggi**: elenco con i non letti (`telefono/nonLetti.ts`: sale anche coi messaggi dall'app del cliente), chat con casella fissa in basso; le note di Leo si vedono come "solo per te"; quando Leo scrive, il testo compare nella casella.
- **Calendario**: 14 giorni in due righe, sedute del giorno, foglio di una seduta (profilo, scrivi, cancella con doppio tocco), foglio "Nuova seduta" (cliente, giorno, ora a rotelle, durata, tipo, posto) con gli stessi controlli di Leo (`verificaAzione`).
- **Leo** (`telefono/LeoTelefono.tsx`): foglio con Leo affacciato dal bordo (la foto del cliente), `useCoachChat({ senzaSoldi: true })`: le azioni sui soldi diventano schede rifiutate ("Pagamenti e pacchetti si gestiscono dal computer"). Durante il viaggio il foglio scende, l'app va nella sezione giusta (la sezione da telefono porta `data-sezione` per `navigateFade`), il calendario apre il giorno e accende la seduta; poi il foglio risale. Tasto tondo con il viso di Leo sopra la barra, tranne nella chat con un cliente: **un tocco apre la chat; tenendolo premuto gli dici cosa fare e Leo lo fa, senza aprire la chat** (30/10, `telefono/TastoLeo.tsx`): "Accendo il microfono…", poi "Parla adesso" con una vibrazione; lasciando si ascolta ancora 0,7 s (con lo stop immediato la dettatura del telefono restituiva un testo vuoto: "Non ho sentito niente") e il testo parte sempre (`useVoceLeo({ sempreInvia })`). Sopra la faccia un fumetto mostra cosa hai detto, la risposta e le azioni (fatte, in corso, rifiutate); quelle da confermare si confermano lì ("Conferma" / "Rivedi" apre la chat). Lasciato prima di "Parla adesso", il fumetto lo dice. La faccia è più grande (68 px) con il bordo al neon che gira e l'alone che pulsa, come il tasto di Leo del cliente. La casella e il microfono della chat stanno in `TrainerTelefono` e passano al foglio.

## Dopo
- Notifiche push, quando c'è il backend; spostare una seduta trascinandola; Leo che sa di essere sul telefono (oggi non lo sa: le azioni sui soldi si fermano nell'app).
