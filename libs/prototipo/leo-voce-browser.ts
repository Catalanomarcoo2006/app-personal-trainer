// Il primo trascrittore dei vocali: la dettatura del browser (Chrome, Edge, Safari). Gratis e senza chiavi, ma l'audio passa
// dal servizio del browser (Google per Chrome): va bene solo con i dati finti della demo, mai con clienti veri.
// Più avanti lo sostituisce un trascrittore del server UE con la stessa forma (vedi leo-voce.ts).

import { VoceErrore, type Dettato, type ErroreVoce, type Trascrittore } from "./leo-voce";

type Risultati = ArrayLike<ArrayLike<{ transcript: string }>>;

type Riconoscitore = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((e: { results: Risultati }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

// Si cerca a ogni chiamata, non al caricamento: i test (e la prova nel browser) ne mettono uno finto.
function costruttore(): (new () => Riconoscitore) | undefined {
  const g = globalThis as unknown as { SpeechRecognition?: new () => Riconoscitore; webkitSpeechRecognition?: new () => Riconoscitore };
  return g.SpeechRecognition ?? g.webkitSpeechRecognition;
}

export const dettaturaDisponibile = (): boolean => costruttore() !== undefined;

export function erroreDaBrowser(codice: string): ErroreVoce {
  switch (codice) {
    case "not-allowed":
    case "service-not-allowed":
      return "permesso";
    case "audio-capture":
      return "nessun-microfono";
    case "no-speech":
      return "nessuna-voce";
    case "language-not-supported":
      return "non-supportato";
    default:
      return "interrotto"; // network, aborted e il resto
  }
}

export function testoDaRisultati(r: Risultati): string {
  return Array.from(r, (parte) => parte[0]?.transcript ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const ATTESA_AUDIO_MS = 1500; // se il browser non manda l'evento dell'audio, dopo l'avvio si considera pronto lo stesso
const ATTESA_FINE_MS = 3000; // alcuni browser non mandano mai la fine dopo stop(): si chiude comunque

export function trascrittoreBrowser(): Trascrittore {
  let rec: Riconoscitore | null = null;
  let attivo = false;
  let terminato = false;
  let ultimo = "";
  let errore: string | null = null;
  let alTermine: (() => void) | null = null;

  return {
    avvia(onTesto) {
      const Costruttore = costruttore();
      if (!Costruttore) return Promise.reject(new VoceErrore("non-supportato"));
      const r = (rec = new Costruttore());
      r.continuous = true;
      r.interimResults = true;
      r.lang = "it-IT";
      attivo = true;
      terminato = false;
      ultimo = "";
      errore = null;
      return new Promise<void>((ok, no) => {
        let partito = false;
        // pronto = il microfono sta davvero catturando l'audio (dopo il permesso), non solo il riconoscimento avviato
        r.onstart = () => {
          partito = true;
          setTimeout(ok, ATTESA_AUDIO_MS);
        };
        r.onaudiostart = () => {
          partito = true;
          console.debug("[voce] audio acceso");
          ok();
        };
        r.onspeechstart = () => console.debug("[voce] sento una voce");
        r.onresult = (e) => {
          if (!attivo) return;
          ultimo = testoDaRisultati(e.results);
          onTesto(ultimo);
        };
        r.onerror = (e) => {
          if (!attivo) return;
          errore = e.error;
          console.debug("[voce] errore del browser:", e.error);
          if (!partito) {
            attivo = false;
            no(new VoceErrore(erroreDaBrowser(e.error)));
          }
        };
        r.onend = () => {
          terminato = true;
          if (!partito && attivo) {
            attivo = false;
            no(new VoceErrore("interrotto"));
          }
          alTermine?.();
        };
        r.start();
      });
    },

    ferma() {
      return new Promise<Dettato>((ok, no) => {
        const chiudi = () => {
          alTermine = null;
          attivo = false;
          if (errore && errore !== "no-speech" && errore !== "aborted") {
            if (ultimo) ok({ testo: ultimo, parziale: true });
            else no(new VoceErrore(erroreDaBrowser(errore)));
            return;
          }
          ok({ testo: ultimo, parziale: false });
        };
        if (!rec || terminato) return chiudi();
        alTermine = chiudi;
        setTimeout(() => alTermine?.(), ATTESA_FINE_MS);
        rec.stop();
      });
    },

    annulla() {
      attivo = false;
      alTermine = null;
      rec?.abort();
    },
  };
}
