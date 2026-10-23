"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarClock, Wallet } from "lucide-react";
import { EASE_OUT, formatEuro } from "@/components/ui/motion";
import { revenue, trainer } from "@/libs/prototipo/dati-finti";
import { useBenvenuto, type Passo } from "@/libs/prototipo/benvenuto";

// Metà sinistra del benvenuto: la vetrina del trainer. Gradiente caldo nel suo colore con macchie sfumate
// che si muovono piano, e sopra le schede in vetro della sua app che fluttuano (come nel riferimento
// docs/riferimenti/animazione-login.mp4). In primo piano i children: pallina, Leo, telefono, email finta.

const tinta = (p: number) => `color-mix(in srgb, var(--trainer) ${p}%, var(--color-card))`;

const NOTIFICHE = [
  { iniziali: "LF", titolo: "Pagamento ricevuto", sotto: "Luca Ferri", valore: "€ 280" },
  { iniziali: "GB", titolo: "Allenamento fatto", sotto: "Giulia Bianchi", valore: "Giorno A" },
  { iniziali: "DG", titolo: "Pacchetto rinnovato", sotto: "Davide Greco", valore: "10 lezioni" },
  { iniziali: "SC", titolo: "Nuove misure", sotto: "Sara Conti", valore: "−0,8 kg" },
];

export function Vetrina({ passo, children }: { passo: Passo; children?: ReactNode }) {
  const b = useBenvenuto();
  // dal passo del marchio in poi al centro c'è il telefono: le schede si fanno da parte
  const lato = passo >= 1;
  return (
    <div className="relative h-full overflow-hidden rounded-[22px]" style={{ background: `linear-gradient(180deg, ${tinta(10)} 0%, ${tinta(28)} 48%, ${tinta(58)} 100%)` }}>
      <Macchie />
      <div className="absolute left-[26px] top-[24px] z-20 flex items-center gap-[9px]">
        <MarchioPiccolo logo={b.logo} />
        <span className="text-[13px] font-bold tracking-[-0.01em] text-ink/80">{b.studio.trim() || trainer.name}</span>
      </div>

      <motion.div className="absolute inset-0" animate={{ opacity: lato ? 0.0 : 1, scale: lato ? 0.96 : 1 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
        <Galleggia durata={6.5} className="absolute left-[19%] top-[19%] w-[54%]">
          <SchedaIncassi />
        </Galleggia>
        <Galleggia durata={5.2} ritardo={0.8} className="absolute right-[9%] top-[13%] w-[44%]">
          <Notifica />
        </Galleggia>
        <Galleggia durata={7} ritardo={0.3} className="absolute left-[11%] top-[43%] w-[30%]">
          <SchedaAnello />
        </Galleggia>
        <Galleggia durata={5.8} ritardo={1.4} className="absolute right-[10%] top-[48%]">
          <Pillola />
        </Galleggia>
      </motion.div>

      <div className="absolute inset-0 z-10">{children}</div>

      <motion.div
        className="pointer-events-none absolute bottom-[30px] left-[30px] right-[30px] z-20"
        animate={{ opacity: lato ? 0 : 1, y: lato ? 10 : 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <p className="text-[13px] font-medium text-ink/55">Con la tua app</p>
        <p className="mt-[6px] text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink">
          I tuoi clienti seguiti
          <br />
          ogni giorno, con il
          <br />
          tuo marchio.
        </p>
      </motion.div>
    </div>
  );
}

export function MarchioPiccolo({ logo, size = 30 }: { logo: string | null; size?: number }) {
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt="" className="rounded-[8px] object-contain" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-[9px] text-[11px] font-extrabold text-white transition-colors duration-500" style={{ width: size, height: size, background: "var(--trainer)" }}>
      {trainer.initials}
    </span>
  );
}

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
          className="absolute aspect-square rounded-full blur-[60px]"
          style={{ width: m.w, left: m.l, top: m.t, background: `color-mix(in srgb, var(--trainer) ${m.c}%, transparent)` }}
          animate={reduce ? undefined : { x: m.x, y: m.y }}
          transition={{ duration: m.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function Galleggia({ durata, ritardo = 0, className, children }: { durata: number; ritardo?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -7, 0] }}
      transition={
        reduce
          ? { duration: 0.4 }
          : { opacity: { duration: 0.5, delay: ritardo * 0.3 }, y: { duration: durata, repeat: Infinity, ease: "easeInOut", delay: ritardo } }
      }
    >
      {children}
    </motion.div>
  );
}

const vetro = "rounded-[16px] border border-white/90 bg-white/75 shadow-[0_18px_40px_-18px_rgba(40,20,10,0.35),inset_0_1px_0_#fff] backdrop-blur-[2px] dark:border-white/12 dark:bg-[#1d1f23]/80 dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]";

function SchedaIncassi() {
  const reduce = useReducedMotion();
  return (
    <div className={`${vetro} px-[16px] pb-[12px] pt-[14px]`}>
      <div className="flex items-center gap-[8px]">
        <span className="grid size-[24px] place-items-center rounded-[7px] bg-ink text-card">
          <Wallet size={12} />
        </span>
        <span className="text-[11.5px] font-semibold">Incassi di {revenue.month.toLowerCase()}</span>
        <span className="ml-auto rounded-full bg-soft px-[8px] py-[3px] text-[9.5px] font-semibold text-muted">Questo mese</span>
      </div>
      <div className="mt-[10px] flex items-center gap-[8px]">
        <span className="text-[24px] font-bold tracking-[-0.02em]">{formatEuro(revenue.collected)}</span>
        <span className="rounded-full bg-ok-soft px-[7px] py-[2px] text-[10px] font-bold text-ok">▲ {revenue.delta}%</span>
      </div>
      <svg viewBox="0 0 240 60" className="mt-[6px] h-[54px] w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="vetrina-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--trainer)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--trainer)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 50 C 20 46, 30 40, 48 44 S 80 30, 100 36 S 130 24, 150 30 S 185 14, 205 18 S 228 6, 240 8 L 240 60 L 0 60 Z" fill="url(#vetrina-area)" />
        <motion.path
          d="M0 50 C 20 46, 30 40, 48 44 S 80 30, 100 36 S 130 24, 150 30 S 185 14, 205 18 S 228 6, 240 8"
          fill="none"
          stroke="var(--trainer)"
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.3 }}
        />
        <circle cx="240" cy="8" r="7" fill="color-mix(in srgb, var(--trainer) 25%, transparent)" />
        <circle cx="240" cy="8" r="3.5" fill="var(--trainer)" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function Notifica() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NOTIFICHE.length), 3500);
    return () => window.clearInterval(t);
  }, [reduce]);
  const n = NOTIFICHE[i];
  return (
    <div className={`${vetro} flex items-center gap-[10px] overflow-hidden px-[12px] py-[10px]`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={i}
          className="flex min-w-0 flex-1 items-center gap-[10px]"
          initial={{ opacity: 0, y: 14, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(3px)" }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <span className="relative grid size-[30px] shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: tinta(85) }}>
            {n.iniziali}
            <span className="absolute -bottom-[2px] -right-[2px] grid size-[12px] place-items-center rounded-full border-2 border-card bg-ok text-[7px] text-white">✓</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11.5px] font-bold">{n.titolo}</span>
            <span className="block truncate text-[10px] text-muted">{n.sotto}</span>
          </span>
          <span className="ml-auto shrink-0 text-[11.5px] font-bold">{n.valore}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SchedaAnello() {
  const reduce = useReducedMotion();
  const r = 15;
  const giro = 2 * Math.PI * r;
  return (
    <div className={`${vetro} flex items-center gap-[10px] px-[12px] py-[10px]`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-ok-soft)" strokeWidth="5" />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--color-ok)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={giro}
          initial={{ strokeDashoffset: reduce ? giro * 0.61 : giro }}
          animate={{ strokeDashoffset: giro * 0.61 }}
          transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.5 }}
        />
      </svg>
      <span>
        <span className="block text-[15px] font-bold leading-none">39%</span>
        <span className="mt-[3px] block text-[9.5px] text-muted">Obiettivo di Giulia</span>
      </span>
    </div>
  );
}

function Pillola() {
  return (
    <div className={`${vetro} flex items-center gap-[8px] rounded-full py-[7px] pl-[8px] pr-[13px]`}>
      <span className="grid size-[20px] place-items-center rounded-full bg-[var(--trainer)] text-white">
        <CalendarClock size={11} />
      </span>
      <span className="text-[11px] font-bold">Prossima seduta · Ven 18:00</span>
    </div>
  );
}
