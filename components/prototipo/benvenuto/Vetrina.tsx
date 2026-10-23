"use client";

import { createContext, ReactNode, RefObject, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { Send, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/basics";
import { CountUp, EASE_OUT, formatEuro } from "@/components/ui/motion";
import { audioSbloccato, isSoundEnabled, suonoComparse, suonoConteggio, suonoNotifica } from "@/libs/ui/sound";
import { agenda, client, clientById, revenue, TODAY_INDEX, week } from "@/libs/prototipo/dati-finti";
import type { Passo } from "@/libs/prototipo/benvenuto";
import { AnteprimaTelefono } from "./AnteprimaTelefono";

// Metà sinistra del benvenuto: la vetrina del trainer. Gradiente caldo nel suo colore con macchie che si muovono
// piano, e sopra le schede in vetro della sua app che fluttuano, come nel riferimento (docs/riferimenti/
// animazione-login.mp4): incassi, agenda di oggi, progressi di un cliente, settimana, e una notifica che cambia.
// In primo piano i children (l'email finta con il codice).

const tinta = (p: number) => `color-mix(in srgb, var(--trainer) ${p}%, var(--color-card))`;

const NOTIFICHE = [
  { id: "luca-ferri", titolo: "Pagamento ricevuto", valore: "€ 280" },
  { id: "giulia-bianchi", titolo: "Allenamento fatto", valore: "Giorno A" },
  { id: "davide-greco", titolo: "Pacchetto rinnovato", valore: "10 lezioni" },
  { id: "sara-conti", titolo: "Nuove misure", valore: "−0,8 kg" },
];

// Il cursore sopra la vetrina: le schede vicine si scostano (come acque che si aprono) e tornano al loro posto.
type Cursore = { x: MotionValue<number>; y: MotionValue<number>; vetrina: RefObject<HTMLDivElement | null> };
const CursoreCtx = createContext<Cursore | null>(null);

// Giro delle animazioni dei numeri (colonne, conteggi, anello, linea): cambiando giro ripartono da capo.
// Serve per il suono: il browser lo blocca finché non si clicca sulla pagina, quindi se le schede sono nate
// mute, al primo clic i numeri rifanno il conteggio, questa volta con il ticchettio (soluzione A, 23/10).
const VetrinaCtx = createContext<{ giro: number; attiva: boolean }>({ giro: 0, attiva: true });

// Suoni delle schede, allineati alle animazioni: pop d'ingresso (Galleggia) e conteggio (incassi, anello, linea).
const suonaIngresso = () => suonoComparse(6, 0.2, 0.09);
const suonaConteggio = () => suonoConteggio({ ritardo: 0.5, durata: 1.35, scatti: 24, volume: 0.85 });
const SCOSTA_PX = 13; // spostamento massimo di una scheda sotto il cursore
const RAGGIO_PX = 230; // distanza entro cui il cursore la sposta

export function Vetrina({ passo, children }: { passo: Passo; children?: ReactNode }) {
  // dal passo del marchio in poi le schede si fanno da parte e al loro posto entra l'anteprima dell'app
  const lato = passo >= 1;
  const reduce = useReducedMotion();
  const vetrina = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);

  const [giro, setGiro] = useState(0);
  const nate = useRef(false);
  const lati = useRef(lato);
  lati.current = lato;
  useEffect(() => {
    if (reduce || lati.current) return;
    // arrivati con un clic (audio già sbloccato): il suono accompagna la nascita delle schede
    if (audioSbloccato()) {
      if (nate.current) return; // in sviluppo React esegue gli effetti due volte: i suoni partono una volta sola
      nate.current = true;
      suonaIngresso();
      suonaConteggio();
      return;
    }
    const primoTocco = () => {
      window.removeEventListener("pointerdown", primoTocco, true);
      window.removeEventListener("keydown", primoTocco, true);
      if (lati.current || !isSoundEnabled()) return;
      // a fine evento: il browser considera la pagina "attivata" solo dopo questo tocco
      window.setTimeout(() => {
        setGiro((g) => g + 1);
        suonaConteggio();
      }, 0);
    };
    window.addEventListener("pointerdown", primoTocco, true);
    window.addEventListener("keydown", primoTocco, true);
    return () => {
      window.removeEventListener("pointerdown", primoTocco, true);
      window.removeEventListener("keydown", primoTocco, true);
    };
  }, [reduce]);

  return (
    <VetrinaCtx.Provider value={{ giro, attiva: !lato }}>
    <CursoreCtx.Provider value={{ x, y, vetrina }}>
      <div
        ref={vetrina}
        className="relative h-full overflow-hidden rounded-[22px]"
        style={{ background: `linear-gradient(180deg, ${tinta(10)} 0%, ${tinta(26)} 46%, ${tinta(56)} 100%)` }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left);
          y.set(e.clientY - r.top);
        }}
        onPointerLeave={() => {
          x.set(-9999);
          y.set(-9999);
        }}
      >
        <Macchie />

        {/* due colonne con spazi fissi tra le schede, centrate nello spazio sopra la frase */}
        <motion.div
          className="absolute inset-x-[6%] bottom-[168px] top-[5%] flex items-center"
          initial={false}
          animate={{ opacity: lato ? 0 : 1 }}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: lato ? 0.1 : 0 }}
          style={{ pointerEvents: lato ? "none" : undefined }}
        >
          <div className="grid w-full grid-cols-[1.08fr_1fr] items-start gap-x-[22px]">
            {/* dal passo del marchio le due colonne si aprono verso i lati per far posto al telefono */}
            <motion.div
              className="flex flex-col gap-[22px] pt-[30px]"
              initial={false}
              animate={{ x: lato && !reduce ? -90 : 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              <Galleggia durata={6.5} entra={0}>
                <SchedaIncassi />
              </Galleggia>
              <Galleggia durata={6} entra={3} ritardo={1.2}>
                <SchedaProgressi />
              </Galleggia>
              <Galleggia durata={5.8} entra={5} ritardo={1.6} className="self-start">
                <Pillola />
              </Galleggia>
            </motion.div>
            <motion.div
              className="flex flex-col gap-[22px]"
              initial={false}
              animate={{ x: lato && !reduce ? 90 : 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              <Galleggia durata={5.4} entra={1} ritardo={0.8}>
                <Notifica />
              </Galleggia>
              <Galleggia durata={7} entra={2} ritardo={0.3}>
                <SchedaAgenda />
              </Galleggia>
              <Galleggia durata={6.8} entra={4} ritardo={0.6}>
                <SchedaSettimana />
              </Galleggia>
            </motion.div>
          </div>
        </motion.div>

        {/* al posto delle schede, il telefono con l'app che riceveranno i clienti */}
        <AnimatePresence>{lato && <AnteprimaTelefono key="telefono" nascita={passo === 1} />}</AnimatePresence>

        <div className="pointer-events-none absolute inset-0 z-10">{children}</div>

        <motion.div
          className="pointer-events-none absolute bottom-[34px] left-[7%] right-[7%] z-20"
          initial={false}
          animate={{ opacity: lato ? 0 : 1, y: lato ? 10 : 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <p className="text-[13px] font-semibold text-ink/55">Tutto il tuo lavoro in un posto</p>
          <p className="mt-[6px] text-[31px] font-semibold leading-[1.14] tracking-[-0.025em] text-ink">
            Clienti, schede, agenda
            <br />e incassi, con il tuo marchio.
          </p>
        </motion.div>
      </div>
    </CursoreCtx.Provider>
    </VetrinaCtx.Provider>
  );
}

// Sfumature pure, senza filtro blur (su alcune schede video Chrome taglia la sfocatura ai bordi in linee dritte).
function Macchie() {
  const reduce = useReducedMotion();
  const macchie = [
    { c: 72, w: "62%", l: "38%", t: "58%", d: 16, x: [-30, 25, -30], y: [0, -30, 0] },
    { c: 48, w: "48%", l: "-8%", t: "68%", d: 19, x: [0, 40, 0], y: [20, -10, 20] },
    { c: 30, w: "40%", l: "55%", t: "8%", d: 22, x: [10, -30, 10], y: [0, 25, 0] },
  ];
  return (
    <>
      {macchie.map((m, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute aspect-square"
          style={{
            width: m.w,
            left: m.l,
            top: m.t,
            background: `radial-gradient(closest-side, color-mix(in srgb, var(--trainer) ${m.c}%, transparent) 0%, color-mix(in srgb, var(--trainer) ${Math.round(m.c * 0.45)}%, transparent) 45%, transparent 100%)`,
          }}
          animate={reduce ? undefined : { x: m.x, y: m.y }}
          transition={{ duration: m.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// Ogni scheda entra dal basso una dopo l'altra, poi ondeggia piano per conto suo; quando il cursore passa vicino
// si scosta da lui (più vicino = più spostata, al massimo SCOSTA_PX) e con una molla torna al suo posto.
function Galleggia({ durata, entra, ritardo = 0, className, children }: { durata: number; entra: number; ritardo?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const cursore = useContext(CursoreCtx);
  const posto = useRef<HTMLDivElement>(null);
  const molla = { stiffness: 140, damping: 16, mass: 0.7 };
  const dx = useSpring(0, molla);
  const dy = useSpring(0, molla);

  const scosta = () => {
    if (!cursore || reduce || !posto.current || !cursore.vetrina.current) return;
    const v = cursore.vetrina.current.getBoundingClientRect();
    const r = posto.current.getBoundingClientRect(); // il posto non si muove: si sposta solo il contenuto
    const cx = r.left - v.left + r.width / 2;
    const cy = r.top - v.top + r.height / 2;
    const vx = cx - cursore.x.get();
    const vy = cy - cursore.y.get();
    const d = Math.hypot(vx, vy);
    if (d > RAGGIO_PX * 2 || d === 0) {
      dx.set(0);
      dy.set(0);
      return;
    }
    const forza = SCOSTA_PX * Math.exp(-((d / RAGGIO_PX) ** 2));
    dx.set((vx / d) * forza);
    dy.set((vy / d) * forza);
  };
  useMotionValueEvent(cursore?.x ?? dx, "change", scosta);
  useMotionValueEvent(cursore?.y ?? dy, "change", scosta);

  return (
    <motion.div
      ref={posto}
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 + entra * 0.09 }}
    >
      <motion.div style={{ x: dx, y: dy }}>
        <motion.div animate={reduce ? undefined : { y: [0, -7, 0] }} transition={{ duration: durata, repeat: Infinity, ease: "easeInOut", delay: ritardo }}>
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const vetro =
  "rounded-[16px] border border-white/90 bg-white/78 shadow-[0_18px_40px_-18px_rgba(40,20,10,0.35),inset_0_1px_0_#fff] dark:border-white/12 dark:bg-[#1d1f23]/82 dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]";

function Titoletto({ children, destra }: { children: ReactNode; destra?: ReactNode }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="text-[11.5px] font-semibold">{children}</span>
      {destra && <span className="ml-auto rounded-full bg-soft px-[8px] py-[3px] text-[9.5px] font-semibold text-muted">{destra}</span>}
    </div>
  );
}

// Incassi del mese con le colonne degli ultimi 6 mesi che crescono (come nella home del trainer).
function SchedaIncassi() {
  const reduce = useReducedMotion();
  const { giro } = useContext(VetrinaCtx);
  const max = Math.max(...revenue.months.map((m) => m.value));
  return (
    <div className={`${vetro} px-[16px] pb-[12px] pt-[14px]`}>
      <div className="flex items-center gap-[8px]">
        <span className="grid size-[24px] place-items-center rounded-[7px] bg-ink text-card">
          <Wallet size={12} />
        </span>
        <span className="text-[11.5px] font-semibold">Incassi di {revenue.month.toLowerCase()}</span>
      </div>
      <div className="mt-[10px] flex items-center gap-[8px]">
        <span className="text-[25px] font-bold tracking-[-0.02em]">
          <CountUp key={giro} value={revenue.collected} format={formatEuro} delay={0.5} duration={1.35} />
        </span>
        <span className="rounded-full bg-ok-soft px-[7px] py-[2px] text-[10px] font-bold text-ok">▲ {revenue.delta}%</span>
      </div>
      <div className="mt-[10px] flex h-[64px] items-end gap-[7px]">
        {revenue.months.map((m, i) => {
          const ultimo = i === revenue.months.length - 1;
          return (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-[4px]">
              <motion.span
                key={giro}
                className="block w-full origin-bottom rounded-[6px]"
                style={{ height: `${(m.value / max) * 48}px`, background: ultimo ? "var(--trainer)" : tinta(30) }}
                initial={{ scaleY: reduce ? 1 : 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.5 + i * 0.07 }}
              />
              <span className={`text-[8.5px] ${ultimo ? "font-bold text-ink" : "text-muted"}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Notifiche: ne arriva una nuova ogni 3,5 s, con un suono leggero (solo le prime 3, e solo finché la vetrina
// mostra le schede: dal passo del marchio continuano mute).
const DING_MAX = 3;
function Notifica() {
  const reduce = useReducedMotion();
  const { attiva } = useContext(VetrinaCtx);
  const [i, setI] = useState(0);
  const dings = useRef(0);
  useEffect(() => {
    if (i === 0 || !attiva || dings.current >= DING_MAX || !audioSbloccato()) return;
    dings.current += 1;
    suonoNotifica(0.8);
  }, [i, attiva]);
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NOTIFICHE.length), 3500);
    return () => window.clearInterval(t);
  }, [reduce]);
  const n = NOTIFICHE[i];
  const c = clientById(n.id);
  return (
    <div className={`${vetro} relative h-[52px] overflow-hidden`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center gap-[10px] px-[12px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <span className="relative shrink-0">
            <Avatar initials={c?.initials ?? "?"} src={c?.photo} size={30} />
            <span className="absolute -bottom-[2px] -right-[2px] grid size-[12px] place-items-center rounded-full border-2 border-card bg-ok text-[7px] text-white">✓</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11.5px] font-bold">{n.titolo}</span>
            <span className="block truncate text-[10px] text-muted">{c?.name}</span>
          </span>
          <span className="ml-auto shrink-0 text-[11.5px] font-bold">{n.valore}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// L'agenda di oggi, con la seduta in corso evidenziata (come la linea del tempo della home).
function SchedaAgenda() {
  const oggi = agenda[TODAY_INDEX].slice(0, 3);
  return (
    <div className={`${vetro} px-[14px] pb-[12px] pt-[13px]`}>
      <Titoletto destra={`${week[TODAY_INDEX].long} ${week[TODAY_INDEX].n}`}>Agenda di oggi</Titoletto>
      <div className="mt-[10px] flex flex-col gap-[7px]">
        {oggi.map((a, i) => {
          const c = clientById(a.clientId);
          const ora = i === 1;
          return (
            <div
              key={a.time}
              className="flex items-center gap-[9px] rounded-[11px] px-[8px] py-[6px]"
              style={{ background: ora ? tinta(16) : "var(--color-soft)", boxShadow: ora ? "inset 0 0 0 1px color-mix(in srgb, var(--trainer) 40%, transparent)" : undefined }}
            >
              <span className="w-[30px] shrink-0 text-[10px] font-bold tabular-nums text-ink/70">{a.time}</span>
              <Avatar initials={c?.initials ?? "?"} src={c?.photo} size={22} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10.5px] font-semibold">{c?.name}</span>
                <span className="block truncate text-[9px] text-muted">
                  {a.type} · {a.minutes} min
                </span>
              </span>
              {ora && <span className="size-[7px] shrink-0 animate-pulse rounded-full bg-[var(--trainer)]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// I progressi di una cliente: grafico del peso e anello dell'obiettivo (come nel profilo cliente).
function SchedaProgressi() {
  const reduce = useReducedMotion();
  const { giro: volta } = useContext(VetrinaCtx);
  const pesi = client.weight;
  const min = Math.min(...pesi) - 0.6;
  const max = Math.max(...pesi) + 0.4;
  const punti = pesi.map((p, i) => [(i / (pesi.length - 1)) * 200, 52 - ((p - min) / (max - min)) * 46] as const);
  const linea = punti.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fine = punti[punti.length - 1];
  const r = 15;
  const giro = 2 * Math.PI * r;
  return (
    <div className={`${vetro} px-[14px] pb-[12px] pt-[13px]`}>
      <div className="flex items-center gap-[9px]">
        <Avatar initials="GB" src={clientById("giulia-bianchi")?.photo} size={26} />
        <span className="min-w-0">
          <span className="block text-[11.5px] font-semibold">Giulia · peso</span>
          <span className="block text-[9.5px] text-muted">{client.goal}</span>
        </span>
        <span className="relative ml-auto grid size-[40px] place-items-center">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="absolute inset-0 -rotate-90">
            <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-ok-soft)" strokeWidth="4.5" />
            <motion.circle
              key={volta}
              cx="20"
              cy="20"
              r={r}
              fill="none"
              stroke="var(--color-ok)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={giro}
              initial={{ strokeDashoffset: reduce ? giro * (1 - client.goalPercent / 100) : giro }}
              animate={{ strokeDashoffset: giro * (1 - client.goalPercent / 100) }}
              transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.7 }}
            />
          </svg>
          <span className="text-[10px] font-bold">
            <CountUp key={volta} value={client.goalPercent} delay={0.7} duration={1.3} />%
          </span>
        </span>
      </div>
      <div className="mt-[6px] flex items-baseline gap-[6px]">
        <span className="text-[21px] font-bold tracking-[-0.02em]">{pesi[pesi.length - 1].toLocaleString("it-IT")} kg</span>
        <span className="rounded-full bg-ok-soft px-[7px] py-[2px] text-[10px] font-bold text-ok">−3,1 kg</span>
      </div>
      <svg viewBox="0 0 200 56" className="mt-[4px] h-[52px] w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="vetrina-peso" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--trainer)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--trainer)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${linea} L 200 56 L 0 56 Z`} fill="url(#vetrina-peso)" />
        <motion.path
          key={volta}
          d={linea}
          fill="none"
          stroke="var(--trainer)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.6 }}
        />
        <circle cx={fine[0]} cy={fine[1]} r="6.5" fill="color-mix(in srgb, var(--trainer) 25%, transparent)" />
        <circle cx={fine[0]} cy={fine[1]} r="3.3" fill="var(--trainer)" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// La settimana: giorni con sedute (puntini), oggi nel colore del trainer.
function SchedaSettimana() {
  return (
    <div className={`${vetro} px-[14px] pb-[13px] pt-[13px]`}>
      <Titoletto destra={`${agenda.flat().length} sedute`}>Questa settimana</Titoletto>
      <div className="mt-[10px] grid grid-cols-7 gap-[5px]">
        {week.map((g, i) => {
          const oggi = i === TODAY_INDEX;
          const sedute = agenda[i].length;
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-[3px] rounded-[10px] py-[6px]"
              style={{ background: oggi ? "var(--trainer)" : i < TODAY_INDEX ? tinta(14) : "var(--color-soft)", color: oggi ? "#fff" : undefined }}
            >
              <span className={`text-[8.5px] ${oggi ? "text-white/80" : "text-muted"}`}>{g.short}</span>
              <span className="text-[11.5px] font-bold">{g.n}</span>
              <span className="flex h-[4px] gap-[2px]">
                {Array.from({ length: Math.min(sedute, 3) }, (_, k) => (
                  <span key={k} className="size-[3.5px] rounded-full" style={{ background: oggi ? "#fff" : "var(--trainer)" }} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Una scheda appena inviata (come dalla sezione Schede).
function Pillola() {
  return (
    <div className={`${vetro} flex items-center gap-[9px] rounded-full py-[7px] pl-[8px] pr-[14px]`}>
      <span className="grid size-[22px] place-items-center rounded-full bg-[var(--trainer)] text-white">
        <Send size={11} />
      </span>
      <span className="text-[11px] font-bold">Scheda inviata a Giulia · Giorno A</span>
    </div>
  );
}
