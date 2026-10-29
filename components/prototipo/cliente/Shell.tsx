"use client";

// Guscio delle app da telefono (il cliente, e dal 29/10 anche il trainer): cornice del telefono sul computer (a tutto
// schermo sul telefono vero), macchie di colore sul fondo come l'area trainer, intestazione grande che scorrendo si
// rimpicciolisce in una barra di vetro (come le app Apple, scelta di Marco del 28/10) e barra in basso a pillola di
// vetro con la goccia che scivola sulla voce attiva. Voci della barra e foto in alto le passa chi lo usa.

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { BatteryFull, ChevronLeft, Moon, Signal, Sun, Wifi } from "lucide-react";
import { useAppearance } from "@/components/ui/appearance";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { navigate } from "@/components/prototipo/trainer/nav";
import { ID_FOGLI } from "./nav";

// Una voce della barra in basso; badge: il numero rosso (messaggi non letti).
export type VoceBarra = { chiave: string; label: string; icon: LucideIcon; href: string; badge?: number };
// La foto in alto a destra: apre il profilo (href) o quello che serve a chi usa il guscio (onTocca).
export type FotoGuscio = { src: string; label: string; href?: string; onTocca?: () => void };

export const FOTO_CLIENTE = "/prototipo/cliente-giulia.jpg";
const SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;

// Le macchie del fondo: danno al vetro qualcosa da mostrare, come nell'area trainer (stessa classe ambient-blob).
function Sfondo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <span
        className="ambient-blob"
        style={{
          left: -90,
          top: 40,
          width: 230,
          height: 200,
          background: "var(--trainer)",
        }}
      />
      <span
        className="ambient-blob"
        style={{
          right: -80,
          top: 220,
          width: 200,
          height: 190,
          background: "var(--color-sky-strong)",
          animationDelay: "-6s",
        }}
      />
      <span
        className="ambient-blob"
        style={{
          left: -60,
          top: 520,
          width: 190,
          height: 170,
          background: "var(--color-mint-strong)",
          animationDelay: "-11s",
        }}
      />
      <span
        className="ambient-blob"
        style={{
          right: -70,
          bottom: 40,
          width: 190,
          height: 160,
          background: "var(--color-violet-strong)",
          animationDelay: "-3s",
        }}
      />
    </div>
  );
}

// Solo nella cornice del computer: ora, isola e icone in alto, come un telefono vero.
function BarraDiStato() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden h-[50px] items-center justify-between px-[30px] pt-[4px] text-[14px] font-semibold sm:flex"
    >
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

// La cornice: a tutto schermo sul telefono vero; sul computer un telefono alto al massimo quanto la finestra.
export function Telefono({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-salvia sm:py-[16px]">
      <div className="relative h-[100dvh] w-full overflow-hidden bg-salvia text-ink sm:h-[min(844px,calc(100dvh-32px))] sm:w-[390px] sm:rounded-[54px] sm:border-[11px] sm:border-[#111] sm:shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <Sfondo />
        <BarraDiStato />
        {children}
      </div>
    </div>
  );
}

function FotoTonda({ size, foto }: { size: number; foto: FotoGuscio }) {
  return (
    <motion.button
      type="button"
      aria-label={foto.label}
      whileTap={{ scale: 0.94 }}
      onClick={() => (foto.onTocca ? foto.onTocca() : foto.href && navigate(foto.href))}
      className="glass shrink-0 cursor-pointer overflow-hidden rounded-full p-[2px]"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.src}
        alt=""
        className="size-full rounded-full object-cover"
      />
    </motion.button>
  );
}

// Al posto della campanella (Marco, 29/10): la luna per il tema scuro (il sole per tornare al chiaro).
// Il cambio parte dal tasto con l'onda dell'area trainer. Le novità del trainer si vedono col numero su Messaggi.
function TastoTema() {
  const { theme, setTheme } = useAppearance();
  const scuro = theme === "dark";
  return (
    <motion.button
      type="button"
      aria-label={scuro ? "Tema chiaro" : "Tema scuro"}
      whileTap={{ scale: 0.94 }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        playSound("tap");
        setTheme(scuro ? "light" : "dark", { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className="glass relative grid size-[40px] cursor-pointer place-items-center rounded-full"
    >
      <motion.span key={theme} initial={{ rotate: -40, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        {scuro ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
      </motion.span>
    </motion.button>
  );
}

// Indicatore di scorrimento sul bordo destro, come su iOS (Marco, 29/10: far capire che la Home scorre).
// All'apertura di una sezione che scorre compare e fa un piccolo su e giù per invitare a scorrere, poi sparisce;
// riappare mentre si scorre e dice a che punto si è. Se la sezione non scorre non c'è.
function Scorrimento({ scorre, chiave }: { scorre: RefObject<HTMLDivElement | null>; chiave: string }) {
  const reduce = useReducedMotion();
  const [misure, setMisure] = useState({ su: 0, alto: 0, tutto: 0 });
  const [acceso, setAcceso] = useState(false);
  const spegni = useRef(0);

  useEffect(() => {
    const el = scorre.current;
    if (!el) return;
    const misura = () => setMisure({ su: el.scrollTop, alto: el.clientHeight, tutto: el.scrollHeight });
    const accendi = (ms: number) => {
      setAcceso(true);
      window.clearTimeout(spegni.current);
      spegni.current = window.setTimeout(() => setAcceso(false), ms);
    };
    const suScorri = () => {
      misura();
      accendi(1100);
    };
    misura();
    // l'invito: appena aperta la sezione (dopo che le schede sono entrate)
    const invito = window.setTimeout(() => {
      misura();
      if (el.scrollHeight > el.clientHeight + 24) accendi(2600);
    }, 700);
    const osserva = new ResizeObserver(misura);
    osserva.observe(el);
    if (el.firstElementChild) osserva.observe(el.firstElementChild);
    el.addEventListener("scroll", suScorri, { passive: true });
    return () => {
      window.clearTimeout(invito);
      window.clearTimeout(spegni.current);
      osserva.disconnect();
      el.removeEventListener("scroll", suScorri);
    };
  }, [scorre, chiave]);

  if (misure.tutto <= misure.alto + 24) return null;
  const binario = misure.alto - 200; // dall'intestazione alla barra in basso
  const pollice = Math.max(34, (misure.alto / misure.tutto) * binario);
  const dove = (misure.su / (misure.tutto - misure.alto)) * (binario - pollice);
  const inCima = misure.su < 4;

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute right-[4px] z-20 w-[4px] rounded-full"
      style={{ top: 110 + dove, height: pollice, background: "color-mix(in srgb, var(--trainer) 70%, var(--color-ink) 10%)" }}
      animate={{ opacity: acceso ? 0.85 : 0, y: acceso && inCima && !reduce ? [0, 14, 0, 9, 0] : 0 }}
      transition={{ opacity: { duration: 0.25 }, y: { duration: 1.6, ease: "easeInOut", delay: 0.2 } }}
    />
  );
}

// Barra in basso: pillola di vetro in rilievo; la goccia (glass-drop, la stessa della barra laterale del trainer)
// scivola sotto la voce attiva. La voce attiva prende il colore del trainer.
function BarraSezioni({ voci, attiva }: { voci: VoceBarra[]; attiva: string }) {
  return (
    <nav
      aria-label="Sezioni"
      className="glass glass-3d absolute inset-x-[14px] z-40 grid h-[64px] rounded-full px-[5px]"
      style={{ bottom: "max(14px, env(safe-area-inset-bottom))", gridTemplateColumns: `repeat(${voci.length}, 1fr)` }}
    >
      {voci.map(({ chiave, label, icon: Icon, href, badge }) => {
        const qui = chiave === attiva;
        return (
          <button
            key={chiave}
            type="button"
            aria-current={qui ? "page" : undefined}
            onClick={() => navigate(href)}
            className="relative flex cursor-pointer flex-col items-center justify-center gap-[3px] [-webkit-tap-highlight-color:transparent]"
          >
            {qui && (
              <motion.span
                layoutId="goccia-telefono"
                aria-hidden
                className="glass-drop absolute inset-x-[2px] inset-y-[6px] rounded-full"
                transition={SPRING}
              />
            )}
            <span className="relative">
              <Icon
                size={20}
                strokeWidth={qui ? 2.2 : 1.8}
                style={{ color: qui ? "var(--trainer)" : undefined }}
                className={qui ? "" : "text-ink/55"}
              />
              {!!badge && badge > 0 && (
                <span className="absolute -top-[5px] -right-[9px] grid h-[16px] min-w-[16px] place-items-center rounded-full bg-[#e5484d] px-[4px] text-[9.5px] font-bold text-white">
                  {badge}
                </span>
              )}
            </span>
            <span
              className={`relative text-[10px] leading-none ${qui ? "font-bold" : "font-medium text-ink/60"}`}
              style={{ color: qui ? "var(--trainer)" : undefined }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// Sul computer si scorre anche trascinando con il mouse, come col dito sul telefono (la rotellina va già da sola).
// Il trascinamento parte dopo 5 px: un clic fermo resta un clic; dopo un trascinamento il clic si annulla.
function useTrascina(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inizio: { y: number; top: number } | null = null;
    let mosso = false;
    const giu = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      inizio = { y: e.clientY, top: el.scrollTop };
      mosso = false;
    };
    const muovi = (e: PointerEvent) => {
      if (!inizio) return;
      const dy = e.clientY - inizio.y;
      if (!mosso && Math.abs(dy) < 5) return;
      mosso = true;
      e.preventDefault(); // niente testo selezionato mentre si trascina
      el.scrollTop = inizio.top - dy;
    };
    const su = () => {
      inizio = null;
    };
    const clic = (e: MouseEvent) => {
      if (!mosso) return;
      mosso = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const noDrag = (e: DragEvent) => e.preventDefault(); // le foto non partono come immagini trascinate
    el.addEventListener("pointerdown", giu);
    window.addEventListener("pointermove", muovi);
    window.addEventListener("pointerup", su);
    el.addEventListener("click", clic, true);
    el.addEventListener("dragstart", noDrag);
    return () => {
      el.removeEventListener("pointerdown", giu);
      window.removeEventListener("pointermove", muovi);
      window.removeEventListener("pointerup", su);
      el.removeEventListener("click", clic, true);
      el.removeEventListener("dragstart", noDrag);
    };
  }, [ref]);
}

// L'intestazione grande sta in cima al contenuto e scorre via; quando è quasi uscita compare in alto la barra
// sottile di vetro con il titolo piccolo e la foto. Il titolo grande intanto rimpicciolisce e sfuma, come su iOS.
export function Guscio({
  sezione,
  voci,
  attiva = sezione,
  foto,
  titolo,
  titoloBreve,
  sotto,
  fuori,
  indietro,
  children,
}: {
  sezione: string; // la pagina mostrata: cambiandola si torna in cima
  voci: VoceBarra[];
  attiva?: string; // la voce accesa nella barra (una sottopagina accende la voce da cui viene)
  foto: FotoGuscio;
  titolo: string;
  titoloBreve: string;
  sotto?: ReactNode;
  fuori?: ReactNode; // sopra tutto, dentro la cornice (fogli come Leo): non scorre con il contenuto
  indietro?: { label: string; href: string }; // le sottopagine (profilo di un cliente, una conversazione): sopra il titolo
  children: ReactNode;
}) {
  const scorre = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll({ container: scorre });
  useTrascina(scorre);
  const barra = useTransform(scrollY, [36, 60], [0, 1]);
  const grande = useTransform(scrollY, [0, 60], [1, reduce ? 1 : 0.9]);
  const grandeVisibile = useTransform(scrollY, [0, 36], [1, 0]);
  const barraTocca = useTransform(barra, (v) => (v > 0.5 ? "auto" : "none"));

  // cambiando sezione si riparte dall'alto, con il titolo grande
  useEffect(() => {
    scorre.current?.scrollTo({ top: 0 });
  }, [sezione]);

  return (
    <Telefono>
      {/* la barra sottile che compare scorrendo */}
      <motion.div
        style={{ opacity: barra, pointerEvents: barraTocca }}
        className="glass absolute inset-x-0 top-0 z-30 rounded-none border-x-0 border-t-0 pt-[max(10px,env(safe-area-inset-top))] sm:pt-[50px]"
      >
        <div className="flex h-[46px] items-center justify-between px-[16px]">
          {indietro ? (
            <button type="button" aria-label={`Torna a ${indietro.label}`} onClick={() => navigate(indietro.href)} className="grid size-[34px] cursor-pointer place-items-center rounded-full" style={{ color: "var(--trainer)" }}>
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>
          ) : (
            <span className="w-[34px]" />
          )}
          <p className="text-[15px] font-bold tracking-[-0.01em]">
            {titoloBreve}
          </p>
          <FotoTonda size={34} foto={foto} />
        </div>
      </motion.div>

      <div
        ref={scorre}
        className="relative h-full overflow-y-auto overscroll-contain px-[16px] pt-[max(14px,env(safe-area-inset-top))] pb-[110px] [scrollbar-width:none] sm:pt-[58px] [&::-webkit-scrollbar]:hidden"
      >
        <motion.header
          style={{ scale: grande, opacity: grandeVisibile }}
          className="origin-left"
        >
          {indietro && (
            <button type="button" onClick={() => navigate(indietro.href)} className="-ml-[6px] mb-[4px] flex cursor-pointer items-center text-[15px] font-semibold" style={{ color: "var(--trainer)" }}>
              <ChevronLeft size={20} strokeWidth={2.4} /> {indietro.label}
            </button>
          )}
          <div className="flex items-center justify-between gap-[10px]">
            <h1 className="min-w-0 truncate text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]">
              {titolo}
            </h1>
            <div className="flex items-center gap-[8px]">
              <TastoTema />
              <FotoTonda size={40} foto={foto} />
            </div>
          </div>
          {sotto}
        </motion.header>
        <motion.div
          key={sezione}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>

      <Scorrimento scorre={scorre} chiave={sezione} />
      <BarraSezioni voci={voci} attiva={attiva} />
      {fuori}
      {/* qui si agganciano i fogli delle sezioni (createPortal): sopra tutto, dentro il telefono */}
      <div id={ID_FOGLI} />
    </Telefono>
  );
}
