"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import { CalendarDays, LayoutGrid, ShieldCheck, Sparkles, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";

// La scheda "Chi è Leo": si apre dalla i luccicante nella testata della chat.
// Leo si sposta a sinistra, a destra compare l'identikit e lui si siede a gambe incrociate lì accanto.

// ——— Le animazioni di Leo seduto (ritagliate dal video con ffmpeg, sfondo tolto) ———
// primo: fotogramma fermo in piedi, per lo spostamento · siede: si siede, una volta sola
// seduto: ultimo fotogramma, fermo · sbatte: sbatte le palpebre, una volta sola (parte e finisce come "seduto")
const ASSET = {
  primo: "/prototipo/coach/seduto-primo.webp",
  siede: "/prototipo/coach/siede.webp",
  seduto: "/prototipo/coach/seduto.webp",
  sbatte: "/prototipo/coach/sbatte.webp",
};
const SIT_MS = 77 * 42; // 77 fotogrammi da 42 ms
const BLINK_MS = 12 * 42;
const LEO_W = 240;
const LEO_H = Math.round(LEO_W * (540 / 420));

const BOX_W = 750;
const BOX_H = 524;
const CARD_W = 456;
const SLOT_X = 28; // Leo seduto: a sinistra della scheda, a un passo dal bordo
const START_X = BOX_W - CARD_W / 2 - LEO_W / 2 - SLOT_X; // parte da dove comparirà la scheda

// Le immagini animate ripartono dall'inizio solo con un indirizzo nuovo: le scarichiamo una volta
// e ogni volta che servono ne creiamo uno (blob:). Si caricano quando si apre la chat.
const blobs: Partial<Record<keyof typeof ASSET, Promise<Blob | null>>> = {};

export function preloadLeoSeduto() {
  (Object.keys(ASSET) as (keyof typeof ASSET)[]).forEach((k) => {
    blobs[k] ??= fetch(ASSET[k])
      .then((r): Promise<Blob> | null => (r.ok ? r.blob() : null))
      .catch((): null => null);
  });
}

async function freshUrl(k: keyof typeof ASSET) {
  preloadLeoSeduto();
  const blob = await blobs[k];
  return blob ? URL.createObjectURL(blob) : `${ASSET[k]}?t=${Date.now()}`;
}

type Phase = "arriva" | "siede" | "seduto";

function SeatedLeo() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduce ? "seduto" : "arriva");
  const [sitUrl, setSitUrl] = useState<string | null>(null);
  const [sitShown, setSitShown] = useState(false);
  const [blinkUrl, setBlinkUrl] = useState<string | null>(null);
  const [blinkShown, setBlinkShown] = useState(false);
  const urls = useRef<string[]>([]);
  const blinkDone = useRef<() => void>(() => {});

  useEffect(() => {
    preloadLeoSeduto();
    let cancel = false;
    const made = urls.current;
    void freshUrl("siede").then((u) => {
      made.push(u);
      if (!cancel) setSitUrl(u);
    });
    return () => {
      cancel = true;
      made.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
    };
  }, []);

  // Seduto: ogni tanto sbatte le palpebre.
  useEffect(() => {
    if (phase !== "seduto" || reduce) return;
    let cancel = false;
    const timers: number[] = [];
    const loop = (wait: number) => {
      timers.push(
        window.setTimeout(async () => {
          const u = await freshUrl("sbatte");
          if (cancel) return;
          urls.current.push(u);
          setBlinkUrl(u);
        }, wait),
      );
    };
    loop(2200);
    blinkDone.current = () => loop(3800 + Math.random() * 2500);
    return () => {
      cancel = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [phase, reduce]);

  const layer = "absolute inset-0 size-full max-w-none select-none";

  return (
    <motion.div
      className="absolute bottom-0"
      style={{ left: SLOT_X, width: LEO_W, height: LEO_H }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: START_X, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: EASE_OUT } }}
      transition={
        reduce
          ? { duration: 0.2 }
          : { opacity: { duration: 0.22 }, y: { duration: 0.25, ease: EASE_OUT }, x: { type: "spring", duration: 0.75, bounce: 0.18, delay: 0.22 } }
      }
      onAnimationComplete={() => phase === "arriva" && setPhase("siede")}
    >
      {/* alone nel colore del trainer e ombra a terra */}
      <span aria-hidden className="leo-alone pointer-events-none absolute rounded-full" style={{ width: LEO_W * 1.3, height: LEO_H * 0.75, left: -LEO_W * 0.15, bottom: LEO_H * 0.08 }} />
      <span aria-hidden className="pointer-events-none absolute rounded-[50%] bg-black/15 blur-[6px] dark:bg-black/45" style={{ width: LEO_W * 0.8, height: 14, left: LEO_W * 0.1, bottom: 0 }} />

      {/* mentre si sposta: leggermente inclinato nella direzione del passo */}
      <motion.div
        className="absolute inset-0"
        style={{ originY: 1 }}
        initial={false}
        animate={reduce ? undefined : { rotate: [0, -3.5, 1, 0] }}
        transition={{ duration: 0.85, delay: 0.22, times: [0, 0.35, 0.75, 1], ease: "easeInOut" }}
      >
        <img src={ASSET.primo} alt="" draggable={false} className={`leo-seduto ${layer}`} style={{ opacity: phase === "arriva" || (phase === "siede" && !sitShown) ? 1 : 0 }} />
        {phase === "siede" && sitUrl && (
          <img
            src={sitUrl}
            alt=""
            draggable={false}
            className={`leo-seduto ${layer}`}
            onLoad={() => {
              setSitShown(true);
              window.setTimeout(() => setPhase("seduto"), SIT_MS - 40);
            }}
          />
        )}
        <img src={ASSET.seduto} alt="" draggable={false} className={`leo-seduto ${layer}`} style={{ opacity: phase === "seduto" && !blinkShown ? 1 : 0 }} />
        {phase === "seduto" && blinkUrl && (
          <img
            key={blinkUrl}
            src={blinkUrl}
            alt=""
            draggable={false}
            className={`leo-seduto ${layer}`}
            onLoad={() => {
              setBlinkShown(true);
              window.setTimeout(() => {
                setBlinkShown(false);
                setBlinkUrl(null);
                blinkDone.current();
              }, BLINK_MS - 20);
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// ——— L'identikit ———

const knows: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Users, title: "Clienti", text: "Chi si allena, chi è fermo, chi ha segnalato un fastidio" },
  { icon: CalendarDays, title: "Agenda", text: "Gli appuntamenti di oggi e della settimana" },
  { icon: Wallet, title: "Incassi e pacchetti", text: "Chi deve pagare, chi sta per rinnovare" },
  { icon: LayoutGrid, title: "L’app", text: "Come importare una scheda o collegare i video" },
];

const numbers: { value: string; label: string }[] = [
  { value: "7", label: "sezioni dell’app che conosce" },
  { value: "1 tocco", label: "per aprire la sezione giusta" },
  { value: "0", label: "email e telefoni inviati all’AI" },
];

const steps = ["Chiedi a parole tue", "Leo legge i tuoi dati", "Risponde o agisce per te"];

export function LeoIdentikit({ onBack, onReplayIntro }: { onBack: () => void; onReplayIntro: () => void }) {
  const reduce = useReducedMotion();
  // mentre esce non prende più i clic: la chat che rientra sotto resta subito usabile
  const present = useIsPresent();
  // ogni blocco della scheda entra 45 ms dopo il precedente, mentre Leo si sposta
  const item = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.5 + i * 0.045, duration: 0.35, ease: EASE_OUT },
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center pl-[84px]">
      <div className="relative" style={{ width: BOX_W, height: BOX_H }} role="dialog" aria-label="Chi è Leo: cosa sa fare e come funziona">
        <SeatedLeo />

        <motion.section
          className={`panel absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden rounded-[26px] text-ink ${present ? "pointer-events-auto" : "pointer-events-none"}`}
          style={{ width: CARD_W, transformOrigin: "0% 100%" }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, x: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18, ease: EASE_OUT } }}
          transition={{ delay: reduce ? 0 : 0.42, type: "spring", duration: 0.6, bounce: 0.16 }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[22px] pt-[20px] pb-[18px] [scrollbar-width:none]">
            <motion.div {...item(0)} className="flex items-start">
              <div>
                <p className="flex items-center gap-[5px] text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: "var(--trainer)" }}>
                  <Sparkles size={12} strokeWidth={2.4} /> Identikit
                </p>
                <h2 className="mt-[3px] text-[28px] leading-none font-extrabold tracking-tight">
                  Leo <span className="text-[15px] font-semibold tracking-normal text-muted">il tuo assistente</span>
                </h2>
                <p className="mt-[7px] text-[12.5px] leading-snug text-muted">Vive nella tua app, conosce la tua giornata e ti risponde in un attimo.</p>
              </div>
              <button type="button" aria-label="Torna alla chat" onClick={onBack} className="ml-auto grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full bg-soft transition-colors hover:bg-line">
                <X size={14} />
              </button>
            </motion.div>

            <motion.div {...item(1)} className="grid grid-cols-3 gap-[8px]">
              {numbers.map((n) => (
                <div key={n.label} className="glass-row rounded-[16px] px-[11px] py-[9px]">
                  <p className="text-[20px] leading-none font-extrabold tabular-nums" style={{ color: "var(--trainer)" }}>
                    {n.value}
                  </p>
                  <p className="mt-[4px] text-[10.5px] leading-tight font-medium text-muted">{n.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div {...item(2)}>
              <p className="mb-[7px] text-[11px] font-bold text-muted">Cosa sa</p>
              <div className="grid grid-cols-2 gap-x-[12px] gap-y-[10px]">
                {knows.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-[9px]">
                    <span className="mt-[1px] grid size-[28px] shrink-0 place-items-center rounded-[10px]" style={{ background: "color-mix(in srgb, var(--trainer) 14%, transparent)", color: "var(--trainer)" }}>
                      <Icon size={15} strokeWidth={2.2} />
                    </span>
                    <span>
                      <span className="block text-[12.5px] leading-tight font-bold">{title}</span>
                      <span className="block text-[11px] leading-snug text-muted">{text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...item(3)}>
              <p className="mb-[7px] text-[11px] font-bold text-muted">Come funziona</p>
              <ol className="flex items-stretch gap-[6px]">
                {steps.map((s, i) => (
                  <li key={s} className="flex flex-1 items-center gap-[7px] rounded-[14px] bg-soft px-[9px] py-[8px]">
                    <span className="grid size-[20px] shrink-0 place-items-center rounded-full text-[10.5px] font-extrabold text-white" style={{ background: "var(--trainer)" }}>
                      {i + 1}
                    </span>
                    <span className="text-[11px] leading-tight font-semibold">{s}</span>
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.p {...item(4)} className="flex items-start gap-[8px] text-[11.5px] leading-snug text-muted">
              <ShieldCheck size={16} className="mt-[1px] shrink-0" style={{ color: "var(--color-ok)" }} />
              <span>
                <b className="text-ink">Decidi sempre tu:</b> fissare e spostare sedute ha sempre “Annulla”, cancellazioni e messaggi ai clienti partono solo con la tua conferma. Email e telefoni non arrivano all’AI.
              </span>
            </motion.p>
          </div>

          <motion.div {...item(5)} className="flex items-center gap-[10px] border-t border-line px-[22px] py-[12px]">
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onBack} className="btn-trainer cursor-pointer rounded-full px-[16px] py-[8px] text-[12.5px] font-semibold">
              Fai una domanda a Leo
            </motion.button>
            <button type="button" onClick={onReplayIntro} className="cursor-pointer text-[12px] font-semibold text-muted transition-colors hover:text-ink">
              Rivedi la presentazione
            </button>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

// ——— La i luccicante, nella testata della chat ———
// Finché non la apri brilla (un riflesso che passa e tre stelline): invita a scoprire chi è Leo.

function Twinkle({ className, delay, size = 7 }: { className: string; delay: number; size?: number }) {
  return (
    <motion.svg
      viewBox="0 0 10 10"
      width={size}
      height={size}
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{ color: "var(--trainer)" }}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
      transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.4, delay, ease: "easeInOut" }}
    >
      <path d="M5 0 C5.4 3.6 6.4 4.6 10 5 C6.4 5.4 5.4 6.4 5 10 C4.6 6.4 3.6 5.4 0 5 C3.6 4.6 4.6 3.6 5 0 Z" fill="currentColor" />
    </motion.svg>
  );
}

export function InfoSparkle({ onClick, inviting, strong }: { onClick: () => void; inviting: boolean; strong?: boolean }) {
  const reduce = useReducedMotion();
  const shine = inviting && !reduce;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      aria-label="Chi è Leo: cosa sa fare e come funziona"
      title="Chi è Leo?"
      className="relative grid size-[22px] shrink-0 cursor-pointer place-items-center rounded-full"
      style={{
        background: "color-mix(in srgb, var(--trainer) 16%, var(--color-card))",
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(--trainer) ${inviting ? 55 : 30}%, transparent)${inviting ? ", 0 0 12px -2px color-mix(in srgb, var(--trainer) 70%, transparent)" : ""}`,
        color: "var(--trainer)",
      }}
    >
      {/* onda che si allarga: più evidente quando Leo la indica nella presentazione */}
      {shine && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 0 2px var(--trainer)" }}
          animate={{ opacity: [strong ? 0.9 : 0.5, 0], scale: [1, strong ? 2.1 : 1.7] }}
          transition={{ duration: strong ? 1.1 : 1.6, repeat: Infinity, repeatDelay: strong ? 0.2 : 1.2, ease: EASE_OUT }}
        />
      )}
      <span className="relative overflow-hidden rounded-full">
        <span className="block px-[7px] font-serif text-[13px] leading-[22px] font-bold italic">i</span>
        {/* riflesso che attraversa la i */}
        {shine && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-[10px] -skew-x-12"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)" }}
            initial={{ x: -14 }}
            animate={{ x: 24 }}
            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
          />
        )}
      </span>
      {shine && (
        <>
          <Twinkle className="-top-[6px] -right-[5px]" delay={0} size={8} />
          <Twinkle className="-bottom-[4px] -left-[6px]" delay={0.9} size={6} />
          <Twinkle className="-top-[7px] left-[1px]" delay={1.7} size={5} />
        </>
      )}
    </motion.button>
  );
}
