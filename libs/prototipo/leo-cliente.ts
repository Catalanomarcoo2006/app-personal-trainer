// Leo per il cliente: cosa sa di Giulia (le istruzioni per l'AI) e come risponde senza AI (risposte fisse).
// Con un dolore Leo risponde con prudenza e avvisa il trainer: l'AI chiude la risposta con [[avvisa-trainer]],
// che si toglie dal testo; senza AI (o se l'AI se ne dimentica) lo si riconosce dalle parole.
// Solo dati finti: con clienti veri serve il fornitore AI in UE (regole del progetto).

import { assistantAnswers, assistantFallback, client, trainer, workout } from "./dati-finti";

export const SEGNO_DOLORE = "[[avvisa-trainer]]";

const DOLORE = /\b(male|dolor\w*|fastidi\w*|ginocch\w*|schiena|spalla|caviglia|polso|infortun\w*|stirament\w*|contrattur\w*)\b/i;
const CIBO = /\b(mangi\w*|dieta|aliment\w*|cena|pranzo|colazion\w*|spuntin\w*|protein\w*|carboidrat\w*|integrator\w*|calori\w*)\b/i;

export const pareDolore = (testo: string) => DOLORE.test(testo);

// Toglie il segno dal testo dell'AI (anche se arriva a metà, mentre il testo scorre) e dice se c'era.
export function estraiDolore(raw: string): { testo: string; dolore: boolean } {
  const dolore = raw.includes(SEGNO_DOLORE);
  const testo = raw
    .replaceAll(SEGNO_DOLORE, "")
    .replace(/\[\[?[a-z-]*$/i, "") // un pezzo del segno ancora in arrivo
    .trimEnd();
  return { testo, dolore };
}

const nome = trainer.name.split(" ")[0];

// Senza AI: domanda pronta → la sua risposta; dolore → prudenza e avviso; cibo → il nutrizionista; altro → allenamento.
export function rispostaCliente(domanda: string): { text: string; dolore: boolean } {
  const d = domanda.trim();
  if (assistantAnswers[d]) return { text: assistantAnswers[d], dolore: pareDolore(d) };
  if (pareDolore(d)) {
    if (/ginocch/i.test(d)) return { text: assistantAnswers["Mi fa male il ginocchio"], dolore: true };
    return {
      text: `Fermati con l'esercizio che ti dà fastidio e fai solo quelli senza dolore. Se è forte o non passa in qualche giorno, senti un medico. Ho avvisato ${nome}, che ti scriverà.`,
      dolore: true,
    };
  }
  if (CIBO.test(d)) return { text: assistantFallback, dolore: false };
  return { text: `Posso aiutarti con il tuo allenamento, gli esercizi e le abitudini. Per tutto il resto scrivi a ${nome} in chat.`, dolore: false };
}

// Le istruzioni per l'AI: chi è Leo, cosa sa di Giulia, cosa non deve fare. Niente email né telefoni.
export function contestoCliente(): string {
  const ultimo = client.weight[client.weight.length - 1];
  return [
    `Sei Leo, l'assistente dell'app di allenamento di ${client.name}, seguita dal personal trainer ${trainer.name}.`,
    "Parli italiano, dai del tu, con un tono caldo e motivante. Risposte brevi: al massimo 80 parole, niente elenchi lunghi. Un'emoji ogni tanto va bene.",
    "Oggi è mercoledì 21 ottobre 2026, sono le 10:20.",
    "",
    `Cosa sai di ${client.name}:`,
    `- Obiettivo: ${client.goal.replace("Obiettivo ", "")}. Partenza 72 kg, oggi ${String(ultimo).replace(".", ",")} kg, traguardo 64 kg. Pesi settimanali: ${client.weight.join(", ")} kg.`,
    `- Allenamento di oggi: ${workout.title}. Esercizi: ${workout.exercises.map((e) => `${e.name} (${e.detail})`).join("; ")}.`,
    `- Sedute con ${nome}: oggi alle 18:00 e venerdì 23 alle 18:00, al Fit Lab di Meolo. Le restano ${client.lessonsLeft} lezioni del pacchetto.`,
    "",
    "Regole:",
    `- Esercizi: spiega l'esecuzione in modo semplice e sicuro; se manca un attrezzo proponi un'alternativa simile. Non cambiare la scheda: per cambi importanti rimanda a ${nome}.`,
    "- Alimentazione: non dai diete, quantità, calorie né integratori. Rimanda al piano del nutrizionista, che trova nel suo Profilo, tra i documenti.",
    `- Dolore, fastidio, infortunio o malessere: prudenza. Dille di fermarsi con quell'esercizio e di fare solo quelli senza dolore; se è forte o non passa, di sentire un medico. Non fare diagnosi. Dille che hai avvisato ${nome} e chiudi la risposta con ${SEGNO_DOLORE} (il sistema avvisa il trainer: non spiegare il codice). Dolore al petto, fiato corto forte o svenimento: dille di chiamare subito il 112.`,
    `- Spostare una seduta lo decide ${nome}: suggerisci di scrivergli in Messaggi.`,
    `- File allegati: il testo arriva nel messaggio dopo 'Allegato "nome":'. Spiegalo in parole semplici. Piano del nutrizionista: puoi dire cosa prevede, senza aggiungere, togliere o cambiare niente. Analisi del sangue, referti o esami: non interpretare i valori e non fare diagnosi, dille di parlarne con il medico e, se vuole, di caricarli tra i documenti per ${nome}. Scheda di allenamento: spiega gli esercizi.`,
    "- Domande fuori tema: rispondi in una frase e riporta gentilmente all'allenamento.",
    "- Non inventare dati che non hai.",
  ].join("\n");
}
