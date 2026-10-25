import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// La rotta di Leo gira sul server: non deve arrivare (nemmeno di riflesso) allo store del browser né a React,
// altrimenti Next.js rifiuta di compilarla. I test unitari non lo vedono: lo controlla questo test.
const radice = resolve(__dirname, "../..");

function risolvi(da: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(radice, spec.slice(2)) : spec.startsWith(".") ? join(dirname(da), spec) : null;
  if (!base) return null;
  for (const est of [".ts", ".tsx", "/index.ts"]) if (existsSync(base + est)) return base + est;
  return existsSync(base) && /\.tsx?$/.test(base) ? base : null;
}

function dipendenze(file: string, viste = new Set<string>()): Set<string> {
  if (viste.has(file)) return viste;
  viste.add(file);
  const codice = readFileSync(file, "utf8");
  for (const [, tipo, spec] of codice.matchAll(/^import\s+(type\s+)?[^;]*?from\s+"([^"]+)"/gm)) {
    if (tipo) continue; // gli import di soli tipi spariscono nella compilazione
    const f = risolvi(file, spec);
    if (f) dipendenze(f, viste);
  }
  return viste;
}

describe("confine tra server e browser", () => {
  it("la rotta di Leo non importa lo store del browser né React", () => {
    const file = [...dipendenze(join(radice, "app/prototipo/api/leo/route.ts"))].map((f) => f.slice(radice.length + 1).replace(/\\/g, "/"));
    expect(file).not.toContain("libs/prototipo/stato.ts");
    expect(file).not.toContain("libs/dati/selettori.ts");
    for (const f of file) expect(readFileSync(join(radice, f), "utf8")).not.toMatch(/from "react"/);
  });
});
