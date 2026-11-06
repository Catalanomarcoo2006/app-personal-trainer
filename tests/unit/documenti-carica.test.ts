import { afterEach, describe, expect, it } from "vitest";
import { caricaDocumento, togliDocumento } from "@/libs/prototipo/documenti-carica";
import { stato } from "@/libs/prototipo/stato";
import { eventiVeri } from "@/libs/vera/eventi";

const pdf = (nome = "Dieta.pdf") => new File(["%PDF-1.4"], nome, { type: "application/pdf" });
const C = "00000000-0000-0000-0000-0000000000c1";

afterEach(() => {
  delete eventiVeri.caricaDocumento;
  delete eventiVeri.togliDocumento;
});

describe("documenti: carica e togli", () => {
  it("versione vera: il documento compare solo se Storage e database hanno detto sì, con il suo percorso", async () => {
    eventiVeri.caricaDocumento = async (d) => `T/${d.clientId}/${d.id}.pdf`;
    const esito = await caricaDocumento(pdf(), C, "nutrizionista");
    expect(esito.ok).toBe(true);
    const doc = stato.get().documenti.find((d) => d.clientId === C)!;
    expect(doc).toMatchObject({ nome: "Dieta.pdf", tipo: "pdf", da: "nutrizionista", percorso: `T/${C}/${doc.id}.pdf` });

    eventiVeri.togliDocumento = async () => false;
    expect((await togliDocumento(doc)).ok).toBe(false);
    expect(stato.get().documenti.some((d) => d.id === doc.id)).toBe(true);
    eventiVeri.togliDocumento = async (d) => d.percorso === doc.percorso;
    expect((await togliDocumento(doc)).ok).toBe(true);
    expect(stato.get().documenti.some((d) => d.id === doc.id)).toBe(false);
  });

  it("caricamento non riuscito: niente documento finto in elenco", async () => {
    eventiVeri.caricaDocumento = async () => null;
    const prima = stato.get().documenti.length;
    const esito = await caricaDocumento(pdf("Analisi.pdf"), C, "cliente");
    expect(esito).toMatchObject({ ok: false, motivo: expect.stringContaining("non è stato caricato") });
    expect(stato.get().documenti.length).toBe(prima);
  });

  it("file non adatto: fermato prima di caricarlo", async () => {
    let chiamato = false;
    eventiVeri.caricaDocumento = async () => ((chiamato = true), "x");
    const esito = await caricaDocumento(new File(["x"], "foglio.xlsx", { type: "application/vnd.ms-excel" }), C, "cliente");
    expect(esito.ok).toBe(false);
    expect(chiamato).toBe(false);
  });
});
