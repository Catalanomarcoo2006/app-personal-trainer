"use client";

import { FormEvent, KeyboardEvent, PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  animate,
  AnimatePresence,
  motion,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
} from "motion/react";
import { ArrowRight, ArrowUp, CalendarDays, Hand, TriangleAlert, Trophy, Wallet, X, type LucideIcon } from "lucide-react";
import { EASE_OUT, formatEuro } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, clientById, clients, revenue, TODAY_INDEX, trainer } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";

// ——— Misure, in px della tela ———

const FLOOR = 14; // i piedi poggiano 14 px sopra il bordo inferiore, dentro le schede
const STAND_RATIO = 357 / 577; // larghezza / altezza di in-piedi.webp
const LIE_W = 230;
const LIE_H = Math.round((LIE_W * 273) / 690); // sdraiato.webp
const DOCK_RIGHT = 74; // centro del posto in piedi, dal bordo destro
const DOCK_ZONE = 270; // rilasciato negli ultimi 270 px a destra: torna in piedi al suo posto
const LIE_MIN = 128; // centro minimo da sdraiato: la testa non esce dalla tela
const PANEL_W = 410;
const PANEL_GAP = 54; // distanza tra il pannello e il centro del Coach in piedi accanto
const BUTTON_X = 44; // centro del tasto nelle altre pagine, sotto la barra laterale

const MOVE = { type: "spring" as const, stiffness: 200, damping: 25 };
const FALL = { type: "spring" as const, stiffness: 320, damping: 24 };
const POP = { type: "spring" as const, duration: 0.5, bounce: 0.3 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type Pose = "standing" | "lying";
type Spot = { pose: "standing" } | { pose: "lying"; x: number };
type Side = "left" | "right";

// Dove riposa il Coach sulla home: resta nel browser del trainer.
const STORAGE_KEY = "coach-posto";
function readSpot(): Spot {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (v?.pose === "lying" && typeof v.x === "number") return { pose: "lying", x: v.x };
  } catch {}
  return { pose: "standing" };
}
function saveSpot(spot: Spot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spot));
  } catch {}
}

// ——— Il viso, per il tasto e l'intestazione della chat: i capelli escono dal cerchio ———

export function CoachFace({ size }: { size: number }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={{ background: "color-mix(in srgb, var(--trainer) 22%, var(--color-card))" }} />
      <span
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{ height: size * 1.3, clipPath: `inset(0 0 0 0 round ${size * 0.3}px ${size * 0.3}px ${size / 2}px ${size / 2}px)` }}
      >
        <img
          src="/prototipo/coach/viso.webp"
          alt=""
          draggable={false}
          className="absolute left-1/2 max-w-none -translate-x-1/2 select-none"
          style={{ width: size * 1.26, bottom: -size * 0.13 }}
        />
      </span>
    </span>
  );
}

// ——— Le risposte, calcolate dai dati ———

type Answer = { text: string; action?: { label: string; href: string } };

const names = (ids: string[]) => ids.map((id) => clientById(id)?.name).filter(Boolean).join(" e ");
const openPayments = clients.flatMap((c) => c.payments.filter((p) => !p.paid).map((p) => ({ c, p })));
const openTotal = openPayments.reduce((s, x) => s + x.p.amount, 0);

function answer(question: string): Answer {
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

// ——— Le vignette ———

type Speech = { text: string; icon?: LucideIcon; alert?: boolean; ask?: string };

const firstName = trainer.name.split(" ")[0];

// Quattro vignette dai dati della giornata, una alla volta, poi il Coach tace.
const tips: Speech[] = [
  { icon: CalendarDays, text: `Ciao ${firstName}! Oggi hai ${agenda[TODAY_INDEX].length} appuntamenti, il prossimo alle 11:00 con Antonella.`, ask: "Chi ho in agenda oggi?" },
  { icon: TriangleAlert, alert: true, text: "Luca ha segnalato fastidio al ginocchio durante gli affondi.", ask: "Cosa ha segnalato Luca?" },
  { icon: Trophy, text: "Davide ha fatto il nuovo massimale di panca: 90 kg! 🎉", ask: "Com’è andata a Davide?" },
  { icon: Wallet, text: `${openPayments.length} pagamenti ancora aperti per ${formatEuro(openTotal)}. Te li riepilogo?`, ask: "Chi deve ancora pagare?" },
];

// Coda del fumetto: di base punta in basso a destra; si specchia in orizzontale e in verticale.
function Tail({ flipX, flipY, className }: { flipX?: boolean; flipY?: boolean; className: string }) {
  return (
    <svg viewBox="0 0 20 14" width={20} height={14} className={`absolute overflow-visible ${flipX ? "-scale-x-100" : ""} ${flipY ? "-scale-y-100" : ""} ${className}`} aria-hidden>
      <path d="M1 0 L13 0 C13 5 15 10 19 13 C13 12 7 8 1 0 Z" style={{ fill: "var(--color-card)" }} />
      <path d="M13 0.5 C13 5 15 10 19 13 C13 12 7 8 1 0.5" fill="none" style={{ stroke: "var(--color-line)" }} strokeWidth={1} strokeLinejoin="round" />
    </svg>
  );
}

function Bubble({ speech, place, onAsk }: { speech: Speech & { id: number }; place: "head-left" | "head-right" | "above"; onAsk: (q?: string) => void }) {
  const Icon = speech.icon;
  const words = speech.text.split(" ");
  const toRight = place !== "head-left";
  const below = place !== "above"; // accanto al petto: la coda sale verso il viso
  return (
    <motion.button
      type="button"
      onClick={() => onAsk(speech.ask)}
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: EASE_OUT } }}
      transition={POP}
      style={{ transformOrigin: `${toRight ? "0%" : "100%"} ${below ? "0%" : "100%"}` }}
      className="pointer-events-auto relative w-max max-w-[228px] cursor-pointer rounded-[18px] border border-line bg-card px-[12px] py-[10px] text-left [filter:drop-shadow(0_12px_22px_rgba(0,0,0,0.13))]"
    >
      <span className="flex items-start gap-[8px]">
        {Icon && (
          <span
            className="mt-[1px] grid size-[24px] shrink-0 place-items-center rounded-full"
            style={
              speech.alert
                ? { background: "rgba(229,72,77,0.12)", color: "#e5484d" }
                : { background: "color-mix(in srgb, var(--trainer) 14%, transparent)", color: "var(--trainer)" }
            }
          >
            <Icon size={13} strokeWidth={2.2} />
          </span>
        )}
        <span className="text-[12px] leading-snug font-semibold text-ink">
          {words.map((w, i) => (
            <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.035, duration: 0.2 }}>
              {w}{" "}
            </motion.span>
          ))}
        </span>
      </span>
      {speech.ask && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 + words.length * 0.035, duration: 0.25 }}
          className="mt-[6px] ml-[32px] flex items-center gap-[4px] text-[10.5px] font-bold"
          style={{ color: "var(--trainer)" }}
        >
          Chiedi al Coach <ArrowRight size={11} strokeWidth={2.4} />
        </motion.span>
      )}
      <Tail flipX={toRight} flipY={below} className={`${below ? "-top-[13px]" : "-bottom-[13px]"} ${toRight ? "left-[16px]" : "right-[16px]"}`} />
    </motion.button>
  );
}

// Nuvolette di polvere quando si sdraia.
function Dust() {
  return (
    <>
      {[-104, -68, -30, 18, 60, 98].map((dx, i) => (
        <motion.span
          key={dx}
          className="absolute bottom-[-4px] rounded-full bg-ink/12"
          style={{ left: dx - 9, width: 14 + (i % 3) * 4, height: 14 + (i % 3) * 4 }}
          initial={{ opacity: 0.6, scale: 0.4, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 1.4, x: Math.sign(dx) * 16, y: -10 }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.02 }}
        />
      ))}
    </>
  );
}

// ——— La chat ———

type Msg = { id: number; from: "trainer" | "coach"; text: string; action?: Answer["action"] };

function ChatPanel({
  side,
  messages,
  typing,
  ask,
  close,
}: {
  side: Side;
  messages: Msg[];
  typing: boolean;
  ask: (q: string) => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const from = side === "right" ? 40 : -40;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  return (
    <motion.div
      initial={{ x: from, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: from, opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={`absolute top-[90px] bottom-[10px] z-50 flex flex-col overflow-hidden rounded-[22px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.22)] ${side === "right" ? "right-[18px]" : "left-[84px]"}`}
      style={{ width: PANEL_W }}
    >
      <div className="flex items-center gap-[10px] border-b border-line px-[16px] py-[12px]">
        <CoachFace size={36} />
        <div className="leading-tight">
          <p className="text-[14px] font-bold">Coach, il tuo assistente</p>
          <p className="text-[11px] text-muted">Conosce clienti, pagamenti, agenda e l’app</p>
        </div>
        <button type="button" aria-label="Chiudi" onClick={close} className="ml-auto grid size-[30px] cursor-pointer place-items-center rounded-full bg-soft">
          <X size={14} />
        </button>
      </div>

      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] py-[14px] [scrollbar-width:none]">
        {messages.length === 0 && (
          <div className="mx-auto mt-[10px] max-w-[300px] text-center">
            <p className="text-[15px] font-bold">Ciao {firstName}! 👋</p>
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
                    close();
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
  );
}

// ——— Il tasto delle altre pagine, sotto la barra laterale ———

function CoachButton({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      type="button"
      aria-label="Chiedi al Coach, il tuo assistente"
      onClick={onOpen}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={hidden ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.25, delay: hidden ? 0 : 0.2 }}
      whileTap={{ scale: 0.92 }}
      className={`glass glass-3d absolute bottom-[12px] left-[22px] z-40 grid size-[44px] cursor-pointer place-items-center rounded-full ${hidden ? "pointer-events-none" : ""}`}
    >
      {/* due onde di colore all'arrivo nella pagina, poi ferme */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 0 2px var(--trainer)" }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [0, 0.55, 0], scale: [1, 1.35, 1.5] }}
        transition={{ duration: 1.4, delay: 0.8, repeat: 1, repeatDelay: 0.4, ease: EASE_OUT }}
      />
      <motion.span animate={{ y: hover ? -2 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 26 }}>
        <CoachFace size={34} />
      </motion.span>
      <AnimatePresence>
        {hover && !hidden && (
          <motion.span
            initial={{ opacity: 0, scale: 0.97, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="glass pointer-events-none absolute top-1/2 left-[52px] origin-left -translate-y-1/2 rounded-full px-[11px] py-[5px] text-[11px] font-semibold whitespace-nowrap text-ink"
          >
            Chiedi al Coach
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ——— Il Coach ———

export function CoachAssistant() {
  const home = usePathname() === ROUTES.oggi;
  const reduce = useReducedMotion();
  const layer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1303, h: 640 });

  useLayoutEffect(() => {
    const el = layer.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // In piedi cresce con l'altezza della tela; sulle tele basse la testa sfiora l'ultimo messaggio (Davide Greco).
  const standH = Math.round(clamp(size.h - 500, 132, 168));
  const standW = Math.round(standH * STAND_RATIO);

  const [rest, setRest] = useState<Spot>(() => (typeof window === "undefined" ? { pose: "standing" } : readSpot()));
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;
  const [out, setOut] = useState(home); // nelle altre pagine il Coach è fuori solo a chat aperta
  const [pose, setPose] = useState<Pose>(home ? rest.pose : "standing");
  const [dragging, setDragging] = useState(false);
  const [inDock, setInDock] = useState(false);
  const [dust, setDust] = useState(0);
  const [hover, setHover] = useState(false);

  const restX = (spot: Spot) => (spot.pose === "lying" ? clamp(spot.x, LIE_MIN, size.w - DOCK_ZONE - LIE_W / 2) : size.w - DOCK_RIGHT);
  const side: Side = home && !(rest.pose === "lying" && rest.x < size.w / 2) ? "right" : "left";
  const besidePanel = side === "right" ? size.w - 18 - PANEL_W - PANEL_GAP : 84 + PANEL_W + PANEL_GAP;

  // Posizione: x è il centro della figura sul pavimento; y e lift lo sollevano; pop lo fa uscire dal tasto.
  const x = useMotionValue(home ? restX(rest) : BUTTON_X);
  const y = useMotionValue(0);
  const lift = useMotionValue(0);
  const pop = useMotionValue(home ? 0.9 : 0.35);
  const fade = useMotionValue(0);
  const held = useMotionValue(0);
  const height = useTransform(() => y.get() + lift.get());
  const vx = useVelocity(x);
  // Mentre lo porti dondola come tenuto per le spalle, in ritardo sul movimento.
  const swing = useSpring(
    useTransform(() => (held.get() || height.get() < -4 ? clamp(vx.get() * 0.009, -15, 15) : 0)),
    { stiffness: 240, damping: 13 },
  );
  const shadowOpacity = useTransform(height, [-220, 0], [0.04, 1]);
  const shadowScale = useTransform(height, [-220, 0], [0.55, 1]);

  const moves = useRef<AnimationPlaybackControls[]>([]);
  const stopMoves = () => {
    moves.current.forEach((c) => c.stop());
    moves.current = [];
  };
  const move = (to: number, velocity = 0) => moves.current.push(animate(x, to, reduce ? { duration: 0 } : { ...MOVE, velocity }));

  // ——— Vignette ———
  const [speech, setSpeech] = useState<(Speech & { id: number }) | null>(null);
  const speechId = useRef(1);
  const speechTimer = useRef<number | undefined>(undefined);
  const [hopScope, animateHop] = useAnimate();

  const say = useCallback((s: Speech | null, ms = 5200) => {
    window.clearTimeout(speechTimer.current);
    setSpeech(s ? { ...s, id: speechId.current++ } : null);
    if (s && ms > 0) speechTimer.current = window.setTimeout(() => setSpeech(null), ms);
  }, []);

  const nextTip = useRef(0);
  const [tipTick, setTipTick] = useState(0);
  useEffect(() => {
    if (!home || open || dragging || nextTip.current >= tips.length) return;
    const t = window.setTimeout(
      () => {
        say(tips[nextTip.current]);
        nextTip.current++;
        setTipTick((n) => n + 1);
        // un saltello per richiamare lo sguardo sulla vignetta
        if (!reduce && hopScope.current)
          animateHop(hopScope.current, { y: [0, -8, 0], scaleY: [1, 1.03, 1] }, { duration: 0.45, ease: EASE_OUT });
      },
      nextTip.current === 0 ? 1800 : 7000,
    );
    return () => window.clearTimeout(t);
  }, [home, open, dragging, tipTick, say, reduce, animateHop, hopScope]);

  useEffect(() => () => window.clearTimeout(speechTimer.current), []);

  // Sulla home entra con un piccolo salto dopo le schede.
  useEffect(() => {
    if (!home) return;
    const c = [animate(fade, 1, { duration: 0.3, delay: 0.6 }), animate(pop, 1, { ...POP, delay: 0.6 })];
    return () => c.forEach((a) => a.stop());
  }, [home, fade, pop]);

  // Al primo passaggio del mouse spiega che si può spostare.
  const hinted = useRef(false);
  const hint = () => {
    setHover(true);
    if (hinted.current || speech || open) return;
    hinted.current = true;
    say({ icon: Hand, text: "Toccami per chiedere, o trascinami dove vuoi." }, 3400);
  };

  // ——— Cambi di posa ———
  const poseTimer = useRef<number | undefined>(undefined);
  const setPoseLater = (p: Pose, ms: number) => {
    window.clearTimeout(poseTimer.current);
    poseTimer.current = window.setTimeout(() => {
      setPose(p);
      if (p === "lying") {
        setDust((n) => n + 1);
        playSound("tap");
      }
    }, ms);
  };
  useEffect(() => () => window.clearTimeout(poseTimer.current), []);

  // ——— La chat ———
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || typing) return;
    playSound("tap");
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

  // Aprendo la chat il Coach si alza e va accanto al pannello; nelle altre pagine salta fuori dal tasto.
  const openChat = (question?: string) => {
    if (open) return;
    playSound("tap");
    say(null);
    setOpen(true);
    stopMoves();
    if (home) {
      setPoseLater("standing", 0);
      move(besidePanel);
    } else {
      setOut(true);
      setPose("standing");
      x.set(BUTTON_X);
      y.set(0);
      pop.set(reduce ? 1 : 0.35);
      moves.current.push(
        animate(fade, 1, { duration: 0.15 }),
        animate(pop, 1, POP),
        animate(y, 0, reduce ? { duration: 0 } : { ...FALL, velocity: -1100 }),
      );
      move(besidePanel);
    }
    if (question) timers.current.push(window.setTimeout(() => ask(question), 450));
  };

  const closeChat = () => {
    setOpen(false);
    stopMoves();
    if (home) {
      move(restX(rest));
      if (rest.pose === "lying") setPoseLater("lying", reduce ? 0 : 420);
    } else {
      move(BUTTON_X);
      moves.current.push(
        animate(y, 0, reduce ? { duration: 0 } : { ...FALL, velocity: -700 }),
        animate(pop, 0.35, { duration: 0.35, ease: EASE_OUT, delay: 0.2 }),
      );
      const f = animate(fade, 0, { duration: 0.18, delay: 0.38 });
      moves.current.push(f);
      f.then(() => {
        if (!openRef.current) setOut(false);
      });
    }
  };

  // Se cambia la tela (finestra ridimensionata), il Coach torna al suo posto senza animazione.
  useEffect(() => {
    if (!home || dragging || open) return;
    x.set(restX(rest));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w]);

  // ——— Trascinamento (a mano: la tela usa CSS zoom e i delta vanno divisi per lo zoom) ———
  const drag = useRef<{ cx: number; cy: number; x: number; y: number; zoom: number; moved: boolean } | null>(null);

  const placeFor = (center: number): Spot =>
    center > size.w - DOCK_ZONE ? { pose: "standing" } : { pose: "lying", x: clamp(center, LIE_MIN, size.w - DOCK_ZONE - LIE_W / 2) };

  const dropAt = (spot: Spot, velocity = 0) => {
    setRest(spot);
    saveSpot(spot);
    stopMoves();
    move(restX(spot), velocity);
    const airborne = height.get() < -40;
    moves.current.push(animate(y, 0, reduce ? { duration: 0 } : { ...FALL, velocity: y.getVelocity() }), animate(lift, 0, reduce ? { duration: 0 } : FALL));
    if (spot.pose === "lying") {
      setPoseLater("lying", reduce ? 0 : airborne ? 260 : 110);
      say({ text: "Mi stendo un attimo qui 😌" }, 2600);
    } else {
      setPoseLater("standing", 0);
      say({ text: "Eccomi, si riparte! 💪" }, 2600);
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!home || open || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const el = layer.current;
    const zoom = el ? el.getBoundingClientRect().width / el.offsetWidth || 1 : 1;
    drag.current = { cx: e.clientX, cy: e.clientY, x: x.get(), y: y.get(), zoom, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.cx) / d.zoom;
    const dy = (e.clientY - d.cy) / d.zoom;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      d.moved = true;
      stopMoves();
      window.clearTimeout(poseTimer.current);
      held.set(1);
      setDragging(true);
      playSound("tap");
      say({ text: "Ehi! Dove mi porti? 😮" }, 0);
      moves.current.push(animate(lift, reduce ? 0 : -18, POP));
    }
    x.set(clamp(d.x + dx, 50, size.w - 50));
    y.set(clamp(d.y + dy, -(size.h - standH - 60), 0));
    const dock = x.get() > size.w - DOCK_ZONE;
    if (dock !== inDock) setInDock(dock);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      openChat();
      return;
    }
    held.set(0);
    setDragging(false);
    setInDock(false);
    const v = x.getVelocity();
    const spot = placeFor(x.get() + v * 0.12); // un lancio conta: guarda dove sarebbe arrivato
    if (spot.pose === "lying") setPose("standing"); // resta in piedi finché non tocca terra
    dropAt(spot, v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openChat();
    } else if (e.key === "ArrowLeft" && rest.pose === "standing") {
      dropAt({ pose: "lying", x: 200 });
    } else if (e.key === "ArrowRight" && rest.pose === "lying") {
      dropAt({ pose: "standing" });
    }
  };

  const shown: Pose = dragging ? "standing" : pose;
  const visible = home || out;

  // La vignetta: sopra la testa da sdraiato; in piedi a sinistra della testa (a destra se è vicino al bordo sinistro).
  const bubblePlace = shown === "lying" ? "above" : x.get() < 330 ? "head-right" : "head-left";

  return (
    <>
      {/* il pannello e il suo velo: il Coach sta tra i due, nitido sopra la sfocatura */}
      <AnimatePresence>
        {open && (
          <motion.button
            key="velo"
            type="button"
            aria-label="Chiudi l'assistente"
            onClick={closeChat}
            className="absolute inset-0 z-[45] bg-black/10 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{open && <ChatPanel key="chat" side={side} messages={messages} typing={typing} ask={ask} close={closeChat} />}</AnimatePresence>

      {!home && <CoachButton hidden={open || out} onOpen={() => openChat()} />}

      <div ref={layer} className="pointer-events-none absolute inset-0 z-[46]">
        {/* il posto in piedi, mentre lo trascini */}
        <AnimatePresence>
          {dragging && (
            <motion.span
              key="posto"
              aria-hidden
              className="absolute h-[18px] w-[96px] rounded-[50%] border-2 border-dashed"
              style={{ left: size.w - DOCK_RIGHT - 48, bottom: FLOOR - 9, borderColor: "var(--trainer)" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: inDock ? 0.9 : 0.35, scale: inDock ? 1.08 : 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
            />
          )}
        </AnimatePresence>

        {visible && (
          <motion.div className="absolute left-0" style={{ x, bottom: FLOOR, opacity: fade }}>
            {/* ombra sul pavimento: si stringe e sbiadisce quando lo sollevi */}
            <motion.div className="absolute bottom-[-7px] left-[-110px] h-[14px] w-[220px]" style={{ opacity: shadowOpacity, scale: shadowScale }}>
              <motion.div
                className="size-full rounded-[50%] bg-black/25 blur-[6px] dark:bg-black/60"
                initial={false}
                animate={{ scaleX: shown === "lying" ? 0.95 : 0.36, opacity: shown === "lying" ? 0.8 : 1 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              />
            </motion.div>

            <AnimatePresence>
              {dust > 0 && (
                <motion.div key={dust} className="absolute bottom-0 left-0" exit={{ opacity: 0 }}>
                  <Dust />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div style={{ y: height, scale: pop, originY: 1 }}>
              <motion.div style={{ rotate: swing, transformOrigin: `0px ${-standH * 0.82}px` }} className="relative">
                <div ref={hopScope} className="relative" style={{ transformOrigin: "50% 100%" }}>
                  {/* respiro a riposo */}
                  <motion.div
                    className="relative"
                    style={{ originY: 1 }}
                    animate={dragging || open ? { scaleY: 1 } : { scaleY: [1, shown === "lying" ? 1.02 : 1.012, 1] }}
                    transition={dragging || open ? { duration: 0.2 } : { duration: shown === "lying" ? 4.2 : 3.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.img
                      src="/prototipo/coach/in-piedi.webp"
                      alt=""
                      draggable={false}
                      className="absolute bottom-0 max-w-none select-none"
                      style={{ width: standW, left: -standW / 2, originX: 0.5, originY: 1 }}
                      initial={false}
                      animate={shown === "standing" ? { opacity: 1, rotate: hover && !dragging && !open ? -3 : 0 } : { opacity: 0, rotate: -78 }}
                      transition={
                        shown === "standing"
                          ? { rotate: { type: "spring", duration: 0.6, bounce: 0.35 }, opacity: { duration: 0.12 } }
                          : { rotate: { duration: 0.36, ease: [0.77, 0, 0.175, 1] }, opacity: { duration: 0.16, delay: 0.16 } }
                      }
                    />
                    <motion.img
                      src="/prototipo/coach/sdraiato.webp"
                      alt=""
                      draggable={false}
                      className="absolute bottom-0 max-w-none select-none"
                      style={{ width: LIE_W, left: -LIE_W / 2, originX: 0.5, originY: 1 }}
                      initial={false}
                      animate={shown === "lying" ? { opacity: 1, scaleY: 1, y: 0 } : { opacity: 0, scaleY: 0.86, y: -10 }}
                      transition={
                        shown === "lying"
                          ? { opacity: { duration: 0.2, delay: 0.18 }, scaleY: { type: "spring", duration: 0.55, bounce: 0.4, delay: 0.18 }, y: { type: "spring", duration: 0.5, bounce: 0.3, delay: 0.18 } }
                          : { duration: 0.12 }
                      }
                    />
                  </motion.div>

                  {/* zona da afferrare: segue la sagoma, così gli angoli vuoti non coprono la pagina */}
                  {home && (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Coach, il tuo assistente. Invio per fargli una domanda, frecce per spostarlo."
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      onKeyDown={onKeyDown}
                      onMouseEnter={hint}
                      onMouseLeave={() => setHover(false)}
                      className={`pointer-events-auto absolute bottom-0 touch-none rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--trainer)] ${
                        open ? "pointer-events-none" : dragging ? "cursor-grabbing" : "cursor-grab"
                      }`}
                      style={
                        shown === "lying"
                          ? { width: LIE_W, height: LIE_H, left: -LIE_W / 2, clipPath: "polygon(0% 10%, 22% 0%, 30% 25%, 55% 33%, 98% 55%, 100% 100%, 0% 100%)" }
                          : {
                              width: standW,
                              height: standH,
                              left: -standW / 2,
                              clipPath: "polygon(26% 0%, 66% 0%, 68% 24%, 100% 24%, 100% 52%, 70% 50%, 74% 100%, 22% 100%, 26% 72%, 0% 72%, 0% 58%, 24% 30%)",
                            }
                      }
                    />
                  )}
                </div>
              </motion.div>

              {/* vignetta: in piedi accanto al petto (non copre l'ultimo messaggio), da sdraiato sopra la testa */}
              <div
                className={`absolute w-max ${bubblePlace === "above" ? "" : "translate-y-full"}`}
                style={
                  bubblePlace === "above"
                    ? { bottom: LIE_H + 10, left: -LIE_W / 2 + 30 }
                    : bubblePlace === "head-left"
                      ? { bottom: standH * 0.68, right: standW * 0.16 }
                      : { bottom: standH * 0.68, left: standW * 0.16 }
                }
              >
                <AnimatePresence mode="wait">
                  {speech && !open && <Bubble key={speech.id} speech={speech} place={bubblePlace} onAsk={(q) => openChat(q)} />}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}
