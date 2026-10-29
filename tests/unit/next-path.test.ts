import { describe, expect, it } from "vitest";
import { safeNext } from "@/libs/auth/next-path";

describe("safeNext", () => {
  it("accetta solo percorsi interni", () => {
    expect(safeNext("/nuova-password", "/dashboard")).toBe("/nuova-password");
    expect(safeNext(null, "/dashboard")).toBe("/dashboard");
    expect(safeNext("https://altro.it", "/dashboard")).toBe("/dashboard");
    expect(safeNext("//altro.it", "/dashboard")).toBe("/dashboard");
    expect(safeNext("/\\altro.it", "/dashboard")).toBe("/dashboard");
  });
});
