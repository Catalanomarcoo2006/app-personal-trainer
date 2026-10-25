# Vocali a Leo: design

Data: 2026-10-25. Stato: approvata, realizzata il 2026-10-25 (piano `docs/plans/2026-10-25-vocali-leo.md`).

## Obiettivo

Il trainer parla a Leo invece di scrivere. Tocca il microfono nella chat, dice quello che deve fare ("Luca ha pagato, segna 77 kg a Sara, sposta Davide a domani alle 18"), tocca di nuovo per finire, e Leo prepara le schede delle azioni da confermare, come con un messaggio scritto.

Fuori da questa funzione: Leo che risponde a voce, vocali dei clienti, note vocali salvate. L'audio non si conserva: si trascrive e basta.

## Come funziona per il trainer

- **Il microfono** sta nella barra della chat di Leo, accanto al tasto per allegare i file. Funziona col dito e col mouse (un semplice `click`).
- **Tocchi una volta e parli, senza tenere premuto.** Il microfono passa da grigio a "sto accendendo" (rotellina) ad acceso (pieno, con onde, bordo della barra illuminato, scritta "Ti ascolto"; fermo con "riduci movimento"). Mentre parli il testo compare nella barra, dal vivo. Massimo 60 secondi: allo scadere si ferma da solo come se avesse toccato per finire.
- **Per finire** si tocca di nuovo il microfono.
- **Annulla**: il tasto "Annulla" sopra la barra o Esc buttano il vocale e la barra torna com'era.
- **Quando finisci**, dipende dalla scelta del trainer:
  - **"Invia subito"**: il testo parte da solo verso Leo, come se l'avesse scritto e premuto Invio. Non c'è una conferma sul vocale.
  - **"Rivedi prima"**: il testo resta nella barra, modificabile, e lo manda il trainer.
- **La scelta si fa la prima volta.** Subito dopo il primo vocale compare una scheda con il testo trascritto e due tasti: "Mandalo subito a Leo (da ora sempre così)" e "Fammelo rivedere (da ora sempre così)". Il vocale in corso segue quello che sceglie. Dopo non chiede più.
- **Cambiare idea**: Impostazioni → nuova riga "Vocali a Leo" con "Invia subito" / "Rivedi prima". Finché il trainer non ha scelto, la riga mostra "Da scegliere" e il prossimo vocale la chiede.
- **Le azioni di Leo non cambiano.** "Invia subito" salta solo la rilettura del *testo*: cancellazioni, messaggi ai clienti, soldi e nuovo cliente si confermano nelle loro schede come sempre. È una scelta di sicurezza, resta.

## Come è fatto dentro

- `libs/prototipo/leo-voce.ts`: la forma del trascrittore e la macchina del gesto (pura, testabile).
  ```
  Trascrittore: avvia(onTesto: (testo, finale) => void): Promise<void>
                ferma(): Promise<string>   // il testo finale
                annulla(): void
  ```
  Stati del gesto: `fermo → in-ascolto → (finito | annullato | errore)`.
- `libs/prototipo/leo-voce-browser.ts`: il primo trascrittore, con la dettatura del browser (`SpeechRecognition`, lingua `it-IT`, risultati provvisori attivi per il testo dal vivo). Se il browser non la ha, `disponibile()` dà `false` e il microfono non compare.
- Più avanti, `leo-voce-server.ts`: registra con `MediaRecorder`, al rilascio manda l'audio a una rotta `app/prototipo/api/leo/voce` che lo gira al fornitore UE (API `audio/transcriptions` compatibile OpenAI, variabili `AI_STT_BASE_URL`, `AI_STT_API_KEY`, `AI_STT_MODEL`). Mostra "Trascrivo…" invece del testo dal vivo. Per passare dall'uno all'altro si cambia una riga.
- `components/prototipo/trainer/MicrofonoLeo.tsx`: il tasto, il gesto, la pulsazione, la scheda della prima scelta. In `CoachAssistant.tsx` entrano poche righe (il tasto nella barra e la funzione che manda il testo, già esistente: `ask`).
- **La scelta** ("subito" / "rivedi" / non ancora scelta) sta nello stesso posto delle altre preferenze del trainer, nel browser per ora (con Supabase finirà nel profilo, accanto a colore e suoni).
- **Il testo trascritto** fa lo stesso percorso di uno scritto: `ripulisci` toglie email e telefoni prima che vada a Leo. Nessun altro passaggio.

## Quando qualcosa va storto

| Caso | Cosa succede |
|---|---|
| Il browser non ha la dettatura (per esempio Firefox) | Il microfono non compare |
| Permesso del microfono negato | Una riga rossa sopra la barra (come per i file): "Serve il permesso del microfono: abilitalo dal lucchetto vicino all'indirizzo" |
| Non sente voce | "Non ho sentito niente, riprova" e il vocale si butta |
| Il riconoscimento si interrompe a metà (rete) | Resta il testo arrivato fino a lì, con "Rivedi prima" forzato per quella volta |
| Più di 60 secondi | Si ferma da solo e prosegue come un rilascio |
| Mentre Leo sta già lavorando a un'azione | Il microfono è fermo (come la barra) |

## Privacy

- La dettatura del browser (Chrome) manda l'audio a Google. Con i dati finti della demo va bene. **Con clienti veri non si usa**: nella voce ci sono nomi e dati sulla salute.
- Prima del primo cliente vero serve il trascrittore del fornitore UE (con DPA firmato) e l'informativa deve dire che la voce viene trascritta da lui. Va nei "Problemi noti" di `PROGRESS.md` e nei "Da non fare" del progetto.
- L'audio non si salva da nessuna parte; del vocale resta solo il testo, come per un messaggio scritto.

## Test

- Automatici (Vitest), con un trascrittore finto: il gesto (premi, parla, lascia, annulla, Esc), il limite dei 60 secondi, la scelta "subito"/"rivedi" e la prima volta che chiede, il testo vuoto, gli errori, il permesso negato, il browser senza dettatura.
- A mano, da Marco: la prova con la voce vera nel browser (il microfono non lo posso provare io), con Chrome o Edge.

## Ordine di lavoro

1. Macchina del gesto e trascrittore finto, con i test.
2. Trascrittore del browser.
3. Il tasto nella chat, con la pulsazione e il testo dal vivo.
4. La scheda della prima scelta e la riga nelle Impostazioni.
5. Errori, `PROGRESS.md`, `docs/DA-CAMBIARE.md`, aggiornamento dei testi del benvenuto (descrive già i vocali come fatti).
6. Più avanti, con il fornitore UE: il trascrittore del server.
