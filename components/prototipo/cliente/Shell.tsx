"use client";

// Guscio dell'app del cliente: cornice del telefono sul computer (a tutto schermo sul telefono vero), macchie di colore
// sul fondo come l'area trainer, intestazione grande che scorrendo si rimpicciolisce in una barra di vetro (come le app
// Apple, scelta di Marco del 28/10) e barra in basso a pillola di vetro con la goccia che scivola sulla voce attiva.

import { ReactNode, useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BatteryFull, Bell, Signal, Wifi } from "lucide-react";
import { trainer } from "@/libs/prototipo/dati-finti";
import { navigate } from "@/components/prototipo/trainer/nav";
import { ROTTE_CLIENTE, VOCI_BARRA, type SezioneCliente } from "./nav";

export const FOTO_CLIENTE = "/prototipo/cliente-giulia.jpg";
const SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;

// Le macchie del fondo: danno al vetro qualcosa da mostrare, come nell'area trainer (stessa classe ambient-blob).
function Sfondo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="ambient-blob" style={{ left: -90, top: 40, width: 230, height: 200, background: "var(--trainer)" }} />
      <span className="ambient-blob" style={{ right: -80, top: 220, width: 200, height: 190, background: "var(--color-sky-strong)", animationDelay: "-6s" }} />
      <span className="ambient-blob" style={{ left: -60, top: 520, width: 190, height: 170, background: "var(--color-mint-strong)", animationDelay: "-11s" }} />
      <span className="ambient-blob" style={{ right: -70, bottom: 40, width: 190, height: 160, background: "var(--color-violet-strong)", animationDelay: "-3s" }} />
    </div>
  );
}

// Solo nella cornice del computer: ora, isola e icone in alto, come un telefono vero.
function BarraDiStato() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden h-[50px] items-center justify-between px-[30px] pt-[4px] text-[14px] font-semibold sm:flex">
      <span className="tabular-nums">{trainer.now}</span>
      <span className="absolute top-[11px] left-1/2 h-[30px] w-[108px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-[5px]">
        <Signal size={15} strokeWidth={2.4} />
        <Wifi size={15} strokeWidth={2.4} />
        <BatteryFull size={19} strokeWidth={2} />
      </span>
    </div>
  );
}

function FotoCliente({ size, onClick }: { size: number; onClick: () => void }) {
  return (
    <motion.button type="button" aria-label="Il tuo profilo" whileTap={{ scale: 0.94 }} onClick={onClick} className="glass shrink-0 cursor-pointer overflow-hidden rounded-full p-[2px]" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FOTO_CLIENTE} alt="" className="size-full rounded-full object-cover" />
    </motion.button>
  );
}

function Campanella({ onClick }: { onClick: () => void }) {
  return (
    <motion.button type="button" aria-label="Novità" whileTap={{ scale: 0.94 }} onClick={onClick} className="glass relative grid size-[40px] cursor-pointer place-items-center rounded-full">
      <Bell size={17} strokeWidth={1.9} />
      <span className="absolute top-[9px] right-[10px] size-[7px] rounded-full bg-[#e5484d] ring-2 ring-white dark:ring-black" />
    </motion.button>
  );
}

// Barra in basso: pillola di vetro in rilievo; la goccia (glass-drop, la stessa della barra laterale del trainer)
// scivola sotto la voce attiva. La voce attiva prende il colore del trainer.
function BarraCliente({ attiva, nonLetti }: { attiva: SezioneCliente; nonLetti: number }) {
  return (
    <nav
      aria-label="Sezioni"
      className="glass glass-3d absolute inset-x-[14px] z-40 grid h-[64px] grid-cols-4 rounded-full px-[5px]"
      style={{ bottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      {VOCI_BARRA.map(({ sezione, label, icon: Icon }) => {
        const qui = sezione === attiva;
        return (
          <button
            key={sezione}
            type="button"
            aria-current={qui ? "page" : undefined}
            onClick={() => navigate(ROTTE_CLIENTE[sezione])}
            className="relative flex cursor-pointer flex-col items-center justify-center gap-[3px] [-webkit-tap-highlight-color:transparent]"
          >
            {qui && <motion.span layoutId="goccia-cliente" aria-hidden className="glass-drop absolute inset-x-[2px] inset-y-[6px] rounded-full" transition={SPRING} />}
            <span className="relative">
              <Icon size={20} strokeWidth={qui ? 2.2 : 1.8} style={{ color: qui ? "var(--trainer)" : undefined }} className={qui ? "" : "text-ink/55"} />
              {sezione === "messaggi" && nonLetti > 0 && (
                <span className="absolute -top-[5px] -right-[9px] grid h-[16px] min-w-[16px] place-items-center rounded-full bg-[#e5484d] px-[4px] text-[9.5px] font-bold text-white">{nonLetti}</span>
              )}
            </span>
            <span className={`relative text-[10px] leading-none ${qui ? "font-bold" : "font-medium text-ink/60"}`} style={{ color: qui ? "var(--trainer)" : undefined }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// L'intestazione grande sta in cima al contenuto e scorre via; quando è quasi uscita compare in alto la barra
// sottile di vetro con il titolo piccolo e la foto. Il titolo grande intanto rimpicciolisce e sfuma, come su iOS.
export function Guscio({
  sezione,
  titolo,
  titoloBreve,
  sotto,
  nonLetti,
  children,
}: {
  sezione: SezioneCliente;
  titolo: string;
  titoloBreve: string;
  sotto?: ReactNode;
  nonLetti: number;
  children: ReactNode;
}) {
  const scorre = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll({ container: scorre });
  const barra = useTransform(scrollY, [36, 60], [0, 1]);
  const grande = useTransform(scrollY, [0, 60], [1, reduce ? 1 : 0.9]);
  const grandeVisibile = useTransform(scrollY, [0, 36], [1, 0]);
  const barraTocca = useTransform(barra, (v) => (v > 0.5 ? "auto" : "none"));

  // cambiando sezione si riparte dall'alto, con il titolo grande
  useEffect(() => {
    scorre.current?.scrollTo({ top: 0 });
  }, [sezione]);

  const profilo = () => navigate(ROTTE_CLIENTE.profilo);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-salvia sm:py-[28px]">
      <div className="relative h-[100dvh] w-full overflow-hidden bg-salvia text-ink sm:h-[844px] sm:w-[390px] sm:rounded-[54px] sm:border-[11px] sm:border-[#111] sm:shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <Sfondo />
        <BarraDiStato />

        {/* la barra sottile che compare scorrendo */}
        <motion.div
          style={{ opacity: barra, pointerEvents: barraTocca }}
          className="glass absolute inset-x-0 top-0 z-30 rounded-none border-x-0 border-t-0 pt-[max(10px,env(safe-area-inset-top))] sm:pt-[50px]"
        >
          <div className="flex h-[46px] items-center justify-between px-[16px]">
            <span className="w-[34px]" />
            <p className="text-[15px] font-bold tracking-[-0.01em]">{titoloBreve}</p>
            <FotoCliente size={34} onClick={profilo} />
          </div>
        </motion.div>

        <div ref={scorre} className="relative h-full overflow-y-auto overscroll-contain px-[16px] pt-[max(14px,env(safe-area-inset-top))] pb-[110px] [scrollbar-width:none] sm:pt-[58px] [&::-webkit-scrollbar]:hidden">
          <motion.header style={{ scale: grande, opacity: grandeVisibile }} className="origin-left">
            <div className="flex items-center justify-between gap-[10px]">
              <h1 className="min-w-0 truncate text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]">{titolo}</h1>
              <div className="flex items-center gap-[8px]">
                <Campanella onClick={() => navigate(ROTTE_CLIENTE.messaggi)} />
                <FotoCliente size={40} onClick={profilo} />
              </div>
            </div>
            {sotto}
          </motion.header>
          <motion.div key={sezione} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </div>

        <BarraCliente attiva={sezione} nonLetti={nonLetti} />
      </div>
    </div>
  );
}
