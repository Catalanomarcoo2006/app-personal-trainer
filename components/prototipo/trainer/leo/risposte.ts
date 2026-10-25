import { formatEuro } from "@/components/ui/motion";
import { agenda, clientById, clients, revenue, TODAY_INDEX } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "../nav";

// ——— Le risposte, calcolate dai dati ———

export type Answer = { text: string; action?: { label: string; href: string } };

export const names = (ids: string[]) => ids.map((id) => clientById(id)?.name).filter(Boolean).join(" e ");
export const openPayments = clients.flatMap((c) => c.payments.filter((p) => !p.paid).map((p) => ({ c, p })));
export const openTotal = openPayments.reduce((s, x) => s + x.p.amount, 0);

export function answer(question: string): Answer {
  const q = question.toLowerCase();

  if (/luca|dolor|ginocch|segnal/.test(q)) {
    return {
      text: "Luca Ferri ha detto all’assistente di sentire fastidio al ginocchio durante gli affondi. Sentilo oggi, prima della prossima seduta: puoi rispondergli da Messaggi.",
      action: { label: "Apri Messaggi", href: ROUTES.messaggi },
    };
  }
  if (/davide|massimal|panca|record/.test(q)) {
    return {
      text: "Davide Greco ha fatto il nuovo massimale di panca: 90 kg, e ti ringrazia per la scheda. Due righe di complimenti adesso valgono doppio.",
      action: { label: "Apri Messaggi", href: ROUTES.messaggi },
    };
  }
  if (/pag|soldi|debit|devono/.test(q)) {
    return {
      text: `Ci sono ${openPayments.length} pagamenti aperti per ${formatEuro(openTotal)}: ${openPayments.map(({ c, p }) => `${c.name}, ${formatEuro(p.amount)} (${p.label.toLowerCase()})`).join(" e ")}. Puoi mandare un sollecito con un tocco da Incassi.`,
      action: { label: "Apri Incassi", href: ROUTES.incassi },
    };
  }
  if (/allen|settiman|ferm|mollare|seguire/.test(q)) {
    const idle = clients.filter((c) => c.needsAttention);
    return {
      text: `${idle.map((c) => `${c.name} (ultimo allenamento ${c.lastWorkout.toLowerCase()})`).join(" e ")}. Scrivi loro oggi: un messaggio adesso evita che perdano il ritmo.`,
      action: { label: "Apri Messaggi", href: ROUTES.messaggi },
    };
  }
  if (/incass|guadagn|fattur|ottobre|mese/.test(q)) {
    return {
      text: `A ottobre hai incassato ${formatEuro(revenue.collected)}, +${revenue.delta}% su settembre. Restano ${formatEuro(revenue.outstanding)} da incassare e il previsto a fine mese è ${formatEuro(revenue.forecast)}.`,
      action: { label: "Apri Incassi", href: ROUTES.incassi },
    };
  }
  if (/oggi|agenda|appuntament|sedut/.test(q)) {
    const today = agenda[TODAY_INDEX];
    return {
      text: `Oggi hai ${today.length} appuntamenti: ${today.map((a) => `${a.time} ${a.type.toLowerCase()} con ${clientById(a.clientId)?.name.split(" ")[0]}`).join(", ")}. Il prossimo è alle 11:00 con Antonella, tra 40 minuti.`,
      action: { label: "Apri Calendario", href: ROUTES.calendario },
    };
  }
  if (/video|esecuzion/.test(q)) {
    return {
      text: "In Schede, sotto ogni esercizio c’è “Collega video”: incolla il link (YouTube, Instagram, Drive) e il cliente lo trova sotto l’esercizio nella sua app. Se lo salvi in libreria, si collega da solo in tutte le schede.",
      action: { label: "Apri Schede", href: ROUTES.schede },
    };
  }
  if (/pdf|import|scheda|invi/.test(q)) {
    return {
      text: "Vai in Schede, scegli il cliente e premi “Importa da PDF”: leggo giorni ed esercizi e collego i video che hai già. Controlla, poi premi “Invia”: il cliente riceve la scheda nell’app e il PDF in chat.",
      action: { label: "Apri Schede", href: ROUTES.schede },
    };
  }
  if (/pacchett|scadenz|rinnov|lezioni/.test(q)) {
    const expiring = clients.filter((c) => c.pkg.expiring);
    return {
      text: `${names(expiring.map((c) => c.id))} hanno il pacchetto quasi finito (${expiring.map((c) => c.pkg.left.toLowerCase()).join(" e ")}). È il momento giusto per proporre il rinnovo.`,
      action: { label: "Vedi i clienti", href: `${ROUTES.clienti}?filtro=scadenza` },
    };
  }
  return {
    text: `Posso aiutarti con i tuoi clienti, i pagamenti, l’agenda e l’uso dell’app. Prova a chiedermi “Chi deve ancora pagare?” oppure “Chi ho in agenda oggi?”.`,
  };
}

export const suggestions = ["Chi deve ancora pagare?", "Chi non si allena da una settimana?", "Chi ho in agenda oggi?", "Quanto ho incassato a ottobre?", "Chi ha il pacchetto in scadenza?", "Come collego i video agli esercizi?"];
