"use client";

// Il microfono nella chat di Leo: tocca e parla, tocca di nuovo per finire e il testo va a Leo (o resta nella barra da rileggere).
// La logica del gesto sta in libs/prototipo/leo-voce.ts; qui ci sono l'aggancio alla barra e l'aspetto.
// Spec: docs/specs/2026-10-25-vocali-leo-design.md.

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, Mic } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { cosaFare, creaSessioneVoce, messaggioErrore, unisciTesto, type StatoVoce } from "@/libs/prototipo/leo-voce";
import { dettaturaDisponibile, trascrittoreBrowser } from "@/libs/prototipo/leo-voce-browser";
import { useSceltaVocali } from "@/libs/prototipo/leo-voce-scelta";

export type VoceLeo = {
  disponibile: boolean;
  bloccato: boolean;
  fase: StatoVoce["fase"]; // fermo, preparazione (toccato, microfono non ancora acceso), in-ascolto
  errore: string | null;
  inAttesa: string | null; // il vocale della prima volta, in attesa della scelta
  scegli(s: "subito" | "rivedi"): void;
  annulla(): void; // butta il vocale in corso
  tasto: { onClick(): void }; // un tocco inizia, il tocco dopo finisce
};

export function useVoceLeo(o: { bloccato: boolean; draft: string; setDraft(t: string): void; invia(testo: string): void }): VoceLeo {
  const [scelta, salvaScelta] = useSceltaVocali();
  const [disponibile, setDisponibile] = useState(false);
  const [fase, setFase] = useState<StatoVoce["fase"]>("fermo");
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
        setFase(x.fase);
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

  // un suono quando il microfono è davvero acceso: da lì si può parlare
  useEffect(() => {
    if (fase === "in-ascolto") playSound("confirm");
  }, [fase]);

  // finché c'è un vocale in corso Esc lo annulla; il cambio di finestra solo a microfono acceso
  // (il riquadro del permesso, la prima volta, toglie il fuoco alla pagina: non è un annullamento)
  useEffect(() => {
    if (fase === "fermo") return;
    // Esc in ascolto annulla solo il vocale: senza fermare l'evento chiuderebbe anche la chat
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      annullaTutto();
    };
    window.addEventListener("keydown", esc, true);
    if (fase === "in-ascolto") window.addEventListener("blur", annullaTutto);
    return () => {
      window.removeEventListener("keydown", esc, true);
      window.removeEventListener("blur", annullaTutto);
    };
  }, [fase]);

  return {
    disponibile,
    bloccato: o.bloccato,
    fase,
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
    annulla: annullaTutto,
    tasto: {
      onClick() {
        if (o.bloccato) return;
        if (fase === "fermo") premi();
        else if (fase === "in-ascolto") void sessione.current?.lascia(); // durante la preparazione il tocco non fa niente
      },
    },
  };
}

// Il tasto accanto a "Allega": non compare se il browser non ha la dettatura (per esempio Firefox).
// Tre aspetti ben distinti: spento, "sto accendendo" (rotellina: non parlare ancora) e acceso (pieno, con onde).
export function TastoMicrofono({ voce }: { voce: VoceLeo }) {
  const reduce = useReducedMotion();
  if (!voce.disponibile) return null;
  const acceso = voce.fase === "in-ascolto";
  const preparo = voce.fase === "preparazione";
  return (
    <button
      type="button"
      aria-label={acceso ? "Tocca per finire il vocale" : "Tocca per parlare a Leo"}
      title={acceso ? "Tocca per finire il vocale" : "Tocca per parlare a Leo"}
      aria-pressed={voce.fase !== "fermo"}
      aria-busy={preparo}
      aria-disabled={voce.bloccato}
      {...voce.tasto}
      onContextMenu={(e) => e.preventDefault()}
      style={acceso ? { background: "var(--trainer)", color: "#fff", boxShadow: "0 4px 14px color-mix(in srgb, var(--trainer) 45%, transparent)" } : preparo ? { background: "color-mix(in srgb, var(--trainer) 14%, transparent)", color: "var(--trainer)" } : undefined}
      className={`relative grid size-[32px] shrink-0 select-none place-items-center rounded-full transition-[background-color,color,box-shadow] duration-200 ${voce.bloccato ? "cursor-default opacity-40" : "cursor-pointer"} ${voce.fase === "fermo" ? "text-muted hover:bg-soft hover:text-ink" : ""}`}
    >
      {acceso && !reduce && (
        <>
          {[0, 0.45].map((ritardo) => (
            <motion.span
              key={ritardo}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: "var(--trainer)" }}
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut", delay: ritardo }}
            />
          ))}
        </>
      )}
      {preparo ? <Loader2 size={15} className={reduce ? "relative" : "relative animate-spin"} /> : <Mic size={15} className="relative" />}
    </button>
  );
}

// Sopra la barra: l'errore del vocale e, la prima volta, la scelta tra "subito" e "rivedi".
export function VoceStato({ voce }: { voce: VoceLeo }) {
  return (
    <>
      {voce.fase !== "fermo" && (
        <p aria-live="polite" className="mx-[14px] mb-[6px] flex items-center gap-[7px] text-[11.5px] font-semibold" style={{ color: voce.fase === "in-ascolto" ? "var(--trainer)" : undefined }}>
          {voce.fase === "in-ascolto" ? (
            <>
              <span aria-hidden className="size-[8px] shrink-0 animate-pulse rounded-full" style={{ background: "var(--trainer)" }} />
              Ti ascolto: parla, poi tocca il microfono per finire
            </>
          ) : (
            <span className="text-muted">Accendo il microfono… aspetta un attimo</span>
          )}
          <button type="button" onClick={voce.annulla} className="ml-auto cursor-pointer rounded-full px-[8px] py-[2px] text-[11px] font-semibold text-muted transition-colors hover:bg-soft hover:text-ink">
            Annulla
          </button>
        </p>
      )}
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
