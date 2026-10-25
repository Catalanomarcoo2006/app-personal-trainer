import { describe, expect, it } from "vitest";
import { bloccoAllegato, conAllegato, leggiFile, MAX_TESTO_FILE } from "@/libs/prototipo/leo-file";

const file = (contenuto: string, nome: string, tipo = "text/plain") => new File([contenuto], nome, { type: tipo });

describe("leggiFile", () => {
  it("legge un CSV così com'è", async () => {
    const r = await leggiFile(file("cliente;vita;fianchi\nGiulia Bianchi;79;99", "misure.csv", "text/csv"));
    expect(r).toEqual({ ok: true, nome: "misure.csv", testo: "cliente;vita;fianchi\nGiulia Bianchi;79;99", tagliato: false });
  });

  it("toglie email e telefoni prima che il testo vada a Leo", async () => {
    const r = await leggiFile(file("Giulia Bianchi giulia@esempio.it +39 333 1234567 peso 68", "note.txt"));
    expect(r.ok && r.testo).toBe("Giulia Bianchi [email] [telefono] peso 68");
  });

  it("taglia i testi troppo lunghi e lo dice", async () => {
    const r = await leggiFile(file("a".repeat(7000), "lungo.txt"));
    expect(r.ok && r.testo.length).toBe(MAX_TESTO_FILE);
    expect(r.ok && r.tagliato).toBe(true);
  });

  it("legge i PDF con il lettore di pdf.js", async () => {
    const r = await leggiFile(file("%PDF finto", "misure.pdf", "application/pdf"), async () => ["Giulia Bianchi", "Vita 79 cm", "Fianchi 99 cm"]);
    expect(r).toMatchObject({ ok: true, testo: "Giulia Bianchi\nVita 79 cm\nFianchi 99 cm" });
  });

  it("un PDF senza testo (una scansione) non si legge", async () => {
    const r = await leggiFile(file("%PDF finto", "foto.pdf", "application/pdf"), async () => []);
    expect(r).toEqual({ ok: false, motivo: "Questo PDF è una foto: per ora leggo solo PDF con testo" });
  });

  it("legge i file Excel come righe separate da punto e virgola", async () => {
    const r = await leggiFile(file("xlsx finto", "misure.xlsx"), undefined, async () => [
      { nome: "Misure", righe: [["Cliente", "Peso", "Vita", null], ["Luca Ferri", 76.6, 83.5, null], [null, null], ["Data", new Date(Date.UTC(2026, 9, 21)), true]] },
    ]);
    expect(r).toEqual({ ok: true, nome: "misure.xlsx", testo: "Cliente;Peso;Vita\nLuca Ferri;76,6;83,5\nData;21/10/2026;sì", tagliato: false });
  });

  it("con più fogli scrive il nome di ognuno e salta quelli vuoti", async () => {
    const r = await leggiFile(file("xlsx finto", "clienti.xlsx"), undefined, async () => [
      { nome: "Luca", righe: [["Peso", 76.6]] },
      { nome: "Vuoto", righe: [] },
      { nome: "Giulia", righe: [["Peso", 68]] },
    ]);
    expect(r.ok && r.testo).toBe("Foglio \"Luca\"\nPeso;76,6\n\nFoglio \"Giulia\"\nPeso;68");
  });

  it("un Excel vuoto o rovinato non si legge", async () => {
    expect(await leggiFile(file("x", "vuoto.xlsx"), undefined, async () => [{ nome: "Foglio1", righe: [] }])).toEqual({ ok: false, motivo: "Questo file Excel è vuoto" });
    expect(await leggiFile(file("x", "rotto.xlsx"), undefined, async () => { throw new Error("zip"); })).toEqual({ ok: false, motivo: "Non riesco ad aprire questo file Excel" });
  });

  it("rifiuta formati non supportati e file troppo grandi", async () => {
    expect(await leggiFile(file("x", "misure.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).toEqual({ ok: false, motivo: "Per ora leggo PDF, Excel, CSV e TXT" });
    expect(await leggiFile(file("x", "vecchio.xls"))).toEqual({ ok: false, motivo: "Questo è un Excel vecchio (.xls): salvalo come .xlsx e riallegalo" });
    const grande = new File([new Uint8Array(6 * 1024 * 1024)], "grande.csv", { type: "text/csv" });
    expect(await leggiFile(grande)).toEqual({ ok: false, motivo: "Il file è troppo grande (massimo 5 MB)" });
  });
});

describe("allegato nel messaggio", () => {
  it("il blocco dell'allegato ha il nome del file e il testo", () => {
    expect(bloccoAllegato("misure.csv", "riga")).toBe('Allegato "misure.csv":\nriga');
  });
  it("riconosce un messaggio con allegato", () => {
    expect(conAllegato(`aggiorna\n\n${bloccoAllegato("misure.csv", "riga")}`)).toBe(true);
    expect(conAllegato("aggiorna le misure")).toBe(false);
  });
});
