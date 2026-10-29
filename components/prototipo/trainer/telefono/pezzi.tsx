"use client";

// Pezzi comuni delle schermate del trainer da telefono, nello stile dell'app del cliente: riquadri pieni (panel)
// con righe divise da una linea sottile, titoletti grandi, tocchi con il suono.

import { ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { navigate } from "../nav";

export function Titoletto({ children, destra }: { children: ReactNode; destra?: ReactNode }) {
  return (
    <div className="mt-[22px] mb-[8px] flex items-center justify-between px-[4px]">
      <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">{children}</h2>
      {destra}
    </div>
  );
}

export function Riquadro({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel overflow-hidden rounded-[24px] ${className}`}>{children}</div>;
}

// Una riga toccabile: porta a href o fa onClick. destra non deve contenere tasti (la riga è già un tasto).
export function Riga({
  sinistra,
  titolo,
  sotto,
  destra,
  href,
  onClick,
  spenta,
  freccia = true,
}: {
  sinistra?: ReactNode;
  titolo: ReactNode;
  sotto?: ReactNode;
  destra?: ReactNode;
  href?: string;
  onClick?: () => void;
  spenta?: boolean;
  freccia?: boolean;
}) {
  const tocca = href || onClick;
  const dentro = (
    <>
      {sinistra}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[14.5px] font-semibold">{titolo}</span>
        {sotto && <span className="mt-[3px] block truncate text-[12.5px] text-muted">{sotto}</span>}
      </span>
      {destra}
      {tocca && freccia && <ChevronRight size={16} className="shrink-0 text-ink/35" />}
    </>
  );
  const classe = `flex w-full items-center gap-[12px] border-b border-line/60 px-[14px] py-[11px] text-left last:border-0 ${spenta ? "opacity-50" : ""}`;
  if (!tocca) return <div className={classe}>{dentro}</div>;
  return (
    <motion.button
      type="button"
      whileTap={{ backgroundColor: "color-mix(in srgb, var(--color-ink) 5%, transparent)" }}
      onClick={() => {
        playSound("tap");
        if (onClick) onClick();
        else if (href) navigate(href);
      }}
      className={`${classe} cursor-pointer`}
    >
      {dentro}
    </motion.button>
  );
}

export function Vuoto({ children }: { children: ReactNode }) {
  return <p className="px-[16px] py-[18px] text-center text-[13px] text-muted">{children}</p>;
}

// Piccolo link a destra di un titoletto ("Calendario ›").
export function LinkTitoletto({ href, children }: { href: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => {
        playSound("tap");
        navigate(href);
      }}
      className="flex cursor-pointer items-center text-[13px] font-semibold"
      style={{ color: "var(--trainer)" }}
    >
      {children} <ChevronRight size={15} />
    </button>
  );
}

// Le ore "10:20" in minuti, per sapere se una seduta è già passata o in corso.
export const minutiDi = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fineDi = (t: string, durata: number) => {
  const m = minutiDi(t) + durata;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
