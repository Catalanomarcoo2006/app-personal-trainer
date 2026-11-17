import { describe, expect, it } from "vitest";
import type { Tables } from "@/types/db";
import { avvisiDaMandare, eLunedi, pacchettiDaAvvisare, rigaAvviso, riepilogoSettimana } from "@/libs/avvisi/calcola";
import { avvisiTrainer } from "@/libs/email/modelli";

const ORA = new Date("2026-11-17T06:00:00Z"); // martedì 17 novembre, 7:00 in Italia
const T = "t1";
const clients = [
  { id: "c1", name: "Sara Neri" },
  { id: "c2", name: "Luca Ferri" },
];
const pacchetto = (o: Partial<Tables<"packages">>): Tables<"packages"> => ({
  id: "p1", client_id: "c1", kind: "lessons", label: "", lessons_total: 10, starts_on: "2026-10-01", ends_on: null, price_cents: 50000, created_at: "2026-10-01T10:00:00Z", ...o,
});
const seduta = (id: string, giorno: string, status: Tables<"sessions">["status"] = "done"): Tables<"sessions"> => ({
  id, trainer_id: T, client_id: "c1", starts_at: `${giorno}T09:00:00Z`, duration_min: 60, kind: "Workout", place: "", online: false, status, package_id: null, created_at: `${giorno}T08:00:00Z`,
});
const otto = Array.from({ length: 8 }, (_, i) => seduta(`s${i}`, `2026-10-${String(i + 2).padStart(2, "0")}`));

describe("pacchetti che finiscono", () => {
  it("a lezioni: con 2 rimaste parte l'avviso, una volta sola", () => {
    const r = { clients, packages: [pacchetto({})], sessions: otto, giaAvvisati: new Set<string>() };
    expect(pacchettiDaAvvisare(r, ORA)).toEqual([{ packageId: "p1", clientId: "c1", testo: "A Sara restano 2 lezioni del pacchetto" }]);
    expect(pacchettiDaAvvisare({ ...r, giaAvvisati: new Set(["p1"]) }, ORA)).toEqual([]);
    expect(pacchettiDaAvvisare({ ...r, sessions: otto.slice(0, 7) }, ORA)).toEqual([]);
    expect(pacchettiDaAvvisare({ ...r, sessions: [...otto, seduta("s8", "2026-10-20"), seduta("s9", "2026-10-21")] }, ORA)[0].testo).toBe("Sara ha finito le lezioni del pacchetto");
  });

  it("a tempo: a 7 giorni dalla scadenza; conta solo l'ultimo pacchetto del cliente", () => {
    const tempo = pacchetto({ id: "p2", client_id: "c2", kind: "time", lessons_total: null, starts_on: "2026-10-24", ends_on: "2026-11-24" });
    const vecchio = pacchetto({ id: "p0", client_id: "c2", kind: "time", lessons_total: null, starts_on: "2026-09-01", ends_on: "2026-10-01" });
    const r = { clients, packages: [vecchio, tempo], sessions: [], giaAvvisati: new Set<string>() };
    expect(pacchettiDaAvvisare(r, ORA)).toEqual([{ packageId: "p2", clientId: "c2", testo: "Il pacchetto di Luca scade il 24 novembre 2026" }]);
    expect(pacchettiDaAvvisare({ ...r, packages: [vecchio, { ...tempo, ends_on: "2026-12-24" }] }, ORA)).toEqual([]);
    expect(pacchettiDaAvvisare({ ...r, packages: [{ ...tempo, ends_on: "2026-11-17" }] }, ORA)[0].testo).toBe("Il pacchetto di Luca scade oggi");
  });

  it("un pacchetto che inizia nel futuro non conta ancora", () => {
    const futuro = pacchetto({ id: "p3", starts_on: "2026-12-01", lessons_total: 1 });
    expect(pacchettiDaAvvisare({ clients, packages: [futuro], sessions: [], giaAvvisati: new Set() }, ORA)).toEqual([]);
  });
});

const avviso = (o: Partial<Tables<"alerts">>): Tables<"alerts"> => ({
  id: "a1", trainer_id: T, client_id: "c1", kind: "pain", text: "male al ginocchio", read: false, created_at: "2026-11-17T05:00:00Z", emailed_at: null, package_id: null, ...o,
});

describe("quali avvisi partono per email", () => {
  it("secondo le notifiche del trainer; spenti o vecchi si chiudono senza email", () => {
    const avvisi = [
      avviso({ id: "a1", kind: "pain" }),
      avviso({ id: "a2", kind: "package_expiring", text: "A Sara restano 2 lezioni del pacchetto" }),
      avviso({ id: "a3", kind: "change_request", created_at: "2026-11-01T10:00:00Z" }),
      avviso({ id: "a4", kind: "pain", emailed_at: "2026-11-16T10:00:00Z" }),
    ];
    const r = avvisiDaMandare(avvisi, { dolore: true, pacchetti: false, spostamento: true }, ORA);
    expect(r.email.map((a) => a.id)).toEqual(["a1"]);
    expect(r.chiudi.map((a) => a.id)).toEqual(["a2", "a3"]);
  });

  it("righe dell'email e oggetto", () => {
    const nomi = new Map([["c1", "Sara"]]);
    const righe = [rigaAvviso(avviso({}), nomi), rigaAvviso(avviso({ kind: "package_expiring", text: "A Sara restano 2 lezioni del pacchetto" }), nomi)];
    expect(righe[0]).toBe('Sara ha segnalato un dolore: "male al ginocchio"');
    expect(avvisiTrainer({ nome: "Marco", prodotto: "Spotter", righe, link: "https://app.it/dashboard" }).oggetto).toBe("2 novità dai tuoi clienti");
    expect(avvisiTrainer({ nome: "Marco", prodotto: "Spotter", righe: righe.slice(0, 1), link: "l" }).oggetto).toBe("Sara ha segnalato un dolore");
  });
});

describe("riepilogo del lunedì", () => {
  it("settimana scorsa e quella che inizia", () => {
    const lunedi = new Date("2026-11-16T06:00:00Z");
    expect(eLunedi(lunedi)).toBe(true);
    expect(eLunedi(ORA)).toBe(false);
    const pagamento = (paid_on: string | null, amount_cents: number): Tables<"payments"> => ({
      id: `${paid_on}${amount_cents}`, trainer_id: T, client_id: "c1", package_id: null, amount_cents, due_on: "2026-11-10", paid_on, description: "", created_at: "2026-11-10T10:00:00Z",
    });
    const righe = riepilogoSettimana(
      {
        payments: [pagamento("2026-11-10", 5000), pagamento("2026-11-15", 4050), pagamento("2026-11-03", 9900), pagamento(null, 12000)],
        sessions: [seduta("x1", "2026-11-11"), seduta("x2", "2026-11-12", "cancelled"), seduta("x3", "2026-11-18", "scheduled"), seduta("x4", "2026-11-22", "scheduled")],
      },
      lunedi,
    );
    expect(righe).toEqual(["La settimana scorsa: 1 seduta e 90,50 € incassati.", "Questa settimana: 2 sedute in calendario.", "Da incassare in tutto: 120 €."]);
  });
});
