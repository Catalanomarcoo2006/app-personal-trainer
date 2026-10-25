"use client";

// Il microfono nella chat di Leo: tieni premuto e parla, lascia e il testo va a Leo (o resta nella barra da rileggere).
// La logica del gesto sta in libs/prototipo/leo-voce.ts; qui ci sono l'aggancio alla barra e l'aspetto.
// Spec: docs/specs/2026-10-25-vocali-leo-design.md.

import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Mic } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { cosaFare, creaSessioneVoce, messaggioErrore, unisciTesto } from "@/libs/prototipo/leo-voce";
import { dettaturaDisponibile, trascrittoreBrowser } from "@/libs/prototipo/leo-voce-browser";
import { useSceltaVocali } from "@/libs/prototipo/leo-voce-scelta";

const MARGINE_PX = 8; // rilasciare un po' fuori dal tasto vale ancora come "lascia"

export type VoceLeo = {
  disponibile: boolean;
  bloccato: boolean;
  inAscolto: boolean;
  errore: string | null;
  inAttesa: string | null; // il vocale della prima volta, in attesa della scelta
  scegli(s: "subito" | "rivedi"): void;
  tasto: {
    onPointerDown(e: ReactPointerEvent<HTMLButtonElement>): void;
    onPointerUp(e: ReactPointerEvent<HTMLButtonElement>): void;
    onPointerCancel(): void;
  };
};

export function useVoceLeo(o: { bloccato: boolean; draft: string; setDraft(t: string): void; invia(testo: string): void }): VoceLeo {
  const [scelta, salvaScelta] = useSceltaVocali();
  const [disponibile, setDisponibile] = useState(false);
  const [inAscolto, setInAscolto] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [inAttesa, setInAttesa] = useState<string | null>(null);
  const sessione = useRef<ReturnType<typeof creaSessioneVoce> | null>(null);
  const base = useRef(""); // quello che c'era nella barra quando si è premuto
  // sempre l'ultimo valore, senza ricreare la sessione a ogni cambio
  const ultimi = useRef({ ...o, scelta });
  ultimi.current = { ...o, scelta };

  useEffect(() => setDisponibile(dettaturaDisponibile()), []);

  // se la chat si chiude mentre si registra, il microfono si spegne subito (non resta acceso fino ai 60 secondi)
  useEffect(
    () => () => {
      sessione.current?.annulla();
      sessione.current = null;
    },
    [],
  );

  const annullaTutto = () => {
    const s = sessione.current;
    if (!s) return;
    sessione.current = null;
    s.annulla();
    ultimi.current.setDraft(base.current);
  };

  function premi() {
    const { bloccato, draft } = ultimi.current;
    if (bloccato || sessione.current) return;
    base.current = draft;
    setErrore(null);
    setInAttesa(null);
    const s = creaSessioneVoce(trascrittoreBrowser(), {
      onStato: (x) => {
        setInAscolto(x.fase === "in-ascolto");
        setErrore(x.errore ? messaggioErrore(x.errore) : null);
        if (x.fase === "in-ascolto" && x.testo) ultimi.current.setDraft(unisciTesto(base.current, x.testo));
      },
      onFine: (d) => {
        sessione.current = null;
        const { setDraft, invia, scelta: scelto } = ultimi.current;
        if (!d) return setDraft(base.current);
        if (d.parziale) setErrore(messaggioErrore("interrotto"));
        const cosa = cosaFare(scelto, d, base.current.trim() !== "");
        if (cosa === "invia") {
          setDraft("");
          invia(d.testo);
        } else if (cosa === "rivedi") setDraft(unisciTesto(base.current, d.testo));
        else {
          setDraft(base.current);
          setInAttesa(d.testo);
        }
      },
    });
    sessione.current = s;
    playSound("tap");
    void s.premi();
  }

  // finché si ascolta: Esc e il cambio di finestra annullano il vocale
  useEffect(() => {
    if (!inAscolto) return;
    // Esc in ascolto annulla solo il vocale: senza fermare l'evento chiuderebbe anche la chat
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      annullaTutto();
    };
    window.addEventListener("keydown", esc, true);
    window.addEventListener("blur", annullaTutto);
    return () => {
      window.removeEventListener("keydown", esc, true);
      window.removeEventListener("blur", annullaTutto);
    };
  }, [inAscolto]);

  return {
    disponibile,
    bloccato: o.bloccato,
    inAscolto,
    errore,
    inAttesa,
    scegli(s) {
      salvaScelta(s);
      const testo = inAttesa;
      setInAttesa(null);
      if (!testo) return;
      if (s === "subito") o.invia(testo);
      else o.setDraft(unisciTesto(base.current, testo));
    },
    tasto: {
      onPointerDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId); // il rilascio arriva al tasto anche se il dito scivola fuori
        } catch {
          // senza cattura vale comunque il rilascio sul tasto
        }
        premi();
      },
      onPointerUp(e) {
        const r = e.currentTarget.getBoundingClientRect();
        const dentro = e.clientX >= r.left - MARGINE_PX && e.clientX <= r.right + MARGINE_PX && e.clientY >= r.top - MARGINE_PX && e.clientY <= r.bottom + MARGINE_PX;
        if (dentro) void sessione.current?.lascia();
        else annullaTutto();
      },
      onPointerCancel: annullaTutto,
    },
  };
}

// Il tasto accanto a "Allega": non compare se il browser non ha la dettatura (per esempio Firefox).
export function TastoMicrofono({ voce }: { voce: VoceLeo }) {
  const reduce = useReducedMotion();
  if (!voce.disponibile) return null;
  return (
    <button
      type="button"
      aria-label="Tieni premuto per parlare a Leo"
      title="Tieni premuto per parlare a Leo"
      aria-pressed={voce.inAscolto}
      aria-disabled={voce.bloccato}
      {...voce.tasto}
      onContextMenu={(e) => e.preventDefault()}
      style={voce.inAscolto ? { background: "color-mix(in srgb, var(--trainer) 16%, transparent)", color: "var(--trainer)" } : undefined}
      className={`relative grid size-[26px] shrink-0 touch-none select-none place-items-center rounded-full transition-colors ${voce.bloccato ? "cursor-default opacity-40" : "cursor-pointer"} ${voce.inAscolto ? "" : "text-muted hover:bg-soft hover:text-ink"}`}
    >
      {voce.inAscolto && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: "var(--trainer)" }}
          initial={{ scale: 1, opacity: 0.35 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <Mic size={14} className="relative" />
    </button>
  );
}

// Sopra la barra: l'errore del vocale e, la prima volta, la scelta tra "subito" e "rivedi".
export function VoceStato({ voce }: { voce: VoceLeo }) {
  return (
    <>
      {voce.errore && <p className="mx-[14px] mb-[6px] text-[11.5px] text-[#d43b4f]">{voce.errore}</p>}
      {voce.inAttesa && (
        <div className="mx-[14px] mb-[8px] rounded-[14px] border border-line bg-soft p-[10px] text-[12px]">
          <p className="text-[10.5px] text-muted">Come vuoi i vocali?</p>
          <p className="mt-[2px] font-semibold">“{voce.inAttesa}”</p>
          <div className="mt-[8px] flex flex-wrap gap-[6px]">
            <button type="button" onClick={() => voce.scegli("subito")} className="btn-trainer cursor-pointer rounded-full px-[10px] py-[5px] text-[11px] font-semibold">
              Mandalo subito a Leo (da ora sempre così)
            </button>
            <button type="button" onClick={() => voce.scegli("rivedi")} className="cursor-pointer rounded-full border border-line px-[10px] py-[5px] text-[11px] font-semibold transition-colors hover:bg-white/60">
              Fammelo rivedere (da ora sempre così)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
