import { describe, expect, it, vi } from "vitest";
import { accessoCliente, invitoCliente, invitoTrainer, mittente, nuovaPassword } from "@/libs/email/modelli";
import { linkAccessoCliente, linkNuovaPassword, troppoPresto } from "@/libs/admin/accesso";

const trainer = { nome: "Marco Rossi", colore: "#3366FF" };

describe("modelli delle email", () => {
  it("invito del cliente: nome del trainer, colore, link e testo semplice", () => {
    const e = invitoCliente({ nome: "Sara", trainer, link: "https://x.it/api/auth/confirm?token_hash=a&type=invite" });
    expect(e.oggetto).toBe("La tua app con Marco Rossi");
    expect(e.html).toContain("#3366FF");
    expect(e.html).toContain("token_hash=a&#38;type=invite");
    expect(e.testo).toContain("https://x.it/api/auth/confirm?token_hash=a&type=invite");
    expect(e.html).toContain('lang="it"');
  });

  it("i nomi non diventano HTML e un colore storto torna quello di base", () => {
    const e = accessoCliente({ nome: "<b>Sara</b>", trainer: { nome: 'Studio "Forte"', colore: "red;background:url(x)" }, link: "https://x.it" });
    expect(e.html).not.toContain("<b>Sara</b>");
    expect(e.html).toContain("&#60;b&#62;Sara");
    expect(e.html).not.toContain("red;background");
    expect(e.html).toContain("#FF6B2C");
  });

  it("con il logo l'immagine, senza l'iniziale nel colore del trainer", () => {
    expect(invitoCliente({ nome: "Sara", trainer: { ...trainer, logo: "https://abc.supabase.co/storage/v1/object/public/marchi/t/logo-1.png" }, link: "l" }).html).toContain("<img src=");
    expect(invitoCliente({ nome: "Sara", trainer, link: "l" }).html).toContain(">M</div>");
  });

  it("email del trainer col nome del prodotto", () => {
    expect(invitoTrainer({ nome: "Giulia", prodotto: "Spotter", link: "l" }).oggetto).toBe("Il tuo account su Spotter");
    expect(nuovaPassword({ prodotto: "Spotter", link: "l" }).testo).toContain("nuova");
  });

  it("mittente: l'indirizzo del dominio con il nome di chi scrive", () => {
    expect(mittente("Spotter <ciao@spotter.it>", "Marco Rossi")).toBe("Marco Rossi <ciao@spotter.it>");
    expect(mittente("ciao@spotter.it", 'Marco "Il Coach" <x>')).toBe("Marco Il Coach x <ciao@spotter.it>");
    expect(mittente("Spotter <ciao@spotter.it>")).toBe("Spotter <ciao@spotter.it>");
  });
});

// Un Supabase finto: ogni tabella risponde con la riga data, l'admin di auth con l'utente dato.
function dbFinto(o: { trainer?: object | null; cliente?: object | null; ruolo?: string; utente?: object | null }) {
  const aggiorna = vi.fn(async () => ({ data: {}, error: null as unknown }));
  const genera = vi.fn(async (a: { type: string; email: string }) =>
    o.utente ? { data: { user: o.utente, properties: { hashed_token: `hash-${a.type}` } }, error: null as unknown } : { data: { user: null }, error: { message: "User not found" } },
  );
  const tabella = (riga: unknown) => {
    const catena: Record<string, unknown> = {};
    for (const m of ["select", "eq", "ilike", "not", "limit"]) catena[m] = () => catena;
    catena.maybeSingle = async () => ({ data: riga ?? null, error: null as unknown });
    return catena;
  };
  const db = {
    from: (t: string) => tabella(t === "trainers" ? o.trainer : t === "clients" ? o.cliente : { role: o.ruolo }),
    auth: { admin: { getUserById: async () => ({ data: { user: o.utente ?? null }, error: null as unknown }), generateLink: genera, updateUserById: aggiorna } },
  };
  return { db: db as never, genera, aggiorna };
}

const ORA = new Date("2026-11-17T10:00:00Z");
const T = { id: "t1", name: "Marco Rossi", color: "#3366FF", logo_path: null as string | null };
const U = { id: "u1", email: "sara@prova.test", app_metadata: {} };

describe("link d'accesso del cliente", () => {
  it("cliente invitato di un trainer attivo: link dell'app, con il nome del trainer come mittente", async () => {
    const { db, aggiorna } = dbFinto({ trainer: T, cliente: { name: "Sara Neri", user_id: "u1" }, utente: U });
    const m = await linkAccessoCliente(db, { slug: "marco-rossi", email: " Sara@Prova.test ", siteUrl: "https://app.it", ora: ORA });
    expect(m?.a).toBe("sara@prova.test");
    expect(m?.mittente).toBe("Marco Rossi");
    expect(m?.email.testo).toContain("https://app.it/api/auth/confirm?token_hash=hash-magiclink&type=magiclink&next=%2Fmarco-rossi");
    expect(aggiorna).toHaveBeenCalledWith("u1", { app_metadata: { ultimo_link: ORA.toISOString() } });
  });

  it("niente email: trainer sconosciuto o sospeso, cliente non invitato, email storta, link chiesto da meno di un minuto", async () => {
    const base = { slug: "marco-rossi", email: "sara@prova.test", siteUrl: "https://app.it", ora: ORA };
    expect(await linkAccessoCliente(dbFinto({ trainer: null, cliente: { name: "S", user_id: "u1" }, utente: U }).db, base)).toBeNull();
    expect(await linkAccessoCliente(dbFinto({ trainer: T, cliente: null, utente: U }).db, base)).toBeNull();
    expect(await linkAccessoCliente(dbFinto({ trainer: T, cliente: { name: "S", user_id: "u1" }, utente: U }).db, { ...base, email: "non-email" })).toBeNull();
    const recente = { ...U, app_metadata: { ultimo_link: new Date(ORA.getTime() - 30_000).toISOString() } };
    expect(await linkAccessoCliente(dbFinto({ trainer: T, cliente: { name: "S", user_id: "u1" }, utente: recente }).db, base)).toBeNull();
  });

  it("dopo un minuto si può richiedere", () => {
    expect(troppoPresto(new Date(ORA.getTime() - 61_000).toISOString(), ORA)).toBe(false);
    expect(troppoPresto(new Date(ORA.getTime() - 10_000).toISOString(), ORA)).toBe(true);
    expect(troppoPresto(undefined, ORA)).toBe(false);
  });
});

describe("password dimenticata", () => {
  it("solo trainer e admin, verso /nuova-password", async () => {
    const t = await linkNuovaPassword(dbFinto({ ruolo: "trainer", utente: U }).db, { email: "sara@prova.test", siteUrl: "https://app.it", prodotto: "Spotter", ora: ORA });
    expect(t?.email.testo).toContain("type=recovery&next=%2Fnuova-password");
    expect(await linkNuovaPassword(dbFinto({ ruolo: "client", utente: U }).db, { email: "sara@prova.test", siteUrl: "https://app.it", prodotto: "Spotter", ora: ORA })).toBeNull();
    expect(await linkNuovaPassword(dbFinto({ ruolo: "trainer", utente: null }).db, { email: "nessuno@prova.test", siteUrl: "https://app.it", prodotto: "Spotter", ora: ORA })).toBeNull();
  });
});
