import { describe, expect, it } from "vitest";
import { fotografiaTrainer, incassiDa, istanteDa, sedutaDa, type RigheTrainer } from "@/libs/vera/mappa";
import { differenze } from "@/libs/vera/salva";
import type { StatoApp } from "@/libs/prototipo/stato";

const ORA = new Date("2026-11-04T09:00:00Z"); // mercoledì 4 novembre, 10:00 in Italia
const T = "00000000-0000-0000-0000-00000000000t";
const C = "00000000-0000-0000-0000-0000000000c1";

const cliente: RigheTrainer["clients"][number] = {
  id: C, name: "Sara Neri", email: "sara@prova.test", phone: null, gender: "donna", tone: "sky",
  goal_label: "Dimagrimento −5 kg", goal_unit: "kg", goal_start: 70, goal_current: 68, goal_target: 65,
  goal_proposed_start: null, goal_proposed_target: null, weigh_frequency: "settimana", notes: "ginocchio", created_at: "2026-10-01T10:00:00Z",
};
const seduta = (id: string, starts_at: string, status: "scheduled" | "done" | "cancelled" = "scheduled") => ({
  id, trainer_id: T, client_id: C, starts_at, duration_min: 60, kind: "Workout", place: "Palestra", online: false, status, package_id: "pk", created_at: starts_at,
});

const righe: RigheTrainer = {
  trainer: { id: T, name: "Giulia Verdi", slug: "giulia-verdi", color: "#3366FF", logo_path: null, notifications: { riepilogo: true } },
  clients: [cliente],
  packages: [{ id: "pk", client_id: C, kind: "lessons", label: "", lessons_total: 10, starts_on: "2026-10-01", ends_on: null, price_cents: 50000, created_at: "2026-10-01T10:00:00Z" }],
  payments: [
    { id: "p1", trainer_id: T, client_id: C, package_id: "pk", amount_cents: 50000, due_on: "2026-10-01", paid_on: "2026-10-02", description: "Pacchetto", created_at: "2026-10-02T10:00:00Z" },
    { id: "p2", trainer_id: T, client_id: C, package_id: null, amount_cents: 4000, due_on: "2026-11-01", paid_on: null, description: "Valutazione", created_at: "2026-11-01T10:00:00Z" },
  ],
  measurements: [{ id: "m1", client_id: C, taken_on: "2026-10-01", weight_kg: 70, waist_cm: null, hips_cm: null, chest_cm: null, arm_cm: null, thigh_cm: null, confirmed: true, created_at: "2026-10-01T10:00:00Z" }],
  sessions: [seduta("s1", "2026-10-28T17:00:00Z"), seduta("s2", "2026-11-04T17:00:00Z"), seduta("s3", "2026-10-30T17:00:00Z", "cancelled")],
  messages: [
    { id: "x1", client_id: C, sender: "client", body: "Ciao!", document_id: null, read_at: null, created_at: "2026-11-04T08:30:00Z" },
    { id: "x0", client_id: C, sender: "trainer", body: "Benvenuta", document_id: null, read_at: null, created_at: "2026-11-02T08:30:00Z" },
  ],
  plans: [], days: [], exercises: [], logs: [], alerts: [], questions: [],
};

describe("dal database alle pagine", () => {
  it("ore italiane, anche con l'ora legale", () => {
    expect(istanteDa("2026-10-21", "18:00")).toBe("2026-10-21T16:00:00.000Z");
    expect(istanteDa("2026-12-01", "18:00")).toBe("2026-12-01T17:00:00.000Z");
    expect(sedutaDa(seduta("s", "2026-12-01T17:00:00Z"))).toMatchObject({ date: "2026-12-01", time: "18:00", minutes: 60, type: "Workout" });
  });

  it("trainer: clienti, pacchetto con le lezioni usate, sedute non annullate, chat", () => {
    const f = fotografiaTrainer(righe, ORA);
    const d = f.stato.dati!;
    expect(d.clienti[0]).toMatchObject({ id: C, name: "Sara Neri", initials: "SN", goalCurrent: 68, pesata: "settimana", lastWorkout: "Mai" });
    // s1 è passata (vale come fatta), s2 è stasera, s3 annullata
    expect(d.pacchetti[0]).toMatchObject({ lessonsTotal: 10, lessonsUsed: 1, label: "Pacchetto 10 lezioni" });
    expect(f.stato.sedute!.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(f.stato.threads![C].map((m) => m.text)).toEqual(["Benvenuta", "Ciao!"]);
    expect(f.stato.threads![C][1].time).toBe("09:30");
    expect(f.veri.conversations[0]).toMatchObject({ clientId: C, unread: 1 });
    expect(f.veri.trainer).toMatchObject({ name: "Giulia Verdi", initials: "GV", color: "#3366FF" });
    expect(d.notifiche.riepilogo).toBe(true);
  });

  it("incassi degli ultimi 6 mesi", () => {
    const r = incassiDa(righe.payments, "2026-11-04");
    expect(r.months.map((m) => m.label)).toEqual(["Giu", "Lug", "Ago", "Set", "Ott", "Nov"]);
    expect(r.months[4].value).toBe(500);
    expect(r).toMatchObject({ month: "Novembre", prevMonth: "ottobre", collected: 0, outstanding: 40, range: "giu – nov 2026" });
  });
});

describe("dalle pagine al database", () => {
  const base = () => {
    const f = fotografiaTrainer(righe, ORA).stato as StatoApp;
    return { dati: f.dati, sedute: f.sedute, threads: f.threads, plans: f.plans };
  };

  it("nessun cambiamento, nessuna scrittura", () => {
    expect(differenze(base(), base(), { tipo: "trainer", trainerId: T })).toEqual([]);
  });

  it("seduta nuova, spostata e tolta (resta annullata); messaggio del trainer; pagamento segnato", () => {
    const prima = base();
    const dopo = structuredClone(prima);
    dopo.sedute = [{ ...dopo.sedute[1], time: "19:00" }, { id: "nuova", clientId: C, date: "2026-11-05", time: "08:00", minutes: 45, type: "Online", place: "Videochiamata" }];
    dopo.threads[C] = [...dopo.threads[C], { from: "trainer", text: "A domani", time: "Adesso" }];
    dopo.dati.pagamenti = dopo.dati.pagamenti.map((p) => (p.id === "p2" ? { ...p, paidOn: "2026-11-04" } : p));
    const ops = differenze(prima, dopo, { tipo: "trainer", trainerId: T });
    expect(ops).toContainEqual({ t: "payments", op: "update", id: "p2", v: expect.objectContaining({ paid_on: "2026-11-04" }) });
    expect(ops).toContainEqual({ t: "sessions", op: "insert", id: "nuova", v: expect.objectContaining({ starts_at: "2026-11-05T07:00:00.000Z", online: true, trainer_id: T }) });
    expect(ops).toContainEqual({ t: "sessions", op: "update", id: "s2", v: expect.objectContaining({ starts_at: "2026-11-04T18:00:00.000Z" }) });
    expect(ops).toContainEqual({ t: "sessions", op: "update", id: "s1", v: { status: "cancelled" } });
    expect(ops).toContainEqual({ t: "messages", op: "insert", v: { client_id: C, sender: "trainer", body: "A domani" } });
  });

  it("il cliente scrive solo le sue misure e i suoi messaggi", () => {
    const prima = base();
    const dopo = structuredClone(prima);
    dopo.dati.misure.push({ id: "m2", clientId: C, takenOn: "2026-11-04", weightKg: 67.5 });
    dopo.threads[C] = [...dopo.threads[C], { from: "client", text: "Fatto!", time: "Adesso" }, { from: "trainer", text: "Brava", time: "Adesso" }];
    dopo.dati.pagamenti = [];
    const ops = differenze(prima, dopo, { tipo: "cliente", clientId: C });
    expect(ops).toEqual([
      { t: "measurements", op: "insert", id: "m2", v: expect.objectContaining({ weight_kg: 67.5, confirmed: true }) },
      { t: "messages", op: "insert", v: { client_id: C, sender: "client", body: "Fatto!" } },
    ]);
  });
});
