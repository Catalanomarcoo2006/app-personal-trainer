"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BatteryFull, Dumbbell, House, LineChart, MessageCircle, Play, Signal, Wifi } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { trainer } from "@/libs/prototipo/dati-finti";
import { inizialiStudio, useBenvenuto } from "@/libs/prototipo/benvenuto";
import { useStato, useTrainerPhoto } from "@/libs/prototipo/stato";

// Il telefono nella vetrina del benvenuto: una versione ridotta dell'app che riceveranno i clienti del trainer
// (separata dall'app del cliente vera). Nel passo del marchio ("nascita") parte spento, a blocchi grigi, e ogni
// scelta ne accende un pezzo: nome dello studio, logo, colore, foto. Negli altri passi è già tutto acceso.

const LARGO = 270;
const ALTO = 560;
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const FATTI = [true, false, true, false, false, false, false];

export function AnteprimaTelefono({ nascita }: { nascita: boolean }) {
  const reduce = useReducedMotion();
  const b = useBenvenuto();
  const foto = useTrainerPhoto();
  const fotoScelta = useStato((s) => s.trainerPhoto) !== null;

  const acceso = {
    nome: !nascita || b.studio.trim() !== "",
    logo: !nascita || b.logo !== null,
    colore: !nascita || b.coloreScelto,
    foto: !nascita || fotoScelta,
  };
  const testo = acceso.nome || acceso.logo || acceso.colore || acceso.foto;
  const tutto = acceso.nome && acceso.logo && acceso.colore && acceso.foto;
  const studio = b.studio.trim() || trainer.name;

  // Il telefono si rimpicciolisce se la vetrina è bassa (lascia spazio alla scritta sotto).
  const spazio = useRef<HTMLDivElement>(null);
  const [scala, setScala] = useState(1);
  useLayoutEffect(() => {
    const el = spazio.current;
    if (!el) return;
    const misura = () => setScala(Math.min(1, Math.max(0.6, (el.clientHeight - 84) / ALTO)));
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Quando l'ultimo pezzo si accende passa un luccichio sullo schermo (una volta per ogni completamento).
  const [luccica, setLuccica] = useState(0);
  const prima = useRef(tutto);
  useEffect(() => {
    if (tutto && !prima.current && !reduce) setLuccica((n) => n + 1);
    prima.current = tutto;
  }, [tutto, reduce]);

  const colore = (p = 100) => (acceso.colore ? (p === 100 ? "var(--trainer)" : `color-mix(in srgb, var(--trainer) ${p}%, var(--color-card))`) : "var(--color-line)");

  return (
    <div ref={spazio} className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[18px]">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 90, scale: reduce ? 1 : 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 30 }}
        transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 170, damping: 20, mass: 0.9, delay: 0.25 }}
        style={{ width: LARGO * scala, height: ALTO * scala }}
      >
        <div className="origin-top-left" style={{ width: LARGO, height: ALTO, transform: `scale(${scala})` }}>
          {/* cornice */}
          <div className="relative h-full w-full rounded-[44px] bg-[#16161a] p-[9px] shadow-[0_40px_80px_-30px_rgba(40,20,10,0.55),0_0_0_1.5px_rgba(255,255,255,0.08)_inset]">
            <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-soft text-ink">
              {/* isola in alto */}
              <span className="absolute left-1/2 top-[9px] z-20 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-[#16161a]" />

              <div className="flex h-[40px] items-center justify-between px-[22px] pt-[4px] text-[10.5px] font-semibold">
                <span>9:41</span>
                <span className="flex items-center gap-[4px]">
                  <Signal size={11} strokeWidth={2.5} />
                  <Wifi size={11} strokeWidth={2.5} />
                  <BatteryFull size={14} strokeWidth={2} />
                </span>
              </div>

              {/* intestazione: logo, nome dello studio, foto del trainer */}
              <div className="flex items-center gap-[10px] px-[16px] pb-[12px] pt-[6px]">
                <Accende acceso={acceso.logo} grigio={<span className="block size-[34px] rounded-[10px] bg-line" />}>
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="size-[34px] rounded-[10px] bg-white object-contain p-[3px]" />
                  ) : (
                    <span
                      className="grid size-[34px] place-items-center rounded-[10px] text-[12px] font-extrabold text-white transition-colors duration-500"
                      style={{ background: "var(--trainer)" }}
                    >
                      {inizialiStudio(b.studio, trainer.name)}
                    </span>
                  )}
                </Accende>
                <div className="min-w-0 flex-1">
                  <Accende
                    acceso={acceso.nome}
                    grigio={
                      <span className="block">
                        <span className="block h-[10px] w-[96px] rounded-full bg-line" />
                        <span className="mt-[6px] block h-[7px] w-[60px] rounded-full bg-line" />
                      </span>
                    }
                  >
                    <span className="block">
                      <span className="block truncate text-[13px] font-bold leading-[1.2]">{studio}</span>
                      <span className="block truncate text-[9.5px] text-muted">con {trainer.name}</span>
                    </span>
                  </Accende>
                </div>
                <Accende acceso={acceso.foto} grigio={<span className="block size-[32px] rounded-full bg-line" />}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto} alt="" className="size-[32px] rounded-full object-cover ring-2 ring-card" />
                </Accende>
              </div>

              {/* saluto */}
              <div className="px-[16px]">
                <Accende
                  acceso={testo}
                  grigio={
                    <span className="block">
                      <span className="block h-[16px] w-[120px] rounded-full bg-line" />
                      <span className="mt-[7px] block h-[8px] w-[84px] rounded-full bg-line" />
                    </span>
                  }
                >
                  <span className="block">
                    <span className="block text-[20px] font-bold leading-[1.15] tracking-[-0.02em]">Ciao, Giulia</span>
                    <span className="mt-[3px] block text-[10.5px] text-muted">Martedì 21 ottobre</span>
                  </span>
                </Accende>
              </div>

              {/* obiettivo */}
              <div className="mx-[12px] mt-[12px] rounded-[18px] bg-card p-[14px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)]">
                <Accende
                  acceso={testo}
                  grigio={
                    <span className="block">
                      <span className="block h-[7px] w-[70px] rounded-full bg-line" />
                      <span className="mt-[9px] block h-[18px] w-[64px] rounded-full bg-line" />
                    </span>
                  }
                >
                  <span className="block">
                    <span className="block text-[10px] text-muted">Il tuo obiettivo</span>
                    <span className="mt-[2px] flex items-baseline gap-[6px]">
                      <span className="text-[22px] font-bold tracking-[-0.02em]">−8 kg</span>
                      <span className="text-[10px] text-muted">entro dicembre</span>
                    </span>
                  </span>
                </Accende>
                <div className="mt-[10px] h-[7px] overflow-hidden rounded-full transition-colors duration-500" style={{ background: colore(22) }}>
                  <motion.div
                    className="h-full rounded-full transition-colors duration-500"
                    style={{ background: colore() }}
                    initial={false}
                    animate={{ width: acceso.colore ? "39%" : "0%" }}
                    transition={{ duration: reduce ? 0 : 0.9, ease: EASE_OUT, delay: reduce ? 0 : 0.15 }}
                  />
                </div>
                <div className="mt-[6px] text-[9.5px] text-muted">{testo ? "−3,1 kg finora" : " "}</div>
              </div>

              {/* allenamento di oggi */}
              <div className="mx-[12px] mt-[10px] rounded-[18px] bg-card p-[14px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-[10px]">
                  <span className="grid size-[34px] place-items-center rounded-[11px] transition-colors duration-500" style={{ background: colore(16) }}>
                    <Dumbbell size={16} className="transition-colors duration-500" style={{ color: acceso.colore ? "var(--trainer)" : "var(--color-card)" }} />
                  </span>
                  <Accende
                    acceso={testo}
                    grigio={
                      <span className="block">
                        <span className="block h-[7px] w-[76px] rounded-full bg-line" />
                        <span className="mt-[7px] block h-[10px] w-[100px] rounded-full bg-line" />
                      </span>
                    }
                  >
                    <span className="block">
                      <span className="block text-[10px] text-muted">Allenamento di oggi</span>
                      <span className="block text-[13.5px] font-bold">Giorno A · Forza</span>
                    </span>
                  </Accende>
                </div>
                <div
                  className="mt-[12px] flex h-[36px] items-center justify-center gap-[6px] rounded-[11px] text-[12px] font-semibold transition-colors duration-500"
                  style={{ background: colore(), color: acceso.colore ? "#fff" : "var(--color-muted)" }}
                >
                  {testo && (
                    <>
                      <Play size={12} fill="currentColor" /> Inizia allenamento
                    </>
                  )}
                </div>
              </div>

              {/* settimana */}
              <div className="mx-[12px] mt-[10px] flex items-center justify-between rounded-[18px] bg-card px-[14px] py-[11px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)]">
                {GIORNI.map((g, i) => (
                  <span key={i} className="flex flex-col items-center gap-[4px]">
                    <span className="text-[8.5px] font-semibold text-muted">{testo ? g : " "}</span>
                    <span
                      className="size-[18px] rounded-full transition-colors duration-500"
                      style={{ background: FATTI[i] ? colore() : i === 3 ? colore(25) : "var(--color-soft)" }}
                    />
                  </span>
                ))}
              </div>

              {/* barra in basso */}
              <div className="absolute inset-x-0 bottom-0 flex h-[58px] items-start justify-around border-t border-line bg-card px-[10px] pt-[9px]">
                {[House, LineChart, MessageCircle].map((Icona, i) => (
                  <span
                    key={i}
                    className="grid size-[30px] place-items-center rounded-full transition-colors duration-500"
                    style={{ background: i === 0 ? colore(14) : "transparent", color: i === 0 && acceso.colore ? "var(--trainer)" : "var(--color-muted)" }}
                  >
                    <Icona size={15} />
                  </span>
                ))}
              </div>

              {/* luccichio a lavoro finito */}
              <AnimatePresence>
                {luccica > 0 && (
                  <motion.span
                    key={luccica}
                    aria-hidden
                    className="absolute inset-y-0 z-30 w-[60%] -skew-x-12"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
                    initial={{ left: "-70%" }}
                    animate={{ left: "130%" }}
                    transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={tutto ? "pronta" : "accende"}
          className="text-center text-[13px] font-semibold text-ink/60"
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {tutto ? "Così la vedranno i tuoi clienti" : "L'app dei tuoi clienti si accende mentre scegli"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// Un pezzo dello schermo: grigio finché non è acceso, poi il contenuto vero entra con un piccolo scatto.
function Accende({ acceso, grigio, children }: { acceso: boolean; grigio: ReactNode; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <span className="grid">
      <AnimatePresence initial={false}>
        <motion.span
          key={acceso ? "si" : "no"}
          className="block [grid-area:1/1]"
          initial={{ opacity: 0, scale: reduce ? 1 : 0.86, filter: reduce ? "none" : "blur(3px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 420, damping: 24 }}
        >
          {acceso ? children : grigio}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
