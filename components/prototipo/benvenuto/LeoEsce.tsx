"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/ui/motion";
import type { Passo } from "@/libs/prototipo/benvenuto";
import { DURATA_ESCE_MS, LEO } from "./misure-leo";
import { PallinaColorata, SlotPallina, usePallina, useDovePallina } from "./Pallina";
import { useScena } from "./scena";

// Leo esce dalla pallina (esce.webp: scintille, lampo, Leo prende colore, la pallina sale sulla sua mano),
// poi resta in piedi nella vetrina con la pallina colorata in mano (con-pallina.webp + PallinaColorata sopra
// quella bianca). La scena parte quando un passo chiama scena.setLeo("esce") dopo aver mandato la pallina "al centro".

const ESCE = "/prototipo/coach/esce.webp";
const FERMO = "/prototipo/coach/con-pallina.webp";
const VOLO_MS = 950; // tempo della pallina per arrivare al centro

export function LeoScena({ passo }: { passo: Passo }) {
  const reduce = useReducedMotion();
  const { leo, setLeo } = useScena();
  const pallina = usePallina();
  const dove = useDovePallina();
  const [anim, setAnim] = useState<"attesa" | "gioca" | "fine">(leo === "fermo" ? "fine" : "attesa");
  // indirizzo nuovo a ogni scena: la WebP animata riparte dal primo fotogramma
  const src = useMemo(() => `${ESCE}?t=${Date.now()}`, [leo === "esce"]); // eslint-disable-line react-hooks/exhaustive-deps

  // le immagini si caricano prima, così la scena parte senza attese
  useEffect(() => {
    for (const s of [ESCE, FERMO]) new Image().src = s;
  }, []);

  useEffect(() => {
    if (leo === "fermo") {
      setAnim("fine");
      pallina.mostra({ dove: "mano" });
      return;
    }
    if (leo !== "esce") return;
    if (reduce) {
      setLeo("fermo");
      return;
    }
    const t1 = window.setTimeout(() => {
      setAnim("gioca");
      pallina.mostra({ dove: "nascosta" });
    }, VOLO_MS);
    const t2 = window.setTimeout(() => setLeo("fermo"), VOLO_MS + DURATA_ESCE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [leo, reduce, setLeo, pallina]);

  // in piedi al centro nel saluto; dal passo del marchio si sposta a destra, più piccolo, accanto al telefono
  const largo = passo === 0 ? LEO.larghezza : 210;
  const alto = Math.round((largo * LEO.altezza) / LEO.larghezza);
  const inizio = LEO.pallinaInizio;
  const fine = LEO.pallina;

  if (leo === "nessuno" && dove !== "centro") return null;

  return (
    <motion.div
      className="pointer-events-none absolute bottom-[18px]"
      initial={false}
      animate={{ left: passo === 0 ? "50%" : "83%", x: "-50%", width: largo, height: alto }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      {/* dove arriva la pallina prima che esca Leo */}
      <SlotPallina
        dove="centro"
        size={Math.round(inizio.r * 2 * largo)}
        className="absolute"
        style={{ left: inizio.x * largo - inizio.r * largo, top: inizio.y * alto - inizio.r * largo }}
      />
      {anim === "gioca" && (
        // la pallina colorata sfuma mentre parte l'animazione, che inizia con la stessa pallina (bianca) nello stesso punto
        <motion.span
          className="absolute z-10"
          style={{ left: inizio.x * largo - inizio.r * largo, top: inizio.y * alto - inizio.r * largo }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <PallinaColorata size={Math.round(inizio.r * 2 * largo)} />
        </motion.span>
      )}
      {anim === "gioca" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="leo-luce absolute inset-0 size-full select-none" draggable={false} />
      )}
      {anim === "fine" && (
        <motion.div initial={{ opacity: leo === "fermo" && !reduce ? 1 : 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FERMO} alt="Leo, il tuo assistente" className="leo-luce absolute inset-0 size-full select-none" draggable={false} />
          <SlotPallina
            dove="mano"
            size={Math.round(fine.r * 2 * largo)}
            className="absolute"
            style={{ left: fine.x * largo - fine.r * largo, top: fine.y * alto - fine.r * largo }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
