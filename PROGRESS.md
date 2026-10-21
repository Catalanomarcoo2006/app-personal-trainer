# APP PERSONAL TRAINER

> Questo file viene caricato a ogni sessione (import `@PROGRESS.md` nel CLAUDE.md): tienilo sotto le 60 righe. Lo storico vecchio va in `docs/STORICO.md`, che NON viene importato.

**Ultimo aggiornamento:** 2026-10-21

## Obiettivo
App per personal trainer con il marchio del trainer: gestionale da computer (e versione minima da telefono) per il trainer, web app per i clienti con assistente virtuale. Demo "wow" e primo trainer pagante entro 4-6 settimane.

## Stato attuale (Completato)
- Brainstorming chiuso, stile fissato su riferimenti Instagram (bozzetto vecchio scartato).
- Design approvato: `docs/specs/2026-10-21-design.md`
- Setup: cartella, git (ramo `setup-iniziale`), boilerplate ZeroToShip applicato, `npm install` fatto, build ok con chiavi finte, CLAUDE.md, PROGRESS.md, gruppo sidebar "🏋️ APP PERSONAL TRAINER".

## In corso
- Piano Fase 1 (fondamenta) scritto: `docs/plans/2026-10-21-piano-v1.md`, 7 task; Fasi 2-5 nella roadmap del piano.

## Da fare (TODO)
- Prototipo visivo di 2 schermate (Oggi del trainer, allenamento del cliente) da approvare.
- Pulizia boilerplate (via Stripe, blog, Crisp, gpt.ts), database con RLS, aree trainer/cliente/admin, assistente, account demo, landing.
- Marco: chiavi Supabase (progetto UE) e Resend in `.env.local`.

## Decisioni prese
- Un'unica web app sul boilerplate, non due app né Lovable: un solo progetto, massimo controllo su animazioni.
- Libreria ~100 esercizi base + esercizi del trainer: la demo parte piena.
- Pacchetti a lezioni e a tempo + registro libero dei pagamenti.
- Calendario gestito dal trainer; il cliente chiede lo spostamento con un messaggio: semplice e senza conflitti.
- Avvisi in app + email; push solo dopo, insieme alla versione telefono completa del trainer.
- Assistente DeepSeek: costo trascurabile (~0,0007 $ a domanda), limite solo di sicurezza (300/mese).
- Dati sanitari: consenso esplicito, Supabase UE, Marco responsabile del trattamento (DPA).

## Problemi noti / blocchi
- Licenza ZeroToShip da verificare con Alberto Ravasini prima di vendere.
- Partita IVA da aprire prima del primo incasso.
- Fornitore AI in UE da scegliere prima del primo cliente vero.
- Informativa, DPA e termini da far rivedere a un professionista.
- Nome del prodotto da scegliere.
- Nota nel vault non creata: il brain è stato azzerato il 2026-10-21; aggiungerla quando la nuova struttura è pronta.

## Prossimi passi immediati
- Task 1 del piano `docs/plans/2026-10-21-piano-v1.md`: prototipo visivo (Oggi del trainer + allenamento del cliente), poi approvazione di Marco.
- Marco: creare il progetto Supabase di sviluppo (UE) prima del Task 3.

## Contesto tecnico utile
- Build senza chiavi: fallisce su `/tos` (Supabase richiede URL e chiave). Per una verifica: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.
- Riferimenti di stile: `docs/riferimenti/` (registrazioni con ffmpeg, escluse da git).

## Changelog
- 2026-10-21: progetto avviato con /start (brainstorming, spec, setup con boilerplate, piano).
