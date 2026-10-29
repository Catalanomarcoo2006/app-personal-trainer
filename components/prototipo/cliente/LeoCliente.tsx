"use client";

// Leo nell'app del cliente: un foglio che sale dal basso con Leo affacciato dal bordo alto, le domande pronte, la chat.
// Risponde l'AI (app/prototipo/api/leo-cliente) con il testo che scorre mentre arriva; senza chiave o se l'AI non
// risponde, le risposte fisse di libs/prototipo/leo-cliente.ts. Con un dolore Leo avvisa il trainer (riga "Ho avvisato").

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, BellRing, Paperclip, X } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { assistantSuggestions, client, trainer } from "@/libs/prototipo/dati-finti";
import { lettoreNdjson } from "@/libs/prototipo/leo-flusso";
import { estraiDolore, pareDolore, rispostaCliente } from "@/libs/prototipo/leo-cliente";
import { ACCETTATI, bloccoAllegato, leggiFile } from "@/libs/prototipo/leo-file";
import { TastoMicrofono, useVoceLeo, VoceStato } from "@/components/prototipo/trainer/MicrofonoLeo";
import { EASE_OUT } from "@/components/ui/motion";

type Msg = { id: number; da: "cliente" | "leo" | "avviso"; testo: string; file?: string };
export type Allegato = { nome: string; testo: string };
const nomeTrainer = trainer.name.split(" ")[0];
// in leo-sbircia.webp (560 × 433) il bordo della foto è alla riga 378: in proporzione alla larghezza, 378 / 560.
// Se si cambia la foto si cambia anche il nome del file: con lo stesso nome il browser può tenere la foto nuova
// e il calcolo vecchio, e Leo finisce più in basso del bordo (successo il 29/10).
export const LEO_FOTO = "/prototipo/coach/leo-sbircia.webp";
export const LEO_BORDO = 378 / 560;
export const LEO_LARGO = 132; // px: piccolo, si aggrappa al bordo senza coprire lo schermo

// La chat con Leo del cliente: sta in ClientApp, così la usano sia il foglio sia la faccia di Leo (vocale tenuto premuto).
export type ChatCliente = ReturnType<typeof useChatCliente>;
export function useChatCliente() {
  const [messaggi, setMessaggi] = useState<Msg[]>([]);
  const [scrive, setScrive] = useState(false); // i tre puntini, finché non arriva il primo pezzo
  const occupato = useRef(false);
  const [risponde, setRisponde] = useState(false); // Leo sta rispondendo: Invia e domande pronte restano spenti
  const prossimo = useRef(1);
  const storia = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const richiesta = useRef<AbortController | null>(null);
  const timer = useRef<number[]>([]);

  useEffect(
    () => () => {
      richiesta.current?.abort();
      timer.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const mostra = (id: number, testo: string) =>
    setMessaggi((m) => (m.some((x) => x.id === id) ? m.map((x) => (x.id === id ? { ...x, testo } : x)) : [...m, { id, da: "leo", testo }]));

  // la risposta fissa si scrive una parola alla volta, come se arrivasse dall'AI
  const scriviPianoPiano = (id: number, testo: string) =>
    new Promise<void>((fatto) => {
      const parole = testo.split(" ");
      parole.forEach((_, i) =>
        timer.current.push(
          window.setTimeout(() => {
            mostra(id, parole.slice(0, i + 1).join(" "));
            if (i === parole.length - 1) fatto();
          }, 350 + i * 35),
        ),
      );
    });

  // allegato: il testo del file (letto nel browser) va a Leo una volta sola, con questa domanda; nella cronologia
  // resta solo il nome del file, come nella chat del trainer
  const chiedi = async (domanda: string, allegato?: Allegato) => {
    const testo = (domanda.trim() || (allegato ? "Leggi il file che ti ho mandato" : "")).slice(0, 1000);
    if (!testo || occupato.current) return false;
    occupato.current = true;
    setRisponde(true);
    playSound("tap");
    setMessaggi((m) => [...m, { id: prossimo.current++, da: "cliente", testo, file: allegato?.nome }]);
    const conFile = allegato ? `${testo}\n\n${bloccoAllegato(allegato.nome, allegato.testo)}` : testo;
    const daMandare = [...storia.current.slice(-9), { role: "user" as const, content: conFile }];
    storia.current = [...storia.current, { role: "user", content: allegato ? `${testo}\n(file allegato "${allegato.nome}")` : testo }];
    setScrive(true);
    const id = prossimo.current++;
    let raw = "";
    let dolore = false;

    try {
      const ctrl = new AbortController();
      richiesta.current = ctrl;
      const res = await fetch("/prototipo/api/leo-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: daMandare }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const lettore = lettoreNdjson((e) => {
        if (e.tipo !== "testo") return;
        raw += e.v;
        setScrive(false);
        mostra(id, estraiDolore(raw).testo);
      });
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        lettore.scrivi(decoder.decode(value, { stream: true }));
      }
      lettore.chiudi();
      const finale = estraiDolore(raw);
      if (!finale.testo) throw new Error("risposta vuota");
      mostra(id, finale.testo);
      // se l'AI non ha messo il segno ma la domanda parla di dolore, l'avviso parte lo stesso: meglio uno in più
      dolore = finale.dolore || pareDolore(testo);
      storia.current = [...storia.current, { role: "assistant", content: finale.testo }];
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return true;
      // senza AI: le risposte fisse (un file senza AI non si può leggere: lo si dice)
      const r = allegato ? { text: `Ho il file "${allegato.nome}", ma adesso non riesco a leggerlo: riprova tra poco, oppure mandalo a ${nomeTrainer} in Messaggi.`, dolore: false } : rispostaCliente(testo);
      setScrive(false);
      await scriviPianoPiano(id, r.text);
      dolore = r.dolore;
      storia.current = [...storia.current, { role: "assistant", content: r.text }];
    } finally {
      setScrive(false);
      occupato.current = false;
      setRisponde(false);
    }
    playSound("confirm");
    if (dolore) {
      timer.current.push(
        window.setTimeout(() => {
          playSound("open");
          setMessaggi((m) => [...m, { id: prossimo.current++, da: "avviso", testo: `Ho avvisato ${nomeTrainer}: ti scriverà in Messaggi` }]);
        }, 400),
      );
    }
    return true;
  };

  return { messaggi, scrive, risponde, chiedi };
}

function Puntini() {
  return (
    <span className="glass-row inline-flex items-center gap-[4px] rounded-[18px] rounded-bl-[6px] px-[14px] py-[13px]">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-[6px] rounded-full bg-ink/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

export function LeoCliente({ chat, aperto, onChiudi }: { chat: ChatCliente; aperto: boolean; onChiudi: () => void }) {
  const reduce = useReducedMotion();
  const { messaggi, scrive, risponde, chiedi } = chat;
  const [bozza, setBozza] = useState("");
  const lista = useRef<HTMLDivElement>(null);
  // vocali: come nella chat del trainer (la dettatura del browser: solo con dati finti, regole del progetto)
  const voce = useVoceLeo({ bloccato: risponde, draft: bozza, setDraft: setBozza, invia: (t) => void chiedi(t) });
  // il file allegato: l'app lo legge subito nel browser (PDF con testo, Excel, CSV, TXT) e lo manda con il messaggio
  const [file, setFile] = useState<Allegato | null>(null);
  const [erroreFile, setErroreFile] = useState<string | null>(null);
  const sceltaFile = useRef<HTMLInputElement>(null);
  const allega = async (f: File | undefined) => {
    if (!f) return;
    playSound("tap");
    const letto = await leggiFile(f);
    if ("motivo" in letto) {
      setFile(null);
      setErroreFile(letto.motivo);
      return;
    }
    setErroreFile(null);
    setFile({ nome: letto.nome, testo: letto.testo });
  };

  // in fondo a ogni messaggio nuovo (anche mentre la risposta scorre)
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messaggi, scrive, reduce]);

  useEffect(() => {
    if (!aperto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onChiudi();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aperto, onChiudi]);

  const invia = (e?: FormEvent) => {
    e?.preventDefault();
    if ((!bozza.trim() && !file) || risponde) return;
    void chiedi(bozza, file ?? undefined);
    setBozza(""); // solo se la domanda è partita: mentre Leo risponde il testo resta nella casella
    setFile(null);
    setErroreFile(null);
  };

  return (
    <AnimatePresence>
      {aperto && (
        <motion.div key="leo-cliente" className="absolute inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <button type="button" aria-label="Chiudi Leo" onClick={onChiudi} className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[3px]" />
          <motion.section
            role="dialog"
            aria-label="Leo, il tuo assistente"
            initial={{ y: reduce ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : "100%" }}
            transition={{ duration: 0.42, ease: EASE_OUT }}
            className="absolute inset-x-0 bottom-0 flex h-[80%] flex-col"
          >
            {/* Leo si affaccia dal bordo alto e guarda giù, come se sbirciasse la chat (leo-sbircia.webp, ritagliato dalla
                foto di Gemini di Marco del 29/10): la riga del bordo della foto combacia con il bordo del foglio e le
                dita scendono sopra il foglio. Sta sopra il foglio, quindi entra solo con una dissolvenza breve. */}
            <motion.img
              src={LEO_FOTO}
              alt=""
              aria-hidden
              draggable={false}
              initial={{ opacity: 0, y: reduce ? 0 : 14, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 22 }}
              className="pointer-events-none absolute left-1/2 z-10 select-none"
              style={{ width: LEO_LARGO, top: -LEO_BORDO * LEO_LARGO }}
            />
            {/* fondo pieno: dietro ci sono il corpo di Leo e la pagina, non devono trasparire */}
            <div className="panel relative flex min-h-0 flex-1 flex-col rounded-t-[30px] rounded-b-none pb-[max(12px,env(safe-area-inset-bottom))]" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center justify-between px-[18px] pt-[22px]">
                <div className="leading-none">
                  <p className="text-[18px] font-extrabold tracking-[-0.02em]">Leo</p>
                  <p className="mt-[4px] text-[12px] text-muted">Il tuo assistente · risponde subito</p>
                </div>
                <button type="button" aria-label="Chiudi" onClick={onChiudi} className="glass grid size-[34px] cursor-pointer place-items-center rounded-full">
                  <X size={15} />
                </button>
              </div>

              <div ref={lista} className="min-h-0 flex-1 overflow-y-auto px-[16px] pt-[14px] pb-[8px] [scrollbar-width:none]">
                {!messaggi.length && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="glass-row max-w-[85%] rounded-[18px] rounded-bl-[6px] px-[13px] py-[10px] text-[14px] leading-snug">
                      Ciao {client.name}! 💪 Oggi c&apos;è il Giorno A. Chiedimi degli esercizi, di come stai andando o di un fastidio: ci sono.
                    </p>
                    <div className="mt-[12px] flex flex-wrap gap-[7px]">
                      {assistantSuggestions.map((d) => (
                        <motion.button key={d} type="button" whileTap={{ scale: 0.96 }} disabled={risponde} onClick={() => void chiedi(d)} className="sel-trainer cursor-pointer rounded-full px-[12px] py-[8px] text-[13px] font-semibold">
                          {d}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <div className="flex flex-col gap-[8px]">
                  {messaggi.map((m) =>
                    m.da === "avviso" ? (
                      <motion.p key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto inline-flex items-center gap-[6px] rounded-full px-[12px] py-[6px] text-[12px] font-semibold" style={{ color: "var(--trainer)", background: "color-mix(in srgb, var(--trainer) 12%, transparent)" }}>
                        <BellRing size={13} /> {m.testo}
                      </motion.p>
                    ) : (
                      <motion.p
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`max-w-[85%] rounded-[18px] px-[13px] py-[10px] text-[14px] leading-snug whitespace-pre-wrap [overflow-wrap:anywhere] ${m.da === "cliente" ? "ml-auto rounded-br-[6px] text-white" : "glass-row rounded-bl-[6px]"}`}
                        style={m.da === "cliente" ? { background: "var(--trainer)" } : undefined}
                      >
                        {m.file && (
                          <span className="mb-[6px] flex items-center gap-[5px] rounded-[10px] bg-white/20 px-[8px] py-[5px] text-[12px] font-semibold">
                            <Paperclip size={12} className="shrink-0" /> <span className="truncate">{m.file}</span>
                          </span>
                        )}
                        {m.testo}
                      </motion.p>
                    ),
                  )}
                  {scrive && <Puntini />}
                </div>
              </div>

              <VoceStato voce={voce} />
              {(file || erroreFile) && (
                <div className="mx-[14px] mb-[6px] flex items-center gap-[6px] text-[12px]">
                  {file ? (
                    <span className="flex min-w-0 items-center gap-[5px] rounded-full bg-soft px-[10px] py-[5px] font-semibold">
                      <Paperclip size={12} className="shrink-0" />
                      <span className="truncate">{file.nome}</span>
                      <button type="button" aria-label="Togli il file" onClick={() => setFile(null)} className="grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-full hover:bg-line">
                        <X size={11} />
                      </button>
                    </span>
                  ) : (
                    <span className="text-[#d43b4f]">{erroreFile}</span>
                  )}
                </div>
              )}
              <form onSubmit={invia} className="mx-[12px] flex items-center gap-[6px] rounded-full border border-line bg-card py-[5px] pr-[5px] pl-[10px]">
                <input
                  ref={sceltaFile}
                  type="file"
                  accept={ACCETTATI}
                  className="hidden"
                  onChange={(e) => {
                    void allega(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <button type="button" aria-label="Allega un file (PDF, Excel, CSV, TXT)" onClick={() => sceltaFile.current?.click()} className="grid size-[32px] shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink">
                  <Paperclip size={16} />
                </button>
                <TastoMicrofono voce={voce} />
                <input
                  value={bozza}
                  onChange={(e) => setBozza(e.target.value)}
                  maxLength={1000}
                  placeholder={voce.fase === "in-ascolto" ? "Parla adesso…" : voce.fase === "preparazione" ? "Accendo il microfono…" : "Scrivi a Leo…"}
                  aria-label="Scrivi a Leo"
                  className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
                />
                <motion.button type="submit" aria-label="Invia" whileTap={{ scale: 0.92 }} disabled={(!bozza.trim() && !file) || risponde} className="btn-trainer grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-full disabled:cursor-default disabled:opacity-40">
                  <ArrowUp size={17} strokeWidth={2.4} />
                </motion.button>
              </form>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
