# Da cambiare

Lista delle modifiche, anche piccole, che Marco vuole fare. Si aggiunge man mano; quando una voce è fatta si spunta con la data.

## Area trainer

- [ ] **Benvenuto, passo "Conosci Leo"**: c'è ancora qualcosa che non va; Marco lo riprende più avanti per ultimarlo (cosa, da chiarire con lui). (2026-10-24) Punti proposti il 24/10, da scegliere con Marco: Leo grande sul bianco senza pavimento né ombra che lo leghi al pannello (vuoto sopra, stacco netto bianco/arancione); "Eccomi! 👋" lontano dalla mano; nuvoletta delle battute con un buco bianco sotto il testo (`min-h` fisso); alla scelta del tono Leo piccolo sembra appiccicato su telefono e didascalia, e nel telefono il 🔥 della risposta "Motivante" va a capo da solo.
- [ ] **Testa di Leo in basso a sinistra (sezioni diverse dalla home)**: non è centrata bene rispetto a ciò che ha sotto, esteticamente non convince. Da valutare: ingrandirla in modo che copra un pelo la barra laterale di vetro, oppure spostarla in un altro punto. (2026-10-23)
- [x] **Suono all'ingresso nella home**: effetto "numeri che salgono", un suono che scorre verso l'alto come un grafico che sale rapidamente; parte con il conteggio dei numeri e finisce quando smettono di crescere. Rispettare l'interruttore "Suoni ai clic" e `prefers-reduced-motion`. (2026-10-23) **Fatto 2026-10-23.**
- [x] **Bug nelle Impostazioni, sezione Aspetto**: in fondo, sotto "Ascolta i suoni", le schede (Apertura, Conferma…) escono dal pannello e restano tagliate dal bordo. (2026-10-23) **Fatto 2026-10-24**: la pagina aveva altezza fissa e le schede si stringevano sotto il contenuto; ora sugli schermi bassi scorre.
- [ ] *(in pausa dal 2026-10-24: ci si pensa in un altro momento)* **Colori della home**: un po' troppo incasinati, da rendere più ordinati e coerenti (in linea con "un solo colore forte"). (2026-10-23)
- [ ] **Tema scuro**: il grigio di fondo non piace a Marco; da ripensare la palette scura (fondo e schede). (2026-10-23)
- [ ] **Fluidità ovunque**: tutto sempre fluido al massimo, a partire dal cambio di sezione dentro la piattaforma, poi tutte le altre transizioni e animazioni. (2026-10-24)
- [ ] **Macchia d'olio da "Salta per ora"**: passaggio dal benvenuto/onboarding alla dashboard con la macchia d'olio. (2026-10-24)
- [ ] **Macchia d'olio come nel video di riferimento** (`Videos/ANIMAZIONE SCHERMO NERO APP.mp4`, da copiare in `docs/riferimenti/`): la macchia di oggi è troppo tonda e pulita; quella del video è una forma liquida grande e asimmetrica, che parte dal pulsante e attraversa lo schermo in diagonale con un fronte a onda (lingue curve lunghe), in circa mezzo secondo. Vale per tutte le macchie (`libs/ui/macchia.ts`, forma in `app/globals.css`). (2026-10-24)

- [ ] **Leo, "Conferma tutte"**: quando Leo propone più azioni da confermare (es. 5 cancellazioni), un tasto unico per confermarle tutte; nella prova del 24/10 Marco ne ha lasciate indietro alcune. (2026-10-24)
- [ ] **Leo fa tutto** (in pausa): peso, misure, note, obiettivo, nuovo cliente; segna pagato, registra pagamento, aggiungi lezioni/rinnova, sollecito come messaggio vero; colore, tema, suoni, notifiche; azioni su più clienti con una scheda a spunte e "Invia a tutti". Subito + Annulla: peso, misure, obiettivo, nota, impostazioni; con conferma: nuovo cliente, soldi, pacchetti, solleciti, azioni multiple. Schede escluse. Dettagli in `PROGRESS.md`; si parte dalla spec. (2026-10-24)
- [ ] **Vocali a Leo dal telefono del trainer**: idea in `IDEE.md`, insieme alla versione telefono del trainer. (2026-10-24)
- [ ] **Leo, rifiniture dalla revisione del 24/10** (minori): azione malformata scartata in silenzio (mostrare "non ho capito, riprova"); il viaggio continua se si chiude la chat a metà; Calendario/Messaggi riaperti dopo tanto ripartono dall'ultima azione di Leo; limite 1.000 caratteri del messaggio; ultima riga del flusso e tool_calls senza indice (per il fornitore UE); test dell'evento errore della rotta e della fila con timer finti; spec da allineare (chat compatta in basso, tasto Invia). (2026-10-24)

## Area cliente

## Varie
