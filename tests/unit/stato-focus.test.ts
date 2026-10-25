import { describe, expect, it, vi } from "vitest";

// Il segno di Leo (focus) vale solo appena dato: una sezione riaperta dopo non ripete l'ultima azione.
describe("focus di Leo", () => {
  it("è recente appena impostato e scade dopo qualche secondo", async () => {
    vi.resetModules();
    const { stato, focusRecente, FOCUS_VALIDO } = await import("@/libs/prototipo/stato");
    stato.setFocus({ tipo: "fissa", id: "A1" });
    const f = stato.get().focus!;
    expect(focusRecente(f, f.alle)).toBe(f);
    expect(focusRecente(f, f.alle + FOCUS_VALIDO - 1)).toBe(f);
    expect(focusRecente(f, f.alle + FOCUS_VALIDO)).toBeNull();
    expect(focusRecente(null)).toBeNull();
  });
});
