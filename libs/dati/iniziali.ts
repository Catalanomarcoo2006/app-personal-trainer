// I dati di partenza della demo, convertiti da dati-finti.ts nella forma del database:
// euro → centesimi, "2 lezioni rimaste" → pacchetto strutturato, pesi e misure → righe datate (una a settimana).

import { clients, type Client } from "@/libs/prototipo/dati-finti";
import type { ClienteDati, DatiClienti, Misura, Pacchetto, Pagamento } from "./tipi";

const ANNO = 2026;
export const OGGI = "2026-10-21"; // la demo è ferma a mercoledì 21 ottobre
export const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
export const MESI_LUNGHI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

const due = (n: number) => String(n).padStart(2, "0");

// "07 Set" → "2026-09-07"
export function dataDaBreve(s: string, anno = ANNO): string {
  const [g, m] = s.trim().split(/\s+/);
  return `${anno}-${due(MESI.indexOf(m) + 1)}-${due(Number(g))}`;
}

// "Dal 05 Ott 2026" → "2026-10-05"
const dataDaSince = (since: string) => {
  const [, g, m, a] = /(\d{1,2}) (\w{3}) (\d{4})/.exec(since) ?? [];
  return g ? dataDaBreve(`${g} ${m}`, Number(a)) : OGGI;
};

// Un giorno spostato di n settimane (n negativo = indietro).
function settimane(data: string, n: number): string {
  const [y, m, d] = data.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n * 7));
  return `${t.getUTCFullYear()}-${due(t.getUTCMonth() + 1)}-${due(t.getUTCDate())}`;
}

function pacchetto(c: Client, id: string): Pacchetto {
  const base = { id, clientId: c.id, label: c.pkg.label, startsOn: dataDaSince(c.since), priceCents: Math.round((c.payments[0]?.amount ?? 0) * 100) };
  const scade = /Scade il (\d{1,2}) (\w+)/i.exec(c.pkg.left);
  if (scade) {
    const mese = MESI_LUNGHI.indexOf(scade[2].toLowerCase()) + 1;
    return { ...base, kind: "time", lessonsTotal: null, lessonsUsed: 0, endsOn: `${ANNO}-${due(mese)}-${due(Number(scade[1]))}` };
  }
  const totali = Number(/(\d+) (lezion|sedut)/i.exec(c.pkg.label)?.[1] ?? 0);
  const rimaste = Number(/(\d+)/.exec(c.pkg.left)?.[1] ?? 0);
  return { ...base, kind: "lessons", lessonsTotal: totali, lessonsUsed: totali - rimaste, endsOn: null };
}

// Il peso ogni settimana; le circonferenze ogni due settimane e all'ultima, in calo graduale dalla partenza a oggi
// (arrotondate al mezzo centimetro): lo storico della demo nei Progressi del cliente.
function misure(c: Client, prossimo: () => string): Misura[] {
  const ultima = c.weights.length - 1;
  const valori = (t: number) => {
    const v = (label: string) => {
      const m = c.measures.find((x) => x.label === label);
      return m ? Math.round((m.start + (m.current - m.start) * t) * 2) / 2 : undefined;
    };
    return { waistCm: v("Vita"), hipsCm: v("Fianchi"), chestCm: v("Petto"), armCm: v("Braccio"), thighCm: v("Coscia") };
  };
  return c.weights.map((w, i) => ({
    id: prossimo(),
    clientId: c.id,
    takenOn: settimane(OGGI, i - ultima),
    weightKg: w,
    ...(i % 2 === 0 || i === ultima ? valori(ultima ? i / ultima : 1) : {}),
  }));
}

function cliente(c: Client): ClienteDati {
  return {
    id: c.id,
    name: c.name,
    gender: c.gender,
    initials: c.initials,
    ...(c.photo ? { photo: c.photo } : {}),
    tone: c.tone,
    since: c.since,
    goalLabel: c.goal,
    goalUnit: c.unit,
    goalStart: c.start,
    goalCurrent: c.current,
    goalTarget: c.target,
    notes: c.notes,
    lastWorkout: c.lastWorkout,
    needsAttention: c.needsAttention,
    plan: c.plan,
    questions: c.questions,
    email: c.email,
    phone: c.phone,
  };
}

export function datiIniziali(): DatiClienti {
  let k = 0;
  let p = 0;
  let m = 0;
  const pacchetti = clients.map((c) => pacchetto(c, `K${++k}`));
  const pagamenti: Pagamento[] = clients.flatMap((c) =>
    c.payments.map((x) => {
      const data = dataDaBreve(x.date);
      return {
        id: `P${++p}`,
        clientId: c.id,
        packageId: x.label === c.pkg.label ? (pacchetti.find((q) => q.clientId === c.id)?.id ?? null) : null,
        description: x.label,
        amountCents: Math.round(x.amount * 100),
        dueOn: data,
        paidOn: x.paid ? data : null,
      };
    }),
  );
  return {
    clienti: clients.map(cliente),
    pacchetti,
    pagamenti,
    misure: clients.flatMap((c) => misure(c, () => `M${++m}`)),
    notifiche: { dolore: true, spostamento: true, pacchetti: true, riepilogo: false, avvisoDolori: true },
  };
}
