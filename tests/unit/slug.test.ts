import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, slugify, validateSlug } from "@/libs/slug";

describe("slugify", () => {
  it("toglie accenti e maiuscole", () => {
    expect(slugify("Marco Rossì")).toBe("marco-rossi");
  });

  it("apostrofi e spazi doppi diventano un solo trattino", () => {
    expect(slugify("  Anna  D'Amico ")).toBe("anna-d-amico");
  });

  it("niente trattini all'inizio, alla fine o ripetuti", () => {
    expect(slugify("--Luca__Ferri--")).toBe("luca-ferri");
    expect(slugify("Ñoño & Çelik")).toBe("nono-celik");
  });
});

describe("validateSlug", () => {
  it("rifiuta ogni slug riservato", () => {
    for (const s of RESERVED_SLUGS) expect(validateSlug(s)).toEqual({ ok: false, reason: "riservato" });
  });

  it("rifiuta i formati non validi", () => {
    expect(validateSlug("ab")).toEqual({ ok: false, reason: "formato" });
    expect(validateSlug("Marco_Rossi")).toEqual({ ok: false, reason: "formato" });
    expect(validateSlug("marco--rossi")).toEqual({ ok: false, reason: "formato" });
    expect(validateSlug("-marco")).toEqual({ ok: false, reason: "formato" });
    expect(validateSlug("a".repeat(41))).toEqual({ ok: false, reason: "formato" });
  });

  it("accetta uno slug normale", () => {
    expect(validateSlug("marco-rossi")).toEqual({ ok: true });
    expect(validateSlug("abc")).toEqual({ ok: true });
    expect(validateSlug("a".repeat(40))).toEqual({ ok: true });
  });
});
