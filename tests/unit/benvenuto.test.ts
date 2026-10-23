import { describe, expect, it } from "vitest";
import {
  BENVENUTO_INIZIALE,
  codiceGiusto,
  controllaLogo,
  emailValida,
  leggiBenvenuto,
  nuovoCodice,
  passoDiRipartenza,
  passwordValida,
  pulisciCodice,
  regolePassword,
} from "@/libs/prototipo/benvenuto";

const archivio = (valore: string | null) => ({ getItem: () => valore });

describe("password", () => {
  it("controlla le tre regole una per una", () => {
    expect(regolePassword("abc")).toEqual({ lunghezza: false, lettera: true, numero: false });
  });
  it("vale solo con 8 caratteri, una lettera e un numero", () => {
    expect(passwordValida("allenamento1")).toBe(true);
    expect(passwordValida("12345678")).toBe(false);
    expect(passwordValida("allenamento")).toBe(false);
  });
});

describe("codice via email", () => {
  it("ha sempre 6 cifre, anche quando inizia con 0", () => {
    expect(nuovoCodice(() => 0)).toBe("000000");
    expect(nuovoCodice(() => 0.999999)).toBe("999999");
    for (let i = 0; i < 20; i++) expect(nuovoCodice()).toMatch(/^\d{6}$/);
  });
  it("tiene solo le prime 6 cifre di quello che si incolla", () => {
    expect(pulisciCodice("482 915")).toBe("482915");
    expect(pulisciCodice("48a915")).toBe("48915");
    expect(pulisciCodice("1234567")).toBe("123456");
    expect(pulisciCodice("482915\n")).toBe("482915");
  });
  it("confronta il codice ignorando gli spazi", () => {
    expect(codiceGiusto("482 915", "482915")).toBe(true);
    expect(codiceGiusto("48291", "482915")).toBe(false);
  });
});

describe("email del cliente", () => {
  it("accetta la forma nome@dominio.it, spazi ai lati compresi", () => {
    expect(emailValida(" giulia@esempio.it ")).toBe(true);
  });
  it("rifiuta email incomplete o vuote", () => {
    expect(emailValida("giulia@")).toBe(false);
    expect(emailValida("giulia.it")).toBe(false);
    expect(emailValida("")).toBe(false);
  });
});

describe("logo", () => {
  it("accetta immagini e riconosce l'SVG", () => {
    expect(controllaLogo({ name: "logo.png", type: "image/png", size: 2e6 })).toEqual({ ok: true, vettoriale: false });
    expect(controllaLogo({ name: "logo.svg", type: "image/svg+xml", size: 2e4 })).toEqual({ ok: true, vettoriale: true });
  });
  it("rifiuta i file oltre 5 MB", () => {
    const r = controllaLogo({ name: "logo.png", type: "image/png", size: 12e6 });
    expect(r.ok).toBe(false);
    if ("motivo" in r) expect(r.motivo).toContain("5 MB");
  });
  it("rifiuta HEIC e PDF", () => {
    for (const f of [
      { name: "foto.heic", type: "image/heic", size: 1e6 },
      { name: "a.pdf", type: "application/pdf", size: 1e6 },
    ]) {
      expect(controllaLogo(f)).toEqual({ ok: false, motivo: "Carica un logo PNG, JPG, WebP o SVG" });
    }
  });
});

describe("ripartenza", () => {
  it("senza email verificata si riparte dall'accesso", () => {
    expect(passoDiRipartenza({ ...BENVENUTO_INIZIALE, passo: 3 })).toBe(0);
  });
  it("dopo la verifica si riparte dal passo salvato", () => {
    expect(passoDiRipartenza({ ...BENVENUTO_INIZIALE, verificato: true, passo: 3 })).toBe(3);
  });
  it("al finale non si arriva senza accordi", () => {
    expect(passoDiRipartenza({ ...BENVENUTO_INIZIALE, verificato: true, passo: 5, accordi: null })).toBe(2);
  });
});

describe("salvataggio nel browser", () => {
  it("senza archivio o con dati rotti riparte dall'inizio", () => {
    expect(leggiBenvenuto(null)).toEqual(BENVENUTO_INIZIALE);
    expect(leggiBenvenuto(archivio("{rotto"))).toEqual(BENVENUTO_INIZIALE);
    expect(leggiBenvenuto(archivio(JSON.stringify({ v: 0, fatto: true })))).toEqual(BENVENUTO_INIZIALE);
  });
  it("legge un salvataggio valido e completa i campi mancanti", () => {
    const letto = leggiBenvenuto(archivio(JSON.stringify({ v: 1, verificato: true, passo: 2, studio: "Rossi Fit" })));
    expect(letto).toEqual({ ...BENVENUTO_INIZIALE, verificato: true, passo: 2, studio: "Rossi Fit" });
  });
});
