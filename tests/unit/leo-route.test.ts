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
    expect(await res.text()).toBe("Ci sono 2 pagamenti aperti. [[vai:incassi]]");
  });

  it("chiede il modello con il ragionamento basso e i dati senza nomi dei clienti", async () => {
    fetchFinto.mockResolvedValue(sse([{ choices: [{ delta: { content: "ok" } }] }]));
    await (await POST(domanda("Come sta andando Luca Ferri? E Giulia?"))).text();
    const [url, init] = fetchFinto.mock.calls[0];
    const corpo = JSON.parse(init.body);
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer chiave-di-prova");
    expect(corpo).toMatchObject({ model: "deepseek-flash", stream: true, thinking: { type: "enabled" }, reasoning_effort: "low" });
    expect(corpo.messages[0].role).toBe("system");
    const inviato = JSON.stringify(corpo.messages);
    expect(inviato).not.toMatch(/Luca|Ferri|Giulia/);
    expect(corpo.messages[1].content).toMatch(/^Come sta andando \[C\d+\]\? E \[C\d+\]\?$/);
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
    expect(await res.text()).toBe("eccomi");
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
});
