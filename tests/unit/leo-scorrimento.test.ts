import { describe, expect, it } from "vitest";
import { bersaglioScorrimento } from "@/libs/prototipo/leo-scorrimento";

const scheda = (key: string, stato: string) => ({ key, stato });

describe("dove scorre la chat quando Leo propone più azioni", () => {
  it("senza messaggi, o con un messaggio senza schede, vale il comportamento di sempre (in fondo)", () => {
    expect(bersaglioScorrimento([])).toBeNull();
    expect(bersaglioScorrimento([{ id: 1 }])).toBeNull();
  });

  it("con una sola scheda vale il comportamento di sempre", () => {
    expect(bersaglioScorrimento([{ id: 3, schede: [scheda("3-0", "da-confermare")] }])).toBeNull();
  });

  it("appena arrivano più azioni si va in cima al messaggio, dove c'è la prima", () => {
    const r = bersaglioScorrimento([{ id: 7, schede: [scheda("7-0", "da-confermare"), scheda("7-1", "da-confermare"), scheda("7-2", "in-corso")] }]);
    expect(r).toEqual({ chiave: "7:7-0", cosa: { tipo: "messaggio", id: 7 } });
  });

  it("man mano che le azioni finiscono, si segue quella in corso", () => {
    const r = bersaglioScorrimento([{ id: 7, schede: [scheda("7-0", "fatto"), scheda("7-1", "in-corso"), scheda("7-2", "da-confermare")] }]);
    expect(r).toEqual({ chiave: "7:7-1", cosa: { tipo: "scheda", key: "7-1" } });
  });

  it("le schede rifiutate, annullate o in errore si saltano", () => {
    const r = bersaglioScorrimento([{ id: 7, schede: [scheda("7-0", "rifiutato"), scheda("7-1", "errore"), scheda("7-2", "da-confermare")] }]);
    expect(r).toEqual({ chiave: "7:7-2", cosa: { tipo: "scheda", key: "7-2" } });
  });

  it("a lavoro finito si resta sull'ultima scheda", () => {
    const r = bersaglioScorrimento([{ id: 7, schede: [scheda("7-0", "fatto"), scheda("7-1", "fatto")] }]);
    expect(r).toEqual({ chiave: "7:7-1", cosa: { tipo: "scheda", key: "7-1" } });
  });

  it("conta solo l'ultimo messaggio", () => {
    const r = bersaglioScorrimento([{ id: 7, schede: [scheda("7-0", "da-confermare"), scheda("7-1", "da-confermare")] }, { id: 8 }]);
    expect(r).toBeNull();
  });
});
