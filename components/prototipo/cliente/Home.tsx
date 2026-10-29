"use client";

// Home del cliente, sul modello di docs/riferimenti/cliente-home-mobile.png (scelte di Marco del 27/10): l'allenamento
// di oggi con l'avanzamento, l'agenda con i giorni e la seduta del giorno scelto, "Chiedi a Leo" con Leo affacciato.
// Niente ultimo messaggio del trainer (sta in Messaggi).

import { ReactNode, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, MapPin, MessageCircleHeart, Play, Video } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { client, trainer } from "@/libs/prototipo/dati-finti";
import { giornoDi, isoDi, LONG, SHORT } from "@/libs/prototipo/calendario";
import { useStato, useTrainerPhoto } from "@/libs/prototipo/stato";
import { navigate } from "@/components/prototipo/trainer/nav";
import { useSpunte } from "./spunte";
import { ROTTE_CLIENTE } from "./nav";
import { CLIENTE_DEMO, giornoDetto, OGGI, useScheda } from "./scheda";
import { PromemoriaPesata } from "./pesata";

export { CLIENTE_DEMO };
const GIORNI = [0, 1, 2, 3, 4]; // da lunedì a venerdì, come il riferimento

// Entrata a cascata delle schede: ognuna 60 ms dopo la precedente.
function Entra({ i, children }: { i: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06, duration: 0.42, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}

const Titolo = ({ children }: { children: ReactNode }) => <h2 className="mt-[20px] mb-[8px] px-[2px] text-[16px] font-bold tracking-[-0.01em]">{children}</h2>;

// Sotto "Ciao, Giulia!": la pastiglia del trainer, come nel riferimento.
export function TrainerDiGiulia() {
  const foto = useTrainerPhoto();
  return (
    <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
      <span className="glass inline-flex h-[34px] items-center gap-[8px] rounded-full pr-[12px] pl-[3px] text-[12.5px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt="" className="size-[28px] rounded-full object-cover" />
        <span>
          <b className="font-bold">{trainer.name}</b> <span className="text-muted">· Il tuo trainer</span>
        </span>
      </span>
      <span className="glass inline-flex h-[34px] items-center rounded-full px-[12px] text-[12px] text-muted">
        <b className="mr-[4px] font-bold text-ink">{client.lessonsLeft}</b> lezioni rimaste
      </span>
    </div>
  );
}

// Le sedute di Giulia di questa settimana, dallo stesso store del calendario del trainer (se Leo le cambia, cambiano qui).
function useSeduteDiGiulia() {
  const sedute = useStato((s) => s.sedute);
  return (giorno: number) =>
    sedute
      .filter((s) => s.clientId === CLIENTE_DEMO && s.date === isoDi(giornoDi(0, giorno)))
      .sort((a, b) => a.time.localeCompare(b.time));
}

// L'allenamento è la cosa più importante della Home (Marco, 28/10): quello di oggi o, se oggi non c'è, il prossimo.
// Tutta la parte alta è un tasto: apre la scheda intera in Allenamento.
function AllenamentoDiOggi() {
  const { giorni, prossimo, esercizio } = useScheda();
  const giorno = prossimo ? giorni[prossimo.giorno] : undefined;
  const [fatte] = useSpunte(prossimo?.oggi && giorno ? giorno.rows.length : 0);
  const quante = fatte.filter(Boolean).length;
  const percento = Math.round((quante / Math.max(1, fatte.length)) * 100);
  const riga = giorno?.rows[Math.max(0, fatte.findIndex((f) => !f))] ?? giorno?.rows[0];
  const primo = riga ? esercizio(riga) : null;
  const apri = () => navigate(ROTTE_CLIENTE.allenamento);
  const sfondo = { background: "linear-gradient(135deg, color-mix(in srgb, var(--trainer) 22%, transparent), color-mix(in srgb, var(--trainer) 6%, transparent))" };

  if (!prossimo || !giorno)
    return (
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={apri} className="panel flex w-full cursor-pointer items-center justify-between rounded-[24px] px-[16px] py-[16px] text-left">
        <span className="leading-none">
          <span className="block text-[16px] font-extrabold">Nessun allenamento in programma</span>
          <span className="mt-[6px] block text-[12.5px] text-muted">{trainer.name.split(" ")[0]} ti fisserà la prossima seduta</span>
        </span>
        <ChevronRight size={18} className="text-ink/40" />
      </motion.button>
    );

  return (
    <section className="panel overflow-hidden rounded-[24px]">
      <motion.button type="button" whileTap={{ scale: 0.99 }} onClick={apri} aria-label="Apri la scheda intera" className="block w-full cursor-pointer text-left">
        <div className="flex items-start justify-between gap-[10px] px-[16px] pt-[14px] pb-[12px]" style={sfondo}>
          <div className="min-w-0 leading-none">
            <p className="text-[17px] font-extrabold tracking-[-0.02em]">{prossimo.oggi ? "Allenamento di oggi 🏋️‍♀️" : "Prossimo allenamento"}</p>
            <p className="mt-[6px] truncate text-[12.5px] text-ink/70">
              {giorno.label}
              {giorno.focus ? ` · ${giorno.focus}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right leading-none">
            {!prossimo.oggi && <p className="mb-[4px] text-[11.5px] font-semibold text-ink/60">{giornoDetto(prossimo.seduta.date)}</p>}
            <p className="text-[22px] font-extrabold tabular-nums tracking-[-0.03em]">{prossimo.seduta.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-[12px] px-[16px] pt-[12px]">
          <span className="relative grid size-[46px] shrink-0 place-items-center overflow-hidden rounded-[12px]" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--trainer) 55%, #1a1a1a), #1a1a1a)" }}>
            <Play size={16} fill="#fff" strokeWidth={0} />
          </span>
          <div className="min-w-0 flex-1 leading-none">
            <p className="truncate text-[14px] font-bold">{primo?.nome}</p>
            <p className="mt-[5px] truncate text-[11.5px] text-muted">{prossimo.oggi ? primo?.dettaglio : `${giorno.rows.length} esercizi · oggi riposo 😌`}</p>
          </div>
          {prossimo.oggi ? (
            <div className="w-[92px] shrink-0 text-right leading-none">
              <p className="text-[12px]">
                <b className="text-[15px] font-extrabold tabular-nums">{percento}%</b> <span className="text-muted">fatto</span>
              </p>
              <div className="mt-[7px] h-[6px] overflow-hidden rounded-full bg-ink/8">
                <motion.div className="h-full rounded-full" style={{ background: "var(--trainer)" }} initial={{ width: 0 }} animate={{ width: `${percento}%` }} transition={{ delay: 0.35, duration: 0.8, ease: EASE_OUT }} />
              </div>
            </div>
          ) : (
            <ChevronRight size={18} className="shrink-0 text-ink/40" />
          )}
        </div>
        <p className="flex items-center gap-[3px] px-[16px] pt-[10px] text-[12px] font-semibold" style={{ color: "var(--trainer)" }}>
          Vedi tutta la scheda <ChevronRight size={13} strokeWidth={2.4} />
        </p>
      </motion.button>
      <div className="px-[16px] pt-[10px] pb-[14px]">
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={apri} className="btn-trainer flex h-[46px] w-full cursor-pointer items-center justify-center gap-[6px] rounded-full text-[14px] font-bold">
          {!prossimo.oggi ? "Guarda cosa farai" : quante === 0 ? "Avvia allenamento" : quante === fatte.length ? "Rivedi l'allenamento" : "Continua l'allenamento"} <ChevronRight size={16} strokeWidth={2.4} />
        </motion.button>
      </div>
    </section>
  );
}

function Agenda() {
  const seduteDi = useSeduteDiGiulia();
  // si parte dal primo giorno, da oggi in poi, con una seduta; se non ce ne sono, da oggi
  const [scelto, setScelto] = useState(() => GIORNI.find((g) => g >= OGGI && seduteDi(g).length) ?? OGGI);
  const sedute = seduteDi(scelto);
  const quando = (g: number) => (g === OGGI ? "Oggi" : g === OGGI + 1 ? "Domani" : LONG[g]);

  return (
    <section className="panel rounded-[24px] px-[12px] pt-[12px] pb-[12px]">
      <p className="px-[4px] text-[13px] font-semibold text-muted">Prossimi appuntamenti</p>
      <div role="radiogroup" aria-label="Giorno" className="mt-[10px] grid grid-cols-5 gap-[6px]">
        {GIORNI.map((g) => {
          const qui = g === scelto;
          const conSeduta = seduteDi(g).length > 0;
          return (
            <motion.button
              key={g}
              type="button"
              role="radio"
              aria-checked={qui}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!qui) playSound("tap");
                setScelto(g);
              }}
              className="relative flex h-[62px] cursor-pointer flex-col items-center justify-center rounded-[16px] leading-none"
            >
              {qui ? (
                <motion.span layoutId="giorno-home" aria-hidden className="sel-trainer absolute inset-0 rounded-[16px] shadow-[0_6px_14px_-6px_color-mix(in_srgb,var(--trainer)_60%,transparent)]" transition={{ type: "spring", stiffness: 520, damping: 40 }} />
              ) : (
                <span aria-hidden className="glass absolute inset-0 rounded-[16px]" />
              )}
              <span className={`relative text-[11px] ${g < OGGI ? "text-muted" : "text-ink/70"}`}>{SHORT[g]}</span>
              <span className={`relative mt-[5px] text-[19px] font-extrabold tabular-nums ${g < OGGI ? "text-ink/45" : ""}`}>{giornoDi(0, g).getDate()}</span>
              <span aria-hidden className="relative mt-[5px] size-[5px] rounded-full" style={{ background: conSeduta ? "var(--trainer)" : "transparent" }} />
            </motion.button>
          );
        })}
      </div>

      <motion.div key={scelto} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="mt-[10px]">
        {sedute.length ? (
          sedute.map((s) => {
            const online = s.type === "Online";
            const Icona = online ? Video : MapPin;
            return (
              <div key={s.id} className="glass-row flex items-stretch gap-[12px] rounded-[16px] py-[11px] pr-[12px] pl-[12px]">
                <span aria-hidden className="w-[3px] shrink-0 rounded-full" style={{ background: "var(--trainer)" }} />
                <div className="min-w-0 leading-none">
                  <p className="text-[12px] text-muted">
                    {quando(scelto)}, ore {s.time}
                  </p>
                  <p className="mt-[5px] truncate text-[15px] font-bold">
                    {s.type === "Valutazione" ? "Valutazione" : s.type === "Corsa" ? "Corsa" : "Workout"} con {trainer.name}
                  </p>
                  <span className="mt-[7px] inline-flex items-center gap-[4px] rounded-full bg-ink/6 px-[8px] py-[4px] text-[11px] text-ink/70">
                    <Icona size={11} /> {online ? "Online" : `In presenza · ${s.place}`}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="glass-row rounded-[16px] px-[14px] py-[14px] text-[13px] text-muted">
            {scelto < OGGI ? "Nessuna seduta quel giorno." : `${quando(scelto)} niente sedute: goditi il riposo.`}
          </p>
        )}
      </motion.div>
    </section>
  );
}

// "Chiedi a Leo" (Marco, 29/10): solo il viso di Leo in un cerchio e tutto il tasto luminoso, che inviti a toccarlo.
// Il bordo è un neon che gira (conic-gradient che ruota) con un alone fatto di ombre, niente filtri blur (Chrome su
// Windows li taglia); il cerchio del viso pulsa piano. Con "riduci movimento" resta luminoso ma fermo.
const NEON = "conic-gradient(from 0deg, var(--trainer), #ffcf5c, #7cf0d0, #7cc4ff, var(--trainer))";

function ChiediALeo({ onApri }: { onApri: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onApri}
      aria-label="Chiedi a Leo, il tuo assistente"
      className="relative mt-[18px] block w-full cursor-pointer overflow-hidden rounded-[26px] p-[2.5px] text-left"
      style={{ boxShadow: "0 0 0 1px color-mix(in srgb, var(--trainer) 30%, transparent), 0 10px 30px -8px color-mix(in srgb, var(--trainer) 70%, transparent), 0 0 26px -4px color-mix(in srgb, var(--trainer) 55%, transparent)" }}
    >
      {/* il neon del bordo */}
      <motion.span aria-hidden className="absolute top-1/2 left-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2" style={{ background: NEON }} animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
      <span className="relative flex items-center gap-[14px] rounded-[23.5px] px-[14px] py-[12px]" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--trainer) 16%, var(--color-card)), var(--color-card) 60%)" }}>
        <span className="relative grid size-[58px] shrink-0 place-items-center">
          {/* l'alone che pulsa dietro il viso */}
          {!reduce && (
            <motion.span aria-hidden className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--trainer) 70%, transparent) 40%, transparent 70%)" }} animate={{ scale: [1, 1.45], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
          )}
          <span className="relative size-[58px] overflow-hidden rounded-full p-[2.5px]" style={{ background: NEON }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prototipo/coach/viso.webp" alt="" draggable={false} className="size-full rounded-full bg-card object-cover" />
          </span>
          <span aria-hidden className="absolute right-[1px] bottom-[2px] size-[13px] rounded-full bg-[#2fc26b] ring-[2.5px] ring-[var(--color-card)]" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[17px] font-extrabold tracking-[-0.02em]">Chiedi a Leo</span>
          <span className="mt-[3px] block text-[12.5px] text-ink/65">Esercizi, dubbi, un fastidio: rispondo subito</span>
        </span>
        <motion.span
          aria-hidden
          className="btn-trainer grid size-[42px] shrink-0 place-items-center rounded-full"
          animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <MessageCircleHeart size={19} strokeWidth={2.2} />
        </motion.span>
      </span>
    </motion.button>
  );
}

export function Home({ onLeo }: { onLeo: () => void }) {
  return (
    <>
      <Titolo>La tua giornata</Titolo>
      <Entra i={0}>
        <AllenamentoDiOggi />
        <PromemoriaPesata />
      </Entra>
      <Titolo>La tua agenda</Titolo>
      <Entra i={1}>
        <Agenda />
      </Entra>
      <Entra i={2}>
        <ChiediALeo onApri={onLeo} />
      </Entra>
    </>
  );
}
