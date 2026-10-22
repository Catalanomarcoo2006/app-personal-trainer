import { describe, expect, it } from "vitest";
import { clients } from "@/libs/prototipo/dati-finti";
import { contestoLeo, estraiAzione, pseudonimizza, ripristinaNomi } from "@/libs/prototipo/leo-contesto";

const codice = (id: string) => `[C${clients.findIndex((c) => c.id === id) + 1}]`;

describe("contesto per l'AI", () => {
  it("non contiene nomi, cognomi, email né telefoni dei clienti", () => {
    const testo = contestoLeo().toLowerCase();
    for (const c of clients) {
      const [nome, cognome] = c.name.toLowerCase().split(" ");
      expect(testo).not.toMatch(new RegExp(`\\b${nome}\\b`));
      expect(testo).not.toContain(c.name.toLowerCase());
      expect(testo).not.toContain(c.email.toLowerCase());
      expect(testo).not.toContain(c.phone.replace(/\s/g, ""));
      expect(testo).not.toContain(c.phone);
      // il cognome da solo può essere una parola comune ("conti"): basta che non compaia accanto al nome
      expect(testo).not.toContain(`${nome} ${cognome}`);
    }
  });

  it("dice se ogni cliente è donna o uomo, per accordare l'italiano", () => {
    const testo = contestoLeo();
    expect(testo).toContain(`${codice("chiara-fontana")} (donna)`);
    expect(testo).toContain(`${codice("luca-ferri")} (uomo)`);
    for (const c of clients) expect(testo).toMatch(new RegExp(`\\${codice(c.id).slice(0, -1)}\\] \\((donna|uomo)\\)`));
  });

  it("usa i codici dei clienti e contiene i dati della giornata", () => {
    const testo = contestoLeo();
    expect(testo).toContain(codice("giulia-bianchi"));
    expect(testo).toContain("11:00");
    expect(testo).toContain("2.840");
  });
});

describe("pseudonimi", () => {
  it("sostituisce nome e cognome, e il nome da solo, con il codice", () => {
    expect(pseudonimizza("Luca Ferri ha pagato")).toBe(`${codice("luca-ferri")} ha pagato`);
    expect(pseudonimizza("Luca ha segnalato un fastidio")).toBe(`${codice("luca-ferri")} ha segnalato un fastidio`);
    expect(pseudonimizza("cosa ha fatto giulia oggi?")).toBe(`cosa ha fatto ${codice("giulia-bianchi")} oggi?`);
  });

  it("non tocca le parole che contengono un nome", () => {
    expect(pseudonimizza("Lucano e Saracena")).toBe("Lucano e Saracena");
  });

  it("rimette i nomi al posto dei codici", () => {
    expect(ripristinaNomi(`${codice("luca-ferri")} deve pagare, ${codice("sara-conti")} rinnova`)).toBe("Luca Ferri deve pagare, Sara Conti rinnova");
    expect(ripristinaNomi("[C99] non esiste")).toBe("[C99] non esiste");
  });
});

describe("tasto per aprire una sezione", () => {
  it("legge l'etichetta in fondo e la toglie dal testo", () => {
    expect(estraiAzione("Ci sono 2 pagamenti aperti.\n[[vai:incassi]]")).toEqual({ text: "Ci sono 2 pagamenti aperti.", vai: { sezione: "incassi" } });
  });

  it("riconosce il profilo di un cliente", () => {
    expect(estraiAzione(`Scrivi a ${codice("luca-ferri")}. [[vai:cliente:${codice("luca-ferri").slice(1, -1)}]]`)).toEqual({
      text: `Scrivi a ${codice("luca-ferri")}.`,
      vai: { sezione: "cliente", clienteId: "luca-ferri" },
    });
  });

  it("ignora etichette sconosciute e nasconde quella ancora a metà mentre arriva", () => {
    expect(estraiAzione("Ciao [[vai:cucina]]")).toEqual({ text: "Ciao" });
    expect(estraiAzione("Ci sono 2 pagamenti aperti. [[va")).toEqual({ text: "Ci sono 2 pagamenti aperti." });
  });
});
