"use client";

// La chat del cliente con il suo trainer: la stessa conversazione che Marco vede nei suoi Messaggi (stesso store),
// quindi quello che Giulia scrive compare a Marco e quello che scrive Marco (anche tramite Leo) compare qui.
// I messaggi interni dell'assistente al trainer non si vedono. Il campo resta in basso, sopra la barra.

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, FileText } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { trainer, type ChatMessage } from "@/libs/prototipo/dati-finti";
import { stato, useStato, useTrainerPhoto } from "@/libs/prototipo/stato";
import { MAX_MESSAGGIO } from "@/libs/dati/sportello";
import { CLIENTE_IO } from "./scheda";
import { ID_FOGLI } from "./nav";

const visibili = (m: ChatMessage[]) => m.filter((x) => x.from !== "assistant");

// Non letti: i messaggi del trainer arrivati dopo l'ultima volta che il cliente ha aperto la chat, in questa finestra.
// All'apertura dell'app quelli che ci sono già contano come visti.
let visti: number | null = null;
export function useNonLettiCliente(aperta: boolean): number {
  const thread = useStato((s) => s.threads[CLIENTE_IO]) ?? [];
  const delTrainer = thread.filter((m) => m.from === "trainer").length;
  if (visti === null) visti = delTrainer;
  useEffect(() => {
    if (aperta) visti = delTrainer;
  }, [aperta, delTrainer]);
  return aperta ? 0 : Math.max(0, delTrainer - visti);
}

export function Messaggi() {
  const reduce = useReducedMotion();
  const thread = visibili(useStato((s) => s.threads[CLIENTE_IO]) ?? []);
  const foto = useTrainerPhoto();
  const [bozza, setBozza] = useState("");
  const fondo = useRef<HTMLDivElement>(null);
  const nome = trainer.name.split(" ")[0];
  const [fogli, setFogli] = useState<HTMLElement | null>(null);
  useEffect(() => setFogli(document.getElementById(ID_FOGLI)), []);

  // all'apertura e a ogni messaggio nuovo si va in fondo, dove c'è l'ultimo. Un attimo dopo: aprendo la sezione
  // il guscio (Shell) riporta la pagina in cima dopo questo effetto e lo annullerebbe. All'apertura senza animazione.
  // Si scorre il contenitore del guscio direttamente: scrollIntoView lì non si muove (provato il 30/10).
  const primaVolta = useRef(true);
  useEffect(() => {
    const t = window.setTimeout(() => {
      let el = fondo.current?.parentElement ?? null;
      while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
      el?.scrollTo({ top: el.scrollHeight, behavior: reduce || primaVolta.current ? "auto" : "smooth" });
      primaVolta.current = false;
    }, 60);
    return () => window.clearTimeout(t);
  }, [thread.length, reduce]);

  const invia = (e: FormEvent) => {
    e.preventDefault();
    const testo = bozza.trim().slice(0, MAX_MESSAGGIO);
    if (!testo) return;
    stato.addMessage(CLIENTE_IO, {
      from: "client",
      text: testo,
      time: "Adesso",
    });
    playSound("confirm");
    setBozza("");
  };

  return (
    <div className="mt-[14px]">
      <div className="glass flex items-center gap-[10px] rounded-[20px] px-[12px] py-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto}
          alt=""
          className="size-[40px] rounded-full object-cover"
        />
        <div className="min-w-0 leading-none">
          <p className="text-[14.5px] font-bold">{trainer.name}</p>
          <p className="mt-[4px] text-[11.5px] text-muted">
            Il tuo trainer · di solito risponde in giornata
          </p>
        </div>
      </div>

      {/* lo spazio della casella è lo spaziatore in fondo: con un pb in più la chat sforava e il primo messaggio
          finiva sotto l'intestazione */}
      <div className="mt-[14px] flex flex-col gap-[6px]">
        {thread.map((m, i) => {
          const mio = m.from === "client";
          const primoDelGruppo = i === 0 || thread[i - 1].from !== m.from;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i, 6) * 0.03 }}
              className={`flex max-w-[82%] flex-col ${mio ? "items-end self-end" : "items-start self-start"} ${primoDelGruppo && i ? "mt-[6px]" : ""}`}
            >
              <div
                className={`max-w-full min-w-0 rounded-[18px] px-[13px] py-[9px] text-[14px] leading-snug whitespace-pre-wrap [overflow-wrap:anywhere] ${mio ? "rounded-br-[6px] text-white" : "glass-row rounded-bl-[6px]"}`}
                style={mio ? { background: "var(--trainer)" } : undefined}
              >
                {m.text}
                {m.attachment && (
                  <a
                    href={m.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-[8px] flex items-center gap-[8px] rounded-[12px] px-[10px] py-[8px] text-[12.5px] font-semibold ${mio ? "bg-white/20" : "bg-ink/5"}`}
                  >
                    <FileText size={16} className="shrink-0" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate">
                        {m.attachment.name}
                      </span>
                      <span className="block truncate text-[11px] font-normal opacity-70">
                        {m.attachment.detail} · Apri PDF
                      </span>
                    </span>
                  </a>
                )}
              </div>
              <span className="mt-[3px] px-[4px] text-[10.5px] text-muted">
                {m.time}
              </span>
            </motion.div>
          );
        })}
        {thread.length === 0 && (
          <p className="py-[30px] text-center text-[13px] text-muted">
            Scrivi a {nome}: qui trovi tutta la vostra conversazione.
          </p>
        )}
        {/* spazio per la casella di scrittura, che sta sopra la barra: l'ultimo messaggio non le finisce sotto */}
        <div ref={fondo} className="h-[44px]" />
      </div>

      {/* la casella sta sempre in basso, appena sopra la barra delle sezioni (agganciata fuori dallo scorrimento) */}
      {fogli &&
        createPortal(
          <form
            onSubmit={invia}
            className="absolute inset-x-[14px] z-30 flex items-center gap-[8px] rounded-full border border-line bg-card py-[5px] pr-[5px] pl-[16px] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.25)]"
            style={{
              bottom: "calc(max(14px, env(safe-area-inset-bottom)) + 74px)",
            }}
          >
            <input
              value={bozza}
              onChange={(e) => setBozza(e.target.value)}
              maxLength={MAX_MESSAGGIO}
              placeholder={`Scrivi a ${nome}…`}
              aria-label={`Scrivi a ${nome}`}
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
            />
            <motion.button
              type="submit"
              aria-label="Invia"
              whileTap={{ scale: 0.92 }}
              disabled={!bozza.trim()}
              className="btn-trainer grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-full disabled:cursor-default disabled:opacity-40"
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </motion.button>
          </form>,
          fogli,
        )}
    </div>
  );
}
