import { describe, expect, it } from "vitest";
import { assistantAnswers, assistantSuggestions } from "@/libs/prototipo/dati-finti";
import { contestoCliente, estraiDolore, rispostaCliente, SEGNO_DOLORE } from "@/libs/prototipo/leo-cliente";

describe("Leo del cliente senza AI", () => {
  it("le domande pronte hanno la loro risposta", () => {
    for (const d of assistantSuggestions) expect(rispostaCliente(d).text).toBe(assistantAnswers[d]);
  });

  it("un dolore avvisa il trainer e consiglia il medico", () => {
    expect(rispostaCliente("Mi fa male il ginocchio").dolore).toBe(true);
    const schiena = rispostaCliente("ho un fastidio alla schiena");
    expect(schiena.dolore).toBe(true);
    expect(schiena.text).toContain("medico");
  });

  it("sul cibo rimanda al nutrizionista, senza avvisi", () => {
    for (const d of ["Cosa mangio stasera?", "Quante proteine devo prendere?"]) {
      const r = rispostaCliente(d);
      expect(r.dolore).toBe(false);
      expect(r.text).toContain("nutrizionista");
    }
  });

  it("fuori tema riporta all'allenamento", () => {
    expect(rispostaCliente("Chi ha vinto la partita?").text).toContain("allenamento");
  });
});

describe("Leo del cliente con l'AI", () => {
  it("il segno del dolore si toglie dal testo e accende l'avviso", () => {
    expect(estraiDolore(`Fermati con gli affondi. Ho avvisato Marco. ${SEGNO_DOLORE}`)).toEqual({ testo: "Fermati con gli affondi. Ho avvisato Marco.", dolore: true });
    expect(estraiDolore("Ottimo lavoro!")).toEqual({ testo: "Ottimo lavoro!", dolore: false });
  });

  it("un pezzo del segno ancora in arrivo non si vede mentre il testo scorre", () => {
    expect(estraiDolore("Ho avvisato Marco. [[avvisa-tr").testo).toBe("Ho avvisato Marco.");
  });

  it("le istruzioni hanno i dati della demo e le regole, mai email o telefoni", () => {
    const c = contestoCliente();
    expect(c).toContain("Giulia");
    expect(c).toContain("nutrizionista");
    expect(c).toContain(SEGNO_DOLORE);
    expect(c).not.toMatch(/@|\+39/);
  });
});
