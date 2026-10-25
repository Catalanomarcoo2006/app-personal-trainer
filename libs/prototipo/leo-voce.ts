// I vocali a Leo: la parte senza schermo. Un "trascrittore" trasforma la voce in testo (oggi la dettatura del browser,
// più avanti un server UE); la sessione gestisce il gesto (tieni premuto, lascia, annulla), il limite di tempo e gli errori.
// Il testo dettato va a Leo come uno scritto: nessun canale in più. Spec: docs/specs/2026-10-25-vocali-leo-design.md.

export type ErroreVoce = "permesso" | "nessun-microfono" | "nessuna-voce" | "non-supportato" | "interrotto";

export class VoceErrore extends Error {
  constructor(readonly codice: ErroreVoce) {
    super(codice);
  }
}

// parziale: il riconoscimento si è interrotto a metà (rete): il testo c'è, ma va riletto
export type Dettato = { testo: string; parziale: boolean };

export type Trascrittore = {
  avvia(onTesto: (testo: string) => void): Promise<void>; // rifiuta con VoceErrore
  ferma(): Promise<Dettato>; // rifiuta con VoceErrore
  annulla(): void;
};

// null: il trainer non ha ancora scelto
export type SceltaVocali = "subito" | "rivedi" | null;

export type StatoVoce = { fase: "fermo" | "in-ascolto"; testo: string; errore: ErroreVoce | null };

export const MAX_MS_VOCALE = 60_000;

type Opzioni = { onStato(s: StatoVoce): void; onFine(d: Dettato | null): void; maxMs?: number };

export function creaSessioneVoce(t: Trascrittore, o: Opzioni): { premi(): Promise<void>; lascia(): Promise<void>; annulla(): void } {
  const maxMs = o.maxMs ?? MAX_MS_VOCALE;
  let gen = 0; // cambia a ogni vocale: quello che arriva da uno annullato o vecchio si ignora
  let fase: StatoVoce["fase"] = "fermo";
  let chiudendo = false; // ferma() è partita e la risposta non è ancora arrivata
  let testo = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let avviata: Promise<VoceErrore | null> = Promise.resolve(null);

  const stato = (errore: ErroreVoce | null = null) => o.onStato({ fase, testo, errore });

  async function premi() {
    if (fase !== "fermo" || chiudendo) return;
    const mia = ++gen;
    fase = "in-ascolto";
    testo = "";
    stato();
    timer = setTimeout(() => void lascia(), maxMs);
    avviata = t
      .avvia((x) => {
        if (mia === gen && fase === "in-ascolto") {
          testo = x;
          stato();
        }
      })
      .then(
        (): null => null,
        (e: unknown): VoceErrore => (e instanceof VoceErrore ? e : new VoceErrore("interrotto")),
      );
    const errore = await avviata;
    if (mia !== gen || !errore) return;
    // non è partito (permesso negato, niente microfono…): finisce qui, senza testo
    clearTimeout(timer);
    fase = "fermo";
    testo = "";
    stato(errore.codice);
    o.onFine(null);
  }

  async function lascia() {
    if (fase !== "in-ascolto") return;
    const mia = gen;
    clearTimeout(timer);
    const errore = await avviata; // se si lascia mentre il browser chiede il permesso, si aspetta la risposta
    if (mia !== gen || fase !== "in-ascolto" || errore) return;
    fase = "fermo";
    chiudendo = true;
    let d: Dettato;
    try {
      d = await t.ferma();
    } catch (e) {
      if (mia !== gen) return;
      chiudendo = false;
      testo = "";
      stato(e instanceof VoceErrore ? e.codice : "interrotto");
      o.onFine(null);
      return;
    }
    if (mia !== gen) return;
    chiudendo = false;
    const pulito = d.testo.trim();
    if (!pulito) {
      testo = "";
      stato("nessuna-voce");
      o.onFine(null);
      return;
    }
    testo = pulito;
    stato();
    o.onFine({ testo: pulito, parziale: d.parziale });
  }

  function annulla() {
    if (fase !== "in-ascolto" && !chiudendo) return;
    gen++;
    clearTimeout(timer);
    fase = "fermo";
    chiudendo = false;
    testo = "";
    t.annulla();
    stato();
  }

  return { premi, lascia, annulla };
}

// Cosa fare del testo dettato: mandarlo, farlo rileggere, o chiedere al trainer (la prima volta).
// Un vocale interrotto e un testo già scritto nella barra vanno sempre riletti: non si manda mai un testo misto.
export function cosaFare(scelta: SceltaVocali, d: Dettato, giaScritto: boolean): "invia" | "rivedi" | "chiedi" {
  if (d.parziale || giaScritto) return "rivedi";
  if (scelta === null) return "chiedi";
  return scelta === "subito" ? "invia" : "rivedi";
}

export const unisciTesto = (base: string, dettato: string) => (base.trim() ? `${base.trimEnd()} ${dettato}` : dettato);

export function messaggioErrore(e: ErroreVoce): string {
  switch (e) {
    case "permesso":
      return "Serve il permesso del microfono: abilitalo dal lucchetto vicino all'indirizzo";
    case "nessun-microfono":
      return "Non trovo un microfono";
    case "nessuna-voce":
      return "Non ho sentito niente, riprova";
    case "non-supportato":
      return "Questo browser non ascolta la voce: prova con Chrome o Edge";
    case "interrotto":
      return "Il vocale si è interrotto: controlla il testo prima di mandarlo";
  }
}
