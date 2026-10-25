import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/prototipo/api/leo/route";

// Finto flusso SSE del fornitore: prima il ragionamento, poi la risposta spezzata in più pezzi.
function sse(parti: object[]): Response {
  const enc = new TextEncoder();
  const righe = [...parti.map((p) => `data: ${JSON.stringify(p)}\n\n`), "data: [DONE]\n\n"];
  return new Response(
    new ReadableStream({
      start(c) {
        // una riga spezzata a metà tra due pezzi, come può succedere in rete
        const tutto = righe.join("");
        c.enqueue(enc.encode(tutto.slice(0, 37)));
        c.enqueue(enc.encode(tutto.slice(37)));
        c.close();
      },
    }),
    { status: 200 },
  );
}

// La risposta è NDJSON: una riga per evento.
async function eventi(res: Response): Promise<{ tipo: string; v?: string; nome?: string; dati?: unknown }[]> {
  return (await res.text())
    .split("\n")
    .filter(Boolean)
    .map((r) => JSON.parse(r));
}
const testoDi = async (res: Response) => (await eventi(res)).filter((e) => e.tipo === "testo").map((e) => e.v).join("");

const domanda = (content: string) =>
  new Request("http://localhost/prototipo/api/leo", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content }] }), headers: { "x-forwarded-for": `ip-${Math.random()}` } });

describe("POST /prototipo/api/leo", () => {
  const fetchFinto = vi.fn();

  beforeEach(() => {
    vi.stubEnv("AI_API_KEY", "chiave-di-prova");
    vi.stubGlobal("fetch", fetchFinto);
    fetchFinto.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("manda solo il testo della risposta, non il ragionamento", async () => {
    fetchFinto.mockResolvedValue(
      sse([
        { choices: [{ delta: { reasoning_content: "Controllo i pagamenti aperti…" } }] },
        { choices: [{ delta: { content: "Ci sono 2 pagamenti " } }] },
        { choices: [{ delta: { content: "aperti. [[vai:incassi]]" } }] },
      ]),
    );
    const res = await POST(domanda("Chi deve pagare?"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/x-ndjson");
    expect(await testoDi(res)).toBe("Ci sono 2 pagamenti aperti. [[vai:incassi]]");
  });

  it("chiede il modello con il ragionamento basso, con i nomi ma senza email e telefoni", async () => {
    fetchFinto.mockResolvedValue(sse([{ choices: [{ delta: { content: "ok" } }] }]));
    await (await POST(domanda("Come sta andando Luca Ferri? Scrivigli a luca@esempio.it o al 333 123 4567"))).text();
    const [url, init] = fetchFinto.mock.calls[0];
    const corpo = JSON.parse(init.body);
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer chiave-di-prova");
    expect(corpo).toMatchObject({ model: "deepseek-flash", stream: true, thinking: { type: "enabled" }, reasoning_effort: "low" });
    expect(corpo.messages[0].role).toBe("system");
    const inviato = JSON.stringify(corpo.messages);
    expect(inviato).not.toMatch(/luca@esempio|333 123/);
    expect(corpo.messages[1].content).toBe("Come sta andando Luca Ferri? Scrivigli a [email] o al [telefono]");
  });

  it("senza chiave risponde 503 senza chiamare il fornitore", async () => {
    vi.stubEnv("AI_API_KEY", "");
    const res = await POST(domanda("ciao"));
    expect(res.status).toBe(503);
    expect(fetchFinto).not.toHaveBeenCalled();
  });

  it("se il fornitore risponde con un errore restituisce 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchFinto.mockResolvedValue(new Response("chiave non valida", { status: 401 }));
    const res = await POST(domanda("ciao"));
    expect(res.status).toBe(502);
  });

  it("se la connessione non parte riprova una volta", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchFinto.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(sse([{ choices: [{ delta: { content: "eccomi" } }] }]));
    const res = await POST(domanda("ciao"));
    expect(res.status).toBe(200);
    expect(await testoDi(res)).toBe("eccomi");
    expect(fetchFinto).toHaveBeenCalledTimes(2);
  });

  it("se la connessione fallisce due volte risponde 504", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchFinto.mockRejectedValue(new TypeError("fetch failed"));
    const res = await POST(domanda("ciao"));
    expect(res.status).toBe(504);
    expect(fetchFinto).toHaveBeenCalledTimes(2);
  });

  it("rifiuta una richiesta senza messaggi", async () => {
    const res = await POST(new Request("http://localhost/prototipo/api/leo", { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
  });

  it("manda al fornitore il menu delle azioni", async () => {
    fetchFinto.mockResolvedValue(sse([{ choices: [{ delta: { content: "ok" } }] }]));
    await (await POST(domanda("ciao"))).text();
    const corpo = JSON.parse(fetchFinto.mock.calls[0][1].body);
    expect(corpo.tool_choice).toBe("auto");
    expect(corpo.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual([
      "fissa_appuntamento",
      "sposta_appuntamento",
      "cancella_appuntamento",
      "scrivi_messaggio",
      "scrivi_a_piu",
      "segna_pagato",
      "registra_pagamento",
      "rinnova_pacchetto",
      "sollecita",
      "aggiorna_misure",
      "aggiorna_obiettivo",
      "aggiungi_nota",
      "nuovo_cliente",
    ]);
  });

  it("restituisce le azioni dopo il testo, ricomposte dai pezzi", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchFinto.mockResolvedValue(
      sse([
        { choices: [{ delta: { content: "Sposto [C4] a venerdì." } }] },
        { choices: [{ delta: { tool_calls: [{ index: 0, id: "c0", type: "function", function: { name: "sposta_appuntamento", arguments: '{"id":"A3",' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"data":"2026-10-23","ora":"10:00"}' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 1, id: "c1", type: "function", function: { name: "vola", arguments: "{}" } }] } }] },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
      ]),
    );
    const ev = await eventi(await POST(domanda("Sposta Sara a venerdì alle 10")));
    expect(ev[0]).toEqual({ tipo: "testo", v: "Sposto [C4] a venerdì." });
    expect(ev.at(-2)).toEqual({ tipo: "azione", nome: "sposta_appuntamento", dati: { id: "A3", data: "2026-10-23", ora: "10:00" } });
    expect(ev.filter((e) => e.tipo === "azione")).toHaveLength(1);
    // l'azione sconosciuta non sparisce in silenzio: la chat dirà "non ho capito questa parte"
    expect(ev.at(-1)).toEqual({ tipo: "azione-scartata", nome: "vola" });
  });

  it("restituisce le azioni anche quando l'AI non scrive testo", async () => {
    fetchFinto.mockResolvedValue(
      sse([{ choices: [{ delta: { tool_calls: [{ index: 0, id: "c0", type: "function", function: { name: "cancella_appuntamento", arguments: '{"id":"A5"}' } }] } }] }]),
    );
    expect(await eventi(await POST(domanda("cancella A5")))).toEqual([{ tipo: "azione", nome: "cancella_appuntamento", dati: { id: "A5" } }]);
  });

  it("mette nel contesto il calendario mandato dal browser, con i nomi", async () => {
    fetchFinto.mockResolvedValue(sse([{ choices: [{ delta: { content: "ok" } }] }]));
    const calendario = [{ id: "A3", date: "2026-10-22", time: "10:00", minutes: 60, clientId: "sara-conti", type: "Workout", place: "Fit Lab, Meolo" }];
    const req = new Request("http://localhost/prototipo/api/leo", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "ciao" }], calendario }),
      headers: { "x-forwarded-for": `ip-${Math.random()}` },
    });
    await (await POST(req)).text();
    const sistema = JSON.parse(fetchFinto.mock.calls[0][1].body).messages[0].content as string;
    expect(sistema).toMatch(/A3 · giovedì 22\/10 · 10:00/);
    expect(sistema).toContain("A3 · giovedì 22/10 · 10:00 · 60 min · workout · Fit Lab, Meolo · Sara Conti");
  });

  it("rifiuta un calendario troppo lungo", async () => {
    const s = { id: "A1", date: "2026-10-22", time: "10:00", minutes: 60, clientId: "sara-conti", type: "Workout", place: "Fit Lab" };
    const req = new Request("http://localhost/prototipo/api/leo", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "ciao" }], calendario: Array(81).fill(s) }),
      headers: { "x-forwarded-for": `ip-${Math.random()}` },
    });
    expect((await POST(req)).status).toBe(400);
  });

  it("segnala le azioni che non ha potuto leggere", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchFinto.mockResolvedValue(
      sse([{ choices: [{ delta: { content: "Fatto", tool_calls: [{ index: 0, id: "c0", type: "function", function: { name: "sposta_appuntamento", arguments: '{"id":' } }] } }] }]),
    );
    expect(await eventi(await POST(domanda("sposta")))).toEqual([
      { tipo: "testo", v: "Fatto" },
      { tipo: "azione-scartata", nome: "sposta_appuntamento" },
    ]);
  });

  it("mette nel contesto i clienti mandati dal browser", async () => {
    fetchFinto.mockResolvedValue(sse([{ choices: [{ delta: { content: "ok" } }] }]));
    const { perContesto } = await import("@/libs/prototipo/leo-contesto");
    const { datiIniziali } = await import("@/libs/dati/iniziali");
    const d = datiIniziali();
    const clienti = perContesto({ ...d, clienti: d.clienti.map((c) => (c.id === "luca-ferri" ? { ...c, notes: "Nota nuova di prova" } : c)) });
    const req = new Request("http://localhost/prototipo/api/leo", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "ciao" }], clienti }),
      headers: { "x-forwarded-for": `ip-${Math.random()}` },
    });
    await (await POST(req)).text();
    const sistema = JSON.parse(fetchFinto.mock.calls[0][1].body).messages[0].content as string;
    expect(sistema).toContain("Nota nuova di prova");
  });

  it("rifiuta troppi clienti", async () => {
    const { perContesto } = await import("@/libs/prototipo/leo-contesto");
    const { datiIniziali } = await import("@/libs/dati/iniziali");
    const uno = perContesto(datiIniziali())[0];
    const req = new Request("http://localhost/prototipo/api/leo", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "ciao" }], clienti: Array(61).fill(uno) }),
      headers: { "x-forwarded-for": `ip-${Math.random()}` },
    });
    expect((await POST(req)).status).toBe(400);
  });
});
