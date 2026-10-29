"use client";

// Le finestre per fare a mano quello che nella demo si chiede a Leo: nuovo cliente, pagamento, pacchetto.
// Nella versione vera servono sempre (Leo non chiama l'AI finché non c'è il fornitore in Europa); nella demo le
// apre il tasto "Nuovo cliente" della lista Clienti. Passano dallo sportello, come Leo: stessi controlli, e nella
// versione vera il salvataggio continuo le scrive nel database.

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { EASE_OUT } from "@/components/ui/motion";
import { creaCliente, creaPacchetto, registraPagamento } from "@/libs/dati/sportello";
import { useClienti } from "@/libs/dati/selettori";
import { oggi } from "@/libs/orologio";
import { playSound } from "@/libs/ui/sound";
import { navigate, ROUTES } from "@/components/prototipo/trainer/nav";

type Modulo = { tipo: "cliente" } | { tipo: "pagamento"; clientId?: string } | { tipo: "pacchetto"; clientId?: string };

let aperto: Modulo | null = null;
const ascolta = new Set<() => void>();
export function apriModulo(m: Modulo | null) {
  aperto = m;
  ascolta.forEach((f) => f());
}
const useModulo = () =>
  useSyncExternalStore(
    (f: () => void) => {
      ascolta.add(f);
      return () => {
        ascolta.delete(f);
      };
    },
    (): Modulo | null => aperto,
    (): Modulo | null => null,
  );

const campo = "h-[38px] w-full rounded-[12px] bg-soft px-[12px] text-[13px] outline-none placeholder:text-muted focus:ring-2 focus:ring-[var(--trainer)]/40";
const euroInCent = (t: string) => Math.round(Number(t.trim().replace(",", ".")) * 100);

function Riga({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[5px] block text-[11.5px] font-semibold text-ink/70">{etichetta}</span>
      {children}
    </label>
  );
}

function Scelta<T extends string>({ valore, voci, onScegli }: { valore: T; voci: [T, string][]; onScegli: (v: T) => void }) {
  return (
    <div className="flex gap-[6px]">
      {voci.map(([v, l]) => (
        <button key={v} type="button" onClick={() => (playSound("tap"), onScegli(v))} className={`h-[34px] flex-1 cursor-pointer rounded-[11px] text-[12.5px] font-semibold ${v === valore ? "sel-trainer" : "bg-soft"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

function SceltaCliente({ valore, onScegli }: { valore: string; onScegli: (id: string) => void }) {
  const clienti = useClienti();
  return (
    <select value={valore} onChange={(e) => onScegli(e.target.value)} className={campo} required>
      <option value="" disabled>
        Scegli il cliente
      </option>
      {clienti.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function NuovoCliente({ chiudi }: { chiudi: () => void }) {
  const [nome, setNome] = useState("");
  const [genere, setGenere] = useState<"donna" | "uomo">("donna");
  const [email, setEmail] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const invia = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const r = await creaCliente({ name: nome, gender: genere, email, goalLabel: obiettivo });
    if ("motivo" in r) {
      toast.error(r.motivo);
      return;
    }
    playSound("confirm");
    toast.success(`${nome.trim()} aggiunto ai clienti`);
    chiudi();
    if (r.id) navigate(ROUTES.cliente(r.id));
  };
  return (
    <form onSubmit={invia} className="space-y-[12px]">
      <Riga etichetta="Nome e cognome">
        <input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder="Sara Neri" />
      </Riga>
      <Riga etichetta="Per parlarle o parlargli nel modo giusto">
        <Scelta<"donna" | "uomo"> valore={genere} voci={[["donna", "Donna"], ["uomo", "Uomo"]]} onScegli={setGenere} />
      </Riga>
      <Riga etichetta="Email (serve per invitarlo nell'app)">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} placeholder="sara@email.it" />
      </Riga>
      <Riga etichetta="Obiettivo">
        <input value={obiettivo} onChange={(e) => setObiettivo(e.target.value)} className={campo} placeholder="Dimagrimento −5 kg" />
      </Riga>
      <button type="submit" className="btn-trainer mt-[4px] h-[40px] w-full cursor-pointer rounded-full text-[13px] font-bold">
        Aggiungi cliente
      </button>
    </form>
  );
}

function NuovoPagamento({ clientId, chiudi }: { clientId?: string; chiudi: () => void }) {
  const [cliente, setCliente] = useState(clientId ?? "");
  const [importo, setImporto] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const invia = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const r = await registraPagamento({ clientId: cliente, amountCents: euroInCent(importo), description: descrizione, paidOn: oggi() });
    if ("motivo" in r) {
      toast.error(r.motivo);
      return;
    }
    playSound("confirm");
    toast.success("Pagamento registrato");
    chiudi();
  };
  return (
    <form onSubmit={invia} className="space-y-[12px]">
      <Riga etichetta="Cliente">
        <SceltaCliente valore={cliente} onScegli={setCliente} />
      </Riga>
      <Riga etichetta="Importo incassato oggi (€)">
        <input required inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} className={campo} placeholder="40" />
      </Riga>
      <Riga etichetta="Per cosa">
        <input required value={descrizione} onChange={(e) => setDescrizione(e.target.value)} className={campo} placeholder="Valutazione posturale" />
      </Riga>
      <button type="submit" className="btn-trainer mt-[4px] h-[40px] w-full cursor-pointer rounded-full text-[13px] font-bold">
        Registra pagamento
      </button>
    </form>
  );
}

function NuovoPacchetto({ clientId, chiudi }: { clientId?: string; chiudi: () => void }) {
  const [cliente, setCliente] = useState(clientId ?? "");
  const [tipo, setTipo] = useState<"lessons" | "time">("lessons");
  const [quanti, setQuanti] = useState("10");
  const [prezzo, setPrezzo] = useState("");
  const [pagato, setPagato] = useState<"si" | "no">("no");
  const invia = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const n = Number(quanti);
    const r = await creaPacchetto({ clientId: cliente, kind: tipo, ...(tipo === "lessons" ? { lezioni: n } : { mesi: n }), amountCents: euroInCent(prezzo), pagato: pagato === "si" });
    if ("motivo" in r) {
      toast.error(r.motivo);
      return;
    }
    playSound("confirm");
    toast.success(pagato === "si" ? "Pacchetto creato e pagato" : "Pacchetto creato: il pagamento è tra quelli da incassare");
    chiudi();
  };
  return (
    <form onSubmit={invia} className="space-y-[12px]">
      <Riga etichetta="Cliente">
        <SceltaCliente valore={cliente} onScegli={setCliente} />
      </Riga>
      <Riga etichetta="Tipo">
        <Scelta<"lessons" | "time"> valore={tipo} voci={[["lessons", "A lezioni"], ["time", "A mesi"]]} onScegli={(t) => (setTipo(t), setQuanti(t === "lessons" ? "10" : "1"))} />
      </Riga>
      <div className="grid grid-cols-2 gap-[10px]">
        <Riga etichetta={tipo === "lessons" ? "Lezioni" : "Mesi"}>
          <input required inputMode="numeric" value={quanti} onChange={(e) => setQuanti(e.target.value)} className={campo} />
        </Riga>
        <Riga etichetta="Prezzo (€)">
          <input required inputMode="decimal" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} className={campo} placeholder="450" />
        </Riga>
      </div>
      <Riga etichetta="Già pagato?">
        <Scelta<"si" | "no"> valore={pagato} voci={[["no", "Da incassare"], ["si", "Pagato oggi"]]} onScegli={setPagato} />
      </Riga>
      <button type="submit" className="btn-trainer mt-[4px] h-[40px] w-full cursor-pointer rounded-full text-[13px] font-bold">
        Crea pacchetto
      </button>
    </form>
  );
}

const TITOLI = { cliente: "Nuovo cliente", pagamento: "Registra un pagamento", pacchetto: "Nuovo pacchetto" };

// Montata una volta nella cornice dell'area trainer (computer).
export function Moduli() {
  const m = useModulo();
  const chiudi = () => apriModulo(null);
  return (
    <AnimatePresence>
      {m && (
        <motion.div key={m.tipo} className="fixed inset-0 z-[60] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Chiudi" onClick={chiudi} className="absolute inset-0 bg-black/15 backdrop-blur-[5px]" />
          <motion.div
            initial={{ y: 20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="relative w-[400px] max-w-[calc(100vw-32px)] rounded-[24px] bg-card p-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
          >
            <div className="mb-[14px] flex items-center justify-between">
              <p className="text-[16px] font-bold">{TITOLI[m.tipo]}</p>
              <button type="button" aria-label="Chiudi" onClick={chiudi} className="grid size-[28px] cursor-pointer place-items-center rounded-full bg-soft">
                <X size={14} />
              </button>
            </div>
            {m.tipo === "cliente" && <NuovoCliente chiudi={chiudi} />}
            {m.tipo === "pagamento" && <NuovoPagamento clientId={m.clientId} chiudi={chiudi} />}
            {m.tipo === "pacchetto" && <NuovoPacchetto clientId={m.clientId} chiudi={chiudi} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
