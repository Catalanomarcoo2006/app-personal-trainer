import { describe, expect, it } from "vitest";
import { datiIniziali } from "@/libs/dati/iniziali";
import { conModifica, daConfermareTutte, titoloModificato } from "@/libs/prototipo/leo-modifica";
import type { AzioneLeo, DatiLeo } from "@/libs/prototipo/leo-azioni";

const piu: AzioneLeo = { nome: "scrivi_a_piu", dati: { clienti: ["giulia-bianchi", "sara-conti"], testo: "Ciao {nome}" } };

describe("modifiche fatte nella scheda", () => {
  it("il messaggio a più clienti tiene solo i destinatari rimasti spuntati e il testo cambiato", () => {
    expect(conModifica(piu, { clienti: ["giulia-bianchi"], testo: " Ciao {nome}, a domani " })).toEqual({ nome: "scrivi_a_piu", dati: { clienti: ["giulia-bianchi"], testo: "Ciao {nome}, a domani" } });
  });

  it("il nuovo cliente prende nome ed email scritti dal trainer", () => {
    const a: AzioneLeo = { nome: "nuovo_cliente", dati: { nome: "Marta Neri", genere: "donna" } };
    expect(conModifica(a, { nome: "Marta Nerini", email: "m@esempio.it", obiettivo: "" })).toEqual({ nome: "nuovo_cliente", dati: { nome: "Marta Nerini", genere: "donna", email: "m@esempio.it" } });
  });

  it("senza modifiche l'azione resta com'è", () => {
    expect(conModifica(piu)).toBe(piu);
  });
});

describe("Conferma tutte", () => {
  it("porta in corso le schede da confermare con le loro modifiche, le altre restano com'erano", () => {
    const schede = [
      { key: "a", azione: piu, stato: "da-confermare" as const },
      { key: "b", azione: { nome: "cancella_appuntamento", dati: { id: "A1" } } as AzioneLeo, stato: "da-confermare" as const },
      { key: "c", azione: { nome: "cancella_appuntamento", dati: { id: "A2" } } as AzioneLeo, stato: "annullato" as const },
    ];
    const dopo = daConfermareTutte(schede, new Map([["a", { clienti: ["sara-conti"] }]]));
    expect(dopo[0]).toMatchObject({ stato: "in-corso", azione: { dati: { clienti: ["sara-conti"] } } });
    expect(dopo[1]).toMatchObject({ stato: "in-corso", azione: { dati: { id: "A1" } } });
    expect(dopo[2].stato).toBe("annullato");
  });
});

describe("il titolo della scheda segue le modifiche", () => {
  const nuovo = { nome: "nuovo_cliente", dati: { nome: "Marta Nerni", genere: "donna" } } as AzioneLeo;
  const d: DatiLeo = { sedute: [], dati: datiIniziali() };

  it("con il nome cambiato nella scheda, il titolo ha il nome nuovo (anche con Conferma tutte)", () => {
    const schede = [{ key: "n", azione: nuovo, stato: "da-confermare" as const, titolo: "Nuovo cliente · Marta Nerni" }];
    const dopo = daConfermareTutte(schede, new Map([["n", { nome: "Marta Nerini" }]]), d);
    expect(dopo[0]).toMatchObject({ stato: "in-corso", titolo: "Nuovo cliente · Marta Nerini" });
  });

  it("senza modifiche il titolo resta com'era", () => {
    const schede = [{ key: "n", azione: nuovo, stato: "da-confermare" as const, titolo: "Nuovo cliente · Marta Nerni" }];
    expect(daConfermareTutte(schede, new Map(), d)[0].titolo).toBe("Nuovo cliente · Marta Nerni");
  });

  it("titoloModificato dà il titolo dell'azione modificata", () => {
    expect(titoloModificato(nuovo, { nome: "Marta Nerini" }, d)).toBe("Nuovo cliente · Marta Nerini");
    expect(titoloModificato(piu, { clienti: ["giulia-bianchi"] }, d)).toBe("Messaggio a Giulia Bianchi");
  });
});
