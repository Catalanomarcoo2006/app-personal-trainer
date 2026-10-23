import { describe, expect, it } from "vitest";
import { resolveRoute, type Access } from "@/libs/auth/routing";

const anon: Access = { role: null, trainerActive: false, clientTrainerSlug: null };
const trainer: Access = { role: "trainer", trainerActive: true, clientTrainerSlug: null };
const suspended: Access = { role: "trainer", trainerActive: false, clientTrainerSlug: null };
const client: Access = { role: "client", trainerActive: false, clientTrainerSlug: "marco-rossi" };
const orphan: Access = { role: "client", trainerActive: false, clientTrainerSlug: null };
const admin: Access = { role: "admin", trainerActive: false, clientTrainerSlug: null };

const next = { action: "next" };
const to = (path: string) => ({ action: "redirect", to: path });

describe("resolveRoute", () => {
  it("anonimo: area riservata → login; pagina di un trainer → si apre (login col marchio)", () => {
    expect(resolveRoute("/dashboard", anon)).toEqual(to("/signin"));
    expect(resolveRoute("/dashboard/clienti", anon)).toEqual(to("/signin"));
    expect(resolveRoute("/admin", anon)).toEqual(to("/signin"));
    expect(resolveRoute("/marco-rossi", anon)).toEqual(next);
    expect(resolveRoute("/signin", anon)).toEqual(next);
  });

  it("trainer attivo: dashboard sì, admin no", () => {
    expect(resolveRoute("/dashboard", trainer)).toEqual(next);
    expect(resolveRoute("/admin", trainer)).toEqual(to("/dashboard"));
  });

  it("trainer sospeso → /sospeso", () => {
    expect(resolveRoute("/dashboard", suspended)).toEqual(to("/sospeso"));
    expect(resolveRoute("/sospeso", suspended)).toEqual(next);
  });

  it("cliente: sempre nella pagina del suo trainer", () => {
    expect(resolveRoute("/anna-bianchi", client)).toEqual(to("/marco-rossi"));
    expect(resolveRoute("/dashboard", client)).toEqual(to("/marco-rossi"));
    expect(resolveRoute("/admin", client)).toEqual(to("/marco-rossi"));
    expect(resolveRoute("/marco-rossi", client)).toEqual(next);
    expect(resolveRoute("/marco-rossi/misure", client)).toEqual(next);
  });

  it("cliente con trainer sospeso → /sospeso ovunque", () => {
    expect(resolveRoute("/marco-rossi", orphan)).toEqual(to("/sospeso"));
    expect(resolveRoute("/dashboard", orphan)).toEqual(to("/sospeso"));
    expect(resolveRoute("/sospeso", orphan)).toEqual(next);
  });

  it("admin: pannello sì", () => {
    expect(resolveRoute("/admin", admin)).toEqual(next);
    expect(resolveRoute("/admin/trainer", admin)).toEqual(next);
  });

  it("pagine pubbliche e API passano sempre", () => {
    for (const a of [anon, trainer, suspended, client, orphan, admin]) {
      expect(resolveRoute("/api/auth/callback", a)).toEqual(next);
      expect(resolveRoute("/privacy-policy", a)).toEqual(next);
      expect(resolveRoute("/tos", a)).toEqual(next);
    }
  });
});
