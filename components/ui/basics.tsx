"use client";

import { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { playSound, SoundKind } from "@/libs/ui/sound";

type Variant = "outline" | "soft" | "dark" | "white";

const variants: Record<Variant, string> = {
  outline: "bg-card border border-line text-ink/70",
  soft: "bg-soft text-ink/70",
  dark: "bg-contrast text-on-contrast",
  white: "bg-card text-ink/70",
};

// Bottone tondo con icona: si solleva al passaggio, si schiaccia al tocco e fa "pop".
export function IconCircle({
  icon: Icon,
  label,
  size = 34,
  iconSize = 15,
  variant = "soft",
  sound = "tap",
  className = "",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  size?: number;
  iconSize?: number;
  variant?: Variant;
  sound?: SoundKind;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      onClick={() => {
        playSound(sound);
        onClick?.();
      }}
      className={`grid shrink-0 cursor-pointer place-items-center rounded-full ${variants[variant]} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} strokeWidth={1.8} />
    </motion.button>
  );
}

// Pillola bianca piccola (date, contatori, badge).
export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-[5px] rounded-full bg-card whitespace-nowrap ${className}`}>{children}</span>;
}

const avatarTones = [
  ["#f6b38a", "#e0703c"],
  ["#9cc6f0", "#3c78c8"],
  ["#f2a3b5", "#c94a6a"],
  ["#b9d99a", "#5a9a3c"],
  ["#c9b6f0", "#6a4fc8"],
];

// Avatar: la foto se c'è, altrimenti le iniziali.
export function Avatar({
  initials,
  size = 24,
  tone,
  src,
  className = "",
}: {
  initials: string;
  size?: number;
  tone?: number;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={initials}
        width={size}
        height={size}
        loading="eager"
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const [a, b] = avatarTones[tone ?? (initials.charCodeAt(0) + initials.charCodeAt(initials.length - 1)) % avatarTones.length];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials}
    </span>
  );
}

// Adatta una tela disegnata a larghezza fissa alla finestra, mantenendo le proporzioni del riferimento.
export function FitCanvas({ width, minHeight, children }: { width: number; minHeight: number; children: ReactNode }) {
  const [box, setBox] = useState<{ zoom: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const fit = () => {
      // Entra sia in larghezza sia in altezza: su schermi bassi resta un margine ai lati invece di uno scorrimento.
      const byWidth = document.documentElement.clientWidth / width;
      const byHeight = window.innerHeight / minHeight;
      const zoom = Math.min(1.6, Math.max(0.6, Math.min(byWidth, byHeight)));
      setBox({ zoom, height: Math.max(minHeight, window.innerHeight / zoom) });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [width, minHeight]);

  if (!box) return null;
  return (
    <div className="overflow-x-hidden">
      <div className="relative mx-auto" style={{ zoom: box.zoom, width, height: box.height }}>
        {children}
      </div>
    </div>
  );
}

// true dopo il montaggio: evita differenze fra server e browser per ciò che dipende dal browser.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// Interruttore on/off.
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-[24px] w-[42px] shrink-0 cursor-pointer rounded-full transition-colors duration-300"
      style={{ background: on ? "var(--trainer)" : "var(--color-line)" }}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
