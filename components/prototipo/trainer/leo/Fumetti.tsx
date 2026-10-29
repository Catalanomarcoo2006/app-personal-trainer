"use client";

import { motion } from "motion/react";
import { ArrowRight, CalendarDays, TriangleAlert, Trophy, Wallet, type LucideIcon } from "lucide-react";
import { EASE_OUT, formatEuro } from "@/components/ui/motion";
import { agenda, TODAY_INDEX, trainer } from "@/libs/prototipo/dati-finti";
import { COACH_NAME, POP } from "./costanti";
import { openPayments, openTotal } from "./risposte";

// ——— Vignette e novità ———

export type Speech = { text: string; icon?: LucideIcon; alert?: boolean; ask?: string };

export let firstName = trainer.name.split(" ")[0];

export const lucaTip: Speech = { icon: TriangleAlert, alert: true, text: "Luca ha segnalato fastidio al ginocchio durante gli affondi.", ask: "Cosa ha segnalato Luca?" };
export const paymentsTip: Speech = { icon: Wallet, text: `${openPayments.length} pagamenti ancora aperti per ${formatEuro(openTotal)}. Te li riepilogo?`, ask: "Chi deve ancora pagare?" };

// Quattro vignette dai dati della giornata, una alla volta, poi Leo tace.
export let tips: Speech[] = [
  { icon: CalendarDays, text: `Ciao ${firstName}! Oggi hai ${agenda[TODAY_INDEX].length} appuntamenti, il prossimo alle 11:00 con Antonella.`, ask: "Chi ho in agenda oggi?" },
  lucaTip,
  { icon: Trophy, text: "Davide ha fatto il nuovo massimale di panca: 90 kg! 🎉", ask: "Com’è andata a Davide?" },
  paymentsTip,
];

// Le cose che richiedono il trainer: fanno illuminare il tasto di Leo finché non apre la chat.
export let novita: Speech[] = [lucaTip, paymentsTip];

// Versione vera: le vignette della demo parlano di clienti inventati, quindi Leo tace e saluta col nome giusto.
export function fumettiVeri() {
  firstName = trainer.name.split(" ")[0];
  tips = [];
  novita = [];
}

// Coda del fumetto: di base punta in basso a destra; si specchia in orizzontale e in verticale.
export function Tail({ flipX, flipY, className }: { flipX?: boolean; flipY?: boolean; className: string }) {
  return (
    <svg viewBox="0 0 20 14" width={20} height={14} className={`absolute overflow-visible ${flipX ? "-scale-x-100" : ""} ${flipY ? "-scale-y-100" : ""} ${className}`} aria-hidden>
      <path d="M1 0 L13 0 C13 5 15 10 19 13 C13 12 7 8 1 0 Z" style={{ fill: "var(--color-card)" }} />
      <path d="M13 0.5 C13 5 15 10 19 13 C13 12 7 8 1 0.5" fill="none" style={{ stroke: "var(--color-line)" }} strokeWidth={1} strokeLinejoin="round" />
    </svg>
  );
}

export function SpeechIcon({ speech, size = 24 }: { speech: Speech; size?: number }) {
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

export function Bubble({ speech, place, onAsk }: { speech: Speech & { id: number }; place: "head-left" | "head-right" | "above"; onAsk: (q?: string) => void }) {
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
