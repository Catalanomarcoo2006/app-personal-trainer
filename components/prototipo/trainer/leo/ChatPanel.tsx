"use client";

import { FormEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, ArrowUp, Paperclip, X } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound, suonoTasto } from "@/libs/ui/sound";
import { ACCETTATI, leggiFile } from "@/libs/prototipo/leo-file";
import { ConfermaTutte, SchedaAzioneView } from "../LeoAzioni";
import { TastoMicrofono, useVoceLeo, VoceStato } from "../MicrofonoLeo";
import { useScorrimentoLeo } from "../useScorrimentoLeo";
import { navigateWithStain } from "../nav";
import { InfoSparkle, preloadLeoSeduto } from "../LeoIdentikit";
import { infoSeen, INTRO_LAST, introSeen, LeoPresentazione, setIntroSeen } from "../LeoPresentazione";
import { COACH_NAME, BARRA_MAX_PX, LEAN_W, LEAN_H, LEAN_EDGE, LEAN_BOTTOM, PANEL_W, PANEL_TOP, COMPATTA } from "./costanti";
import { CoachFace } from "./CoachFace";
import { suggestions } from "./risposte";
import { SpeechIcon, firstName, novita } from "./Fumetti";
import { type Chat, type Allegato } from "./useChatLeo";

// Il messaggio appena inviato dal trainer: parte dall'altezza del campo di scrittura (daY, in px dello schermo),
// vola su fino al suo posto nella chat e rimbalza.
export function VolaSu({ daY, children }: { daY: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // lo schermo può essere rimpicciolito (tela adattata): la distanza va riportata in px della tela
    const fattore = el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1;
    const distanza = (daY - el.getBoundingClientRect().top) / (fattore || 1);
    if (distanza <= 0) return;
    y.set(distanza);
    scale.set(0.9);
    const a = [animate(y, 0, { type: "spring", duration: 0.8, bounce: 0.28 }), animate(scale, 1, { type: "spring", duration: 0.8, bounce: 0.4 })];
    return () => a.forEach((x) => x.stop());
  }, [daY, y, scale]);
  return (
    <motion.div ref={box} style={{ y, scale, transformOrigin: "100% 100%" }}>
      {children}
    </motion.div>
  );
}

// Leo che si sporge dal bordo destro della chat, aggrappato con le mani: esce da dietro la chat quando si apre.
export function SidePeek() {
  return (
    <motion.img
      src="/prototipo/coach/spunta.webp"
      alt=""
      aria-hidden
      draggable={false}
      className="leo-luce pointer-events-none absolute max-w-none select-none"
      style={{ width: LEAN_W, height: LEAN_H, left: `calc(100% - ${Math.round(LEAN_W * LEAN_EDGE)}px)`, bottom: LEAN_BOTTOM }}
      initial={{ opacity: 0, x: -26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18, transition: { duration: 0.16, ease: EASE_OUT } }}
      transition={{ opacity: { duration: 0.2, delay: 0.16 }, x: { type: "spring", duration: 0.55, bounce: 0.3, delay: 0.16 } }}
    />
  );
}

// close: chiude con il suono (X, velo, Esc); dismiss: chiude in silenzio, sotto la macchia di un link di Leo.
export function ChatPanel({
  left,
  origin,
  height,
  chat,
  close,
  dismiss,
  openInfo,
  bozza,
}: {
  left: number;
  origin: string;
  height: number; // altezza della tela: la chat compatta si appoggia in basso
  chat: Chat;
  close: () => void;
  dismiss: () => void;
  openInfo: () => void;
  bozza?: string; // frase già scritta nella casella (azioni rapide della barra in alto)
}) {
  const { messages, typing, thinking, ask: askChat, conferma, confermaTutte, segnaModifica, rifiuta, annulla, torna, partenza, compatta } = chat;
  const [draft, setDraft] = useState(bozza ?? "");
  const scrive = draft.trim().length > 0;
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  // la prima volta Leo si presenta; scrivere una domanda vale come "salta"
  // con una frase già scritta il trainer sa cosa vuole fare: niente presentazione
  const [intro, setIntro] = useState(() => !bozza && !introSeen());
  const [introStep, setIntroStep] = useState(0);
  const endIntro = () => {
    setIntroSeen(true);
    setIntro(false);
  };
  const ask = (q: string, allegato?: Allegato) => {
    if (intro) endIntro();
    askChat(q, allegato);
  };

  // il file allegato: l'app lo legge subito (nel browser) e lo manda a Leo con il messaggio
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

  // con più azioni insieme la chat porta alla prima e poi segue quella in corso; altrimenti in fondo
  const { sotto, piuSotto, aggiorna: aggiornaSotto, vaiSotto } = useScorrimentoLeo(scroller, messages, typing);

  // le animazioni dell'identikit si scaricano mentre la chat è aperta: alla i sono già pronte
  useEffect(() => {
    const t = window.setTimeout(preloadLeoSeduto, 1200);
    return () => window.clearTimeout(t);
  }, []);

  // da dove parte il volo del messaggio appena inviato: l'altezza del campo di scrittura
  const campo = useRef<HTMLFormElement>(null);
  // la casella cresce con il testo (anche mentre si detta) fino a ~6 righe, poi scorre; Maiusc+Invio va a capo
  const barra = useRef<HTMLTextAreaElement>(null);
  // frase già scritta (azioni rapide): il cursore va in fondo, così il trainer continua a scrivere dopo
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = barra.current;
      if (bozza && el) el.setSelectionRange(el.value.length, el.value.length);
    }, 30);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [alta, setAlta] = useState(false);
  useLayoutEffect(() => {
    const el = barra.current;
    if (!el) return;
    el.style.height = "auto";
    const pieno = el.scrollHeight > BARRA_MAX_PX;
    el.style.height = `${Math.min(el.scrollHeight, BARRA_MAX_PX)}px`;
    el.style.overflowY = pieno ? "auto" : "hidden";
    if (pieno) el.scrollTop = el.scrollHeight;
    setAlta(el.scrollHeight > 24);
  }, [draft]);
  const voce = useVoceLeo({ bloccato: thinking, draft, setDraft, invia: (t) => ask(t) });
  const [volo, setVolo] = useState<{ daY: number; dopo: number } | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if ((draft.trim() || file) && campo.current) setVolo({ daY: campo.current.getBoundingClientRect().top, dopo: messages.length });
    ask(draft, file ?? undefined);
    setDraft("");
    setFile(null);
    setErroreFile(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97, width: compatta ? COMPATTA.w : PANEL_W, top: compatta ? height - 10 - COMPATTA.h : PANEL_TOP }}
      animate={{ opacity: 1, y: 0, scale: 1, width: compatta ? COMPATTA.w : PANEL_W, top: compatta ? height - 10 - COMPATTA.h : PANEL_TOP }}
      exit={{ opacity: 0, y: 14, scale: 0.98, transition: { duration: 0.22, ease: EASE_OUT, delay: 0.08 } }}
      transition={{ duration: 0.32, ease: EASE_OUT, width: { duration: 0.35, ease: EASE_OUT }, top: { duration: 0.35, ease: EASE_OUT } }}
      style={{ left, transformOrigin: origin }}
      className="absolute bottom-[10px] z-50"
      role="dialog"
      aria-label={`${COACH_NAME}, il tuo assistente`}
    >
      <SidePeek />
      <div className="relative size-full overflow-hidden rounded-[22px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
      {/* durante il viaggio: Leo al lavoro, il resto della chat resta montato sotto (ritrovi tutto com'era) */}
      <AnimatePresence>
        {compatta && (
          <motion.div
            key="al-lavoro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.15, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[8px] bg-card text-center"
            aria-live="polite"
          >
            <CoachFace size={58} />
            <p className="text-[12px] leading-tight font-bold">
              {COACH_NAME} è al lavoro…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`flex h-full flex-col transition-opacity duration-150 ${compatta ? "pointer-events-none opacity-0" : ""}`} style={{ width: PANEL_W }} aria-hidden={compatta || undefined}>
        <div className="flex items-center gap-[10px] border-b border-line px-[16px] py-[12px]">
          <div className="leading-tight">
            <p className="flex items-center gap-[7px] text-[15px] font-bold">
              {COACH_NAME}
              <span className="flex items-center gap-[4px] rounded-full px-[7px] py-[2px] text-[10px] font-semibold" style={{ color: "var(--color-ok, #1f9d55)", background: "color-mix(in srgb, #1f9d55 12%, transparent)" }}>
                <span className="size-[5px] rounded-full bg-current" /> online
              </span>
              <InfoSparkle onClick={openInfo} inviting={!infoSeen()} strong={intro && introStep === INTRO_LAST} />
            </p>
            <p className="text-[11px] text-muted">Il tuo assistente: conosce clienti, pagamenti, agenda e app</p>
          </div>
          <button type="button" aria-label="Chiudi" onClick={close} className="ml-auto grid size-[30px] cursor-pointer place-items-center rounded-full bg-soft transition-colors hover:bg-line">
            <X size={14} />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scroller} onScroll={aggiornaSotto} className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] py-[14px] [scrollbar-width:none]">
          {intro && <LeoPresentazione face={<CoachFace size={64} />} onStep={setIntroStep} onDone={endIntro} />}
          {!intro && messages.length === 0 && (
            <div className="mt-[2px]">
              <p className="text-[15px] font-bold">Ciao {firstName}! 👋</p>
              <p className="mt-[4px] text-[12px] leading-relaxed text-muted">
                Ho guardato la tua dashboard: ci sono {novita.length} cose che ti aspettano. Oppure chiedimi qualcosa qui sotto.
              </p>
              <div className="mt-[10px] flex flex-col gap-[6px]">
                {novita.map((n, i) => (
                  <motion.button
                    key={n.text}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.3, ease: EASE_OUT }}
                    onClick={() => n.ask && ask(n.ask)}
                    className="flex cursor-pointer items-center gap-[10px] rounded-[14px] border border-line px-[12px] py-[10px] text-left transition-colors hover:bg-soft"
                  >
                    <SpeechIcon speech={n} size={26} />
                    <span className="flex-1 text-[12px] leading-snug font-semibold">{n.text}</span>
                    <ArrowRight size={13} className="shrink-0 text-ink/40" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {!intro && messages.map((m) => (
            <motion.div
              key={m.id}
              data-msg={m.id}
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className={`flex max-w-[86%] flex-col ${m.from === "trainer" ? "items-end self-end" : "items-start self-start"}`}
            >
              {m.allegato && (
                <span className="mb-[4px] flex max-w-[240px] items-center gap-[5px] self-end rounded-full bg-soft px-[10px] py-[4px] text-[11px] font-semibold">
                  <Paperclip size={11} className="shrink-0" />
                  <span className="truncate">{m.allegato}</span>
                </span>
              )}
              {m.text &&
                (m.from === "trainer" && volo && !reduce && messages.indexOf(m) === volo.dopo ? (
                  <VolaSu daY={volo.daY}>
                    <p className="rounded-[16px] rounded-br-[6px] bubble-trainer px-[12px] py-[8px] text-[12.5px] leading-relaxed">{m.text}</p>
                  </VolaSu>
                ) : (
                  <p className={`rounded-[16px] px-[12px] py-[8px] text-[12.5px] leading-relaxed ${m.from === "trainer" ? "rounded-br-[6px] bubble-trainer" : "rounded-bl-[6px] bg-soft"}`}>{m.text}</p>
                ))}
              {!!m.nonCapite && (
                <p className="mt-[6px] max-w-[300px] rounded-[12px] border border-line px-[10px] py-[6px] text-[11px] leading-snug text-[#d43b4f]">
                  {m.nonCapite === 1 ? "Non ho capito una parte della richiesta" : `Non ho capito ${m.nonCapite} parti della richiesta`}: riprova con altre parole.
                </p>
              )}
              {m.schede && (
                <div className="mt-[6px] flex w-[300px] max-w-full flex-col gap-[6px]">
                  {m.schede.map((sc) => (
                    <div key={sc.key} data-scheda={sc.key}>
                      <SchedaAzioneView
                        scheda={sc}
                        onConferma={(modifica) => conferma(m.id, sc.key, modifica)}
                        onModifica={(modifica) => segnaModifica(sc.key, modifica)}
                        onRifiuta={() => rifiuta(m.id, sc.key)}
                        onAnnulla={() => annulla(m.id, sc.key)}
                        onTorna={partenza(m.id) ? () => torna(m.id) : undefined}
                      />
                    </div>
                  ))}
                  {/* "Conferma tutte" sta in fondo: si arriva qui dopo aver visto le azioni dalla prima all'ultima */}
                  {m.schede.filter((sc) => sc.stato === "da-confermare").length >= 2 && (
                    <ConfermaTutte n={m.schede.filter((sc) => sc.stato === "da-confermare").length} onConferma={() => confermaTutte(m.id)} />
                  )}
                </div>
              )}
              {m.action && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  {/* la sezione nuova si allarga a macchia d'olio dal punto toccato; la chat si chiude sotto la macchia */}
                  <a
                    href={m.action.href}
                    data-macchia
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      const origin = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                      navigateWithStain(m.action!.href, origin, dismiss);
                    }}
                    className="mt-[6px] flex items-center gap-[5px] rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold text-white"
                    style={{ background: "var(--trainer)" }}
                  >
                    {m.action.label} <ArrowRight size={12} />
                  </a>
                </motion.div>
              )}
            </motion.div>
          ))}
          {typing && (
            <div className="flex items-center gap-[8px] self-start">
              <div className="flex gap-[4px] rounded-[16px] bg-soft px-[12px] py-[11px]">
                {[0, 1, 2].map((d) => (
                  <motion.span key={d} className="size-[6px] rounded-full bg-ink/40" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
                ))}
              </div>
              {thinking && (
                <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="text-[11px] text-muted">
                  {COACH_NAME} sta ragionando…
                </motion.span>
              )}
            </div>
          )}
        </div>
        {(sotto > 0 || piuSotto) && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.96 }}
            onClick={vaiSotto}
            className="btn-trainer absolute bottom-[8px] left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-[5px] rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold shadow-lg"
          >
            <ArrowDown size={12} /> {sotto === 0 ? "Altro sotto" : sotto === 1 ? "1 altra azione sotto" : `${sotto} altre azioni sotto`}
          </motion.button>
        )}
        </div>

        {/* i suggerimenti lasciano spazio alle schede delle azioni; tornano alla domanda dopo */}
        <div className="flex flex-wrap gap-[6px] px-[16px] pb-[10px]">
          {!intro && !messages.at(-1)?.schede?.length && suggestions.map((s) => (
            <motion.button key={s} type="button" whileTap={{ scale: 0.95 }} onClick={() => ask(s)} className="cursor-pointer rounded-full border border-line px-[10px] py-[5px] text-[11px] font-medium transition-colors hover:bg-soft">
              {s}
            </motion.button>
          ))}
        </div>
        <VoceStato voce={voce} />
        {(file || erroreFile) && (
          <div className="mx-[14px] mb-[6px] flex items-center gap-[6px] text-[11.5px]">
            {file ? (
              <span className="flex min-w-0 items-center gap-[5px] rounded-full bg-soft px-[10px] py-[4px] font-semibold">
                <Paperclip size={12} className="shrink-0" />
                <span className="truncate">{file.nome}</span>
                <button type="button" aria-label="Togli il file" onClick={() => setFile(null)} className="grid size-[16px] shrink-0 cursor-pointer place-items-center rounded-full hover:bg-line">
                  <X size={10} />
                </button>
              </span>
            ) : (
              <span className="text-[#d43b4f]">{erroreFile}</span>
            )}
          </div>
        )}
        {/* mentre scrivi il campo si accende col colore del trainer e il tasto di invio si sveglia */}
        <form
          ref={campo}
          onSubmit={submit}
          className={`mx-[14px] mb-[14px] flex gap-[8px] border py-[5px] pr-[5px] pl-[14px] transition-[border-color,box-shadow,border-radius] duration-300 focus-within:border-[color-mix(in_srgb,var(--trainer)_55%,transparent)] ${alta ? "items-end rounded-[22px]" : "items-center rounded-full"}`}
          style={
            scrive || voce.fase === "in-ascolto"
              ? { borderColor: "color-mix(in srgb, var(--trainer) 70%, transparent)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--trainer) 14%, transparent), 0 6px 18px color-mix(in srgb, var(--trainer) 18%, transparent)" }
              : { borderColor: "var(--color-line)" }
          }
        >
          <input ref={sceltaFile} type="file" accept={ACCETTATI} className="hidden" onChange={(e) => { void allega(e.target.files?.[0]); e.target.value = ""; }} />
          <button type="button" aria-label="Allega un file (PDF, Excel, CSV, TXT)" title="Allega un file (PDF, Excel, CSV, TXT)" onClick={() => sceltaFile.current?.click()} className="-ml-[6px] grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink">
            <Paperclip size={14} />
          </button>
          <TastoMicrofono voce={voce} />
          <textarea
            ref={barra}
            rows={1}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            // ogni tasto fa il suo clic di tastiera (lettere, spazio, cancella; non le scorciatoie)
            onKeyDown={(e) => {
              // Invio manda, Maiusc+Invio va a capo
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                campo.current?.requestSubmit();
                return;
              }
              if (e.ctrlKey || e.metaKey || e.altKey) return;
              if (e.key === " ") suonoTasto("spazio");
              else if (e.key === "Backspace" || e.key === "Delete") suonoTasto("cancella");
              else if (e.key.length === 1) suonoTasto("lettera");
            }}
            placeholder={voce.fase === "in-ascolto" ? "Parla adesso…" : voce.fase === "preparazione" ? "Accendo il microfono…" : `Chiedi a ${COACH_NAME}…`} className="my-[7px] min-w-0 flex-1 resize-none bg-transparent leading-[18px] [scrollbar-width:thin] text-[13px] outline-none placeholder:text-muted" />
          <motion.button
            type="submit"
            aria-label="Invia"
            whileTap={{ scale: 0.9 }}
            animate={{ scale: scrive && !reduce ? 1.08 : 1, opacity: scrive ? 1 : 0.55 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.4 }}
            className="relative grid size-[32px] shrink-0 cursor-pointer place-items-center rounded-full btn-trainer"
          >
            {scrive && !reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "var(--trainer)" }}
                initial={{ scale: 1, opacity: 0.45 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <motion.span animate={{ y: scrive && !reduce ? [0, -2, 0] : 0 }} transition={{ duration: 0.4 }} className="relative">
              <ArrowUp size={15} />
            </motion.span>
          </motion.button>
        </form>
      </div>
      </div>
    </motion.div>
  );
}
