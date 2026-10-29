import { afterAll, describe, expect, it } from "vitest";
import { createTrainer, newInviteLink, renewTrainer, setTrainerStatus } from "@/libs/admin/trainers";
import { adminClient, anonClient } from "../helpers/supabase";
import { creaUtente, DOMINIO_PROVA, resetTestData } from "../helpers/seed";

const db = adminClient();
const sito = "http://localhost:3000";
const email = (nome: string) => `${nome}-${Math.random().toString(36).slice(2, 8)}${DOMINIO_PROVA}`;
// un nome diverso a ogni esecuzione, così lo slug non si scontra con quelli di un giro precedente
const nome = (base: string) => `${base} ${Math.random().toString(36).slice(2, 6)}`;

afterAll(resetTestData);

describe("createTrainer", () => {
  it("crea trainer, profilo e licenza di un anno; slug dal nome senza accenti", async () => {
    const n = nome("Marco Rossì");
    const r = await createTrainer({ name: n, email: email("marco"), siteUrl: sito, today: "2026-10-29" }, db);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.slug).toMatch(/^marco-rossi-[a-z0-9]+$/);
    expect(r.licenseExpiresAt).toBe("2027-10-29");
    expect(r.inviteLink).toMatch(/^http:\/\/localhost:3000\/api\/auth\/confirm\?token_hash=.+&type=invite$/);
    const t = (await db.from("trainers").select("name, status, user_id").eq("id", r.trainerId).single()).data!;
    expect(t).toMatchObject({ name: n, status: "active" });
    const p = (await db.from("profiles").select("role").eq("id", t.user_id).single()).data!;
    expect(p.role).toBe("trainer");
  });

  it("il link d'invito fa entrare il trainer", async () => {
    const r = await createTrainer({ name: nome("Invito"), email: email("invito"), siteUrl: sito }, db);
    if ("error" in r) throw new Error(r.error);
    const tokenHash = new URL(r.inviteLink).searchParams.get("token_hash")!;
    const browser = anonClient();
    const v = await browser.auth.verifyOtp({ type: "invite", token_hash: tokenHash });
    expect(v.error).toBeNull();
    const acc = await browser.rpc("my_access");
    expect(acc.data).toEqual([{ role: "trainer", trainer_active: true, client_trainer_slug: null }]);
  });

  it("slug occupato, riservato o scritto male → errore chiaro", async () => {
    const n = nome("Anna Bianchi");
    const primo = await createTrainer({ name: n, email: email("anna1"), siteUrl: sito }, db);
    expect(primo.ok).toBe(true);
    expect(await createTrainer({ name: n, email: email("anna2"), siteUrl: sito }, db)).toEqual({ ok: false, error: "slug_occupato" });
    expect(await createTrainer({ name: "Admin", email: email("adm"), siteUrl: sito }, db)).toEqual({ ok: false, error: "slug_riservato" });
    expect(await createTrainer({ name: "X", email: email("x"), slug: "Marco_Rossi", siteUrl: sito }, db)).toEqual({ ok: false, error: "slug_formato" });
  });

  it("email già usata da un cliente → email_esistente e nessuna riga trainers orfana", async () => {
    const cliente = await creaUtente(db, "gia-cliente", "client");
    const prima = (await db.from("trainers").select("id", { count: "exact", head: true })).count;
    const n = nome("Doppione");
    const r = await createTrainer({ name: n, email: cliente.email, siteUrl: sito }, db);
    expect(r).toEqual({ ok: false, error: "email_esistente" });
    const dopo = (await db.from("trainers").select("id", { count: "exact", head: true })).count;
    expect(dopo).toBe(prima);
    // e il profilo del cliente resta quello che era
    expect((await db.from("profiles").select("role").eq("id", cliente.id).single()).data?.role).toBe("client");
  });
});

describe("renewTrainer e setTrainerStatus", () => {
  const nuovo = async () => {
    const r = await createTrainer({ name: nome("Rinnovo"), email: email("rinnovo"), siteUrl: sito }, db);
    if ("error" in r) throw new Error(r.error);
    return r.trainerId;
  };

  it("rinnovo: un anno dalla scadenza, o da oggi se è già passata", async () => {
    const id = await nuovo();
    await db.from("trainers").update({ license_expires_at: "2027-03-01" }).eq("id", id);
    expect(await renewTrainer(id, db, "2026-10-29")).toBe("2028-03-01");
    await db.from("trainers").update({ license_expires_at: "2026-01-10", status: "suspended" }).eq("id", id);
    expect(await renewTrainer(id, db, "2026-10-29")).toBe("2027-10-29");
    expect((await db.from("trainers").select("status").eq("id", id).single()).data?.status).toBe("active");
  });

  it("sospensione: stato salvato, clienti intatti", async () => {
    const id = await nuovo();
    await db.from("clients").insert([{ trainer_id: id, name: "Uno" }, { trainer_id: id, name: "Due" }]);
    await setTrainerStatus(id, "suspended", db);
    expect((await db.from("trainers").select("status").eq("id", id).single()).data?.status).toBe("suspended");
    expect((await db.from("clients").select("id", { count: "exact", head: true }).eq("trainer_id", id)).count).toBe(2);
    await setTrainerStatus(id, "active", db);
    expect((await db.from("trainers").select("status").eq("id", id).single()).data?.status).toBe("active");
  });

  it("nuovo link d'invito per chi non ha ancora scelto la password", async () => {
    const id = await nuovo();
    expect(await newInviteLink(id, sito, db)).toMatch(/type=invite$/);
  });
});
