import { beforeEach, describe, expect, it, vi } from "vitest";

// Ogni test riparte dallo stato iniziale della demo: i moduli si ricaricano da capo.
async function carica() {
  vi.resetModules();
  const { stato } = await import("@/libs/prototipo/stato");
  const sp = await import("@/libs/dati/sportello");
  const sel = await import("@/libs/dati/selettori");
  return { stato, sp, sel };
}

let m: Awaited<ReturnType<typeof carica>>;
beforeEach(async () => {
  m = await carica();
});

const dati = () => m.stato.get().dati;
const aperto = (clientId: string) => dati().pagamenti.find((p) => p.clientId === clientId && !p.paidOn)!;
const vista = (id: string) => m.sel.vistaCliente(dati(), id)!;

describe("vista dei clienti", () => {
  it("ricostruisce la forma che usano le pagine", () => {
    const g = vista("giulia-bianchi");
    expect(g.goal).toBe("Dimagrimento −8 kg");
    expect(g.current).toBe(68.9);
    expect(g.weights).toHaveLength(8);
    expect(g.measures.find((x) => x.label === "Vita")).toEqual({ label: "Vita", start: 86, current: 82 });
    expect(g.pkg).toEqual({ label: "Pacchetto 10 lezioni", left: "2 lezioni rimaste", expiring: true });
    expect(vista("sara-conti").pkg.left).toBe("1 lezione rimasta");
    expect(vista("elena-marini").pkg.left).toBe("5 sedute rimaste");
    expect(vista("luca-ferri").pkg).toEqual({ label: "Mensile", left: "Scade il 31 ottobre", expiring: false });
    expect(vista("antonella-russo").payments[1]).toMatchObject({ date: "03 Ott", label: "Valutazione posturale", amount: 40, paid: false });
  });

  it("incassi di ottobre come nella demo: 2.840 € incassati, 160 € da incassare", () => {
    expect(m.sel.calcolaIncassi(dati())).toEqual({ collectedCents: 284000, outstandingCents: 16000 });
  });
});

describe("pagamenti", () => {
  it("segnaPagato sposta l'importo in incassato; annulla riporta tutto com'era", async () => {
    const prima = structuredClone(dati());
    const esito = await m.sp.segnaPagato(aperto("antonella-russo").id);
    expect(esito.ok).toBe(true);
    expect(m.sel.calcolaIncassi(dati())).toEqual({ collectedCents: 288000, outstandingCents: 12000 });
    expect(dati().pagamenti.find((p) => p.description === "Valutazione posturale")?.paidOn).toBe("2026-10-21");
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: true });
    expect(dati()).toEqual(prima);
  });

  it("lo stesso pagamento non si segna due volte", async () => {
    const id = aperto("luca-ferri").id;
    await m.sp.segnaPagato(id);
    expect(await m.sp.segnaPagato(id)).toEqual({ ok: false, motivo: "Il pagamento è già segnato" });
    expect(m.sel.calcolaIncassi(dati()).collectedCents).toBe(296000);
  });

  it("registraPagamento aggiunge un incasso già pagato", async () => {
    const esito = await m.sp.registraPagamento({ clientId: "luca-ferri", amountCents: 12000, description: "Mensile novembre", paidOn: "2026-10-21" });
    expect(esito.ok).toBe(true);
    expect(m.sel.calcolaIncassi(dati()).collectedCents).toBe(296000);
    expect(await m.sp.registraPagamento({ clientId: "nessuno", amountCents: 12000, description: "x", paidOn: "2026-10-21" })).toEqual({ ok: false, motivo: "Cliente non trovato" });
    expect((await m.sp.registraPagamento({ clientId: "luca-ferri", amountCents: 0, description: "x", paidOn: "2026-10-21" })).ok).toBe(false);
  });

  it("rinnovaPacchetto a lezioni: +10 lezioni e un pagamento da incassare; annulla toglie entrambi", async () => {
    const prima = structuredClone(dati());
    const esito = await m.sp.rinnovaPacchetto({ clientId: "giulia-bianchi", lezioni: 10, amountCents: 45000 });
    expect(esito.ok).toBe(true);
    expect(dati().pacchetti.find((p) => p.clientId === "giulia-bianchi")?.lessonsTotal).toBe(20);
    expect(vista("giulia-bianchi").pkg.left).toBe("12 lezioni rimaste");
    expect(vista("giulia-bianchi").pkg.expiring).toBe(false);
    expect(aperto("giulia-bianchi")).toMatchObject({ amountCents: 45000, dueOn: "2026-10-21", paidOn: null, description: "Rinnovo Pacchetto 10 lezioni" });
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: true });
    expect(dati()).toEqual(prima);
  });

  it("rinnovaPacchetto a tempo: la scadenza si sposta di un mese, a fine mese", async () => {
    await m.sp.rinnovaPacchetto({ clientId: "luca-ferri", mesi: 1, amountCents: 12000 });
    expect(dati().pacchetti.find((p) => p.clientId === "luca-ferri")?.endsOn).toBe("2026-11-30");
    await m.sp.rinnovaPacchetto({ clientId: "davide-greco", mesi: 3, amountCents: 33000 });
    expect(dati().pacchetti.find((p) => p.clientId === "davide-greco")?.endsOn).toBe("2027-02-28");
  });

  it("rinnovaPacchetto rifiuta lezioni su un pacchetto a tempo e valori fuori misura", async () => {
    expect(await m.sp.rinnovaPacchetto({ clientId: "luca-ferri", lezioni: 10, amountCents: 12000 })).toEqual({ ok: false, motivo: "Il pacchetto di Luca Ferri è a tempo: si rinnova a mesi" });
    expect(await m.sp.rinnovaPacchetto({ clientId: "giulia-bianchi", mesi: 1, amountCents: 12000 })).toEqual({ ok: false, motivo: "Il pacchetto di Giulia Bianchi è a lezioni: si rinnova a lezioni" });
    expect((await m.sp.rinnovaPacchetto({ clientId: "giulia-bianchi", lezioni: 60, amountCents: 45000 })).ok).toBe(false);
  });
});

describe("misure, obiettivo e note", () => {
  it("aggiungiMisura aggiorna il peso; annulla toglie solo la riga di Leo", async () => {
    const esito = await m.sp.aggiungiMisura({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 68 });
    expect(esito.ok).toBe(true);
    expect(vista("giulia-bianchi").current).toBe(68);
    expect(vista("giulia-bianchi").weights.at(-1)).toBe(68);
    await m.sp.aggiungiMisura({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 67.5 });
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: true });
    expect(dati().misure.filter((x) => x.clientId === "giulia-bianchi" && x.weightKg === 68)).toHaveLength(0);
    expect(vista("giulia-bianchi").weights.at(-1)).toBe(67.5);
    expect(vista("giulia-bianchi").current).toBe(67.5);
  });

  it("aggiungiMisura su un obiettivo non in kg non tocca l'avanzamento", async () => {
    await m.sp.aggiungiMisura({ clientId: "luca-ferri", takenOn: "2026-10-21", weightKg: 77 });
    expect(vista("luca-ferri").current).toBe(14.5);
  });

  it("aggiungiMisura rifiuta valori fuori misura", async () => {
    const esito = await m.sp.aggiungiMisura({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 680 });
    expect(esito.ok).toBe(false);
  });

  it("aggiornaObiettivo cambia traguardo e descrizione; annulla li rimette", async () => {
    const prima = structuredClone(dati());
    const esito = await m.sp.aggiornaObiettivo("giulia-bianchi", { goalTarget: 62, goalLabel: "Dimagrimento −10 kg" });
    expect(vista("giulia-bianchi")).toMatchObject({ target: 62, goal: "Dimagrimento −10 kg" });
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: true });
    expect(dati()).toEqual(prima);
    expect(await m.sp.aggiornaObiettivo("giulia-bianchi", {})).toEqual({ ok: false, motivo: "Niente da cambiare nell'obiettivo" });
  });

  it("aggiungiNota aggiunge una riga datata; annulla non tocca note cambiate nel frattempo", async () => {
    const esito = await m.sp.aggiungiNota("luca-ferri", "Ginocchio a posto");
    expect(vista("luca-ferri").notes.endsWith("\n21/10 · Ginocchio a posto")).toBe(true);
    m.stato.setDati((d) => ({ ...d, clienti: d.clienti.map((c) => (c.id === "luca-ferri" ? { ...c, notes: "riscritte a mano" } : c)) }));
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: false, motivo: "Le note sono cambiate nel frattempo" });
  });
});

describe("clienti, messaggi e notifiche", () => {
  it("creaCliente aggiunge il cliente con id dal nome; un nome doppio non passa", async () => {
    expect(await m.sp.creaCliente({ name: "Sara Conti", gender: "donna" })).toEqual({ ok: false, motivo: "Esiste già un cliente con questo nome" });
    const esito = await m.sp.creaCliente({ name: "Marta Neri", gender: "donna", email: "marta@esempio.it" });
    expect(esito).toMatchObject({ ok: true, id: "marta-neri" });
    const marta = m.sel.clientiAttuali().find((c) => c.id === "marta-neri")!;
    expect(marta).toMatchObject({ name: "Marta Neri", initials: "MN", goal: "Da definire", email: "marta@esempio.it", since: "Dal 21 Ott 2026" });
    expect(marta.weights).toEqual([]);
    expect(marta.pkg.left).toBe("Da definire");
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: true });
    expect(m.sel.clientiAttuali().some((c) => c.id === "marta-neri")).toBe(false);
  });

  it("annulla del nuovo cliente non cancella i dati inseriti dopo", async () => {
    const esito = await m.sp.creaCliente({ name: "Marta Neri", gender: "donna" });
    await m.sp.aggiungiMisura({ clientId: "marta-neri", takenOn: "2026-10-21", weightKg: 60 });
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: false, motivo: "Marta Neri ha già dei dati: non la tolgo" });
    expect(m.sel.clientiAttuali().some((c) => c.id === "marta-neri")).toBe(true);
  });

  it("annulla del nuovo cliente si ferma anche se ha già messaggi o sedute", async () => {
    const esito = await m.sp.creaCliente({ name: "Marco Blu", gender: "uomo" });
    await m.sp.inviaMessaggio("marco-blu", "Benvenuto!");
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: false, motivo: "Marco Blu ha già dei dati: non lo tolgo" });
  });

  it("inviaMessaggio scrive nella conversazione del cliente", async () => {
    expect((await m.sp.inviaMessaggio("giulia-bianchi", "Ciao!")).ok).toBe(true);
    expect(m.stato.get().threads["giulia-bianchi"].at(-1)).toMatchObject({ from: "trainer", text: "Ciao!" });
    expect(await m.sp.inviaMessaggio("giulia-bianchi", "  ")).toEqual({ ok: false, motivo: "Il messaggio è vuoto o troppo lungo" });
  });

  it("impostaNotifica accende e annulla rimette", async () => {
    const esito = await m.sp.impostaNotifica("riepilogo", true);
    expect(dati().notifiche.riepilogo).toBe(true);
    expect(esito.ok && (await esito.annulla!())).toEqual({ ok: true });
    expect(dati().notifiche.riepilogo).toBe(false);
  });
});

describe("misura con data vecchia e messaggi a più clienti", () => {
  it("una misura con data più vecchia dell'ultima non cambia il peso attuale", async () => {
    const prima = vista("giulia-bianchi").current;
    const esito = await m.sp.aggiungiMisura({ clientId: "giulia-bianchi", takenOn: "2026-01-05", weightKg: 90 });
    expect(esito.ok).toBe(true);
    expect(vista("giulia-bianchi").current).toBe(prima);
    expect(dati().misure.some((x) => x.takenOn === "2026-01-05" && x.weightKg === 90)).toBe(true);
  });

  it("una misura di oggi aggiorna il peso attuale, e annulla lo riporta com'era", async () => {
    const prima = vista("giulia-bianchi").current;
    const esito = await m.sp.aggiungiMisura({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 67.5 });
    expect(vista("giulia-bianchi").current).toBe(67.5);
    if (esito.ok) await esito.annulla!();
    expect(vista("giulia-bianchi").current).toBe(prima);
  });

  it("inviaMessaggi controlla tutti prima di scrivere: se uno non va, non parte nessuno", async () => {
    const lunghezza = () => (m.stato.get().threads["giulia-bianchi"] ?? []).length;
    const prima = lunghezza();
    const esito = await m.sp.inviaMessaggi([
      { clientId: "giulia-bianchi", testo: "Ciao" },
      { clientId: "non-esiste", testo: "Ciao" },
    ]);
    expect(esito).toEqual({ ok: false, motivo: "Cliente non trovato" });
    expect(lunghezza()).toBe(prima);
    const troppo = await m.sp.inviaMessaggi([
      { clientId: "giulia-bianchi", testo: "Ciao" },
      { clientId: "sara-conti", testo: "x".repeat(1001) },
    ]);
    expect(troppo.ok).toBe(false);
    expect(lunghezza()).toBe(prima);
  });

  it("inviaMessaggi scrive a tutti quando vanno bene", async () => {
    const esito = await m.sp.inviaMessaggi([
      { clientId: "giulia-bianchi", testo: "Ciao Giulia" },
      { clientId: "sara-conti", testo: "Ciao Sara" },
    ]);
    expect(esito.ok).toBe(true);
    expect(m.stato.get().threads["giulia-bianchi"].at(-1)).toMatchObject({ text: "Ciao Giulia" });
    expect(m.stato.get().threads["sara-conti"].at(-1)).toMatchObject({ text: "Ciao Sara" });
  });
});

describe("misure e obiettivo dall'app del cliente", () => {
  it("il peso entra subito, le circonferenze restano in attesa e non contano finché il trainer non le accetta", async () => {
    const e = await m.sp.misureDalCliente({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 68.2, waistCm: 80 });
    expect(e).toMatchObject({ ok: true, inAttesa: true });
    expect(vista("giulia-bianchi").current).toBe(68.2);
    expect(vista("giulia-bianchi").measures.find((x) => x.label === "Vita")?.current).toBe(82);
    const [attesa] = m.sp.misureInAttesa(dati(), "giulia-bianchi");
    expect(attesa).toMatchObject({ waistCm: 80, daConfermare: true });
    expect(attesa.weightKg).toBeUndefined();

    expect((await m.sp.confermaMisura(attesa.id)).ok).toBe(true);
    expect(vista("giulia-bianchi").measures.find((x) => x.label === "Vita")?.current).toBe(80);
    expect(m.sp.misureInAttesa(dati(), "giulia-bianchi")).toHaveLength(0);
  });

  it("le circonferenze rifiutate spariscono; solo peso: niente in attesa", async () => {
    await m.sp.misureDalCliente({ clientId: "giulia-bianchi", takenOn: "2026-10-21", hipsCm: 99 });
    const [attesa] = m.sp.misureInAttesa(dati(), "giulia-bianchi");
    expect((await m.sp.rifiutaMisura(attesa.id)).ok).toBe(true);
    expect(dati().misure.some((x) => x.id === attesa.id)).toBe(false);
    expect(await m.sp.misureDalCliente({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 68 })).toEqual({ ok: true });
    expect(m.sp.misureInAttesa(dati(), "giulia-bianchi")).toHaveLength(0);
  });

  it("valori assurdi rifiutati con lo stesso messaggio del trainer", async () => {
    const e = await m.sp.misureDalCliente({ clientId: "giulia-bianchi", takenOn: "2026-10-21", weightKg: 500 });
    expect(e.ok).toBe(false);
    expect(m.sp.misureInAttesa(dati(), "giulia-bianchi")).toHaveLength(0);
  });

  it("l'obiettivo proposto vale quando il trainer lo conferma; si può rifiutare", async () => {
    expect((await m.sp.proponiObiettivo("giulia-bianchi", 70, 70)).ok).toBe(false);
    expect((await m.sp.proponiObiettivo("giulia-bianchi", 70, 900)).ok).toBe(false);
    expect((await m.sp.proponiObiettivo("giulia-bianchi", 70, 62.5)).ok).toBe(true);
    expect(vista("giulia-bianchi").target).toBe(64); // ancora quello di prima
    expect((await m.sp.confermaObiettivo("giulia-bianchi")).ok).toBe(true);
    const g = vista("giulia-bianchi");
    expect([g.start, g.target, g.goal]).toEqual([70, 62.5, "Dimagrimento −7,5 kg"]);
    await m.sp.proponiObiettivo("giulia-bianchi", 70, 75);
    expect((await m.sp.rifiutaObiettivo("giulia-bianchi")).ok).toBe(true);
    expect(dati().clienti.find((c) => c.id === "giulia-bianchi")?.obiettivoProposto).toBeUndefined();
  });

  it("ogni quanto pesarsi: settimanale di partenza, si cambia", async () => {
    expect(dati().clienti.find((c) => c.id === "giulia-bianchi")?.pesata).toBe("settimana");
    await m.sp.impostaPesata("giulia-bianchi", "giorno");
    expect(dati().clienti.find((c) => c.id === "giulia-bianchi")?.pesata).toBe("giorno");
  });
});

describe("creaPacchetto", () => {
  it("pacchetto a lezioni con il suo pagamento da incassare; diventa quello del cliente", async () => {
    const { creaPacchetto } = await import("@/libs/dati/sportello");
    const { stato } = await import("@/libs/prototipo/stato");
    const prima = stato.get().dati;
    const e = await creaPacchetto({ clientId: "giulia-bianchi", kind: "lessons", lezioni: 12, amountCents: 54000, pagato: false }, "2026-10-21");
    expect(e.ok).toBe(true);
    const d = stato.get().dati;
    expect(d.pacchetti.find((p) => p.clientId === "giulia-bianchi")).toMatchObject({ label: "Pacchetto 12 lezioni", lessonsTotal: 12, lessonsUsed: 0, startsOn: "2026-10-21" });
    expect(d.pagamenti.at(-1)).toMatchObject({ amountCents: 54000, paidOn: null, description: "Pacchetto 12 lezioni" });
    if (e.ok) await e.annulla!();
    expect(stato.get().dati.pacchetti).toEqual(prima.pacchetti);
  });

  it("abbonamento a mesi: scade dopo i mesi scelti; numeri fuori misura rifiutati", async () => {
    const { creaPacchetto } = await import("@/libs/dati/sportello");
    const { stato } = await import("@/libs/prototipo/stato");
    const e = await creaPacchetto({ clientId: "luca-ferri", kind: "time", mesi: 3, amountCents: 30000, pagato: true }, "2026-10-31");
    expect(e.ok).toBe(true);
    expect(stato.get().dati.pacchetti.find((p) => p.clientId === "luca-ferri")).toMatchObject({ kind: "time", endsOn: "2027-01-31" });
    expect(await creaPacchetto({ clientId: "luca-ferri", kind: "lessons", lezioni: 0, amountCents: 100, pagato: true })).toMatchObject({ ok: false });
    expect(await creaPacchetto({ clientId: "nessuno", kind: "lessons", lezioni: 5, amountCents: 100, pagato: true })).toMatchObject({ ok: false, motivo: "Cliente non trovato" });
  });
});
