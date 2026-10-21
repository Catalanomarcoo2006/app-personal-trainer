"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUp, X } from "lucide-react";
import { EASE_OUT, formatEuro } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, clientById, clients, revenue, TODAY_INDEX, trainer } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";

// ——— L'omino ———

function Mascot({ size = 72, waving = false }: { size?: number; waving?: boolean }) {
  return (
    <svg viewBox="0 0 80 96" width={size} height={size * 1.2} className="overflow-visible">
      <motion.ellipse cx={40} cy={92} rx={17} ry={3.5} fill="black" animate={{ opacity: [0.18, 0.1, 0.18], rx: [17, 14, 17] }} transition={{ duration: 2.4, repeat: Infinity }} />
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        {/* gambe */}
        <rect x={30} y={70} width={8} height={15} rx={4} fill="#2b2d31" />
        <rect x={42} y={70} width={8} height={15} rx={4} fill="#2b2d31" />
        <rect x={27} y={82} width={12} height={6} rx={3} fill="white" stroke="#2b2d31" strokeWidth={1.5} />
        <rect x={41} y={82} width={12} height={6} rx={3} fill="white" stroke="#2b2d31" strokeWidth={1.5} />
        {/* braccio sinistro */}
        <rect x={15} y={48} width={9} height={22} rx={4.5} style={{ fill: "var(--trainer)" }} />
        <circle cx={19.5} cy={71} r={4} fill="#f3d3b8" />
        {/* corpo con fischietto */}
        <rect x={22} y={44} width={36} height={32} rx={14} style={{ fill: "var(--trainer)" }} />
        <path d="M33 45 L40 56 L47 45" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />
        <circle cx={40} cy={58} r={3} fill="#c9ccd1" stroke="#8a8e94" strokeWidth={1} />
        {/* braccio destro che saluta */}
        <motion.g
          style={{ originX: "57px", originY: "50px" }}
          animate={waving ? { rotate: [0, -40, -15, -40, 0] } : { rotate: 0 }}
          transition={{ duration: 1.2, repeat: waving ? Infinity : 0, repeatDelay: 2.5 }}
        >
          <rect x={56} y={48} width={9} height={22} rx={4.5} style={{ fill: "var(--trainer)" }} />
          <circle cx={60.5} cy={71} r={4} fill="#f3d3b8" />
        </motion.g>
        {/* testa */}
        <circle cx={40} cy={28} r={17} fill="#f3d3b8" />
        <path d="M23 26 C23 12 57 12 57 26 C52 20 28 20 23 26 Z" fill="#2b2d31" />
        <rect x={23} y={21} width={34} height={4.5} rx={2.2} style={{ fill: "var(--trainer)" }} />
        <motion.g style={{ originX: "40px", originY: "31px" }} animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] }}>
          <ellipse cx={34} cy={31} rx={2.2} ry={2.6} fill="#2b2d31" />
          <ellipse cx={46} cy={31} rx={2.2} ry={2.6} fill="#2b2d31" />
        </motion.g>
        <circle cx={29.5} cy={36} r={2.4} fill="#f2a1a1" opacity={0.6} />
        <circle cx={50.5} cy={36} r={2.4} fill="#f2a1a1" opacity={0.6} />
        <path d="M35 37.5 Q40 42 45 37.5" fill="none" stroke="#2b2d31" strokeWidth={1.8} strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

// ——— Le risposte, calcolate dai dati ———

type Answer = { text: string; action?: { label: string; href: string } };

const names = (ids: string[]) => ids.map((id) => clientById(id)?.name).filter(Boolean).join(" e ");

function answer(question: string): Answer {
  const q = question.toLowerCase();

  if (/pag|soldi|debit|devono/.test(q)) {
    const open = clients.flatMap((c) => c.payments.filter((p) => !p.paid).map((p) => ({ c, p })));
    const total = open.reduce((s, x) => s + x.p.amount, 0);
    return {
      text: `Ci sono ${open.length} pagamenti aperti per ${formatEuro(total)}: ${open.map(({ c, p }) => `${c.name}, ${formatEuro(p.amount)} (${p.label.toLowerCase()})`).join(" e ")}. Puoi mandare un sollecito con un tocco da Incassi.`,
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
  if (/pdf|import|scheda/.test(q)) {
    return {
      text: "Vai in Schede, scegli il cliente e premi “Importa da PDF”. Trascina il file: leggo giorni ed esercizi, li trasformo in una scheda che puoi modificare cella per cella e poi la invii al cliente.",
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

const suggestions = ["Chi deve ancora pagare?", "Chi non si allena da una settimana?", "Chi ho in agenda oggi?", "Quanto ho incassato a ottobre?", "Chi ha il pacchetto in scadenza?", "Come importo una scheda da PDF?"];

const teasers = [`Ciao ${trainer.name.split(" ")[0]}! Serve una mano?`, "Chiedimi chi deve ancora pagare", "Vuoi sapere chi non si allena da una settimana?", "Ti spiego come importare una scheda da PDF"];

type Msg = { id: number; from: "trainer" | "coach"; text: string; action?: Answer["action"] };

// ——— Il widget ———

export function CoachAssistant() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(0);
  const [bubble, setBubble] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  // La nuvoletta mostra tre messaggi, uno dopo l'altro, poi si ritira per non coprire la pagina.
  useEffect(() => {
    if (open) return;
    const steps: number[] = [window.setTimeout(() => setBubble(true), 1500)];
    for (let k = 1; k <= 3; k++) {
      steps.push(window.setTimeout(() => setBubble(false), 1500 + k * 5000 - 700));
      if (k < 3)
        steps.push(
          window.setTimeout(() => {
            setTeaser(k % teasers.length);
            setBubble(true);
          }, 1500 + k * 5000),
        );
    }
    return () => steps.forEach((t) => window.clearTimeout(t));
  }, [open]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || typing) return;
    playSound("tap");
    setDraft("");
    setMessages((m) => [...m, { id: nextId.current++, from: "trainer", text }]);
    setTyping(true);
    const a = answer(text);
    const words = a.text.split(" ");
    const id = nextId.current++;
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { id, from: "coach", text: "" }]);
        words.forEach((_, i) =>
          timers.current.push(
            window.setTimeout(() => {
              const last = i === words.length - 1;
              setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: words.slice(0, i + 1).join(" "), action: last ? a.action : undefined } : x)));
              if (last) playSound("confirm");
            }, i * 32),
          ),
        );
      }, 650),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Chiudi l'assistente" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/10 backdrop-blur-[4px]" />
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="absolute top-[90px] right-[18px] bottom-[10px] flex w-[410px] flex-col overflow-hidden rounded-[22px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-center gap-[10px] border-b border-line px-[16px] py-[12px]">
                <div className="-my-[6px]">
                  <Mascot size={38} />
                </div>
                <div className="leading-tight">
                  <p className="text-[14px] font-bold">Coach, il tuo assistente</p>
                  <p className="text-[11px] text-muted">Conosce clienti, pagamenti, agenda e l’app</p>
                </div>
                <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="ml-auto grid size-[30px] cursor-pointer place-items-center rounded-full bg-soft">
                  <X size={14} />
                </button>
              </div>

              <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] py-[14px] [scrollbar-width:none]">
                {messages.length === 0 && (
                  <div className="mx-auto mt-[10px] max-w-[300px] text-center">
                    <p className="text-[15px] font-bold">Ciao {trainer.name.split(" ")[0]}! 👋</p>
                    <p className="mt-[6px] text-[12px] leading-relaxed text-muted">Chiedimi qualcosa sui tuoi clienti, sui pagamenti o su come si usa l’app. Leggo i dati della tua dashboard.</p>
                  </div>
                )}
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className={`flex max-w-[86%] flex-col ${m.from === "trainer" ? "items-end self-end" : "items-start self-start"}`}
                  >
                    <p className={`rounded-[16px] px-[12px] py-[8px] text-[12.5px] leading-relaxed ${m.from === "trainer" ? "rounded-br-[6px] bg-contrast text-on-contrast" : "rounded-bl-[6px] bg-soft"}`}>{m.text}</p>
                    {m.action && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                        <Link
                          href={m.action.href}
                          onClick={() => {
                            playSound("tap");
                            setOpen(false);
                          }}
                          className="mt-[6px] flex items-center gap-[5px] rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold text-white"
                          style={{ background: "var(--trainer)" }}
                        >
                          {m.action.label} <ArrowRight size={12} />
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
                {typing && (
                  <div className="flex gap-[4px] self-start rounded-[16px] bg-soft px-[12px] py-[11px]">
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="size-[6px] rounded-full bg-ink/40" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-[6px] px-[16px] pb-[10px]">
                {suggestions.map((s) => (
                  <motion.button key={s} type="button" whileTap={{ scale: 0.95 }} onClick={() => ask(s)} className="cursor-pointer rounded-full border border-line px-[10px] py-[5px] text-[11px] font-medium hover:bg-soft">
                    {s}
                  </motion.button>
                ))}
              </div>
              <form onSubmit={submit} className="mx-[14px] mb-[14px] flex items-center gap-[8px] rounded-full border border-line py-[5px] pr-[5px] pl-[14px]">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Chiedi al Coach…" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
                <motion.button type="submit" aria-label="Invia" whileTap={{ scale: 0.9 }} className="grid size-[32px] shrink-0 cursor-pointer place-items-center rounded-full bg-contrast text-on-contrast">
                  <ArrowUp size={15} />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <div className="absolute right-[20px] bottom-[8px] z-40 flex items-end gap-[6px]">
          <AnimatePresence mode="wait">
            {bubble && (
              <motion.button
                key={teaser}
                type="button"
                onClick={() => {
                  playSound("tap");
                  setOpen(true);
                }}
                initial={{ opacity: 0, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                className="relative mb-[58px] max-w-[190px] origin-bottom-right cursor-pointer rounded-[16px] rounded-br-[4px] border border-line bg-card px-[12px] py-[9px] text-left text-[11.5px] leading-snug font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.14)]"
              >
                {teasers[teaser]}
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            aria-label="Apri l'assistente"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              playSound("tap");
              setOpen(true);
            }}
            className="relative cursor-pointer"
          >
            <motion.span
              className="absolute bottom-[10px] left-1/2 size-[60px] -translate-x-1/2 rounded-full"
              style={{ background: "var(--trainer)" }}
              animate={{ scale: [0.8, 1.3], opacity: [0.25, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Mascot size={66} waving />
          </motion.button>
        </div>
      )}
    </>
  );
}
