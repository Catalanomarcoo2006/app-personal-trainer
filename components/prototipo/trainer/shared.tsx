"use client";

import { motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import type { Client } from "@/libs/prototipo/dati-finti";

// Avatar di un cliente: la foto se c'è, altrimenti le iniziali.
export function ClientAvatar({ c, size = 24, className = "" }: { c: Pick<Client, "initials" | "photo">; size?: number; className?: string }) {
  return <Avatar initials={c.initials} src={c.photo} size={size} className={className} />;
}

// Leo ha appena toccato questo punto: si illumina col colore del trainer e poi si spegne.
// Il genitore deve essere "relative"; key = focus.seq per farlo ripartire a ogni azione.
export function Bagliore() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
      style={{ background: "color-mix(in srgb, var(--trainer) 20%, transparent)", boxShadow: "inset 0 0 0 1.5px var(--trainer)" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: reduce ? 0.6 : 0.5, duration: reduce ? 0.2 : 1.4, ease: EASE_OUT }}
    />
  );
}
