import { describe, expect, it, vi } from "vitest";
import { lettoreNdjson, raccoglitoreAzioni, type EventoLeo } from "@/libs/prototipo/leo-flusso";

const pezzo = (index: number, fn: { name?: string; arguments?: string }) => [{ index, id: fn.name ? `call_${index}` : undefined, type: "function", function: fn }];

describe("raccoglitoreAzioni", () => {
  it("ricompone argomenti spezzati e azioni con indici diversi, in ordine", () => {
    const r = raccoglitoreAzioni();
    r.aggiungi(pezzo(0, { name: "sposta_appuntamento", arguments: '{"id":"A3","da' }));
    r.aggiungi(pezzo(1, { name: "cancella_appuntamento", arguments: "" }));
    r.aggiungi(pezzo(0, { arguments: 'ta":"2026-10-23","ora":"10:00"}' }));
    r.aggiungi(pezzo(1, { arguments: '{"id":"A5"}' }));
    expect(r.azioni()).toEqual([
      { nome: "sposta_appuntamento", dati: { id: "A3", data: "2026-10-23", ora: "10:00" } },
      { nome: "cancella_appuntamento", dati: { id: "A5" } },
    ]);
  });

  it("scarta argomenti non JSON e azioni sconosciute, tiene le altre", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = raccoglitoreAzioni();
    r.aggiungi(pezzo(0, { name: "cancella_appuntamento", arguments: '{"id":' }));
    r.aggiungi(pezzo(1, { name: "vola", arguments: "{}" }));
    r.aggiungi(pezzo(2, { name: "cancella_appuntamento", arguments: '{"id":"A9"}' }));
    expect(r.azioni()).toEqual([{ nome: "cancella_appuntamento", dati: { id: "A9" } }]);
  });

  it("tiene al massimo 5 azioni", () => {
    const r = raccoglitoreAzioni();
    for (let i = 0; i < 7; i++) r.aggiungi(pezzo(i, { name: "cancella_appuntamento", arguments: `{"id":"A${i}"}` }));
    expect(r.azioni()).toHaveLength(5);
  });

  it("ignora quello che non è un elenco di tool_calls", () => {
    const r = raccoglitoreAzioni();
    r.aggiungi(undefined);
    r.aggiungi("ciao");
    r.aggiungi([{ index: "x" }]);
    expect(r.azioni()).toEqual([]);
  });
});

describe("lettoreNdjson", () => {
  it("legge righe spezzate tra due pezzi e ignora quelle rotte", () => {
    const eventi: EventoLeo[] = [];
    const l = lettoreNdjson((e) => eventi.push(e));
    l.scrivi('{"tipo":"testo","v":"Ci');
    l.scrivi('ao"}\nnon json\n{"tipo":"azione","nome":"cancella_appuntamento","dati":{"id":"A5"}}\n{"tipo":"testo","v":"!"}');
    l.chiudi();
    expect(eventi).toEqual([
      { tipo: "testo", v: "Ciao" },
      { tipo: "azione", nome: "cancella_appuntamento", dati: { id: "A5" } },
      { tipo: "testo", v: "!" },
    ]);
  });

  it("scarta eventi azione malformati", () => {
    const eventi: EventoLeo[] = [];
    const l = lettoreNdjson((e) => eventi.push(e));
    l.scrivi('{"tipo":"azione","nome":"cancella_appuntamento","dati":{}}\n{"tipo":"boh"}\n');
    l.chiudi();
    expect(eventi).toEqual([]);
  });
});
