"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, BellRing, X } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { EASE_OUT } from "./motion";

// La sfera dell'assistente: respira, brilla e ogni tanto sbatte gli occhi.
export function AssistantOrb({ onOpen, size = 58 }: { onOpen: () => void; size?: number }) {
  return (
    <motion.button
      type="button"
      aria-label="Apri l'assistente"
      onClick={() => {
        playSound("tap");
        onOpen();
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={{ delay: 0.9, type: "spring", stiffness: 380, damping: 20 }}
      className="relative grid cursor-pointer place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      <motion.span
        className="absolute inset-[-10px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(92,108,255,0.45) 0%, rgba(92,108,255,0) 70%)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 28%, #c7d6ff 0%, #6f86ff 38%, #3f45f0 72%, #2a2bc4 100%)",
          boxShadow: "inset -4px -6px 12px rgba(20,20,120,0.45), 0 8px 22px rgba(63,69,240,0.45)",
        }}
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative flex gap-[7px]">
        {[0, 1].map((eye) => (
          <motion.span
            key={eye}
            className="block rounded-full bg-card"
            style={{ width: size * 0.09, height: size * 0.2 }}
            animate={{ scaleY: [1, 1, 0.15, 1, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
          />
        ))}
      </span>
    </motion.button>
  );
}

type Message = { id: number; role: "user" | "assistant" | "notice"; text: string };

// Pannello della chat: sale dal basso sopra la pagina sfocata, con domande pronte da toccare.
export function AssistantPanel({
  open,
  onClose,
  suggestions,
  answers,
  fallback,
  trainerName,
}: {
  open: boolean;
  onClose: () => void;
  suggestions: string[];
  answers: Record<string, string>;
  fallback: string;
  trainerName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || typing) return;
    playSound("tap");
    setDraft("");
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text }]);
    setTyping(true);

    const answer = answers[text] ?? fallback;
    const words = answer.split(" ");
    const id = nextId.current++;
    later(() => {
      setTyping(false);
      setMessages((m) => [...m, { id, role: "assistant", text: "" }]);
      words.forEach((_, i) =>
        later(() => {
          setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: words.slice(0, i + 1).join(" ") } : msg)));
          if (i === words.length - 1 && /male|dolore/i.test(text)) {
            later(() => {
              playSound("confirm");
              setMessages((m) => [...m, { id: nextId.current++, role: "notice", text: `Avviso inviato a ${trainerName}` }]);
            }, 350);
          }
        }, i * 38),
      );
    }, 700);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Chiudi" onClick={onClose} className="absolute inset-0 bg-black/10 backdrop-blur-[6px]" />
          <motion.div
            className="absolute inset-x-[10px] bottom-[10px] flex h-[78%] flex-col overflow-hidden rounded-[26px] bg-card shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%" }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <div className="flex items-center justify-between px-[18px] pt-[16px] pb-[10px]">
              <div className="flex items-center gap-[10px]">
                <span
                  className="size-[30px] rounded-full"
                  style={{ background: "radial-gradient(circle at 32% 28%, #c7d6ff 0%, #6f86ff 38%, #3f45f0 72%, #2a2bc4 100%)" }}
                />
                <div className="leading-tight">
                  <p className="text-[14px] font-bold">Il tuo assistente</p>
                  <p className="text-[11px] text-muted">Conosce la tua scheda e i tuoi progressi</p>
                </div>
              </div>
              <button type="button" aria-label="Chiudi" onClick={onClose} className="grid size-[30px] cursor-pointer place-items-center rounded-full bg-soft">
                <X size={15} />
              </button>
            </div>

            <div ref={scroller} className="flex flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] py-[8px]">
              {messages.length === 0 && (
                <p className="mx-auto mt-[24px] max-w-[250px] text-center text-[12px] leading-relaxed text-muted">
                  Chiedimi come si fa un esercizio, cosa fare se manca un attrezzo o come stai andando.
                </p>
              )}
              {messages.map((m) =>
                m.role === "notice" ? (
                  <motion.p
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-auto flex items-center gap-[6px] rounded-full btn-trainer px-[12px] py-[6px] text-[11px] font-semibold"
                  >
                    <BellRing size={12} /> {m.text}
                  </motion.p>
                ) : (
                  <motion.p
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className={
                      m.role === "user"
                        ? "max-w-[80%] self-end rounded-[16px] rounded-br-[6px] bubble-trainer px-[12px] py-[8px] text-[12.5px]"
                        : "max-w-[86%] self-start rounded-[16px] rounded-bl-[6px] bg-soft px-[12px] py-[8px] text-[12.5px] leading-relaxed"
                    }
                  >
                    {m.text}
                  </motion.p>
                ),
              )}
              {typing && (
                <div className="flex gap-[4px] self-start rounded-[16px] bg-soft px-[12px] py-[11px]">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="size-[6px] rounded-full bg-ink/40"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-[6px] overflow-x-auto px-[16px] pb-[8px] [scrollbar-width:none]">
              {suggestions.map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => ask(s)}
                  className="shrink-0 cursor-pointer rounded-full border border-line bg-card px-[11px] py-[6px] text-[11.5px] font-medium whitespace-nowrap"
                >
                  {s}
                </motion.button>
              ))}
            </div>

            <form onSubmit={submit} className="mx-[12px] mb-[12px] flex items-center gap-[8px] rounded-full border border-line bg-card py-[5px] pr-[5px] pl-[14px]">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Scrivi una domanda…"
                className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
              />
              <motion.button
                type="submit"
                aria-label="Invia"
                whileTap={{ scale: 0.9 }}
                className="grid size-[32px] shrink-0 cursor-pointer place-items-center rounded-full btn-trainer"
              >
                <ArrowUp size={15} />
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
