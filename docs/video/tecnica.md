# Come si costruisce il video

## 1. Progetto Remotion in `video/`
- Cartella `video/` alla radice del repo, **progetto a sé** con il suo `package.json` (`npx create-video@latest` con il modello vuoto in TypeScript, oppure a mano: `remotion`, `@remotion/cli`, `react`, `react-dom`, versioni fissate).
- Il sito non deve vederlo:
  - nel `tsconfig.json` della radice aggiungere `"video"` a `exclude` (oggi `include` prende `**/*.ts`: senza esclusione la build di Next controllerebbe anche il video);
  - `video/node_modules`, `video/out/` e i file pesanti delle riprese in `.gitignore` (le riprese si rigenerano con gli script);
  - controllare che `npm run build` della radice resti verde e che Vercel non provi a costruire `video/`.
- Struttura consigliata:
  ```
  video/
    src/
      Root.tsx            composizioni: Spotter916 (1080×1920) e Spotter11 (1080×1080), 30 fps
      Video.tsx           la sequenza delle scene (<Series> o <TransitionSeries>)
      scene/              una scena per file: Gancio, Logo, EccoLeo, VocaleSposta, Pagamento, FileMisure, AppCliente, Dolore, Controllo, Chiusura
      pezzi/              CorniceTelefono, CorniceComputer, Tocco, ScrittaCinetica, Sottotitoli, Macchie (fondo dell'app), Numero (conta)
      tempi.ts            inizio e durata di ogni scena, presi dalla voce (sotto)
    public/               riprese (mp4/webm), logo, immagini di Leo, font, voce, musica
    script/               riprese con Playwright, Leo finto, preparazione dell'audio
  ```
- **Font**: lo stesso dell'app (`--font-display` in `app/globals.css`), caricato in Remotion con `@remotion/fonts` o `@font-face` da `public/`.
- **Colori**: gli stessi token dell'app (`--trainer: #ff6b2c`, salvia `#dfebe1`, nero pece `#040405`, inchiostro `#1c1c1e`): copiarli in un file `colori.ts`.
- **Animazioni**: `spring()` e `interpolate()` di Remotion legati al fotogramma (non animazioni a tempo del browser: al render devono essere deterministiche). Motion solo se serve un componente già fatto, sempre guidato dal fotogramma corrente.
- **Licenza Remotion**: gratuita per singoli e aziende fino a 3 persone (Marco rientra). Da ricontrollare con la partita IVA.

## 2. Riprese delle schermate (Playwright)
Le schermate sono quelle vere. Si registrano dall'app avviata in locale:
```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run start -- -p 3100
```
- **Prima di ogni pagina** (in `addInitScript`): `localStorage` `benvenuto` = `{"v":1,"fatto":true}`, `registrazione-cliente` = `fatta`, `consiglio-leo` = `visto`, `tema` = `light` o `dark`. Così non partono benvenuto, registrazione e fumetto del consiglio.
- **Dimensioni**: telefono 390 × 844 con `deviceScaleFactor: 3` (nitido nella cornice a 1080 px); computer 1440 × 900 con `deviceScaleFactor: 2`.
- **Come registrare**, due strade (provare la prima, tenere quella più nitida):
  1. **Fotogrammi**: con il protocollo di Chrome (`Page.startScreencast` via `page.context().newCDPSession(page)`) si salvano i fotogrammi alla risoluzione piena, poi `ffmpeg -framerate 30 -i f%05d.jpg -c:v libx264 -crf 16 -pix_fmt yuv420p clip.mp4`. Qualità migliore del registratore integrato.
  2. **Registratore di Playwright** (`recordVideo`): più semplice, ma registra alla dimensione CSS e comprime: va bene per prove, meno per il finale.
  - In alternativa per i momenti statici: **screenshot ad alta risoluzione** animati in Remotion (zoom, scorrimento): più nitidi e leggeri.
- **Browser**: alcune animazioni dell'app sono MP4 (benvenuto, casetta). Chromium di Playwright su Linux può non riprodurre H.264: usare Chrome o Edge (`channel: "chrome"` / `"msedge"`) dove c'è, o evitare quelle schermate. Sull'ambiente cloud di Claude Chromium è in `/opt/pw-browsers/chromium`.
- Un **dito finto**: Playwright clicca senza cursore; il tocco (cerchio che si allarga) si aggiunge dopo in Remotion, nei punti e momenti salvati dallo script di ripresa (salvare in un JSON tempo e coordinate di ogni tocco).

### Dettatura finta (scena 4)
La dettatura del browser non c'è in un browser automatico: si mette un riconoscitore finto prima del caricamento, che "sente" la frase un pezzo alla volta.
```js
await context.addInitScript((frase) => {
  class Finto {
    start() {
      setTimeout(() => { this.onstart?.(); this.onaudiostart?.(); }, 200);
      const parole = frase.split(" ");
      parole.forEach((_, i) => setTimeout(() => this.onresult?.({ results: [[{ transcript: parole.slice(0, i + 1).join(" ") }]] }), 500 + i * 220));
    }
    stop() { setTimeout(() => this.onend?.(), 150); }
    abort() { setTimeout(() => this.onend?.(), 50); }
  }
  window.SpeechRecognition = window.webkitSpeechRecognition = Finto;
}, "Sposta Antonella a domani alle 18 e avvisala");
```
Il vocale tenendo premuta la faccia di Leo: `mouse.down()` sul tasto con etichetta "Leo: tocca per scrivere, tieni premuto per parlargli", attesa, `mouse.up()`.

### Leo finto (scene 4, 5, 6)
Le azioni di Leo partono solo con l'AI. Per riprese **ripetibili e senza costi** si usa un server locale compatibile con l'API OpenAI che risponde sempre allo stesso modo:
- In `.env.local` (mai committato): `AI_API_KEY=finta` e `AI_BASE_URL=http://127.0.0.1:4010` (le rotte `app/prototipo/api/leo/route.ts` e `api/leo-cliente/route.ts` chiamano `${AI_BASE_URL}/chat/completions`).
- Il server (`video/script/leo-finto.mjs`, Node puro) riceve `POST /chat/completions` con `stream: true`, guarda l'ultimo messaggio dell'utente e risponde in **SSE** come OpenAI:
  - testo: `data: {"choices":[{"delta":{"content":"Fatto! Ho spostato…"}}]}`
  - azioni: `data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"c1","type":"function","function":{"name":"sposta_appuntamento","arguments":"{\"id\":\"…\",\"data\":\"…\",\"ora\":\"18:00\"}"}}]}}]}`
  - fine: `data: [DONE]`
- Nomi e parametri delle azioni: `libs/prototipo/leo-azioni.ts` (sedute e messaggi), `leo-azioni-soldi.ts` (`segna_pagato`…), `leo-azioni-clienti.ts` (`aggiorna_misure`…). Gli **id** delle sedute e dei clienti e il formato delle date stanno nel messaggio di sistema che l'app manda (`libs/prototipo/leo-contesto.ts`): il server finto lo stampa in console la prima volta, così si leggono gli id giusti (es. la seduta di Antonella di oggi alle 11:00).
- Tabella delle risposte (parole chiave → risposta):
  - "sposta antonella" → `sposta_appuntamento` (seduta di oggi 11:00 → domani 18:00) + `scrivi_messaggio` ad Antonella ("Ciao Antonella, ho spostato la seduta a domani alle 18:00. A domani!");
  - "luca ha pagato" → `segna_pagato` (Luca Ferri, Mensile ottobre, 120 €);
  - file delle misure → `aggiorna_misure` per Giulia con i valori del file.
- Ritardo realistico: 400-800 ms prima del primo pezzo, testo a pezzetti di 2-3 parole ogni 40 ms.

## 3. Voce
- **Prima la voce, poi il montaggio**: i tempi delle scene (`tempi.ts`) si prendono dalla voce finita, non il contrario.
- **Se la registra Marco**: file WAV o M4A per frase (o uno solo), stanza silenziosa, telefono a 20 cm. Le parole con i tempi (per sottotitoli e tagli) si ricavano con Whisper (`@remotion/install-whisper-cpp` + `@remotion/captions`).
- **Se è sintetica (ElevenLabs)**: voce italiana, modello multilingue; l'endpoint "with timestamps" restituisce i tempi di ogni carattere, da cui si ricavano le parole per i sottotitoli. Serve la chiave di Marco (variabile d'ambiente, mai nel repo, da aggiungere a `docs/chiavi.md` senza valore) e il dominio dell'API aperto nella rete dell'ambiente.
- Le frasi «tra virgolette» del copione sono il trainer che parla a Leo: seconda voce o stessa voce con tono diverso.

## 4. Musica
- Brano con **licenza commerciale** (Pixabay Music, Artlist, Epidemic Sound): tenere nel repo la prova della licenza (link o PDF) accanto al file, in `video/public/musica/`.
- Ritmo 100-120 BPM, elettronica pulita e positiva, senza voce cantata. Tagliare sugli stacchi delle scene (i colpi forti sui cambi scena).
- **Abbassare la musica sotto la voce** (ducking): `volume` di `<Audio>` come funzione del fotogramma, circa 0,12-0,18 mentre parla la voce e 0,4-0,5 nelle pause; dissolvenza in entrata e in uscita.
- Suoni dell'interfaccia: quelli dell'app (`libs/ui/sound.ts` li genera; registrarli o rifarli) + un whoosh per le transizioni.

## 5. Sottotitoli
Impressi nel video, una riga o due, grandi (circa 54 px su 1080), bianchi con contorno o su pillola scura sfocata, parola pronunciata evidenziata in arancione. Sopra il 15% basso dello schermo (lì ci sono i controlli di WhatsApp e LinkedIn).

## 6. Esportazione
```
cd video
npx remotion render src/index.ts Spotter916 out/spotter-9x16.mp4 --codec h264 --crf 23 --audio-bitrate 128k
npx remotion render src/index.ts Spotter11  out/spotter-1x1.mp4  --codec h264 --crf 23 --audio-bitrate 128k
```
- Remotion scarica il suo Chrome alla prima esecuzione; se la rete dell'ambiente non lo permette: `--browser-executable /opt/pw-browsers/chromium`.
- Obiettivo **sotto i 16 MB**: se si supera, alzare `--crf` (25-27) o abbassare la musica a 96k; controllare con `ls -lh`.
- Copertina: fotogramma della scena 4 (`npx remotion still … --frame=…`).
- Controllo finale: guardarlo **su un telefono vero**, dentro WhatsApp e LinkedIn (anteprima, audio spento all'inizio, sottotitoli leggibili).
