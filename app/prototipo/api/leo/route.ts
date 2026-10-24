// Leo con l'AI: riceve la conversazione e il calendario, li manda al fornitore (API compatibile OpenAI, oggi DeepSeek)
// insieme ai dati della dashboard e al menu delle azioni (tools), e restituisce NDJSON: il testo man mano che arriva
// ({"tipo":"testo"}) e, alla fine, le azioni ricomposte e controllate ({"tipo":"azione"}). Le esegue il browser.
// Sta sotto /prototipo perché il middleware lo esclude: gira senza chiavi Supabase.
// Verificato il 24/10: DeepSeek accetta tools con thinking attivo in streaming (azioni in delta.tool_calls).
// Solo dati finti: DeepSeek ha i server in Cina, con clienti veri serve il fornitore UE (cambiano solo le variabili AI_*).

import { z } from "zod";
import { LEO_TOOLS, type Seduta } from "@/libs/prototipo/leo-azioni";
import { contestoLeo, pseudonimizza, SedutaContesto } from "@/libs/prototipo/leo-contesto";
import { raccoglitoreAzioni, type EventoLeo } from "@/libs/prototipo/leo-flusso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CARATTERI = 2000;
const MAX_MESSAGGI = 10;
const LIMITE_MINUTO = 20;
const ATTESA_RISPOSTA = 30_000; // ms per iniziare a rispondere
const DURATA_MASSIMA = 60_000; // ms per finire

const Richiesta = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1)
    .max(50),
  calendario: z.array(SedutaContesto).max(80).optional(),
});

// Rete di sicurezza contro l'uso eccessivo: al massimo 20 domande al minuto per indirizzo (in memoria).
const richieste = new Map<string, number[]>();
function troppeRichieste(ip: string): boolean {
  const ora = Date.now();
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

  // Ultimi 10 messaggi, tagliati a 2.000 caratteri, senza nomi dei clienti (anche quelli scritti dal trainer).
  const messaggi = corpo.data.messages.slice(-MAX_MESSAGGI).map((m) => ({ role: m.role, content: pseudonimizza(m.content.slice(0, MAX_CARATTERI)) }));

  const stop = new AbortController();
  const attesa = setTimeout(() => stop.abort(), ATTESA_RISPOSTA);
  const richiesta = {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${chiave}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "deepseek-flash",
      messages: [{ role: "system", content: contestoLeo(corpo.data.calendario as Seduta[] | undefined) }, ...messaggi],
      stream: true,
      tools: LEO_TOOLS,
      tool_choice: "auto",
      thinking: { type: "enabled" },
      reasoning_effort: process.env.AI_REASONING_EFFORT ?? "low",
      max_tokens: 2000,
    }),
    signal: stop.signal,
  };

  // Ogni tanto il primo collegamento non parte ("fetch failed" dopo ~10 s): la domanda non è arrivata
  // al fornitore, quindi si riprova una volta senza pagare due volte. Se scade l'attesa, si smette.
  let risposta: Response | undefined;
  for (let tentativo = 1; !risposta; tentativo++) {
    try {
      risposta = await fetch(`${process.env.AI_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`, richiesta);
    } catch (e) {
      const causa = e instanceof Error && e.cause instanceof Error ? ` (${(e.cause as Error & { code?: string }).code ?? ""} ${e.cause.message})` : "";
      const motivo = e instanceof Error ? e.message + causa : String(e);
      if (tentativo < 2 && !stop.signal.aborted) {
        console.warn("Leo: collegamento al fornitore AI non riuscito, riprovo", motivo);
        continue;
      }
      clearTimeout(attesa);
      console.error("Leo: il fornitore AI non risponde", motivo);
      return Response.json({ errore: "il fornitore AI non risponde" }, { status: 504 });
    }
  }
  clearTimeout(attesa);

  if (!risposta.ok || !risposta.body) {
    console.error("Leo: errore dal fornitore AI", risposta.status, (await risposta.text().catch(() => "")).slice(0, 300));
    return Response.json({ errore: `il fornitore AI ha risposto ${risposta.status}` }, { status: 502 });
  }

  // Dal flusso SSE del fornitore tiene il testo della risposta (delta.content) e i pezzi delle azioni
  // (delta.tool_calls): il ragionamento (delta.reasoning_content) resta sul server. Al browser arriva una riga
  // JSON per evento: il testo pezzo per pezzo, le azioni tutte insieme alla fine.
  const fine = setTimeout(() => stop.abort(), DURATA_MASSIMA);
  const lettore = risposta.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const azioni = raccoglitoreAzioni();
  const riga = (e: EventoLeo) => encoder.encode(JSON.stringify(e) + "\n");
  let resto = "";

  const flusso = new ReadableStream<Uint8Array>({
    // Legge finché non ha qualcosa da mandare: durante il ragionamento e le azioni arrivano pezzi senza testo
    // e, se pull finisse a mani vuote, il flusso resterebbe fermo.
    async pull(controller) {
      try {
        for (;;) {
          const { done, value } = await lettore.read();
          if (done) {
            clearTimeout(fine);
            for (const a of azioni.azioni()) controller.enqueue(riga({ tipo: "azione", ...a }));
            controller.close();
            return;
          }
          resto += decoder.decode(value, { stream: true });
          const righe = resto.split("\n");
          resto = righe.pop() ?? "";
          let inviato = false;
          for (const r of righe) {
            const dati = r.trim();
            if (!dati.startsWith("data:")) continue;
            const json = dati.slice(5).trim();
            if (json === "[DONE]") continue;
            try {
              const delta = JSON.parse(json)?.choices?.[0]?.delta;
              if (delta?.tool_calls) azioni.aggiungi(delta.tool_calls);
              if (delta?.content) {
                controller.enqueue(riga({ tipo: "testo", v: delta.content }));
                inviato = true;
              }
            } catch {
              // riga incompleta o di servizio: si ignora
            }
          }
          if (inviato) return;
        }
      } catch (e) {
        clearTimeout(fine);
        console.error("Leo: risposta interrotta", e instanceof Error ? e.message : e);
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
