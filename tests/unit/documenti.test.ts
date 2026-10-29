import { describe, expect, it } from "vitest";
import { controllaFile } from "@/libs/prototipo/documenti";

describe("file dei documenti del cliente", () => {
  it("PDF e foto vanno, il resto no", () => {
    expect(controllaFile({ name: "a.pdf", type: "application/pdf", size: 2e6 })).toEqual({ ok: true, tipo: "pdf" });
    expect(controllaFile({ name: "foto.JPG", type: "image/jpeg", size: 3e6 })).toEqual({ ok: true, tipo: "foto" });
    expect(controllaFile({ name: "foto.heic", type: "image/heic", size: 1e6 })).toMatchObject({ ok: false, motivo: "Carica un PDF o una foto JPG o PNG" });
    expect(controllaFile({ name: "lettera.docx", type: "", size: 1e4 })).toMatchObject({ ok: false });
  });

  it("i file troppo grandi si rifiutano con il limite scritto", () => {
    const e = controllaFile({ name: "grande.pdf", type: "application/pdf", size: 40 * 1024 * 1024 });
    expect(e.ok).toBe(false);
    expect("motivo" in e && e.motivo).toContain("10 MB");
  });
});
