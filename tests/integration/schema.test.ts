import { afterAll, describe, expect, it } from "vitest";
import { adminClient } from "../helpers/supabase";
import { creaUtente, resetTestData } from "../helpers/seed";

const TABELLE = [
  "profiles", "trainers", "clients", "exercises", "workout_plans", "plan_days", "plan_exercises", "workout_logs",
  "sessions", "packages", "payments", "measurements", "habits", "documents", "messages", "change_requests", "alerts", "ai_messages",
] as const;

describe("schema del database", () => {
  afterAll(resetTestData);

  it("ogni tabella della spec risponde", async () => {
    const db = adminClient();
    for (const t of TABELLE) {
      const { error } = await db.from(t).select("*").limit(0);
      expect(error, t).toBeNull();
    }
  });

  it("slug duplicato → 23505", async () => {
    const db = adminClient();
    const a = await creaUtente(db, "slug-a", "trainer");
    const b = await creaUtente(db, "slug-b", "trainer");
    const slug = `doppio-${Date.now()}`;
    const primo = await db.from("trainers").insert({ user_id: a.id, name: "A", slug, license_expires_at: "2099-01-01" });
    expect(primo.error).toBeNull();
    const secondo = await db.from("trainers").insert({ user_id: b.id, name: "B", slug, license_expires_at: "2099-01-01" });
    expect(secondo.error?.code).toBe("23505");
  });

  it("una seduta non può puntare al cliente di un altro trainer", async () => {
    const db = adminClient();
    const ua = await creaUtente(db, "fk-a", "trainer");
    const ub = await creaUtente(db, "fk-b", "trainer");
    const ta = (await db.from("trainers").insert({ user_id: ua.id, name: "A", slug: `fk-a-${Date.now()}`, license_expires_at: "2099-01-01" }).select().single()).data!;
    const tb = (await db.from("trainers").insert({ user_id: ub.id, name: "B", slug: `fk-b-${Date.now()}`, license_expires_at: "2099-01-01" }).select().single()).data!;
    const cb = (await db.from("clients").insert({ trainer_id: tb.id, name: "Cliente di B" }).select().single()).data!;
    const r = await db.from("sessions").insert({ trainer_id: ta.id, client_id: cb.id, starts_at: "2026-11-02T09:00:00Z", duration_min: 60 });
    expect(r.error?.code).toBe("23503");
  });

  it("pacchetto a lezioni senza numero di lezioni → rifiutato", async () => {
    const db = adminClient();
    const u = await creaUtente(db, "pkg", "trainer");
    const t = (await db.from("trainers").insert({ user_id: u.id, name: "T", slug: `pkg-${Date.now()}`, license_expires_at: "2099-01-01" }).select().single()).data!;
    const c = (await db.from("clients").insert({ trainer_id: t.id, name: "C" }).select().single()).data!;
    const r = await db.from("packages").insert({ client_id: c.id, kind: "lessons", starts_on: "2026-10-01", price_cents: 100 });
    expect(r.error?.code).toBe("23514");
  });
});
