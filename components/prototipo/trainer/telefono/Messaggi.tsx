"use client";

// Messaggi del trainer da telefono: l'elenco delle conversazioni (con i non letti) e la chat con un cliente
// (?cliente=). Stesse conversazioni del computer e dell'app del cliente (stesso store). I messaggi dell'assistente
// al trainer compaiono come note di Leo. Quando Leo scrive a un cliente, il testo compare nella casella e poi parte.

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, Bot, FileText } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { stato, useFocusLeo, useStato } from "@/libs/prototipo/stato";
import { useTrovaCliente } from "@/libs/dati/selettori";
import { MAX_MESSAGGIO } from "@/libs/dati/sportello";
import { ID_FOGLI } from "@/components/prototipo/cliente/nav";
import { ROUTES } from "../nav";
import { ClientAvatar } from "../shared";
import { segnaLetta, useNonLetti } from "./nonLetti";
import { Riga, Riquadro, Vuoto } from "./pezzi";

export function ElencoMessaggi() {
  const threads = useStato((s) => s.threads);
  const trova = useTrovaCliente();
  const nonLetti = useNonLetti();
  // prima chi ha scritto e aspetta, poi le altre nell'ordine della demo
  const ordine = Object.keys(threads).sort((a, b) => (nonLetti[b] ? 1 : 0) - (nonLetti[a] ? 1 : 0));

  return (
    <Riquadro className="mt-[14px]">
      {ordine.map((id) => {
        const c = trova(id);
        const ultimo = threads[id].at(-1);
        const n = nonLetti[id] ?? 0;
        if (!c) return null;
        return (
          <Riga
            key={id}
            href={`${ROUTES.messaggi}?cliente=${id}`}
            freccia={false}
            sinistra={<ClientAvatar c={c} size={46} />}
            titolo={<span className={n ? "font-extrabold" : ""}>{c.name}</span>}
            sotto={ultimo ? `${ultimo.from === "trainer" ? "Tu: " : ultimo.from === "assistant" ? "Leo: " : ""}${ultimo.attachment ? `📄 ${ultimo.attachment.name}` : ultimo.text}` : "Nessun messaggio"}
            destra={
              <span className="flex shrink-0 flex-col items-end gap-[5px] leading-none">
                <span className="text-[11px] text-muted">{ultimo?.time}</span>
                {n > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e5484d] px-[5px] text-[10.5px] font-bold text-white">{n}</span>}
              </span>
            }
          />
        );
      })}
      {!ordine.length && <Vuoto>Nessuna conversazione</Vuoto>}
    </Riquadro>
  );
}

export function ChatCliente({ id }: { id: string }) {
  const reduce = useReducedMotion();
  const threads = useStato((s) => s.threads);
  const thread = threads[id] ?? [];
  const c = useTrovaCliente()(id);
  const [bozza, setBozza] = useState("");
  const fondo = useRef<HTMLDivElement>(null);
  const [fogli, setFogli] = useState<HTMLElement | null>(null);
  useEffect(() => setFogli(document.getElementById(ID_FOGLI)), []);
  const primo = c?.name.split(" ")[0] ?? "il cliente";

  // aperta = letta, anche quando arriva un messaggio nuovo mentre è aperta
  useEffect(() => segnaLetta(id, threads), [id, threads]);

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [thread.length, reduce]);

  // Leo scrive a questo cliente: il testo compare nella casella; quando il messaggio parte la casella si svuota
  const focus = useFocusLeo();
  useEffect(() => {
    if (focus?.tipo !== "messaggio" || focus.clientId !== id) return;
    setBozza(focus.daScrivere ? (focus.testo ?? "") : "");
  }, [focus, id]);

  const invia = (e: FormEvent) => {
    e.preventDefault();
    const testo = bozza.trim().slice(0, MAX_MESSAGGIO);
    if (!testo) return;
    stato.addMessage(id, { from: "trainer", text: testo, time: "Adesso" });
    playSound("confirm");
    setBozza("");
  };

  return (
    <div className="mt-[10px]">
      <div className="flex flex-col gap-[6px] pb-[64px]">
        {thread.map((m, i) => {
          if (m.from === "assistant")
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="my-[6px] flex gap-[8px] rounded-[16px] px-[12px] py-[9px] text-[12.5px] leading-snug"
                style={{ background: "color-mix(in srgb, var(--trainer) 10%, transparent)" }}
              >
                <Bot size={15} className="mt-[1px] shrink-0" style={{ color: "var(--trainer)" }} />
                <span>
                  <b>Leo · solo per te</b> — {m.text}
                </span>
              </motion.p>
            );
          const mio = m.from === "trainer";
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
                      <span className="block truncate">{m.attachment.name}</span>
                      <span className="block truncate text-[11px] font-normal opacity-70">{m.attachment.detail} · Apri PDF</span>
                    </span>
                  </a>
                )}
              </div>
              <span className="mt-[3px] px-[4px] text-[10.5px] text-muted">{m.time}</span>
            </motion.div>
          );
        })}
        {!thread.length && <p className="py-[30px] text-center text-[13px] text-muted">Scrivi a {primo}: qui trovi tutta la vostra conversazione.</p>}
        <div ref={fondo} />
      </div>

      {/* la casella sta sempre in basso, sopra la barra delle sezioni (fuori dallo scorrimento) */}
      {fogli &&
        createPortal(
          <form
            onSubmit={invia}
            className="absolute inset-x-[14px] z-30 flex items-center gap-[8px] rounded-full border border-line bg-card py-[5px] pr-[5px] pl-[16px] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.25)]"
            style={{ bottom: "calc(max(14px, env(safe-area-inset-bottom)) + 74px)" }}
          >
            <input
              value={bozza}
              onChange={(e) => setBozza(e.target.value)}
              maxLength={MAX_MESSAGGIO}
              placeholder={`Scrivi a ${primo}…`}
              aria-label={`Scrivi a ${primo}`}
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
            />
            <motion.button
              type="submit"
              aria-label="Invia"
              whileTap={{ scale: 0.92 }}
              disabled={!bozza.trim()}
              className="btn-trainer grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-full disabled:cursor-default"
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </motion.button>
          </form>,
          fogli,
        )}
    </div>
  );
}
