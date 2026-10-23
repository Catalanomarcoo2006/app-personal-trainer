# Benvenuto del trainer (onboarding): design

**Data:** 2026-10-23 · **Stato:** approvato a voce, da rivedere per iscritto
**Parte da:** `docs/specs/2026-10-21-design.md` (sezioni Trainer, Privacy, Stile)

## 1. Obiettivo

La prima volta che il trainer entra nel suo account (creato da Marco), un percorso guidato a tutto schermo gli fa preparare l'app che riceveranno i suoi clienti: marchio, accordi sulla privacy, primo cliente, Leo. È il momento "wow" della demo: il trainer vede nascere la *sua* app mentre la configura.

**Priorità: computer** (decisione di Marco del 23/10). Schermo di riferimento 1280–1440 px; il telefono deve solo funzionare (una colonna), senza rifiniture.

**Riuscito quando:**
- al primo accesso a `/prototipo/trainer` si apre il benvenuto; finito, non ricompare più (anche ricaricando); "Rivedi il benvenuto" in Impostazioni lo riapre;
- ogni scelta (colore, logo, foto, nome dello studio, tono di Leo) si vede subito nel telefono d'anteprima e poi nella dashboard;
- senza accettare gli accordi non si arriva alla dashboard;
- niente tasti neri, tema scuro funzionante, suoni al tocco, `prefers-reduced-motion` rispettato, console pulita.

## 2. Fuori ambito

- Rifiniture per il telefono del trainer (resta una colonna funzionante).
- Invio vero dell'email d'invito, registrazione libera, account veri: solo dati finti, nessuna chiamata di rete.
- Testi legali veri di termini e DPA: nel prototipo un riassunto in parole semplici con un testo segnaposto dichiarato ("bozza da far rivedere a un professionista").
- Onboarding del cliente (Task 8 del piano dell'area cliente): resta nel suo piano, dopo.

## 3. Il flusso

Pagina a tutto schermo, `/prototipo/benvenuto`. In alto: logo dell'app, barra a 5 tratti che si riempiono nel colore del trainer, "Indietro". Al centro, su computer, due colonne: a sinistra la scheda del passo (entra scivolando), a destra un **telefono con l'app del cliente** che cambia a ogni passo. Suoni del prototipo a ogni tocco, `confirm` alla fine di ogni passo. Con "riduci movimento" solo dissolvenze.

1. **Saluto.** Il personaggio (`public/prototipo/personaggio-trainer.png`) entra con una molla e saluta (piccola oscillazione). "Ciao Marco, benvenuto! In 2 minuti prepariamo l'app che riceveranno i tuoi clienti." Sotto, i 4 passi in breve e "Iniziamo". Il telefono mostra un'app grigia, senza marchio.
2. **Il tuo marchio** (si può saltare: "Lo faccio dopo"). Nome dello studio, logo (caricato, oppure le iniziali nel colore), gli 8 colori di Impostazioni, la foto del trainer. Il telefono si ricolora dal vivo a ogni scelta e mostra logo, nome dello studio e foto.
3. **Privacy e accordi** (obbligatorio). Tre schede in parole semplici: "I dati dei tuoi clienti sono tuoi: sei il titolare del trattamento"; "Noi li custodiamo per te, con un accordo scritto (DPA)"; "Server in Unione Europea, dati sulla salute protetti". "Leggi termini e accordo" apre un foglio con il testo segnaposto. Casella "Ho letto e accetto i termini di servizio e l'accordo sul trattamento dei dati (DPA)"; "Avanti" spento finché non è spuntata, con sotto il perché ("Serve per poter seguire i dati sulla salute dei tuoi clienti"). Il telefono mostra la schermata del consenso che vedranno i clienti.
4. **Primo cliente** (si può saltare). Nome ed email, oppure "Prova con un cliente di esempio" (Giulia Bianchi). Compare il link `nomeprodotto.it/marco-rossi` con "Copia" e "Invia invito" (finto: "Invito pronto! Nel prodotto vero parte un'email a …"). Il telefono mostra il benvenuto che riceve il cliente ("Marco Rossi ti ha invitato").
5. **Conosci Leo** (si può saltare). Leo (`viso.webp` / `in-piedi.webp`) si presenta con le tre battute di `LeoPresentazione.tsx` adattate al benvenuto; il trainer sceglie il tono: amichevole, professionale, motivante. Nel telefono una vignetta di Leo con una frase d'esempio che cambia con il tono.
6. **Finale.** "La tua app è pronta!", torna il personaggio, coriandoli nel colore del trainer (solo con il movimento attivo), riepilogo (colore, studio, primo cliente, tono di Leo), "Entra nella tua dashboard" → `/prototipo/trainer` con la macchia d'olio.

## 4. Architettura

**Pagina a sé**, `app/prototipo/benvenuto/page.tsx`, fuori dal layout del trainer: `TrainerFrame` rimpicciolisce tutto su una tela di 1303 px e porta barra laterale e Leo, che qui non servono. `TrainerFrame` controlla all'apertura: se il benvenuto non è fatto, porta a `/prototipo/benvenuto`.

**File** in `components/prototipo/benvenuto/`:
- `Benvenuto.tsx`: regia (passo corrente, avanti/indietro, barra a 5 tratti, due colonne su computer, una sotto `lg`);
- `Saluto.tsx`, `Marchio.tsx`, `Accordi.tsx`, `PrimoCliente.tsx`, `ConosciLeo.tsx`, `Finale.tsx`: un file per passo;
- `AnteprimaTelefono.tsx`: telefono con una versione ridotta dell'app del cliente, che disegna solo i pezzi del passo (intestazione con logo, saluto, scheda dell'obiettivo, consenso, invito, vignetta di Leo); separato dall'app del cliente vera;
- `Personaggio.tsx`: il personaggio con entrata e saluto;
- `Coriandoli.tsx`: coriandoli del finale, leggeri, spenti con "riduci movimento".

**Dati**, `libs/prototipo/benvenuto.ts`, salvati nel browser (`localStorage`, chiave `benvenuto`), perché lo stato in memoria si azzera ricaricando:
- `type Tono = "amichevole" | "professionale" | "motivante"`
- `type Benvenuto = { fatto: boolean; passo: number; studio: string; logo: string | null; accordi: { quando: string } | null; primoCliente: { nome: string; email: string; esempio: boolean } | null; tono: Tono }`
- `useBenvenuto()`, `aggiornaBenvenuto(parte)`, `completaBenvenuto()`, `azzeraBenvenuto()`; storage non disponibile → vale per la visita.
- Colore e foto riusano quello che c'è: `setAccent` (`components/ui/appearance.tsx`) e `setTrainerPhoto` (`libs/prototipo/stato.ts`). Il tono di Leo in Impostazioni legge e scrive `benvenuto.tono`.

**Regole:**
- Si riparte dal passo salvato (`passo`); il finale si raggiunge solo con `accordi` presente.
- Logo: PNG, JPG, WebP o SVG fino a 5 MB; le immagini raster rimpicciolite nel browser (lato lungo 512 px); file sbagliato → messaggio chiaro, restano le iniziali.
- Nome dello studio vuoto → nome del trainer. Email: controllo solo della forma; tasto spento se non valida.
- Campi ≥ 16 px sotto `md`, bersagli ≥ 44 px, `100dvh`.

**Nel prodotto vero:** `Benvenuto` diventa colonne di `trainers` (`studio`, `logo`, `accordi_accettati_il`, `tono_assistente`, `benvenuto_fatto`); il primo cliente una riga di `clients` con il magic link.

## 5. Verifica

- Logica pura con Vitest (`tests/unit/benvenuto.test.ts`): lettura e scrittura del salvataggio (anche storage rotto), passo di ripartenza, controllo email, controllo file del logo, finale bloccato senza accordi.
- Nel browser su computer (1280 e 1440 px): tutti i passi, avanti/indietro/salta, accordi non spuntati, tema scuro, riduci movimento, suoni; ricarica a metà e alla fine; "Rivedi il benvenuto"; console pulita; screenshot a Marco.
- Controllo veloce a 375 px: una colonna, niente sovrapposizioni.
- `npx tsc --noEmit`, `npm test`, build con chiavi finte senza errori.

## 6. Note

- Il personaggio è anche lui un'immagine da verificare prima di vendere (come Leo: serve un personaggio proprio o con licenza chiara).
- Piano dell'area cliente: Task 1, Task 4 e il primo accesso del cliente (Task 8) restano in attesa, dopo il benvenuto del trainer.
