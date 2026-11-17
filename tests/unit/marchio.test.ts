import { afterEach, describe, expect, it, vi } from "vitest";
import { indirizzoMarchio, percorsoMarchio } from "@/libs/vera/marchio";
import { messaggioArrivato } from "@/libs/vera/dal-vivo";
import { statoLicenza } from "@/libs/vera/account";

const T = "00000000-0000-0000-0000-00000000000t";

describe("foto e logo del trainer su Storage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("un file per caricamento, nella cartella del trainer", () => {
    expect(percorsoMarchio(T, "foto", 123)).toBe(`${T}/foto-123.jpg`);
    expect(percorsoMarchio(T, "logo", 456)).toBe(`${T}/logo-456.png`);
    expect(percorsoMarchio(T, "logo", 1)).not.toBe(percorsoMarchio(T, "logo", 2));
  });

  it("indirizzo pubblico dal progetto Supabase", () => {
    expect(indirizzoMarchio(`${T}/logo-1.png`, "https://abc.supabase.co/")).toBe(`https://abc.supabase.co/storage/v1/object/public/marchi/${T}/logo-1.png`);
    expect(indirizzoMarchio(null, "https://abc.supabase.co")).toBeUndefined();
    expect(indirizzoMarchio(`${T}/logo-1.png`, undefined)).toBeUndefined();
  });

  it("senza indirizzo passato usa quello del progetto (variabile d'ambiente)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
    expect(indirizzoMarchio("a/b.png")).toBe("https://xyz.supabase.co/storage/v1/object/public/marchi/a/b.png");
  });
});

describe("messaggi dal vivo", () => {
  const trainer = { tipo: "trainer" as const, trainerId: T };
  const cliente = { tipo: "cliente" as const, clientId: "c1" };

  it("il trainer riceve i messaggi dei suoi clienti in elenco, non i suoi", () => {
    expect(messaggioArrivato({ client_id: "c1", sender: "client" }, trainer, ["c1"])).toBe("c1");
    expect(messaggioArrivato({ client_id: "c1", sender: "trainer" }, trainer, ["c1"])).toBeNull();
    expect(messaggioArrivato({ client_id: "c9", sender: "client" }, trainer, ["c1"])).toBeNull();
  });

  it("il cliente riceve solo i messaggi del trainer nella sua conversazione", () => {
    expect(messaggioArrivato({ client_id: "c1", sender: "trainer" }, cliente, [])).toBe("c1");
    expect(messaggioArrivato({ client_id: "c1", sender: "client" }, cliente, [])).toBeNull();
    expect(messaggioArrivato({ client_id: "c2", sender: "trainer" }, cliente, [])).toBeNull();
  });
});

describe("licenza del trainer (Impostazioni)", () => {
  it("data in italiano, giorni che restano, barra del tempo passato", () => {
    expect(statoLicenza("2027-10-21", "2026-11-17")).toMatchObject({ data: "21 ottobre 2027", giorni: 338, passato: 7, inScadenza: false, scaduta: false });
    expect(statoLicenza("2026-12-01", "2026-11-17")).toMatchObject({ giorni: 14, inScadenza: true, scaduta: false });
    expect(statoLicenza("2026-11-10", "2026-11-17")).toMatchObject({ scaduta: true, inScadenza: false, passato: 100 });
  });
});
