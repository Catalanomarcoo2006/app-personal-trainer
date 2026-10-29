import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, signInAs, type Db } from "../helpers/supabase";
import { resetTestData, seedTwoTrainers, type Seed } from "../helpers/seed";

let s: Seed;
let trainerA: Db, clientA1: Db, admin: Db;

beforeAll(async () => {
  s = await seedTwoTrainers();
  trainerA = await signInAs(s.trainerA.email, s.trainerA.password);
  clientA1 = await signInAs(s.clientA1.email, s.clientA1.password);
  admin = await signInAs(s.admin.email, s.admin.password);
});
afterAll(resetTestData);

const ids = (rows: { id: string }[] | null) => (rows ?? []).map((r) => r.id);

describe("trainer", () => {
  it("vede solo i suoi clienti e non scrive sedute per quelli di un altro", async () => {
    const { data } = await trainerA.from("clients").select("id");
    expect(ids(data)).toEqual([s.clientA1.clientId]);
    const r = await trainerA
      .from("sessions")
      .insert({ trainer_id: s.trainerA.trainerId, client_id: s.clientB1.clientId, starts_at: "2026-11-03T09:00:00Z", duration_min: 60 });
    expect(r.error).not.toBeNull();
    const r2 = await trainerA
      .from("sessions")
      .insert({ trainer_id: s.trainerB.trainerId, client_id: s.clientB1.clientId, starts_at: "2026-11-03T09:00:00Z", duration_min: 60 });
    expect(r2.error?.code).toBe("42501");
  });

  it("non legge misure, sedute e pagamenti dell'altro trainer", async () => {
    for (const t of ["measurements", "sessions", "packages"] as const) {
      const { data } = await trainerA.from(t).select("client_id");
      expect((data ?? []).every((r) => r.client_id === s.clientA1.clientId), t).toBe(true);
      expect(data?.length, t).toBeGreaterThan(0);
    }
  });

  it("cambia il suo colore, non il suo stato né la licenza", async () => {
    const ok = await trainerA.from("trainers").update({ color: "#123456" }).eq("id", s.trainerA.trainerId);
    expect(ok.error).toBeNull();
    const no = await trainerA.from("trainers").update({ status: "suspended" }).eq("id", s.trainerA.trainerId);
    expect(no.error?.code).toBe("42501");
    const no2 = await trainerA.from("trainers").update({ license_expires_at: "2199-01-01" }).eq("id", s.trainerA.trainerId);
    expect(no2.error?.code).toBe("42501");
  });

  it("vede la richiesta di spostamento del cliente come avviso", async () => {
    const { data: sedute } = await clientA1.from("sessions").select("id");
    const r = await clientA1.from("change_requests").insert({ session_id: sedute![0].id, client_id: s.clientA1.clientId, message: "Posso venire alle 10?" });
    expect(r.error).toBeNull();
    const { data: avvisi } = await trainerA.from("alerts").select("kind, text, client_id");
    expect(avvisi).toContainEqual({ kind: "change_request", text: "Posso venire alle 10?", client_id: s.clientA1.clientId });
  });
});

describe("cliente", () => {
  it("vede solo le sue misure", async () => {
    const { data } = await clientA1.from("measurements").select("client_id");
    expect(data?.length).toBeGreaterThan(0);
    expect(data!.every((m) => m.client_id === s.clientA1.clientId)).toBe(true);
  });

  it("non seleziona trainers né clients (le note del trainer), ma legge il marchio e il suo profilo", async () => {
    expect((await clientA1.from("trainers").select("id")).data).toEqual([]);
    expect((await clientA1.from("clients").select("id")).data).toEqual([]);
    const marchio = await clientA1.rpc("trainer_branding", { p_slug: s.trainerA.slug });
    expect(marchio.data).toEqual([{ name: "trainer-a", logo_path: null, color: expect.any(String), active: true }]);
    const io = await clientA1.rpc("my_client");
    expect(io.data?.[0].id).toBe(s.clientA1.clientId);
    expect(io.data?.[0]).not.toHaveProperty("notes");
  });

  it("scrive il peso; le circonferenze solo da confermare", async () => {
    const peso = await clientA1.from("measurements").insert({ client_id: s.clientA1.clientId, taken_on: "2026-10-20", weight_kg: 69.5 });
    expect(peso.error).toBeNull();
    const vita = await clientA1.from("measurements").insert({ client_id: s.clientA1.clientId, taken_on: "2026-10-20", waist_cm: 80 });
    expect(vita.error?.code).toBe("42501");
    const vitaDaConfermare = await clientA1
      .from("measurements")
      .insert({ client_id: s.clientA1.clientId, taken_on: "2026-10-20", waist_cm: 80, confirmed: false });
    expect(vitaDaConfermare.error).toBeNull();
  });

  it("non scrive sedute né misure per un altro cliente", async () => {
    const seduta = await clientA1
      .from("sessions")
      .insert({ trainer_id: s.trainerA.trainerId, client_id: s.clientA1.clientId, starts_at: "2026-11-03T09:00:00Z", duration_min: 60 });
    expect(seduta.error?.code).toBe("42501");
    const misura = await clientA1.from("measurements").insert({ client_id: s.clientB1.clientId, taken_on: "2026-10-20", weight_kg: 60 });
    expect(misura.error?.code).toBe("42501");
  });

  it("completa la registrazione solo con il consenso", async () => {
    const senza = await clientA1.rpc("complete_registration", { p_consent: false });
    expect(senza.error).not.toBeNull();
    const con = await clientA1.rpc("complete_registration", { p_consent: true, p_gender: "donna", p_goal_start: 70, p_goal_target: 64 });
    expect(con.error).toBeNull();
    const io = (await clientA1.rpc("my_client")).data![0];
    expect(io.consent_at).not.toBeNull();
    expect(io.goal_proposed_target).toBe(64);
  });
});

describe("anonimo", () => {
  it("non legge nulla, ma vede il marchio del trainer", async () => {
    const anon = anonClient();
    // niente righe: elenco vuoto o rifiuto netto (senza permessi sulle tabelle, come nei progetti Supabase nuovi)
    expect((await anon.from("clients").select("id")).data ?? []).toEqual([]);
    expect((await anon.from("trainers").select("id")).data ?? []).toEqual([]);
    const marchio = await anon.rpc("trainer_branding", { p_slug: s.trainerB.slug });
    expect(marchio.data?.[0].name).toBe("trainer-b");
    expect((await anon.rpc("my_trainer_id")).error).not.toBeNull();
  });
});

describe("admin", () => {
  it("non legge i dati dei clienti", async () => {
    expect((await admin.from("measurements").select("id")).data).toEqual([]);
    expect((await admin.from("clients").select("id")).data).toEqual([]);
  });

  it("sospende un trainer: lui e i suoi clienti, con la sessione già aperta, non leggono più nulla", async () => {
    const r = await admin.from("trainers").update({ status: "suspended" }).eq("id", s.trainerA.trainerId).select("status");
    expect(r.data).toEqual([{ status: "suspended" }]);

    for (const db of [trainerA, clientA1]) {
      for (const t of ["clients", "sessions", "measurements"] as const) {
        const { data } = await db.from(t).select("id");
        expect(data, t).toEqual([]);
      }
    }
    // i dati restano
    const { count } = await adminClient().from("measurements").select("id", { count: "exact", head: true }).eq("client_id", s.clientA1.clientId);
    expect(count).toBeGreaterThan(0);
    // e l'accesso lo manda a /sospeso
    const acc = await clientA1.rpc("my_access");
    expect(acc.data).toEqual([{ role: "client", trainer_active: false, client_trainer_slug: null }]);
    const accT = await trainerA.rpc("my_access");
    expect(accT.data).toEqual([{ role: "trainer", trainer_active: false, client_trainer_slug: null }]);
  });
});
