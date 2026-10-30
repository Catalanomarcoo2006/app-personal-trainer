# Video pubblicitario di Spotter: punto di partenza

Kit preparato il 30/10 per costruire il video promozionale dell'app **in un'altra sessione di Claude** (altro profilo di Marco). Qui c'è tutto: obiettivo, copione, storyboard, come registrare le schermate, come montare con Remotion, voce, musica ed esportazione.

## Cosa leggere, in ordine
1. `brief.md`: obiettivo, pubblico, messaggio, formato, decisioni prese e **decisioni ancora da confermare con Marco**.
2. `copione.md`: la voce fuori campo, frase per frase, con i tempi e le scritte a schermo.
3. `storyboard.md`: scena per scena, cosa si vede, da dove si prende (percorso dell'app e azioni), animazioni e suoni.
4. `tecnica.md`: progetto Remotion, riprese con Playwright (Leo finto e dettatura finta), audio, esportazione.
5. `reference.md`: i video di riferimento di Marco e cosa prendere da ognuno.
6. `prompt-avvio.md`: il messaggio da incollare nella nuova sessione per partire.

Il contesto del progetto è in `CLAUDE.md` e `PROGRESS.md` alla radice (regole, stile, dati finti, comandi).

## Come si lavora (regole per la sessione del video)
- **Ramo**: `video-pubblicita`, creato da `setup-iniziale`. Mai push su `setup-iniziale` senza che Marco lo chieda: quel ramo va online su Vercel.
- **Cartella**: tutto il video in `video/` alla radice, con un suo `package.json` (vedi `tecnica.md`). Il sito non deve accorgersene: la build di Next deve restare verde.
- **A tappe, con un'anteprima a Marco a ogni tappa** (immagini o un MP4 corto), prima di andare avanti:
  1. reference lette e `reference.md` compilato;
  2. copione e storyboard rivisti con le reference (Marco approva);
  3. riprese delle schermate (Marco vede le clip grezze);
  4. animazioni scena per scena (anteprima di ogni scena);
  5. voce e musica;
  6. esportazione finale nei formati di `brief.md`.
- **Solo dati finti** della demo (Giulia, Antonella, Luca…): mai dati veri di clienti nel video (CLAUDE.md).
- Le decisioni nuove vanno scritte qui (`brief.md`, sezione "Decisioni"), così restano anche per le sessioni dopo.
