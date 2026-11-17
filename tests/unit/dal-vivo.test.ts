import { describe, expect, it } from "vitest";
import type { Tables } from "@/types/db";
import { avvisoArrivato, sedutaArrivata } from "@/libs/vera/dal-vivo";
import { sedutaDa } from "@/libs/vera/mappa";
import { aggiungiDolore, urgent, alerts, versioneDegliAvvisi } from "@/libs/prototipo/dati-finti";

const riga = (o: Partial<Tables<"sessions">> = {}): Tables<"sessions"> => ({
  id: "s1", trainer_id: "t1", client_id: "c1", starts_at: "2026-11-18T17:00:00Z", duration_min: 60, kind: "Workout", place: "Palestra", online: false,
  status: "scheduled", package_id: null, created_at: "2026-11-17T10:00:00Z", ...o,
});

describe("sedute dal vivo nell'app del cliente", () => {
  it("una seduta nuova o spostata entra; una uguale non cambia niente", () => {
    expect(sedutaArrivata([], riga(), "c1")).toEqual({ tipo: "metti", seduta: sedutaDa(riga()) });
    expect(sedutaArrivata([sedutaDa(riga())], riga(), "c1")).toBeNull();
    const spostata = riga({ starts_at: "2026-11-19T08:00:00Z" });
    expect(sedutaArrivata([sedutaDa(riga())], spostata, "c1")).toEqual({ tipo: "metti", seduta: sedutaDa(spostata) });
  });

  it("annullata: esce dal calendario; di un altro cliente: niente", () => {
    expect(sedutaArrivata([sedutaDa(riga())], riga({ status: "cancelled" }), "c1")).toEqual({ tipo: "togli", id: "s1" });
    expect(sedutaArrivata([], riga({ status: "cancelled" }), "c1")).toBeNull();
    expect(sedutaArrivata([], riga({ client_id: "c2" }), "c1")).toBeNull();
  });
});

describe("avvisi dal vivo per il trainer", () => {
  const clienti = [{ id: "c1", name: "Sara Neri" }];

  it("dolore: avviso a schermo e voce negli Urgenti", () => {
    expect(avvisoArrivato({ kind: "pain", text: "male al ginocchio", client_id: "c1" }, clienti)).toEqual({
      avviso: "Sara ha segnalato un dolore",
      dolore: { clientId: "c1", title: "Dolore segnalato", detail: "Sara Neri · male al ginocchio", text: "male al ginocchio" },
    });
  });

  it("richiesta di spostamento: solo l'avviso; pacchetti e clienti non in elenco: niente", () => {
    expect(avvisoArrivato({ kind: "change_request", text: "venerdì?", client_id: "c1" }, clienti)).toEqual({ avviso: "Sara chiede di spostare una seduta" });
    expect(avvisoArrivato({ kind: "package_expiring", text: "x", client_id: "c1" }, clienti)).toBeNull();
    expect(avvisoArrivato({ kind: "pain", text: "x", client_id: "c9" }, clienti)).toBeNull();
  });

  it("il dolore arrivato entra negli Urgenti e tra gli avvisi, e le pagine si ridisegnano", () => {
    const prima = versioneDegliAvvisi();
    aggiungiDolore({ clientId: "c1", title: "Dolore segnalato", detail: "Sara Neri · schiena", text: "schiena" });
    expect(versioneDegliAvvisi()).toBe(prima + 1);
    expect(urgent.at(-1)).toEqual({ kind: "dolore", clientId: "c1", title: "Dolore segnalato", detail: "Sara Neri · schiena" });
    expect(alerts[0]).toEqual({ clientId: "c1", text: "schiena", urgent: true });
  });
});
