"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATA_ESCE_MS, LEO } from "./misure-leo";
import { PallinaColorata, SlotPallina, usePallina } from "./Pallina";
import { useScena } from "./scena";

// Leo esce dalla pallina (esce.webp: scintille, lampo, Leo prende colore, la pallina sale sulla sua mano),
// poi resta in piedi con la pallina colorata in mano (con-pallina.webp, senza la pallina bianca, e sopra la mano
// il segnaposto "mano" dove si posa la pallina vera). La scena parte quando un passo chiama scena.setLeo("esce")
// dopo aver mandato la pallina "al centro" (il segnaposto "centro", dove l'animazione ha la sua pallina all'inizio).

const ESCE = "/prototipo/coach/esce.webp";
const FERMO = "/prototipo/coach/con-pallina.webp";
const VOLO_MS = 1000; // tempo della pallina per arrivare al centro

export function LeoInPiedi({ largo, className }: { largo: number; className?: string }) {
  const reduce = useReducedMotion();
  const { leo, setLeo } = useScena();
  const pallina = usePallina();
  const [anim, setAnim] = useState<"attesa" | "gioca" | "fine">(leo === "fermo" ? "fine" : "attesa");
  const [giocata, setGiocata] = useState(false);
  // indirizzo nuovo a ogni scena: la WebP animata riparte dal primo fotogramma
  const src = useMemo(() => `${ESCE}?t=${Date.now()}`, []);

  // le immagini si caricano prima, così la scena parte senza attese
  useEffect(() => {
    for (const s of [src, FERMO]) new Image().src = s;
  }, [src]);

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
      setGiocata(true);
      pallina.mostra({ dove: "nascosta" });
    }, VOLO_MS);
    const t2 = window.setTimeout(() => setLeo("fermo"), VOLO_MS + DURATA_ESCE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [leo, reduce, setLeo, pallina]);

  const alto = Math.round((largo * LEO.altezza) / LEO.larghezza);
  const inizio = LEO.pallinaInizio;
  const fine = LEO.pallina;
  const posInizio = { left: (inizio.x - inizio.r) * largo, top: inizio.y * alto - inizio.r * largo };
  const latoInizio = Math.round(inizio.r * 2 * largo);

  return (
    <div className={`pointer-events-none relative ${className ?? ""}`} style={{ width: largo, height: alto }}>
      {/* alone nel colore del trainer: fa risaltare il lampo e le scintille (bianchi) anche sul fondo bianco del modulo */}
      <motion.span
        aria-hidden
        // niente filtro blur: su alcune schede video Chrome lo taglia ai bordi del riquadro (linee verticali);
        // la sfumatura arriva a zero ben dentro il riquadro, quindi i bordi sono sempre trasparenti
        className="absolute"
        style={{
          left: "-70%",
          right: "-70%",
          top: "-12%",
          bottom: "-12%",
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--trainer) 40%, transparent) 0%, color-mix(in srgb, var(--trainer) 18%, transparent) 38%, transparent 70%)",
        }}
        initial={false}
        animate={{ opacity: anim === "gioca" ? 1 : anim === "fine" ? 0.45 : 0, scale: anim === "gioca" ? 1.05 : 0.9 }}
        transition={{ duration: 0.8 }}
      />
      {/* dove arriva la pallina prima che esca Leo */}
      <SlotPallina dove="centro" size={latoInizio} className="absolute" style={posInizio} />
      {anim === "fine" && (
        <motion.div initial={{ opacity: leo === "fermo" ? 1 : 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FERMO} alt="Leo, il tuo assistente" className="leo-luce absolute inset-0 size-full select-none" draggable={false} />
        </motion.div>
      )}
      {giocata && (
        // l'animazione si ferma sul suo ultimo fotogramma (pallina bianca in mano): resta sopra un attimo e sfuma
        // mentre compare la pallina colorata, così il cambio di colore è morbido
        // eslint-disable-next-line @next/next/no-img-element
        <motion.img
          src={src}
          alt=""
          className="leo-luce absolute inset-0 size-full select-none"
          draggable={false}
          initial={false}
          animate={{ opacity: anim === "fine" ? 0 : 1 }}
          transition={{ duration: 0.45, delay: anim === "fine" ? 0.1 : 0 }}
        />
      )}
      {anim === "gioca" && (
        // la pallina colorata sfuma mentre parte l'animazione, che inizia con la stessa pallina (bianca) nello stesso punto
        <motion.span className="absolute" style={posInizio} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <PallinaColorata size={latoInizio} />
        </motion.span>
      )}
      <SlotPallina dove="mano" size={Math.round(fine.r * 2 * largo)} className="absolute" style={{ left: (fine.x - fine.r) * largo, top: fine.y * alto - fine.r * largo }} />
    </div>
  );
}
