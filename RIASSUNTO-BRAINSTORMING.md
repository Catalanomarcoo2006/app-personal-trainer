# App personal trainer: riassunto del brainstorming (20-21 ottobre 2026)

Sessione di partenza: gruppo sidebar "💻 SOFTWARE". Da qui riparte `/start` dalla **fase 2** (la fase 1, il brainstorming, è quasi chiusa: mancano le parti "invisibili" del design e la spec scritta).

## Obiettivo
Piattaforma **di Marco** (tutto il profitto; sul Pianificatore prende solo il 10%), semplice da sviluppare, molto curata nell'estetica, da vendere in fretta.
- Tempo: circa 20 ore a settimana, prima vendita entro 4-6 settimane.
- Prezzo: **750 € una tantum con bonifico + 200 €/anno**, pagati a Marco con fattura (serve la partita IVA aperta prima del primo incasso). **Niente pagamenti nella piattaforma, niente Stripe, niente iscrizione libera**: gli account li crea Marco.
- Vendita: lead su LinkedIn (e Instagram per i trainer), call, presale, **video demo massimo 20 MB** (limite allegati delle chat LinkedIn).

## Il prodotto
"L'app del percorso del cliente, con il logo del trainer." Il trainer la dà ai suoi clienti; il cliente la apre ogni giorno, resta motivato e rinnova il pacchetto.

**Trainer (da computer):** home "Oggi" (incassi del mese, clienti attivi, allenamenti di oggi, pacchetti in scadenza, clienti che hanno bisogno di attenzione) · clienti · scheda cliente (progressi, scheda, pacchetti, documenti, domande all'assistente) · creazione schede da libreria esercizi · calendario · pacchetti e incassi · impostazioni (logo, colore).

**Cliente (telefono, web app installabile, niente store):** allenamento di oggi · obiettivo con avanzamento · peso e misure con grafici · acqua e passi segnati a mano · documenti (es. PDF della dieta del suo nutrizionista) · prossimo allenamento e lezioni rimaste · **assistente virtuale**.

**Assistente virtuale (nella versione 1, Marco: "aiuta molto a vendere"):** conosce scheda, obiettivo e progressi del cliente; allenamenti e abitudini sì; alimentazione solo consigli generali (rimanda alla dieta del nutrizionista); dolori → alternativa prudente e avviso al trainer; limite di domande al mese per cliente. **Modello: DeepSeek "flash"** (scelta di Marco). Confronto con altri modelli su 15 domande reali: rimandato allo sviluppo.

**Marco (pannello minimo):** elenco trainer, attiva dopo il bonifico (crea account + invito), rinnova di un anno, sospendi (i dati restano).

**Fuori dalla versione 1:** foto prima/dopo, passi letti in automatico dal telefono, promemoria automatici, pagamenti online, app negli store.

## Decisioni tecniche
- Base: boilerplate **ZeroToShip** (Alberto Ravasini), modello in `~\.claude\skills\start\boilerplate`. Tenere: login Supabase, area protetta, componenti landing, Resend. Togliere: Stripe, blog, Crisp, `gpt.ts`, testimonial finti. Adattare: `config.ts` in italiano, privacy/termini per GDPR italiano, tema DaisyUI personalizzato a fondo. **Licenza da verificare con Alberto Ravasini** prima di vendere.
- Accesso cliente: **link via email** (magic link Supabase).
- File: **Supabase Storage**, immagini compresse prima del caricamento; Supabase Pro con il primo cliente.
- Marchio: indirizzo `nomeprodotto.it/nome-trainer`, con logo e colore del trainer.
- Landing: vetrina con video e "Richiedi una demo", senza prezzi né checkout.

## Vincoli importanti
- Il trainer **non prescrive diete** (in Italia è riservato a nutrizionisti, dietisti e medici): la dieta è solo un PDF caricato dal cliente. Niente concorrenza con il Pianificatore di Luca.
- Peso, misure, dieta e dolori sono **dati sanitari (GDPR)**: consenso al primo accesso, server in UE, ogni trainer vede solo i suoi clienti, privacy fatta bene.
- **DeepSeek:** le API ufficiali elaborano i dati in Cina. Prima del primo cliente vero: fornitore UE che ospita il modello DeepSeek (consigliato) oppure solo dati pseudonimizzati + informativa. Sviluppo e demo con dati finti: ok anche l'API ufficiale.
- La concorrenza (Trainerize, TrueCoach, Everfit) è in inglese e si paga ogni mese: argomento di vendita "in italiano, con il tuo marchio, paghi una volta".

## Scartato (e perché)
- Interior designer / portale cantiere: per Marco "non serve" ed è difficilissimo da vendere (bello da avere, non indispensabile). Lezione: il software deve velocizzare il lavoro per cui il professionista viene pagato, o fargli guadagnare/non perdere soldi.
- Nutrizionisti: concorrenza con il Pianificatore. Commercialisti: mercato dominato e normativo.

## Stile grafico (bozzetto in `docs/bozzetti/2026-10-21-app-trainer.html`)
Sportivo ma premium: sfondo chiaro, nero, un solo colore forte che è quello del trainer (nel bozzetto arancione), font Space Grotesk per titoli e numeri, Inter per il testo. Approvazione dello stile ancora da dare.

## Prossimi passi (nuova sessione)
1. Aprire la sessione in questa cartella e lanciare `/start`, ripartendo dalla fase 2 (questa cartella esiste già: non è un errore).
2. Chiudere il design: feedback sul bozzetto, poi dati, sicurezza, assistente; scrivere la spec in `docs/specs/`.
3. Fasi 3-6 di `/start`: boilerplate, `CLAUDE.md` + `PROGRESS.md`, nota nel vault e gruppo sidebar con lo stesso nome, piano.
4. In parallelo: aprire la partita IVA, chiedere la licenza ad Alberto Ravasini, scegliere il nome del prodotto.
