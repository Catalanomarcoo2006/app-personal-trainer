// Leo del cliente con l'AI: riceve la conversazione, aggiunge le istruzioni con i dati di Giulia (libs/prototipo/leo-cliente.ts)
// e restituisce NDJSON come la rotta del trainer ({"tipo":"testo"} man mano che arriva). Niente azioni: il cliente chiede,
// Leo risponde; il dolore lo segnala il testo stesso ([[avvisa-trainer]]), che legge il browser.
// Sta sotto /prototipo perché il middleware lo esclude. Solo dati finti: con clienti veri serve il fornitore UE.

import { z } from "zod";
import { contestoCliente } from "@/libs/prototipo/leo-cliente";
import { ripulisci } from "@/libs/prototipo/leo-contesto";
import type { EventoLeo } from "@/libs/prototipo/leo-flusso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CARATTERI = 1000;
const MAX_MESSAGGI = 10;
const LIMITE_MINUTO = 15;
const ATTESA_RISPOSTA = 30_000; // ms per iniziare a rispondere
const DURATA_MASSIMA = 45_000; // ms per finire

const Richiesta = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1)
    .max(40),
});

// Rete di sicurezza contro l'uso eccessivo: al massimo 15 domande al minuto per indirizzo (in memoria).
// Gli indirizzi vecchi si tolgono, così la memoria non cresce.
const richieste = new Map<string, number[]>();
function troppeRichieste(ip: string): boolean {
  const ora = Date.now();
  for (const [k, t] of richieste) if (!t.some((x) => ora - x < 60_000)) richieste.delete(k);
  const recenti = (richieste.get(ip) ?? []).filter((t) => ora - t < 60_000);
  recenti.push(ora);
  richieste.set(ip, recenti);
  return recenti.length > LIMITE_MINUTO;
}

export async function POST(req: Request) {
  const chiave = process.env.AI_API_KEY;
  if (!chiave) return Response.json({ errore: "AI_API_KEY mancante in .env.local" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "locale";
  if (troppeRichieste(ip)) return Response.json({ errore: "troppe domande, riprova tra un minuto" }, { status: 429 });

  const corpo = Richiesta.safeParse(await req.json().catch((): unknown => null));
  if (!corpo.success) return Response.json({ errore: "richiesta non valida" }, { status: 400 });

  // ultimi 10 messaggi, tagliati a 1.000 caratteri, senza email e telefoni
  const messaggi = corpo.data.messages.slice(-MAX_MESSAGGI).map((m) => ({ role: m.role, content: ripulisci(m.content.slice(0, MAX_CARATTERI)) }));

  const stop = new AbortController();
  const attesa = setTimeout(() => stop.abort(), ATTESA_RISPOSTA);
  let risposta: Response;
  try {
    risposta = await fetch(`${process.env.AI_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${chiave}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "deepseek-flash",
        messages: [{ role: "system", content: contestoCliente() }, ...messaggi],
        stream: true,
        thinking: { type: "enabled" },
        reasoning_effort: process.env.AI_REASONING_EFFORT ?? "low",
        max_tokens: 700,
      }),
      signal: stop.signal,
    });
  } catch (e) {
    clearTimeout(attesa);
    console.error("Leo cliente: il fornitore AI non risponde", e instanceof Error ? e.message : e);
    return Response.json({ errore: "il fornitore AI non risponde" }, { status: 504 });
  }
  clearTimeout(attesa);
  if (!risposta.ok || !risposta.body) {
    console.error("Leo cliente: errore dal fornitore AI", risposta.status, (await risposta.text().catch(() => "")).slice(0, 300));
    return Response.json({ errore: `il fornitore AI ha risposto ${risposta.status}` }, { status: 502 });
  }

  // Dal flusso SSE del fornitore resta solo il testo della risposta (delta.content): il ragionamento resta sul server.
  const fine = setTimeout(() => stop.abort(), DURATA_MASSIMA);
  const lettore = risposta.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const riga = (e: EventoLeo) => encoder.encode(JSON.stringify(e) + "\n");
  let resto = "";
  const testoDi = (r: string): string => {
    const dati = r.trim();
    if (!dati.startsWith("data:")) return "";
    const json = dati.slice(5).trim();
    if (json === "[DONE]") return "";
    try {
      const v = JSON.parse(json)?.choices?.[0]?.delta?.content;
      return typeof v === "string" ? v : "";
    } catch {
      return ""; // riga incompleta o di servizio
    }
  };

  const flusso = new ReadableStream<Uint8Array>({
    // legge finché non ha del testo da mandare: durante il ragionamento arrivano pezzi senza testo
    async pull(controller) {
      try {
        for (;;) {
          const { done, value } = await lettore.read();
          if (done) {
            clearTimeout(fine);
            const ultimo = testoDi(resto + decoder.decode());
            if (ultimo) controller.enqueue(riga({ tipo: "testo", v: ultimo }));
            controller.close();
            return;
          }
          resto += decoder.decode(value, { stream: true });
          const righe = resto.split("\n");
          resto = righe.pop() ?? "";
          const testo = righe.map(testoDi).join("");
          if (testo) {
            controller.enqueue(riga({ tipo: "testo", v: testo }));
            return;
          }
        }
      } catch (e) {
        clearTimeout(fine);
        console.error("Leo cliente: risposta interrotta", e instanceof Error ? e.message : e);
        controller.enqueue(riga({ tipo: "errore", v: "risposta interrotta" }));
        controller.close();
      }
    },
    cancel() {
      clearTimeout(fine);
      stop.abort();
    },
  });

  return new Response(flusso, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
