"use client";

// Leo del trainer da telefono: lo stesso Leo del computer (stessa chat, stesse azioni con le schede da confermare,
// vocali e file) in un foglio dal basso con Leo affacciato dal bordo, come nell'app del cliente. Pagamenti e
// pacchetti no (Marco, 29/10): le schede lo dicono e non partono (useCoachChat con senzaSoldi).
// Durante il viaggio di un'azione il foglio scende, l'app va dove succede (calendario, messaggi, profilo) e una
// pillola in alto dice che Leo sta lavorando; finito, il foglio risale.

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUp, Paperclip, X } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { ACCETTATI, leggiFile } from "@/libs/prototipo/leo-file";
import { EASE_OUT } from "@/components/ui/motion";
import { LEO_BORDO, LEO_FOTO, LEO_LARGO } from "@/components/prototipo/cliente/LeoCliente";
import { ConfermaTutte, SchedaAzioneView } from "../LeoAzioni";
import { TastoMicrofono, VoceStato, type VoceLeo } from "../MicrofonoLeo";
import { CoachFace } from "../leo/CoachFace";
import { suggestions } from "../leo/risposte";
import type { Allegato, Chat } from "../leo/useChatLeo";
import { navigate, ROUTES } from "../nav";

const primo = trainer.name.split(" ")[0];
// da telefono niente domande sui soldi tra quelle pronte, e niente link alle sezioni che qui non ci sono
const PRONTE = suggestions.filter((s) => !/pag|incass/i.test(s)).slice(0, 4);
const SOLO_COMPUTER = [ROUTES.incassi, ROUTES.schede, ROUTES.impostazioni];
const linkValido = (href: string) => !SOLO_COMPUTER.some((r) => href.startsWith(r));

function Puntini({ ragiona }: { ragiona: boolean }) {
  return (
    <div className="flex items-center gap-[8px] self-start">
      <span className="glass-row inline-flex items-center gap-[4px] rounded-[18px] rounded-bl-[6px] px-[14px] py-[13px]">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="size-[6px] rounded-full bg-ink/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </span>
      {ragiona && <span className="text-[12px] text-muted">Leo sta ragionando…</span>}
    </div>
  );
}

// bozza e voce arrivano da TrainerTelefono (la casella resta uguale chiudendo e riaprendo il foglio).
export function LeoTelefono({ chat, aperto, onChiudi, bozza, setBozza, voce }: { chat: Chat; aperto: boolean; onChiudi: () => void; bozza: string; setBozza: (t: string) => void; voce: VoceLeo }) {
  const reduce = useReducedMotion();
  const { messages, typing, thinking, ask, conferma, confermaTutte, segnaModifica, rifiuta, annulla, compatta } = chat;
  const lista = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<Allegato | null>(null);
  const [erroreFile, setErroreFile] = useState<string | null>(null);
  const sceltaFile = useRef<HTMLInputElement>(null);
  const visibile = aperto && !compatta;

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

  useEffect(() => {
    if (!visibile) return;
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, typing, visibile, reduce]);

  useEffect(() => {
    if (!visibile) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onChiudi();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [visibile, onChiudi]);

  const invia = (e?: FormEvent) => {
    e?.preventDefault();
    if ((!bozza.trim() && !file) || typing) return;
    ask(bozza, file ?? undefined);
    setBozza("");
    setFile(null);
    setErroreFile(null);
  };

  return (
    <>
      {/* durante il viaggio di un'azione: la pillola in alto al posto del foglio */}
      <AnimatePresence>
        {aperto && compatta && (
          <motion.div
            key="leo-lavora"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass glass-3d absolute top-[max(12px,env(safe-area-inset-top))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-[8px] rounded-full py-[5px] pr-[14px] pl-[6px] text-[13px] font-semibold whitespace-nowrap sm:top-[54px]"
          >
            <CoachFace size={28} /> Leo sta lavorando…
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visibile && (
          <motion.div key="leo-trainer" className="absolute inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <button type="button" aria-label="Chiudi Leo" onClick={onChiudi} className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[3px]" />
            <motion.section
              role="dialog"
              aria-label="Leo, il tuo assistente"
              initial={{ y: reduce ? 0 : "100%" }}
              animate={{ y: 0 }}
              exit={{ y: reduce ? 0 : "100%" }}
              transition={{ duration: 0.42, ease: EASE_OUT }}
              className="absolute inset-x-0 bottom-0 flex h-[84%] flex-col"
            >
              {/* Leo si affaccia dal bordo alto, come nell'app del cliente */}
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
              <div className="panel relative flex min-h-0 flex-1 flex-col rounded-t-[30px] rounded-b-none pb-[max(12px,env(safe-area-inset-bottom))]" style={{ background: "var(--color-card)" }}>
                <div className="flex items-center justify-between px-[18px] pt-[22px]">
                  <div className="leading-none">
                    <p className="text-[18px] font-extrabold tracking-[-0.02em]">Leo</p>
                    <p className="mt-[4px] text-[12px] text-muted">Il tuo assistente · fa le cose per te</p>
                  </div>
                  <button type="button" aria-label="Chiudi" onClick={onChiudi} className="glass grid size-[34px] cursor-pointer place-items-center rounded-full">
                    <X size={15} />
                  </button>
                </div>

                <div ref={lista} className="min-h-0 flex-1 overflow-y-auto px-[16px] pt-[14px] pb-[8px] [scrollbar-width:none]">
                  {!messages.length && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <p className="glass-row max-w-[88%] rounded-[18px] rounded-bl-[6px] px-[13px] py-[10px] text-[14px] leading-snug">
                        Ciao {primo}! Dimmi cosa fare: fisso e sposto sedute, scrivo ai clienti, aggiorno misure e note. Anche a voce: tieni premuta la mia faccia, dimmi cosa fare e lo faccio 🎙️ Pagamenti e pacchetti li trovi sul computer.
                      </p>
                      <div className="mt-[12px] flex flex-wrap gap-[7px]">
                        {PRONTE.map((d) => (
                          <motion.button key={d} type="button" whileTap={{ scale: 0.96 }} disabled={typing} onClick={() => ask(d)} className="sel-trainer cursor-pointer rounded-full px-[12px] py-[8px] text-[13px] font-semibold">
                            {d}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div className="flex flex-col gap-[8px]">
                    {messages.map((m) => {
                      const mio = m.from === "trainer";
                      const daConfermare = m.schede?.filter((s) => s.stato === "da-confermare").length ?? 0;
                      return (
                        <motion.div key={m.id} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex max-w-[88%] flex-col ${mio ? "items-end self-end" : "items-start self-start"}`}>
                          {m.allegato && (
                            <span className="mb-[4px] flex max-w-[240px] items-center gap-[5px] rounded-full bg-soft px-[10px] py-[4px] text-[12px] font-semibold">
                              <Paperclip size={12} className="shrink-0" />
                              <span className="truncate">{m.allegato}</span>
                            </span>
                          )}
                          {m.text && (
                            <p
                              className={`rounded-[18px] px-[13px] py-[10px] text-[14px] leading-snug whitespace-pre-wrap [overflow-wrap:anywhere] ${mio ? "rounded-br-[6px] text-white" : "glass-row rounded-bl-[6px]"}`}
                              style={mio ? { background: "var(--trainer)" } : undefined}
                            >
                              {m.text}
                            </p>
                          )}
                          {!!m.nonCapite && (
                            <p className="mt-[6px] rounded-[12px] border border-line px-[10px] py-[6px] text-[12px] leading-snug text-[#d43b4f]">
                              {m.nonCapite === 1 ? "Non ho capito una parte della richiesta" : `Non ho capito ${m.nonCapite} parti della richiesta`}: riprova con altre parole.
                            </p>
                          )}
                          {m.schede && (
                            <div className="mt-[6px] flex w-[300px] max-w-full flex-col gap-[6px]">
                              {m.schede.map((sc) => (
                                <SchedaAzioneView
                                  key={sc.key}
                                  scheda={sc}
                                  onConferma={(modifica) => conferma(m.id, sc.key, modifica)}
                                  onModifica={(modifica) => segnaModifica(sc.key, modifica)}
                                  onRifiuta={() => rifiuta(m.id, sc.key)}
                                  onAnnulla={() => annulla(m.id, sc.key)}
                                />
                              ))}
                              {daConfermare >= 2 && <ConfermaTutte n={daConfermare} onConferma={() => confermaTutte(m.id)} />}
                            </div>
                          )}
                          {m.action && linkValido(m.action.href) && (
                            <button
                              type="button"
                              onClick={() => {
                                playSound("tap");
                                onChiudi();
                                navigate(m.action!.href);
                              }}
                              className="mt-[6px] flex cursor-pointer items-center gap-[5px] rounded-full px-[13px] py-[7px] text-[13px] font-semibold text-white"
                              style={{ background: "var(--trainer)" }}
                            >
                              {m.action.label} <ArrowRight size={14} />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {typing && <Puntini ragiona={thinking} />}
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
                    placeholder={voce.fase === "in-ascolto" ? "Parla adesso…" : voce.fase === "preparazione" ? "Accendo il microfono…" : "Chiedi a Leo…"}
                    aria-label="Chiedi a Leo"
                    className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
                  />
                  <motion.button type="submit" aria-label="Invia" whileTap={{ scale: 0.92 }} disabled={(!bozza.trim() && !file) || typing} className="btn-trainer grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-full disabled:cursor-default">
                    <ArrowUp size={17} strokeWidth={2.4} />
                  </motion.button>
                </form>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
