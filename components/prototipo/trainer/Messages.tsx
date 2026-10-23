"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Bot, ExternalLink, FileText, Phone, Search, TriangleAlert, UserRound } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { conta } from "@/libs/ui/testo";
import { Attachment, ChatMessage, clientById, conversations, progressOf } from "@/libs/prototipo/dati-finti";
import { SentPlan, stato } from "@/libs/prototipo/stato";
import { ROUTES } from "./nav";
import { ClientAvatar } from "./shared";

const quickReplies = ["Perfetto, ci vediamo venerdì!", "Ti sposto la seduta, ti confermo a breve", "Riposa oggi e fammi sapere domani", "Bravissimo, continua così 💪"];
const autoReplies = ["Grazie mille! 🙏", "Perfetto, a presto!", "Ok, ti aggiorno domani", "Fantastico, grazie!"];
const planReply = "Grazie! La guardo subito, i video sono comodissimi 💪";

// Il messaggio con il PDF della scheda inviata da Schede.
const sentMessage = (p: SentPlan): ChatMessage => ({
  from: "trainer",
  text: "Ecco la tua nuova scheda! Sotto ogni esercizio trovi il video dell’esecuzione.",
  time: p.time,
  attachment: { name: p.fileName, url: p.url, detail: `${conta(p.days.length, "giorno", "giorni")} · ${conta(p.exercises, "esercizio", "esercizi")} · ${p.withVideo} video` },
});

function initialThreads(): Record<string, ChatMessage[]> {
  const threads = Object.fromEntries(conversations.map((c) => [c.clientId, c.messages])) as Record<string, ChatMessage[]>;
  const { sent, replied } = stato.get();
  for (const p of sent) {
    threads[p.clientId] = [...(threads[p.clientId] ?? []), sentMessage(p)];
    if (replied.includes(p.id)) threads[p.clientId].push({ from: "client", text: planReply, time: "Adesso" });
  }
  return threads;
}

function PdfMessage({ a }: { a: Attachment }) {
  return (
    <div className="mb-[6px] flex w-[340px] items-center gap-[10px] rounded-[12px] bg-white/20 p-[8px]">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-[#e5484d] text-white">
        <FileText size={17} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[12px] font-semibold">{a.name}</p>
        <p className="mt-[2px] text-[10.5px] opacity-65">{a.detail}</p>
      </div>
      <a
        href={a.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => playSound("tap")}
        className="flex h-[30px] shrink-0 items-center gap-[5px] rounded-full bg-white px-[11px] text-[11px] font-semibold text-[var(--trainer)]"
      >
        <ExternalLink size={12} /> Apri PDF
      </a>
    </div>
  );
}

// search: i parametri dell'indirizzo (?cliente=), passati da TrainerApp.
export function MessagesView({ search }: { search: string }) {
  const params = new URLSearchParams(search);
  const target = params.get("cliente");
  const [activeId, setActiveId] = useState(() => (target && clientById(target) ? target : conversations[0].clientId));
  const [threads, setThreads] = useState(initialThreads);
  const [unread, setUnread] = useState(() => {
    const u = Object.fromEntries(conversations.map((c) => [c.clientId, c.unread])) as Record<string, number>;
    if (target) u[target] = 0;
    return u;
  });
  const [filter, setFilter] = useState<"tutti" | "non-letti" | "segnalazioni">("tutti");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Il cliente risponde alla scheda appena ricevuta.
  useEffect(() => {
    const { sent, replied } = stato.get();
    const pending = sent.filter((p) => !replied.includes(p.id));
    const local: number[] = [];
    pending.forEach((p, i) => {
      local.push(window.setTimeout(() => p.clientId === activeId && setTyping(true), 900 + i * 400));
      local.push(
        window.setTimeout(() => {
          stato.markReplied(p.id);
          setTyping(false);
          playSound("tap");
          setThreads((th) => ({ ...th, [p.clientId]: [...(th[p.clientId] ?? []), { from: "client", text: planReply, time: "Adesso" }] }));
        }, 2600 + i * 400),
      );
    });
    return () => local.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [threads, activeId, typing]);

  // Conversazioni: quelle esistenti, più i clienti a cui hai appena inviato una scheda.
  const allConversations = useMemo(() => {
    const extra = Object.keys(threads)
      .filter((id) => !conversations.some((c) => c.clientId === id))
      .map((clientId) => ({ clientId, unread: 0, messages: threads[clientId] }));
    return [...extra, ...conversations];
  }, [threads]);

  const list = useMemo(
    () =>
      allConversations.filter((c) => {
        if (filter === "non-letti") return unread[c.clientId] > 0;
        if (filter === "segnalazioni") return threads[c.clientId].some((m) => m.from === "assistant");
        return true;
      }),
    [allConversations, filter, unread, threads],
  );

  const client = clientById(activeId)!;
  const messages = threads[activeId] ?? [];

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
    setThreads((th) => ({ ...th, [id]: [...(th[id] ?? []), { from: "trainer", text: t, time: "Adesso" }] }));
    timers.current.push(window.setTimeout(() => setTyping(true), 700));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        playSound("tap");
        setThreads((th) => ({ ...th, [id]: [...(th[id] ?? []), { from: "client", text: autoReplies[(th[id] ?? []).length % autoReplies.length], time: "Adesso" }] }));
      }, 2300),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[372px_minmax(0,1fr)] gap-x-[14px] pr-[18px] pl-[80px]">
      <section className="flex min-h-0 flex-col panel rounded-[18px] px-[14px] pt-[14px] pb-[12px]">
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
              className={`relative cursor-pointer rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold ${filter === key ? "text-ink" : "bg-soft text-ink/70"}`}
            >
              {filter === key && <motion.span layoutId="filtro-messaggi" className="sel-trainer absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
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
                  <p className={`truncate text-[11px] ${(unread[conv.clientId] ?? 0) > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                    {last.from === "trainer" ? "Tu: " : last.from === "assistant" ? "Assistente: " : ""}
                    {last.attachment ? `Scheda in PDF · ${last.attachment.detail}` : last.text}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-[4px]">
                  <span className="text-[10px] text-muted">{last.time}</span>
                  {(unread[conv.clientId] ?? 0) > 0 && (
                    <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.35, bounce: 0.3 }} className="grid size-[18px] place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--trainer)" }}>
                      {unread[conv.clientId]}
                    </motion.span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-col panel rounded-[18px]">
        <div className="flex items-center gap-[12px] border-b border-line px-[18px] py-[12px]">
          <ClientAvatar c={client} size={42} />
          <div className="leading-none">
            <p className="text-[15px] font-bold">{client.name}</p>
            <p className="mt-[5px] text-[11px] text-muted">
              {client.goal} · {progressOf(client)}% dell’obiettivo
            </p>
          </div>
          <div className="ml-auto flex items-center gap-[6px]">
            <IconCircle icon={Phone} label={`Chiama ${client.phone}`} size={34} onClick={() => (window.location.href = `tel:${client.phone.replace(/\s/g, "")}`)} />
            <Link href={ROUTES.cliente(client.id)} onClick={() => playSound("tap")} className="flex h-[34px] items-center gap-[6px] rounded-full bg-soft px-[14px] text-[12px] font-semibold text-ink transition-colors hover:bg-line">
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
                  <div
                    className={`rounded-[18px] text-[12.5px] leading-snug ${m.attachment ? "p-[6px] pb-[9px]" : "px-[14px] py-[9px]"} ${
                      m.from === "trainer" ? "rounded-br-[6px] bubble-trainer" : "rounded-bl-[6px] bg-soft"
                    }`}
                  >
                    {m.attachment && <PdfMessage a={m.attachment} />}
                    <p className={m.attachment ? "max-w-[340px] px-[8px]" : ""}>{m.text}</p>
                  </div>
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

        <div className="flex gap-[6px] overflow-x-auto px-[18px] pb-[8px] [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,#000_18px,#000_calc(100%-36px),transparent)]">
          {quickReplies.map((q) => (
            <motion.button key={q} type="button" whileTap={{ scale: 0.95 }} onClick={() => send(q)} className="shrink-0 cursor-pointer rounded-full border border-line px-[12px] py-[6px] text-[11.5px] font-medium whitespace-nowrap hover:bg-soft">
              {q}
            </motion.button>
          ))}
        </div>
        <form onSubmit={submit} className="mx-[16px] mb-[14px] flex items-center gap-[8px] rounded-full border border-line py-[5px] pr-[5px] pl-[16px]">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Scrivi a ${client.name.split(" ")[0]}…`} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
          <motion.button type="submit" aria-label="Invia" whileTap={{ scale: 0.9 }} className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full btn-trainer">
            <ArrowUp size={15} />
          </motion.button>
        </form>
      </section>
    </main>
  );
}
