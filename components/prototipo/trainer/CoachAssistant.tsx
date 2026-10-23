"use client";

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUp, CalendarDays, Hand, TriangleAlert, Trophy, Wallet, X, type LucideIcon } from "lucide-react";
import { EASE_OUT, formatEuro } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, clientById, clients, revenue, TODAY_INDEX, trainer } from "@/libs/prototipo/dati-finti";
import { estraiAzione, ripristinaNomi, type Sezione } from "@/libs/prototipo/leo-contesto";
import { navigateWithStain, ROUTES } from "./nav";
import { InfoSparkle, LeoIdentikit, preloadLeoSeduto } from "./LeoIdentikit";
import { infoSeen, INTRO_LAST, introSeen, LeoPresentazione, setInfoSeen, setIntroSeen } from "./LeoPresentazione";

// L'assistente del trainer si chiama Leo.
export const COACH_NAME = "Leo";

// ——— Misure, in px della tela ———

// Chat chiusa: Leo in piedi nell'angolo in basso a destra della home (in-piedi.webp).
const STAND_RATIO = 294 / 640; // larghezza / altezza di in-piedi.webp
const STAND_RIGHT = 74; // centro della figura, dal bordo destro della tela
const FLOOR = 14; // i piedi poggiano 14 px sopra il bordo inferiore

// Chat aperta: Leo si sporge dal bordo destro della chat, aggrappato con le mani (spunta.webp).
const LEAN_W = 112;
const LEAN_H = Math.round(LEAN_W / (385 / 560));
const LEAN_EDGE = 0.1276; // dove cade il bordo a cui si tiene, in frazione della larghezza: a sinistra le dita, a destra il corpo
const LEAN_BODY = Math.round(LEAN_W * (1 - LEAN_EDGE)); // quanto spazio occupa a destra della chat
const LEAN_BOTTOM = 26; // distanza dal fondo della chat

const PANEL_W = 410;
const PANEL_TOP = 112;
const PANEL_LEFT_MIN = 84; // a destra della barra laterale

const POP = { type: "spring" as const, duration: 0.5, bounce: 0.3 };

// Leo sulla home si illumina a intervalli per dire che si può toccare: 1,4 s di luce, poi 2,2 s di pausa.
const PULSE = { duration: 1.4, pause: 2.2, first: 1.6 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ——— Il viso, per il tasto delle altre pagine: i capelli escono dal cerchio ———

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
          className="leo-luce-viso absolute left-1/2 max-w-none -translate-x-1/2 select-none"
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

const suggestions = ["Chi deve ancora pagare?", "Chi non si allena da una settimana?", "Chi ho in agenda oggi?", "Quanto ho incassato a ottobre?", "Chi ha il pacchetto in scadenza?", "Come collego i video agli esercizi?"];

// ——— Vignette e novità ———

type Speech = { text: string; icon?: LucideIcon; alert?: boolean; ask?: string };

const firstName = trainer.name.split(" ")[0];

const lucaTip: Speech = { icon: TriangleAlert, alert: true, text: "Luca ha segnalato fastidio al ginocchio durante gli affondi.", ask: "Cosa ha segnalato Luca?" };
const paymentsTip: Speech = { icon: Wallet, text: `${openPayments.length} pagamenti ancora aperti per ${formatEuro(openTotal)}. Te li riepilogo?`, ask: "Chi deve ancora pagare?" };

// Quattro vignette dai dati della giornata, una alla volta, poi Leo tace.
const tips: Speech[] = [
  { icon: CalendarDays, text: `Ciao ${firstName}! Oggi hai ${agenda[TODAY_INDEX].length} appuntamenti, il prossimo alle 11:00 con Antonella.`, ask: "Chi ho in agenda oggi?" },
  lucaTip,
  { icon: Trophy, text: "Davide ha fatto il nuovo massimale di panca: 90 kg! 🎉", ask: "Com’è andata a Davide?" },
  paymentsTip,
];

// Le cose che richiedono il trainer: fanno illuminare il tasto di Leo finché non apre la chat.
const novita: Speech[] = [lucaTip, paymentsTip];
let novitaViste = false;
// Quante vignette della home sono già uscite: tornando sulla home non ricominciano da capo.
const tipCursor = { shown: 0 };

// Coda del fumetto: di base punta in basso a destra; si specchia in orizzontale e in verticale.
function Tail({ flipX, flipY, className }: { flipX?: boolean; flipY?: boolean; className: string }) {
  return (
    <svg viewBox="0 0 20 14" width={20} height={14} className={`absolute overflow-visible ${flipX ? "-scale-x-100" : ""} ${flipY ? "-scale-y-100" : ""} ${className}`} aria-hidden>
      <path d="M1 0 L13 0 C13 5 15 10 19 13 C13 12 7 8 1 0 Z" style={{ fill: "var(--color-card)" }} />
      <path d="M13 0.5 C13 5 15 10 19 13 C13 12 7 8 1 0.5" fill="none" style={{ stroke: "var(--color-line)" }} strokeWidth={1} strokeLinejoin="round" />
    </svg>
  );
}

function SpeechIcon({ speech, size = 24 }: { speech: Speech; size?: number }) {
  const Icon = speech.icon;
  if (!Icon) return null;
  return (
    <span
      className="mt-[1px] grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        ...(speech.alert ? { background: "rgba(229,72,77,0.12)", color: "#e5484d" } : { background: "color-mix(in srgb, var(--trainer) 14%, transparent)", color: "var(--trainer)" }),
      }}
    >
      <Icon size={size * 0.54} strokeWidth={2.2} />
    </span>
  );
}

function Bubble({ speech, place, onAsk }: { speech: Speech & { id: number }; place: "head-left" | "head-right" | "above"; onAsk: (q?: string) => void }) {
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
        <SpeechIcon speech={speech} />
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
          Chiedi a {COACH_NAME} <ArrowRight size={11} strokeWidth={2.4} />
        </motion.span>
      )}
      <Tail flipX={toRight} flipY={below} className={`${below ? "-top-[13px]" : "-bottom-[13px]"} ${toRight ? "left-[16px]" : "right-[16px]"}`} />
    </motion.button>
  );
}

// ——— La chat (resta mentre si cambia pagina) ———

type Msg = { id: number; from: "trainer" | "coach"; text: string; action?: Answer["action"] };
type Chat = { messages: Msg[]; typing: boolean; thinking: boolean; ask: (q: string) => void };
type Turn = { role: "user" | "assistant"; content: string };

const sectionLinks: Record<Exclude<Sezione, "cliente">, NonNullable<Answer["action"]>> = {
  oggi: { label: "Apri Oggi", href: ROUTES.oggi },
  clienti: { label: "Vedi i clienti", href: ROUTES.clienti },
  messaggi: { label: "Apri Messaggi", href: ROUTES.messaggi },
  schede: { label: "Apri Schede", href: ROUTES.schede },
  calendario: { label: "Apri Calendario", href: ROUTES.calendario },
  incassi: { label: "Apri Incassi", href: ROUTES.incassi },
  impostazioni: { label: "Apri Impostazioni", href: ROUTES.impostazioni },
};

// Il tasto proposto dall'AI ([[vai:…]]) diventa un link alla sezione o al profilo del cliente.
function actionFor(vai: ReturnType<typeof estraiAzione>["vai"]): Answer["action"] {
  if (!vai) return undefined;
  if (vai.sezione !== "cliente") return sectionLinks[vai.sezione];
  const c = vai.clienteId ? clientById(vai.clienteId) : undefined;
  return c ? { label: `Apri il profilo di ${c.name.split(" ")[0]}`, href: ROUTES.cliente(c.id) } : undefined;
}

// Le risposte arrivano dall'AI (app/prototipo/api/leo) e si scrivono man mano che arrivano.
// Senza chiave o se l'AI non risponde, Leo usa le risposte calcolate dai dati: la demo non si blocca mai.
function useCoachChat(): Chat {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const history = useRef<Turn[]>([]);
  const request = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      request.current?.abort();
    },
    [],
  );

  const ask = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy.current) return;
    busy.current = true;
    playSound("tap");
    setMessages((m) => [...m, { id: nextId.current++, from: "trainer", text }]);
    history.current = [...history.current, { role: "user", content: text }];
    setTyping(true);
    const id = nextId.current++;
    const thinkTimer = window.setTimeout(() => setThinking(true), 1200);

    const finish = (shown: string) => {
      history.current = [...history.current, { role: "assistant", content: shown }];
      busy.current = false;
      playSound("confirm");
    };
    const show = (shown: string, action?: Answer["action"]) =>
      setMessages((m) => (m.some((x) => x.id === id) ? m.map((x) => (x.id === id ? { ...x, text: shown, action } : x)) : [...m, { id, from: "coach", text: shown, action }]));

    const ctrl = new AbortController();
    request.current = ctrl;
    let raw = "";
    try {
      const res = await fetch("/prototipo/api/leo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.current.slice(-10) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`${res.status} ${((await res.json().catch(() => ({}))) as { errore?: string }).errore ?? ""}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        window.clearTimeout(thinkTimer);
        setTyping(false);
        setThinking(false);
        show(ripristinaNomi(estraiAzione(raw).text));
      }
      if (!raw.trim()) throw new Error("risposta vuota");
      const { text: final, vai } = estraiAzione(raw);
      show(ripristinaNomi(final), actionFor(vai));
      finish(ripristinaNomi(final));
    } catch (e) {
      window.clearTimeout(thinkTimer);
      setThinking(false);
      if (ctrl.signal.aborted) return;
      if (raw.trim()) {
        // interrotta a metà: resta quello che è arrivato
        finish(ripristinaNomi(estraiAzione(raw).text));
        return;
      }
      console.warn("Leo: AI non raggiungibile, uso le risposte di riserva.", e instanceof Error ? e.message : e);
      const a = answer(text);
      const words = a.text.split(" ");
      setTyping(false);
      words.forEach((_, i) =>
        timers.current.push(
          window.setTimeout(() => {
            const last = i === words.length - 1;
            show(words.slice(0, i + 1).join(" "), last ? a.action : undefined);
            if (last) finish(a.text);
          }, i * 28),
        ),
      );
    }
  }, []);

  return { messages, typing, thinking, ask };
}

// Leo che si sporge dal bordo destro della chat, aggrappato con le mani: esce da dietro la chat quando si apre.
function SidePeek() {
  return (
    <motion.img
      src="/prototipo/coach/spunta.webp"
      alt=""
      aria-hidden
      draggable={false}
      className="leo-luce pointer-events-none absolute max-w-none select-none"
      style={{ width: LEAN_W, height: LEAN_H, left: `calc(100% - ${Math.round(LEAN_W * LEAN_EDGE)}px)`, bottom: LEAN_BOTTOM }}
      initial={{ opacity: 0, x: -26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18, transition: { duration: 0.16, ease: EASE_OUT } }}
      transition={{ opacity: { duration: 0.2, delay: 0.16 }, x: { type: "spring", duration: 0.55, bounce: 0.3, delay: 0.16 } }}
    />
  );
}

// close: chiude con il suono (X, velo, Esc); dismiss: chiude in silenzio, sotto la macchia di un link di Leo.
function ChatPanel({
  left,
  origin,
  chat,
  close,
  dismiss,
  openInfo,
}: {
  left: number;
  origin: string;
  chat: Chat;
  close: () => void;
  dismiss: () => void;
  openInfo: () => void;
}) {
  const { messages, typing, thinking, ask: askChat } = chat;
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  // la prima volta Leo si presenta; scrivere una domanda vale come "salta"
  const [intro, setIntro] = useState(() => !introSeen());
  const [introStep, setIntroStep] = useState(0);
  const endIntro = () => {
    setIntroSeen(true);
    setIntro(false);
  };
  const ask = (q: string) => {
    if (intro) endIntro();
    askChat(q);
  };

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // le animazioni dell'identikit si scaricano mentre la chat è aperta: alla i sono già pronte
  useEffect(() => {
    const t = window.setTimeout(preloadLeoSeduto, 1200);
    return () => window.clearTimeout(t);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.98, transition: { duration: 0.22, ease: EASE_OUT, delay: 0.08 } }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      style={{ left, width: PANEL_W, top: PANEL_TOP, transformOrigin: origin }}
      className="absolute bottom-[10px] z-50"
      role="dialog"
      aria-label={`${COACH_NAME}, il tuo assistente`}
    >
      <SidePeek />
      <div className="relative flex size-full flex-col overflow-hidden rounded-[22px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-[10px] border-b border-line px-[16px] py-[12px]">
          <div className="leading-tight">
            <p className="flex items-center gap-[7px] text-[15px] font-bold">
              {COACH_NAME}
              <span className="flex items-center gap-[4px] rounded-full px-[7px] py-[2px] text-[10px] font-semibold" style={{ color: "var(--color-ok, #1f9d55)", background: "color-mix(in srgb, #1f9d55 12%, transparent)" }}>
                <span className="size-[5px] rounded-full bg-current" /> online
              </span>
              <InfoSparkle onClick={openInfo} inviting={!infoSeen()} strong={intro && introStep === INTRO_LAST} />
            </p>
            <p className="text-[11px] text-muted">Il tuo assistente: conosce clienti, pagamenti, agenda e app</p>
          </div>
          <button type="button" aria-label="Chiudi" onClick={close} className="ml-auto grid size-[30px] cursor-pointer place-items-center rounded-full bg-soft transition-colors hover:bg-line">
            <X size={14} />
          </button>
        </div>

        <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] py-[14px] [scrollbar-width:none]">
          {intro && <LeoPresentazione face={<CoachFace size={64} />} onStep={setIntroStep} onDone={endIntro} />}
          {!intro && messages.length === 0 && (
            <div className="mt-[2px]">
              <p className="text-[15px] font-bold">Ciao {firstName}! 👋</p>
              <p className="mt-[4px] text-[12px] leading-relaxed text-muted">
                Ho guardato la tua dashboard: ci sono {novita.length} cose che ti aspettano. Oppure chiedimi qualcosa qui sotto.
              </p>
              <div className="mt-[10px] flex flex-col gap-[6px]">
                {novita.map((n, i) => (
                  <motion.button
                    key={n.text}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.3, ease: EASE_OUT }}
                    onClick={() => n.ask && ask(n.ask)}
                    className="flex cursor-pointer items-center gap-[10px] rounded-[14px] border border-line px-[12px] py-[10px] text-left transition-colors hover:bg-soft"
                  >
                    <SpeechIcon speech={n} size={26} />
                    <span className="flex-1 text-[12px] leading-snug font-semibold">{n.text}</span>
                    <ArrowRight size={13} className="shrink-0 text-ink/40" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {!intro && messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className={`flex max-w-[86%] flex-col ${m.from === "trainer" ? "items-end self-end" : "items-start self-start"}`}
            >
              <p className={`rounded-[16px] px-[12px] py-[8px] text-[12.5px] leading-relaxed ${m.from === "trainer" ? "rounded-br-[6px] bubble-trainer" : "rounded-bl-[6px] bg-soft"}`}>{m.text}</p>
              {m.action && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  {/* la sezione nuova si allarga a macchia d'olio dal punto toccato; la chat si chiude sotto la macchia */}
                  <a
                    href={m.action.href}
                    data-macchia
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      const origin = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                      navigateWithStain(m.action!.href, origin, dismiss);
                    }}
                    className="mt-[6px] flex items-center gap-[5px] rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold text-white"
                    style={{ background: "var(--trainer)" }}
                  >
                    {m.action.label} <ArrowRight size={12} />
                  </a>
                </motion.div>
              )}
            </motion.div>
          ))}
          {typing && (
            <div className="flex items-center gap-[8px] self-start">
              <div className="flex gap-[4px] rounded-[16px] bg-soft px-[12px] py-[11px]">
                {[0, 1, 2].map((d) => (
                  <motion.span key={d} className="size-[6px] rounded-full bg-ink/40" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
                ))}
              </div>
              {thinking && (
                <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="text-[11px] text-muted">
                  {COACH_NAME} sta ragionando…
                </motion.span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-[6px] px-[16px] pb-[10px]">
          {!intro && suggestions.map((s) => (
            <motion.button key={s} type="button" whileTap={{ scale: 0.95 }} onClick={() => ask(s)} className="cursor-pointer rounded-full border border-line px-[10px] py-[5px] text-[11px] font-medium transition-colors hover:bg-soft">
              {s}
            </motion.button>
          ))}
        </div>
        <form onSubmit={submit} className="mx-[14px] mb-[14px] flex items-center gap-[8px] rounded-full border border-line py-[5px] pr-[5px] pl-[14px] focus-within:border-[color-mix(in_srgb,var(--trainer)_55%,transparent)]">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Chiedi a ${COACH_NAME}…`} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
          <motion.button type="submit" aria-label="Invia" whileTap={{ scale: 0.9 }} className="grid size-[32px] shrink-0 cursor-pointer place-items-center rounded-full btn-trainer">
            <ArrowUp size={15} />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

// ——— Il tasto delle altre pagine, sotto la barra laterale: alone che respira, si illumina quando ci sono novità ———

// La prima volta che si apre una sezione diversa dalla home, Leo saluta per farsi notare (una volta per visita).
let coachHintShown = false;

function CoachButton({ hidden, count, onOpen }: { hidden: boolean; count: number; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const [hint, setHint] = useState(false);
  const glowing = count > 0 && !hidden;

  useEffect(() => {
    if (coachHintShown || hidden) return;
    const timers = [
      window.setTimeout(() => {
        coachHintShown = true;
        setHint(true);
      }, 1400),
      window.setTimeout(() => setHint(false), 4800),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [hidden]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={hidden ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.25, delay: hidden ? 0 : 0.2 }}
      className={`absolute bottom-[12px] left-[19px] z-40 ${hidden ? "pointer-events-none" : ""}`}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      {/* alone nel colore del trainer, sempre acceso: Leo si vede anche fuori dalla home */}
      <motion.span
        aria-hidden
        className="leo-alone pointer-events-none absolute inset-[-16px] rounded-full"
        animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.94, 1.04, 0.94] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {glowing && (
        <>
          {/* bagliore che respira */}
          <motion.span
            aria-hidden
            className="absolute inset-[-12px] rounded-full blur-[12px]"
            style={{ background: "var(--trainer)" }}
            animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* onda che si allarga */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 0 2.5px var(--trainer)" }}
            animate={{ opacity: [0.9, 0], scale: [1, 1.9] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6, ease: EASE_OUT }}
          />
        </>
      )}
      <motion.button
        type="button"
        aria-label={count ? `Chiedi a ${COACH_NAME}: ${count} novità` : `Chiedi a ${COACH_NAME}, il tuo assistente`}
        onClick={onOpen}
        whileTap={{ scale: 0.92 }}
        className="glass glass-3d relative grid size-[56px] cursor-pointer place-items-center rounded-full"
        style={{
          boxShadow: glowing
            ? "0 0 0 2px var(--trainer), 0 10px 24px -6px color-mix(in srgb, var(--trainer) 70%, transparent)"
            : "0 0 0 1.5px color-mix(in srgb, var(--trainer) 45%, transparent), 0 10px 22px -8px color-mix(in srgb, var(--trainer) 55%, transparent)",
        }}
      >
        <motion.span animate={{ y: [0, -1.5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
          <CoachFace size={44} />
        </motion.span>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.4, delay: 0.5 }}
            className="absolute -top-[3px] -right-[3px] grid size-[17px] place-items-center rounded-full bg-[#e5484d] text-[9.5px] font-bold text-white ring-2 ring-[var(--color-card)] tabular-nums"
          >
            {count}
          </motion.span>
        )}
      </motion.button>
      <AnimatePresence>
        {(hover || hint) && !hidden && (
          <motion.button
            type="button"
            onClick={onOpen}
            initial={{ opacity: 0, scale: 0.97, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="glass absolute top-1/2 left-[66px] origin-left -translate-y-1/2 cursor-pointer rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold whitespace-nowrap text-ink"
          >
            {count ? (
              <>
                {COACH_NAME} ha {count} novità per te <ArrowRight size={11} strokeWidth={2.4} className="ml-[3px] inline" style={{ color: "var(--trainer)" }} />
              </>
            ) : hint && !hover ? (
              "Sono qui se ti serve 👋"
            ) : (
              `Chiedi a ${COACH_NAME}`
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ——— Leo ———

// Resta montato mentre si cambia pagina (sta nel layout): la conversazione non si perde.
export function CoachAssistant() {
  const home = usePathname() === ROUTES.oggi;
  const chat = useCoachChat();
  return <CoachStage key={home ? "home" : "pagine"} home={home} chat={chat} />;
}

function CoachStage({ home, chat }: { home: boolean; chat: Chat }) {
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

  // In piedi cresce con l'altezza della tela; sulle tele basse la testa sfiora l'ultimo messaggio.
  const standH = Math.round(clamp(size.h - 500, 132, 168));
  const standW = Math.round(standH * STAND_RATIO);
  const standX = size.w - STAND_RIGHT;

  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(novitaViste ? 0 : novita.length);

  // Cliccato, Leo lascia l'angolo e si sporge dal bordo destro della chat: sulla home la chat si apre
  // a sinistra dell'angolo, lasciando a Leo lo spazio; nelle altre pagine accanto al tasto.
  const panelLeft = home ? clamp(size.w - 18 - LEAN_BODY - PANEL_W, PANEL_LEFT_MIN, size.w - 18 - PANEL_W) : PANEL_LEFT_MIN;
  const panelOrigin = home ? "100% 100%" : "0% 100%";

  // Ingresso: compare salendo appena da sotto, una volta sola; poi resta fermo.
  const rise = useMotionValue(16);
  const fade = useMotionValue(0);

  // ——— Vignette ———
  const [speech, setSpeech] = useState<(Speech & { id: number }) | null>(null);
  const speechId = useRef(1);
  const speechTimer = useRef<number | undefined>(undefined);

  const say = useCallback((s: Speech | null, ms = 5200) => {
    window.clearTimeout(speechTimer.current);
    setSpeech(s ? { ...s, id: speechId.current++ } : null);
    if (s && ms > 0) speechTimer.current = window.setTimeout(() => setSpeech(null), ms);
  }, []);

  const [tipTick, setTipTick] = useState(0);
  useEffect(() => {
    if (!home || open || tipCursor.shown >= tips.length) return;
    const t = window.setTimeout(
      () => {
        say(tips[tipCursor.shown]);
        tipCursor.shown++;
        setTipTick((n) => n + 1);
      },
      tipCursor.shown === 0 ? 1800 : 7000,
    );
    return () => window.clearTimeout(t);
  }, [home, open, tipTick, say]);

  useEffect(() => () => window.clearTimeout(speechTimer.current), []);

  // Sulla home compare salendo da sotto, dopo le schede.
  useEffect(() => {
    if (!home) return;
    const c = [animate(fade, 1, { duration: 0.3, delay: 0.6 }), animate(rise, 0, reduce ? { duration: 0 } : { type: "spring", duration: 0.6, bounce: 0.25, delay: 0.6 })];
    return () => c.forEach((a) => a.stop());
  }, [home, fade, rise, reduce]);

  // Al primo passaggio del mouse dice che si può cliccare. Al passaggio la figura resta ferma.
  const [hover, setHover] = useState(false);
  const hinted = useRef(false);
  const hint = () => {
    if (hinted.current || speech || open) return;
    hinted.current = true;
    say({ icon: Hand, text: "Toccami per farmi una domanda." }, 3400);
  };

  // ——— Chat ———
  const openChat = (question?: string) => {
    if (open) return;
    playSound("open");
    say(null);
    setOpen(true);
    if (!novitaViste) {
      novitaViste = true;
      setUnseen(0);
    }
    if (question) window.setTimeout(() => chat.ask(question), 380);
  };
  const closeChat = () => {
    playSound("close");
    setOpen(false);
    setInfo(false);
  };

  // ——— Identikit: dalla i della chat; si torna alla chat con la X, il tasto o Esc ———
  const [info, setInfo] = useState(false);
  const openInfo = () => {
    playSound("open");
    setInfoSeen();
    setIntroSeen(true); // l'identikit dice già tutto: la presentazione non riparte
    setInfo(true);
  };
  const closeInfo = () => {
    playSound("close");
    setInfo(false);
  };
  const replayIntro = () => {
    setIntroSeen(false);
    closeInfo();
  };

  // Esc chiude l'identikit (si torna alla chat), poi la chat.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (info) setInfo(false);
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, info]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openChat();
    }
  };


  return (
    <>
      {/* il velo sotto la chat */}
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
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && !info && <ChatPanel key="chat" left={panelLeft} origin={panelOrigin} chat={chat} close={closeChat} dismiss={() => setOpen(false)} openInfo={openInfo} />}
      </AnimatePresence>
      <AnimatePresence>{open && info && <LeoIdentikit key="identikit" onBack={closeInfo} onReplayIntro={replayIntro} />}</AnimatePresence>

      {!home && <CoachButton hidden={open} count={unseen} onOpen={() => openChat()} />}

      <div ref={layer} className="pointer-events-none absolute inset-0 z-[46]">
        {home && (
          <motion.div className="absolute left-0" style={{ x: standX, bottom: FLOOR, opacity: fade }}>
            {/* a chat aperta lascia l'angolo: ricompare aggrappato al bordo della chat */}
            <motion.div
              initial={false}
              animate={open ? { opacity: 0, scale: 0.9, x: -24 } : { opacity: 1, scale: 1, x: 0 }}
              transition={open ? { duration: 0.18, ease: EASE_OUT } : { type: "spring", duration: 0.45, bounce: 0.2, delay: 0.1 }}
              style={{ originY: 1 }}
              className={open ? "pointer-events-none" : ""}
            >
              <motion.div style={{ y: rise }}>
                {/* alone nel colore del trainer dietro il busto: respira piano per attirare lo sguardo */}
                <motion.span
                  aria-hidden
                  className="leo-alone pointer-events-none absolute rounded-full"
                  style={{ width: standW * 2, height: standH * 0.95, left: -standW, bottom: standH * 0.12 }}
                  animate={reduce ? { opacity: 0.8 } : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.04, 0.95] }}
                  transition={reduce ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* ombra a terra */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute rounded-[50%] bg-black/20 blur-[4px] dark:bg-black/50"
                  style={{ width: standW * 0.95, height: 9, left: (-standW * 0.95) / 2, bottom: -4 }}
                />
                {/* onde sul pavimento, insieme al contorno: "toccami" */}
                {!reduce &&
                  [0, 0.35].map((d) => (
                    <motion.span
                      key={d}
                      aria-hidden
                      className="leo-onda pointer-events-none absolute rounded-[50%]"
                      style={{ width: standW * 1.1, height: standW * 0.3, left: (-standW * 1.1) / 2, bottom: (-standW * 0.3) / 2 + 2 }}
                      initial={{ opacity: 0, scale: 0.45 }}
                      animate={{ opacity: [0, 0.9, 0], scale: [0.45, 1, 1.45] }}
                      transition={{ duration: PULSE.duration, repeat: Infinity, repeatDelay: PULSE.pause, delay: PULSE.first + d, ease: "easeOut", times: [0, 0.25, 1] }}
                    />
                  ))}
                {/* contorno luminoso che si accende a intervalli (fisso al passaggio del mouse) */}
                <motion.img
                  src="/prototipo/coach/in-piedi.webp"
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="leo-contorno pointer-events-none absolute bottom-0 max-w-none select-none"
                  style={{ width: standW, left: -standW / 2 }}
                  initial={{ opacity: 0 }}
                  animate={hover ? { opacity: 1 } : reduce ? { opacity: 0.45 } : { opacity: [0, 1, 0] }}
                  transition={
                    hover || reduce
                      ? { duration: 0.2 }
                      : { duration: PULSE.duration, repeat: Infinity, repeatDelay: PULSE.pause, delay: PULSE.first, ease: "easeInOut" }
                  }
                />
                <img
                  src="/prototipo/coach/in-piedi.webp"
                  alt=""
                  draggable={false}
                  className="leo-luce absolute bottom-0 max-w-none select-none"
                  style={{ width: standW, left: -standW / 2 }}
                />
                {/* zona cliccabile: segue la sagoma, così gli angoli vuoti non coprono i messaggi */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${COACH_NAME}, il tuo assistente. Clicca o premi Invio per fargli una domanda.`}
                  onClick={() => openChat()}
                  onKeyDown={onKeyDown}
                  onMouseEnter={() => {
                    setHover(true);
                    hint();
                  }}
                  onMouseLeave={() => setHover(false)}
                  className="pointer-events-auto absolute bottom-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--trainer)]"
                  style={{
                    width: standW,
                    height: standH,
                    left: -standW / 2,
                    // sagoma: testa, mano che saluta a sinistra, tablet a destra, gambe
                    clipPath: "polygon(40% 0%, 76% 0%, 78% 20%, 95% 24%, 100% 46%, 100% 62%, 88% 64%, 90% 100%, 25% 100%, 30% 52%, 22% 42%, 0% 38%, 0% 25%, 15% 24%, 38% 20%)",
                  }}
                />
              </motion.div>

              {/* vignetta: a sinistra della testa, accanto al petto */}
              <div className="absolute w-max translate-y-full" style={{ bottom: standH * 0.68, right: standW * 0.16 }}>
                <AnimatePresence mode="wait">
                  {speech && !open && <Bubble key={speech.id} speech={speech} place="head-left" onAsk={(q) => openChat(q)} />}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}
