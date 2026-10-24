import { describe, expect, it } from "vitest";
import { clients } from "@/libs/prototipo/dati-finti";
import { contestoLeo, estraiAzione, ripulisci, SedutaContesto } from "@/libs/prototipo/leo-contesto";
import type { Seduta } from "@/libs/prototipo/leo-azioni";

describe("contesto per l'AI", () => {
  it("contiene i nomi dei clienti ma non email né telefoni", () => {
    const testo = contestoLeo();
    for (const c of clients) {
      expect(testo).toContain(c.name);
      expect(testo.toLowerCase()).not.toContain(c.email.toLowerCase());
      expect(testo).not.toContain(c.phone.replace(/\s/g, ""));
      expect(testo).not.toContain(c.phone);
    }
  });

  it("dice se ogni cliente è donna o uomo e il suo id per le azioni", () => {
    const testo = contestoLeo();
    expect(testo).toContain("Chiara Fontana (donna, id chiara-fontana)");
    expect(testo).toContain("Luca Ferri (uomo, id luca-ferri)");
    for (const c of clients) expect(testo).toContain(`${c.name} (${c.gender}, id ${c.id})`);
  });

  it("contiene i dati della giornata e non parla più di codici", () => {
    const testo = contestoLeo();
    expect(testo).toContain("11:00");
    expect(testo).toContain("2.840");
    expect(testo).not.toMatch(/\[C\d+\]/);
  });
});

describe("pulizia dei messaggi", () => {
  it("toglie email e numeri di telefono, lascia i nomi", () => {
    expect(ripulisci("Luca Ferri ha scritto da luca.ferri@esempio.it, chiamalo al +39 333 123 4567")).toBe("Luca Ferri ha scritto da [email], chiamalo al [telefono]");
    expect(ripulisci("cosa ha fatto giulia oggi?")).toBe("cosa ha fatto giulia oggi?");
  });
});

describe("tasto per aprire una sezione", () => {
  it("legge l'etichetta in fondo e la toglie dal testo", () => {
    expect(estraiAzione("Ci sono 2 pagamenti aperti.\n[[vai:incassi]]")).toEqual({ text: "Ci sono 2 pagamenti aperti.", vai: { sezione: "incassi" } });
  });

  it("riconosce il profilo di un cliente dal suo id", () => {
    expect(estraiAzione("Scrivi a Luca Ferri. [[vai:cliente:luca-ferri]]")).toEqual({
      text: "Scrivi a Luca Ferri.",
      vai: { sezione: "cliente", clienteId: "luca-ferri" },
    });
    expect(estraiAzione("Ciao [[vai:cliente:nessuno]]")).toEqual({ text: "Ciao" });
  });

  it("ignora etichette sconosciute e nasconde quella ancora a metà mentre arriva", () => {
    expect(estraiAzione("Ciao [[vai:cucina]]")).toEqual({ text: "Ciao" });
    expect(estraiAzione("Ci sono 2 pagamenti aperti. [[va")).toEqual({ text: "Ci sono 2 pagamenti aperti." });
  });
});

describe("calendario e azioni nel contesto", () => {
  const sedute: Seduta[] = [
    { id: "A3", date: "2026-10-22", time: "10:00", minutes: 60, clientId: "sara-conti", type: "Workout", place: "Fit Lab, Meolo" },
    { id: "A40", date: "2026-10-27", time: "18:30", minutes: 45, clientId: "luca-ferri", type: "Corsa", place: "Parco di Meolo" },
  ];

  it("elenca le sedute delle due settimane con id, giorno e codice del cliente", () => {
    const testo = contestoLeo(sedute);
    expect(testo).toContain("## Calendario (questa settimana e la prossima)");
    expect(testo).toContain("A3 · giovedì 22/10 · 10:00 · 60 min · workout · Fit Lab, Meolo · Sara Conti");
    expect(testo).toContain("A40 · martedì 27/10 · 18:30 · 45 min · corsa · Parco di Meolo · Luca Ferri");
  });

  it("dice la data della demo e senza argomento usa il calendario iniziale", () => {
    expect(contestoLeo(sedute)).toContain("mercoledì 21 ottobre 2026");
    expect(contestoLeo()).toMatch(/A1 · lunedì 19\/10/);
  });

  it("spiega quando usare le azioni", () => {
    const testo = contestoLeo(sedute);
    expect(testo).toContain("Usa le azioni solo quando il trainer chiede di fare qualcosa");
    expect(testo).toContain("se non è chiaro");
  });

  it("toglie email e telefoni anche da luoghi scritti nel calendario", () => {
    expect(contestoLeo([{ ...sedute[0], place: "Da Sara, sara@esempio.it" }])).not.toContain("sara@esempio.it");
  });

  it("valida il calendario mandato dal browser", () => {
    expect(SedutaContesto.safeParse(sedute[0]).success).toBe(true);
    expect(SedutaContesto.safeParse({ ...sedute[0], time: "10" }).success).toBe(false);
    expect(SedutaContesto.safeParse({ ...sedute[0], type: "Yoga" }).success).toBe(false);
  });
});
