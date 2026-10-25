// Contesto per l'AI di Leo, l'assistente del trainer.
// Leo vede i nomi dei clienti (decisione di Marco del 24/10): con i dati finti della demo va bene; con clienti veri
// solo con un fornitore AI in UE, il suo DPA e l'informativa aggiornata. Email e telefoni non arrivano mai all'AI.

import { z } from "zod";
import { LONG, seduteIniziali } from "./calendario";
import { clients, conversations, notifications, revenue, TODAY_INDEX, trainer, urgent, week } from "./dati-finti";
import type { Seduta } from "./leo-azioni";
import { datiIniziali } from "@/libs/dati/iniziali";
import { vistaClienti } from "@/libs/dati/vista";
import type { DatiClienti, Notifiche } from "@/libs/dati/tipi";

const semplice = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// Il cliente indicato dall'AI: id ("sara-conti"), nome completo ("Sara Conti") o solo nome se è unico ("Sara").
// elenco: i clienti di adesso (anche quelli creati nell'app); senza, quelli della demo.
export function clienteDa(valore: string, elenco: { id: string; name: string }[] = clients): string | undefined {
  const v = semplice(valore);
  if (!v) return undefined;
  // anche "cognome nome" (come negli elenchi e nei file: "CONTI SARA")
  const alContrario = (nome: string) => semplice(nome).split(" ").reverse().join(" ");
  const esatto = elenco.find((c) => c.id === v || semplice(c.name) === v || alContrario(c.name) === v);
  if (esatto) return esatto.id;
  const perNome = elenco.filter((c) => semplice(c.name.split(" ")[0]) === v);
  return perNome.length === 1 ? perNome[0].id : undefined;
}

// ——— I clienti come li manda il browser: la situazione di adesso, senza email, telefoni e foto ———

const testo = (max: number) => z.string().max(max);
export const ClienteContesto = z.object({
  id: testo(60),
  name: testo(80),
  gender: z.enum(["donna", "uomo"]),
  since: testo(40),
  goal: testo(120),
  unit: testo(12),
  start: z.number(),
  current: z.number(),
  target: z.number(),
  weights: z.array(z.number()).max(12),
  measures: z.array(z.object({ label: testo(20), start: z.number(), current: z.number() })).max(8),
  ultimaMisura: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pkg: z.object({ label: testo(80), left: testo(80), expiring: z.boolean() }),
  payments: z.array(z.object({ id: testo(12), date: testo(12), label: testo(120), amount: z.number(), paid: z.boolean() })).max(40),
  lastWorkout: testo(40),
  needsAttention: z.boolean(),
  plan: testo(120),
  notes: testo(3000),
  questions: z.array(testo(300)).max(20),
});
export type ClienteContesto = z.infer<typeof ClienteContesto>;

export function perContesto(d: DatiClienti): ClienteContesto[] {
  return vistaClienti(d).map((v) => {
    const date = d.misure.filter((m) => m.clientId === v.id).map((m) => m.takenOn);
    return {
      id: v.id,
      name: v.name,
      gender: v.gender,
      since: v.since,
      goal: v.goal,
      unit: v.unit,
      start: v.start,
      current: v.current,
      target: v.target,
      weights: v.weights,
      measures: v.measures,
      ...(date.length ? { ultimaMisura: date.sort().at(-1) } : {}),
      pkg: v.pkg,
      payments: v.payments,
      lastWorkout: v.lastWorkout,
      needsAttention: v.needsAttention,
      plan: v.plan,
      notes: v.notes,
      questions: v.questions,
    };
  });
}

// Altri dati di adesso che il browser manda insieme ai clienti.
export const ExtraContesto = z.object({
  incassi: z.object({ incassatoCents: z.number().int(), daIncassareCents: z.number().int() }).optional(),
  aspetto: z.object({ colore: testo(9), tema: z.enum(["light", "dark"]) }).optional(),
  notifiche: z.object({ dolore: z.boolean(), spostamento: z.boolean(), pacchetti: z.boolean(), riepilogo: z.boolean(), avvisoDolori: z.boolean() }).optional(),
});
export type ExtraContesto = { incassi?: { incassatoCents: number; daIncassareCents: number }; aspetto?: { colore: string; tema: "light" | "dark" }; notifiche?: Notifiche };

// Email e numeri di telefono spariscono dai testi che vanno all'AI: a Leo non servono.
export function ripulisci(testo: string): string {
  return testo.replace(/[^\s@,;:()<>]+@[^\s@,;:()<>]+\.[a-z]{2,}/gi, "[email]").replace(/\+?\d[\d ]{7,}\d/g, "[telefono]");
}

// ——— Il tasto per aprire una sezione: l'AI chiude la risposta con [[vai:incassi]] o [[vai:cliente:luca-ferri]] ———

export type Sezione = "oggi" | "clienti" | "messaggi" | "schede" | "calendario" | "incassi" | "impostazioni" | "cliente";
const SEZIONI: Sezione[] = ["oggi", "clienti", "messaggi", "schede", "calendario", "incassi", "impostazioni", "cliente"];

export function estraiAzione(testo: string): { text: string; vai?: { sezione: Sezione; clienteId?: string } } {
  let vai: { sezione: Sezione; clienteId?: string } | undefined;
  let t = testo.replace(/\[\[\s*vai\s*:\s*([a-z]+)\s*(?::\s*([^\]]+?)\s*)?\]\]/gi, (_, nome: string, chi?: string) => {
    const sezione = nome.toLowerCase() as Sezione;
    if (!SEZIONI.includes(sezione)) return "";
    if (sezione !== "cliente") vai = { sezione };
    else {
      const id = chi ? clienteDa(chi) : undefined;
      if (id) vai = { sezione, clienteId: id };
    }
    return "";
  });
  // mentre la risposta arriva: niente etichette ancora a metà ("[[va")
  t = t.replace(/\[{1,2}[^\]]*$/, "");
  return vai ? { text: t.trim(), vai } : { text: t.trim() };
}

// ——— Il contesto: istruzioni, dati della dashboard e guida all'app ———

const numero = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1, useGrouping: "always" });
const euro = (n: number) => `€ ${numero.format(n)}`;

const ISTRUZIONI = `Sei Leo, l'assistente virtuale di un personal trainer dentro la sua app di gestione. Parli con il trainer.
Rispondi sempre in italiano, con tono amichevole e pratico, in 2-4 frasi brevi (al massimo 80 parole), senza titoli né elenchi lunghi.
Prima ragiona sui dati qui sotto: confronta, fai i conti, metti in ordine di urgenza e suggerisci la prossima azione concreta. Usa solo questi dati: se un'informazione non c'è, dillo e suggerisci dove guardare nell'app. Non inventare numeri, nomi, date o fatti.
Ogni cliente è indicato con nome e cognome, (donna) o (uomo) e il suo id, per esempio "Sara Conti (donna, id sara-conti)". Quando parli di un cliente usa il suo nome (anche solo il nome, se è chiaro); accorda aggettivi e participi al genere indicato ("ferma da 8 giorni" per una donna). Il trainer può scrivere i nomi in modo informale o con errori ("Sarina", "Davidee"): capisci tu chi intende tra i clienti qui sotto e, se ci sono dubbi, chiedi.
Niente diete, grammature o integratori: per l'alimentazione rimanda al nutrizionista del cliente. Per dolori o problemi di salute suggerisci di sentire il cliente e, se serve, un medico.
Puoi anche agire nell'app con le azioni: sedute (fissare, spostare, cancellare), messaggi (a un cliente o lo stesso a più clienti), soldi (segnare pagato, registrare un incasso, rinnovare un pacchetto, sollecitare un pagamento) e dati dei clienti (misure e peso, obiettivo, note, nuovo cliente). Usa le azioni solo quando il trainer chiede di fare qualcosa, mai per rispondere a una semplice domanda. Se il trainer chiede più cose nella stessa frase, usa un'azione per ognuna: non saltarne nessuna. Se il messaggio contiene un file allegato (Allegato \"nome\": …), leggi i valori, associa ogni valore al cliente giusto (dal nome nel file o dal messaggio) e usa aggiorna_misure, aggiorna_obiettivo o aggiungi_nota, un'azione per cliente; non inventare valori che nel file non ci sono e, se qualcosa non è chiaro, dillo nella frase. Nelle azioni indica le sedute con il loro id (per esempio A12) e i clienti con il loro id (per esempio sara-conti), ma nel testo per il trainer non scrivere mai gli id; se non è chiaro quale cliente, giorno, ora o seduta intende, chiedi in una frase invece di agire. Quando usi le azioni scrivi SEMPRE anche il testo della risposta, una frase breve che dica cosa stai facendo ("Sposto Giulia a venerdì alle 10 e le preparo un messaggio"); cancellazioni e messaggi li conferma il trainer. Nei messaggi ai clienti scrivi come il trainer, in prima persona, con tono cordiale e senza firma.
Se è utile aprire una sezione dell'app (e non stai già usando un'azione), chiudi la risposta con UNA sola etichetta fra queste: [[vai:oggi]], [[vai:clienti]], [[vai:messaggi]], [[vai:schede]], [[vai:calendario]], [[vai:incassi]], [[vai:impostazioni]], oppure [[vai:cliente:sara-conti]] per il profilo di un cliente (con il suo id). Se non serve, non aggiungere etichette.`;

const GUIDA = `- Schede: si costruiscono dalla libreria esercizi. Sotto ogni esercizio c'è "Collega video" (link YouTube, Instagram o Drive); salvato in libreria, il video si collega da solo in tutte le schede. "Importa da PDF" legge giorni ed esercizi da un PDF e crea la scheda, modificabile prima dell'invio. "Invia" manda al cliente la scheda nell'app e il PDF in chat, con il link al video sotto ogni esercizio.
- Clienti: elenco con filtri (tutti, in scadenza, da seguire, pagamenti mancanti) e ricerca; ogni scheda apre il profilo con obiettivo, peso, misure, pacchetto, pagamenti, note e domande fatte all'assistente.
- Messaggi: conversazioni con i clienti, risposte rapide, segnalazioni dell'assistente.
- Calendario: settimana a griglia; una seduta segnata "fatta" scala una lezione dal pacchetto.
- Incassi: incassato, da incassare con "segna pagato" e "sollecita", movimenti e grafico degli ultimi 6 mesi.
- Impostazioni: profilo e foto, colore del marchio (i clienti vedono l'app con quel colore), tema chiaro o scuro, suoni, notifiche.
- In alto: campanello "Urgenti" con quello che va fatto subito, ricerca (Ctrl+K), avvisi recenti.`;

const avanzamento = (c: ClienteContesto) => Math.round(Math.max(0, Math.min(100, ((c.current - c.start) / (c.target - c.start || 1)) * 100)));

function cliente(c: ClienteContesto): string {
  const peso = c.weights.length ? `${numero.format(c.weights[0])} → ${numero.format(c.weights[c.weights.length - 1])} kg nelle ultime ${c.weights.length} rilevazioni` : "nessuna rilevazione";
  const misure = c.measures.map((m) => `${m.label.toLowerCase()} ${m.start}→${m.current} cm`).join(", ");
  const pagamenti = c.payments.length ? c.payments.map((p) => `${p.id} ${p.label} ${euro(p.amount)} del ${p.date} (${p.paid ? "pagato" : "DA PAGARE"})`).join("; ") : "nessuno";
  const parti = [
    `obiettivo "${c.goal}": partenza ${numero.format(c.start)} ${c.unit}, ora ${numero.format(c.current)}, traguardo ${numero.format(c.target)} (avanzamento ${avanzamento(c)}%)`,
    `cliente ${c.since.toLowerCase()}`,
    `pacchetto: ${c.pkg.label}, ${c.pkg.left.toLowerCase()}${c.pkg.expiring ? " (IN SCADENZA)" : ""}`,
    `ultimo allenamento: ${c.lastWorkout.toLowerCase()}${c.needsAttention ? " (DA SEGUIRE: non si allena da più di una settimana)" : ""}`,
    `scheda attuale: ${c.plan}`,
    `peso: ${peso}; misure: ${misure || "nessuna"}${c.ultimaMisura ? ` (ultima rilevazione ${c.ultimaMisura})` : ""}`,
    `pagamenti: ${pagamenti}`,
    `note del trainer: ${c.notes || "nessuna"}`,
  ];
  if (c.questions.length) parti.push(`domande fatte all'assistente: ${c.questions.map((q) => `"${q}"`).join(", ")}`);
  return `- ${c.name} (${c.gender}, id ${c.id}): ${parti.join(" · ")}`;
}

// Il calendario mandato dal browser (lo stato vive lì): forma controllata prima di finire nel contesto.
export const SedutaContesto = z.object({
  id: z.string().max(12),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  minutes: z.number().int().min(1).max(600),
  clientId: z.string().max(60),
  type: z.enum(["Workout", "Valutazione", "Online", "Corsa"]),
  place: z.string().max(80),
});

function seduta(s: Seduta, nomeDi: (id: string) => string): string {
  const [y, m, d] = s.date.split("-").map(Number);
  const giornoSett = LONG[(new Date(y, m - 1, d).getDay() + 6) % 7].toLowerCase();
  const oggi = s.date === "2026-10-21" ? " (OGGI)" : "";
  return `- ${s.id} · ${giornoSett} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}${oggi} · ${s.time} · ${s.minutes} min · ${s.type.toLowerCase()} · ${s.place} · ${nomeDi(s.clientId)}`;
}

export function contestoLeo(sedute: Seduta[] = seduteIniziali(), clienti: ClienteContesto[] = perContesto(datiIniziali()), extra: ExtraContesto = {}): string {
  const oggi = week[TODAY_INDEX];
  const nomi = new Map(clienti.map((c) => [c.id, c.name]));
  const nomeDi = (id: string) => nomi.get(id) ?? "cliente sconosciuto";
  const incassato = extra.incassi ? extra.incassi.incassatoCents / 100 : revenue.collected;
  const daIncassare = extra.incassi ? extra.incassi.daIncassareCents / 100 : revenue.outstanding;
  const mesi = revenue.months.map((m, i, tutti) => `${m.label} ${euro(i === tutti.length - 1 ? incassato : m.value)}`).join(", ");
  const righe = [
    ISTRUZIONI,
    "",
    `Oggi è ${oggi.long.toLowerCase()} ${trainer.today.toLowerCase()} 2026, sono le ${trainer.now}. Le date nelle azioni vanno scritte AAAA-MM-GG (oggi è 2026-10-21).`,
    "",
    `## Clienti (${clienti.length})`,
    "I pagamenti hanno un id (P2, P7…): usalo nelle azioni sui pagamenti, mai nel testo per il trainer.",
    ...clienti.map(cliente),
    "",
    "## Calendario (questa settimana e la prossima)",
    "Settimane: questa da lunedì 19 a domenica 25 ottobre, la prossima da lunedì 26 ottobre a domenica 1 novembre. Puoi agire solo su questi giorni. Giorni senza righe = nessuna seduta.",
    ...[...sedute].sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)).map((s) => seduta(s, nomeDi)),
    "",
    "## Incassi",
    `${revenue.month}: incassato ${euro(incassato)}, da incassare ${euro(daIncassare)}, previsto a fine mese ${euro(revenue.forecast)}. Ultimi 6 mesi: ${mesi}.`,
    "",
    "## Da fare subito (oltre a pagamenti DA PAGARE e pacchetti IN SCADENZA scritti nei clienti)",
    ...urgent.filter((u) => u.kind === "imminente" || u.kind === "dolore").map((u) => `- ${u.title}: ${u.detail}`),
    "",
    "## Avvisi recenti",
    ...notifications.map((n) => `- ${nomeDi(n.clientId)} ${n.text} (${n.when})`),
    "",
    "## Messaggi recenti (ultimi 3 per cliente)",
    ...conversations.map(
      (c) =>
        `- con ${nomeDi(c.clientId)}${c.unread ? ` (${c.unread} da leggere)` : ""}: ` +
        c.messages
          .slice(-3)
          .map((m) => `${m.from === "client" ? "cliente" : m.from === "trainer" ? "trainer" : "assistente"}: "${m.text}" (${m.time})`)
          .join(" | "),
    ),
    "",
    ...(extra.aspetto || extra.notifiche
      ? [
          "## Impostazioni attuali",
          ...(extra.aspetto ? [`- colore del marchio ${extra.aspetto.colore}, tema ${extra.aspetto.tema === "dark" ? "scuro" : "chiaro"}`] : []),
          ...(extra.notifiche ? [`- notifiche: ${Object.entries(extra.notifiche).map(([k, v]) => `${k} ${v ? "accesa" : "spenta"}`).join(", ")}`] : []),
          "",
        ]
      : []),
    "## Come si usa l'app",
    GUIDA,
  ];
  return ripulisci(righe.join("\n"));
}
