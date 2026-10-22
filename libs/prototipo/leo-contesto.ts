// Contesto per l'AI di Leo, l'assistente del trainer, e pseudonimi dei clienti.
// Regola del progetto: mai nome o email del cliente verso l'AI. I clienti diventano codici ([C1], [C2], …)
// sia nei dati sia nei messaggi; il browser rimette i nomi nella risposta (ripristinaNomi).

import { agenda, clients, conversations, notifications, progressOf, revenue, TODAY_INDEX, trainer, urgent, week } from "./dati-finti";

const codici = clients.map((c, i) => ({ id: c.id, nome: c.name, primo: c.name.split(" ")[0], codice: `C${i + 1}` }));
const codiceDi = (id: string) => `[${codici.find((c) => c.id === id)?.codice ?? "C?"}]`;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Nome e cognome, poi il nome da solo, diventano il codice del cliente; email e numeri di telefono spariscono.
export function pseudonimizza(testo: string): string {
  let t = testo.replace(/\S+@\S+\.\S+/g, "[email]").replace(/\+?\d[\d ]{7,}\d/g, "[telefono]");
  for (const c of codici) t = t.replace(new RegExp(`\\b${escape(c.nome)}\\b`, "gi"), `[${c.codice}]`);
  for (const c of codici) t = t.replace(new RegExp(`\\b${escape(c.primo)}\\b`, "gi"), `[${c.codice}]`);
  return t;
}

export function ripristinaNomi(testo: string): string {
  return testo.replace(/\[C(\d+)\]/g, (codice, n) => codici[Number(n) - 1]?.nome ?? codice);
}

// ——— Il tasto per aprire una sezione: l'AI chiude la risposta con [[vai:incassi]] o [[vai:cliente:C3]] ———

export type Sezione = "oggi" | "clienti" | "messaggi" | "schede" | "calendario" | "incassi" | "impostazioni" | "cliente";
const SEZIONI: Sezione[] = ["oggi", "clienti", "messaggi", "schede", "calendario", "incassi", "impostazioni", "cliente"];

export function estraiAzione(testo: string): { text: string; vai?: { sezione: Sezione; clienteId?: string } } {
  let vai: { sezione: Sezione; clienteId?: string } | undefined;
  let t = testo.replace(/\[\[\s*vai\s*:\s*([a-z]+)\s*(?::\s*\[?C(\d+)\]?\s*)?\]\]/gi, (_, nome: string, n?: string) => {
    const sezione = nome.toLowerCase() as Sezione;
    if (!SEZIONI.includes(sezione)) return "";
    if (sezione !== "cliente") vai = { sezione };
    else if (n && codici[Number(n) - 1]) vai = { sezione, clienteId: codici[Number(n) - 1].id };
    return "";
  });
  // mentre la risposta arriva: niente etichette o codici ancora a metà ("[[va", "[C")
  t = t.replace(/\[{1,2}[^\]]*$/, "");
  return vai ? { text: t.trim(), vai } : { text: t.trim() };
}

// ——— Il contesto: istruzioni, dati della dashboard e guida all'app ———

const numero = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1, useGrouping: "always" });
const euro = (n: number) => `€ ${numero.format(n)}`;

const ISTRUZIONI = `Sei Leo, l'assistente virtuale di un personal trainer dentro la sua app di gestione. Parli con il trainer.
Rispondi sempre in italiano, con tono amichevole e pratico, in 2-4 frasi brevi (al massimo 80 parole), senza titoli né elenchi lunghi.
Prima ragiona sui dati qui sotto: confronta, fai i conti, metti in ordine di urgenza e suggerisci la prossima azione concreta. Usa solo questi dati: se un'informazione non c'è, dillo e suggerisci dove guardare nell'app. Non inventare numeri, nomi, date o fatti.
I clienti sono indicati con un codice tra parentesi quadre, per esempio [C1], seguito da (donna) o (uomo). Quando parli di un cliente scrivi sempre il codice così com'è, con le parentesi, e non provare a indovinarne il nome; accorda aggettivi e participi al genere indicato ("ferma da 8 giorni" per una donna).
Niente diete, grammature o integratori: per l'alimentazione rimanda al nutrizionista del cliente. Per dolori o problemi di salute suggerisci di sentire il cliente e, se serve, un medico.
Se è utile aprire una sezione dell'app, chiudi la risposta con UNA sola etichetta fra queste: [[vai:oggi]], [[vai:clienti]], [[vai:messaggi]], [[vai:schede]], [[vai:calendario]], [[vai:incassi]], [[vai:impostazioni]], oppure [[vai:cliente:C1]] per il profilo di un cliente (con il suo codice). Se non serve, non aggiungere etichette.`;

const GUIDA = `- Schede: si costruiscono dalla libreria esercizi. Sotto ogni esercizio c'è "Collega video" (link YouTube, Instagram o Drive); salvato in libreria, il video si collega da solo in tutte le schede. "Importa da PDF" legge giorni ed esercizi da un PDF e crea la scheda, modificabile prima dell'invio. "Invia" manda al cliente la scheda nell'app e il PDF in chat, con il link al video sotto ogni esercizio.
- Clienti: elenco con filtri (tutti, in scadenza, da seguire, pagamenti mancanti) e ricerca; ogni scheda apre il profilo con obiettivo, peso, misure, pacchetto, pagamenti, note e domande fatte all'assistente.
- Messaggi: conversazioni con i clienti, risposte rapide, segnalazioni dell'assistente.
- Calendario: settimana a griglia; una seduta segnata "fatta" scala una lezione dal pacchetto.
- Incassi: incassato, da incassare con "segna pagato" e "sollecita", movimenti e grafico degli ultimi 6 mesi.
- Impostazioni: profilo e foto, colore del marchio (i clienti vedono l'app con quel colore), tema chiaro o scuro, suoni, notifiche.
- In alto: campanello "Urgenti" con quello che va fatto subito, ricerca (Ctrl+K), avvisi recenti.`;

function cliente(c: (typeof clients)[number]): string {
  const peso = `${numero.format(c.weights[0])} → ${numero.format(c.weights[c.weights.length - 1])} kg in 8 settimane`;
  const misure = c.measures.map((m) => `${m.label.toLowerCase()} ${m.start}→${m.current} cm`).join(", ");
  const pagamenti = c.payments.map((p) => `${p.label} ${euro(p.amount)} del ${p.date} (${p.paid ? "pagato" : "DA PAGARE"})`).join("; ");
  const parti = [
    `obiettivo "${c.goal}": partenza ${numero.format(c.start)} ${c.unit}, ora ${numero.format(c.current)}, traguardo ${numero.format(c.target)} (avanzamento ${progressOf(c)}%)`,
    `cliente ${c.since.toLowerCase()}`,
    `pacchetto: ${c.pkg.label}, ${c.pkg.left.toLowerCase()}${c.pkg.expiring ? " (IN SCADENZA)" : ""}`,
    `ultimo allenamento: ${c.lastWorkout.toLowerCase()}${c.needsAttention ? " (DA SEGUIRE: non si allena da più di una settimana)" : ""}`,
    `scheda attuale: ${c.plan}`,
    `peso: ${peso}; misure: ${misure}`,
    `pagamenti: ${pagamenti}`,
    `note del trainer: ${c.notes}`,
  ];
  if (c.questions.length) parti.push(`domande fatte all'assistente: ${c.questions.map((q) => `"${q}"`).join(", ")}`);
  return `- ${codiceDi(c.id)} (${c.gender}): ${parti.join(" · ")}`;
}

function giorno(i: number): string {
  const d = week[i];
  const sedute = agenda[i].map((a) => `${a.time} ${a.type.toLowerCase()} con ${codiceDi(a.clientId)} (${a.minutes} min, ${a.place})`);
  return `- ${d.long} ${d.n}${i === TODAY_INDEX ? " (OGGI)" : ""}: ${sedute.length ? sedute.join("; ") : "nessuna seduta"}`;
}

export function contestoLeo(): string {
  const oggi = week[TODAY_INDEX];
  const mesi = revenue.months.map((m) => `${m.label} ${euro(m.value)}`).join(", ");
  const righe = [
    ISTRUZIONI,
    "",
    `Oggi è ${oggi.long.toLowerCase()} ${trainer.today.toLowerCase()} 2026, sono le ${trainer.now}.`,
    "",
    `## Clienti (${clients.length})`,
    ...clients.map(cliente),
    "",
    "## Agenda della settimana",
    ...week.map((_, i) => giorno(i)),
    "",
    "## Incassi",
    `${revenue.month}: incassato ${euro(revenue.collected)} (+${revenue.delta}% sul mese prima), da incassare ${euro(revenue.outstanding)}, previsto a fine mese ${euro(revenue.forecast)}. Ultimi 6 mesi: ${mesi}.`,
    "",
    "## Da fare subito",
    ...urgent.map((u) => `- ${u.title}: ${u.detail}`),
    "",
    "## Avvisi recenti",
    ...notifications.map((n) => `- ${codiceDi(n.clientId)} ${n.text} (${n.when})`),
    "",
    "## Messaggi recenti (ultimi 3 per cliente)",
    ...conversations.map(
      (c) =>
        `- con ${codiceDi(c.clientId)}${c.unread ? ` (${c.unread} da leggere)` : ""}: ` +
        c.messages
          .slice(-3)
          .map((m) => `${m.from === "client" ? "cliente" : m.from === "trainer" ? "trainer" : "assistente"}: "${m.text}" (${m.time})`)
          .join(" | "),
    ),
    "",
    "## Come si usa l'app",
    GUIDA,
  ];
  return pseudonimizza(righe.join("\n"));
}
