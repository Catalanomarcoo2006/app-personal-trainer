# Storyboard (prima stesura, 30/10)

Formato principale 9:16 (1080 × 1920). Per ogni scena: cosa si vede, **da dove si prende** (percorso dell'app e passi per registrarla, vedi `tecnica.md`), animazioni, suoni. Numeri delle scene = righe del `copione.md`.

Linguaggio visivo comune (coerente con l'app, `docs/specs/2026-10-21-design.md` sezione 9):
- Fondo **salvia chiaro** con le macchie di colore sfocate dell'app (`ambient-blob`), oppure **nero pece** nelle scene al buio; un solo colore forte, l'**arancione del trainer** (`#ff6b2c`).
- Le schermate stanno dentro una **cornice di telefono** (iPhone, angoli 54 px, isola dinamica) o di **computer** (finestra con angoli tondi), che entrano con una molla (`spring`), si inclinano leggermente in 3D e si avvicinano sul dettaglio che conta.
- **Tocchi** visibili: cerchio che si allarga dove il dito tocca; per il vocale, onde attorno alla faccia di Leo.
- **Scritte cinetiche** grandi (font dell'app, extra bold, `tracking` stretto), una parola chiave in arancione; numeri che contano (come nell'app).
- Transizioni: **zoom attraverso** lo schermo, scorrimento con sfocatura di movimento, e l'**onda** del cambio tema dell'app (`libs/ui/onda.ts`) per passare tra chiaro e scuro.
- Suoni brevi: i suoni dell'app (`libs/ui/sound.ts`: tocco, conferma, completato) + un "whoosh" nelle transizioni.

---

## 1. Gancio (0-4 s)
- **Si vede**: schermo nero; notifiche finte di chat che piovono e si accumulano ("Posso spostare a domani?", "Ti ho fatto il bonifico", "Mi mandi la scheda?"), sempre più veloci; poi si bloccano e si sfocano. Scritta: "E se lo facesse **qualcun altro**?"
- **Fonte**: tutto disegnato in Remotion (non serve l'app). Le frasi delle notifiche prese dai messaggi della demo (Messaggi del trainer).
- **Suono**: "ding" delle notifiche che si sovrappongono, poi silenzio di mezzo secondo.

## 2. Logo (4-8 s)
- **Si vede**: l'animazione d'apertura dell'app (anello arancione che si chiude, testa di Leo che vola e atterra), poi la scritta "Spotter" e sotto "l'app dei tuoi clienti, con **il tuo marchio**". Per un istante il colore dell'anello cambia (arancione → blu → verde → arancione) a dire "il tuo colore".
- **Fonte**: registrare l'apertura di `/prototipo/cliente` (componente `components/prototipo/cliente/IngressoLeo.tsx`), oppure ricostruirla in Remotion con lo stesso SVG (`public/brand/logo-leo-anello.svg`) per averla nitida a 1080 px.

## 3. Ecco Leo (8-14 s)
- **Si vede**: la dashboard del trainer da computer (`/prototipo/trainer`), con Leo in piedi in basso a destra; zoom su Leo che saluta (fumetto). Scritta: "Gli parli. **Lui lo fa.**"
- **Fonte**: registrazione di `/prototipo/trainer` alla prima apertura (Leo in piedi). Le animazioni di Leo sono WebP in `public/prototipo/coach/`.

## 4. Vocale → sposta la seduta e scrive (14-21 s)  ← scena chiave
- **Si vede**: la mano tiene premuta la faccia di Leo (versione telefono del trainer `/prototipo/trainer?telefono`, oppure il microfono nella chat da computer); il fumetto mostra il testo dal vivo "Sposta Antonella a domani alle 18 e avvisala"; Leo "viaggia" verso il Calendario e la seduta di Antonella **scivola** da oggi 11:00 a domani 18:00; poi apre Messaggi e il messaggio ad Antonella compare nella chat. Spunta finale "Fatto".
- **Fonte**: registrazione con **dettatura finta** e **Leo finto** (risponde con le azioni `sposta_appuntamento` + `scrivi_messaggio`), vedi `tecnica.md`. Nell'app il viaggio di Leo tra le sezioni c'è già (`libs/prototipo/leo-viaggio.ts`).
- **Montaggio**: due inquadrature: prima stretta sul telefono/fumetto, poi larga sulla dashboard mentre cambia. Evidenziare con un alone arancione la seduta che si sposta.

## 5. Pagamento (21-26 s)
- **Si vede**: "Luca ha pagato il mensile" → scheda di conferma di Leo → tocco su "Conferma" → in Incassi il pagamento di Luca diventa "pagato" e il totale del mese **sale di 120 €** con i numeri che contano.
- **Fonte**: computer, `/prototipo/trainer`, Leo finto con `segna_pagato` (Luca Ferri, Mensile ottobre). Sezione Incassi.

## 6. File delle misure (26-31 s)
- **Si vede**: un PDF "Misure Giulia ottobre" trascinato nella chat di Leo; Leo mostra le schede "prima → dopo" (vita, fianchi, peso…); tocco su **"Conferma tutte"**; il profilo di Giulia si aggiorna.
- **Fonte**: computer, chat di Leo con allegato (PDF con testo, CSV o Excel: `libs/prototipo/leo-allegato.ts`); Leo finto con `aggiorna_misure`. Preparare il file di prova in `video/assets/`.
- **Alternativa più corta** se il tempo non basta: le **cancellazioni con il vetro che si rompe** (più sedute cancellate insieme, `libs/ui/vetro.ts`): molto spettacolare, da valutare con Marco.

## 7. App del cliente (31-40 s)
- **Si vede**: transizione di "zoom attraverso" verso il telefono di Giulia. Home ("Ciao, Giulia! 👋", allenamento di oggi, agenda) → Allenamento: spunta due esercizi (i fatti si barrano), tocco su "Guarda l'esecuzione" → Progressi: grafico del peso che si disegna, "39%" verso l'obiettivo.
- **Fonte**: `/prototipo/cliente`, `/prototipo/cliente/allenamento`, `/prototipo/cliente/progressi` (390 × 844, tema chiaro). Saltare registrazione e consiglio di Leo con il localStorage (`tecnica.md`).

## 8. Il dolore arriva al trainer (40-45 s)
- **Si vede**: Giulia (o Luca) scrive a Leo "mi fa male il ginocchio negli affondi"; Leo risponde con prudenza e "Ho avvisato Marco"; schermo diviso: a destra il telefono del trainer dove compare l'avviso in "Da tenere d'occhio".
- **Fonte**: chat di Leo del cliente (`components/prototipo/cliente/LeoCliente.tsx`: il dolore si riconosce dalle parole e compare "Ho avvisato Marco"; senza chiave AI Leo usa le risposte di riserva, che bastano); trainer da telefono, sezione Oggi.
- **Attenzione, da decidere con Marco**: nella demo l'avviso **non arriva ancora dal vivo** negli Urgenti / "Da tenere d'occhio" del trainer (voce aperta in `docs/DA-CAMBIARE.md`, "Avvisi del cliente negli Urgenti del trainer"); lì c'è già una riga fissa "Dolore segnalato · Luca". Due strade: (a) farlo davvero nell'app prima delle riprese (lavoro sull'app, non sul video: chiedere a Marco); (b) montare la scena con la riga fissa di Luca che entra con un'animazione (onesto solo se poi la funzione si fa). Non mostrare nel video cose che l'app non fa.

## 9. Tutto sotto controllo (45-52 s)
- **Si vede**: la dashboard da computer "Oggi" (incassi con grafico che si disegna, clienti, agenda con la linea "adesso"), che si **rimpicciolisce** accanto al telefono del trainer con la stessa giornata. Un tocco sulla luna: il tema passa al buio con l'**onda**.
- **Fonte**: `/prototipo/trainer` e `/prototipo/trainer?telefono`, tema chiaro → scuro.

## 10. Chiusura (52-60 s)
- **Si vede**: fondo salvia, logo Spotter al centro, Leo che fa l'occhiolino o saluta; scritte "In italiano. Con il tuo marchio." poi "Vuoi vederla con i tuoi clienti?" e il contatto di Marco. Ultimi 2 secondi fermi (è il fotogramma che resta in chat).
- **Fonte**: Remotion + logo SVG + un fotogramma di Leo.

---

## Versione 1:1
Stesse scene; nelle scene col computer la finestra occupa tutta la larghezza e le scritte vanno sopra; nelle scene col telefono il telefono si affianca alle scritte invece di stare sotto.

## Copertina
Fotogramma della scena 4 (Leo che sposta la seduta, fumetto con il testo) con la scritta "Gli parli. Lui lo fa." Si imposta come primo fotogramma (o con `--frame` al render) perché è quello che si vede in chat prima del play.
