"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Bot, Phone, Search, TriangleAlert, UserRound, Video } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { ChatMessage, clientById, conversations, progressOf } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";
import { ClientAvatar } from "./shared";

const quickReplies = ["Perfetto, ci vediamo venerdì!", "Ti sposto la seduta, ti confermo a breve", "Riposa oggi e fammi sapere domani", "Bravissimo, continua così 💪"];
const autoReplies = ["Grazie mille! 🙏", "Perfetto, a presto!", "Ok, ti aggiorno domani", "Fantastico, grazie!"];

export function MessagesView() {
  const [activeId, setActiveId] = useState(conversations[0].clientId);
  const [threads, setThreads] = useState(() => Object.fromEntries(conversations.map((c) => [c.clientId, c.messages])) as Record<string, ChatMessage[]>);
  const [unread, setUnread] = useState(() => Object.fromEntries(conversations.map((c) => [c.clientId, c.unread])) as Record<string, number>);
  const [filter, setFilter] = useState<"tutti" | "non-letti" | "segnalazioni">("tutti");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [threads, activeId, typing]);

  const list = useMemo(
    () =>
      conversations.filter((c) => {
        if (filter === "non-letti") return unread[c.clientId] > 0;
        if (filter === "segnalazioni") return threads[c.clientId].some((m) => m.from === "assistant");
        return true;
      }),
    [filter, unread, threads],
  );

  const client = clientById(activeId)!;
  const messages = threads[activeId];

  const open = (id: string) => {
    playSound("tap");
    setActiveId(id);
    setUnread((u) => ({ ...u, [id]: 0 }));
    setTyping(false);
  };

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    playSound("confirm");
    setDraft("");
    const id = activeId;
    setThreads((th) => ({ ...th, [id]: [...th[id], { from: "trainer", text: t, time: "Adesso" }] }));
    timers.current.push(window.setTimeout(() => setTyping(true), 700));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        playSound("tap");
        setThreads((th) => ({ ...th, [id]: [...th[id], { from: "client", text: autoReplies[th[id].length % autoReplies.length], time: "Adesso" }] }));
      }, 2300),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[372px_minmax(0,1fr)] gap-x-[14px] pr-[18px] pl-[80px]">
      <section className="flex min-h-0 flex-col rounded-[18px] bg-card px-[14px] pt-[14px] pb-[12px]">
        <label className="flex h-[34px] items-center gap-[8px] rounded-full bg-soft px-[12px]">
          <Search size={13} className="text-muted" />
          <input placeholder="Cerca nei messaggi" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted" />
        </label>
        <div className="mt-[10px] flex gap-[6px]">
          {(
            [
              ["tutti", "Tutti"],
              ["non-letti", "Non letti"],
              ["segnalazioni", "Segnalazioni"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                playSound("tap");
                setFilter(key);
              }}
              className={`relative cursor-pointer rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold ${filter === key ? "text-on-contrast" : "bg-soft text-ink/70"}`}
            >
              {filter === key && <motion.span layoutId="filtro-messaggi" className="absolute inset-0 rounded-full bg-contrast" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[4px] overflow-y-auto [scrollbar-width:none]">
          {list.map((conv, i) => {
            const c = clientById(conv.clientId)!;
            const last = threads[conv.clientId][threads[conv.clientId].length - 1];
            const flagged = threads[conv.clientId].some((m) => m.from === "assistant");
            const active = conv.clientId === activeId;
            return (
              <motion.button
                key={conv.clientId}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: EASE_OUT }}
                onClick={() => open(conv.clientId)}
                className={`flex cursor-pointer items-center gap-[10px] rounded-[14px] px-[10px] py-[10px] text-left transition-colors ${active ? "bg-soft" : "hover:bg-soft/60"}`}
              >
                <ClientAvatar c={c} size={38} />
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="flex items-center gap-[6px] text-[12.5px] font-bold">
                    {c.name}
                    {flagged && <TriangleAlert size={12} className="text-[#e5484d]" />}
                  </p>
                  <p className={`truncate text-[11px] ${unread[conv.clientId] ? "font-semibold text-ink" : "text-muted"}`}>
                    {last.from === "trainer" ? "Tu: " : last.from === "assistant" ? "Assistente: " : ""}
                    {last.text}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-[4px]">
                  <span className="text-[10px] text-muted">{last.time}</span>
                  {unread[conv.clientId] > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid size-[18px] place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--trainer)" }}>
                      {unread[conv.clientId]}
                    </motion.span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-col rounded-[18px] bg-card">
        <div className="flex items-center gap-[12px] border-b border-line px-[18px] py-[12px]">
          <ClientAvatar c={client} size={42} />
          <div className="leading-none">
            <p className="text-[15px] font-bold">{client.name}</p>
            <p className="mt-[5px] text-[11px] text-muted">
              {client.goal} · {progressOf(client)}% dell’obiettivo
            </p>
          </div>
          <div className="ml-auto flex items-center gap-[6px]">
            <IconCircle icon={Phone} label="Chiama" size={34} />
            <IconCircle icon={Video} label="Videochiamata" size={34} />
            <Link href={ROUTES.cliente(client.id)} onClick={() => playSound("tap")} className="flex h-[34px] items-center gap-[6px] rounded-full bg-contrast px-[14px] text-[12px] font-semibold text-on-contrast">
              <UserRound size={13} /> Apri profilo
            </Link>
          </div>
        </div>

        <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[22px] py-[16px] [scrollbar-width:none]">
          <AnimatePresence initial={false}>
            {messages.map((m, i) =>
              m.from === "assistant" ? (
                <motion.div key={`${activeId}-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto my-[4px] flex max-w-[520px] gap-[10px] rounded-[16px] border border-line bg-soft px-[14px] py-[10px]">
                  <span className="grid size-[28px] shrink-0 place-items-center rounded-full bg-[rgba(212,59,79,0.14)] text-[#d43b4f]">
                    <Bot size={15} />
                  </span>
                  <div className="leading-snug">
                    <p className="text-[11px] font-bold">Segnalazione dell’assistente · {m.time}</p>
                    <p className="mt-[2px] text-[11.5px] text-ink/75">{m.text}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeId}-${i}`}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className={`flex max-w-[62%] flex-col ${m.from === "trainer" ? "items-end self-end" : "items-start self-start"}`}
                >
                  <p
                    className={`rounded-[18px] px-[14px] py-[9px] text-[12.5px] leading-snug ${
                      m.from === "trainer" ? "rounded-br-[6px] bg-contrast text-on-contrast" : "rounded-bl-[6px] bg-soft"
                    }`}
                  >
                    {m.text}
                  </p>
                  <span className="mt-[3px] px-[4px] text-[9.5px] text-muted">{m.time}</span>
                </motion.div>
              ),
            )}
          </AnimatePresence>
          {typing && (
            <div className="flex gap-[4px] self-start rounded-[18px] bg-soft px-[14px] py-[12px]">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="size-[6px] rounded-full bg-ink/40" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-[6px] overflow-x-auto px-[18px] pb-[8px] [scrollbar-width:none]">
          {quickReplies.map((q) => (
            <motion.button key={q} type="button" whileTap={{ scale: 0.95 }} onClick={() => send(q)} className="shrink-0 cursor-pointer rounded-full border border-line px-[12px] py-[6px] text-[11.5px] font-medium whitespace-nowrap hover:bg-soft">
              {q}
            </motion.button>
          ))}
        </div>
        <form onSubmit={submit} className="mx-[16px] mb-[14px] flex items-center gap-[8px] rounded-full border border-line py-[5px] pr-[5px] pl-[16px]">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Scrivi a ${client.name.split(" ")[0]}…`} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
          <motion.button type="submit" aria-label="Invia" whileTap={{ scale: 0.9 }} className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full bg-contrast text-on-contrast">
            <ArrowUp size={15} />
          </motion.button>
        </form>
      </section>
    </main>
  );
}
