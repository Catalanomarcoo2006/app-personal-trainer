"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { BellRing, Check, CircleDollarSign, Hourglass, TrendingUp, Users, Wallet, type LucideIcon } from "lucide-react";
import { Appear, CountUp, EASE_OUT, formatEuro } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { conta } from "@/libs/ui/testo";
import { clientById, clients, revenue } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./nav";
import { ClientAvatar } from "./shared";
import { RevenueChart } from "./Revenue";

type Movement = { key: string; clientId: string; date: string; label: string; amount: number; paid: boolean };

const initialMovements: Movement[] = clients.flatMap((c) => c.payments.map((p, i) => ({ key: `${c.id}-${i}`, clientId: c.id, date: p.date, label: p.label, amount: p.amount, paid: p.paid })));

function Kpi({ icon: Icon, label, children, note, i }: { icon: LucideIcon; label: string; children: ReactNode; note?: ReactNode; i: number }) {
  return (
    <Appear i={1 + i}>
      <div className="flex h-[96px] items-center gap-[12px] panel rounded-[18px] px-[16px]">
        <span className="grid size-[40px] shrink-0 place-items-center rounded-full bg-soft text-ink/70">
          <Icon size={18} />
        </span>
        <div className="min-w-0 leading-none">
          <p className="text-[11px] text-muted">{label}</p>
          <p className="mt-[6px] text-[24px] font-extrabold tracking-[-0.03em]">{children}</p>
          {note && <div className="mt-[5px] text-[10.5px]">{note}</div>}
        </div>
      </div>
    </Appear>
  );
}

export function PaymentsView() {
  const [moves, setMoves] = useState(initialMovements);
  const [filter, setFilter] = useState<"tutti" | "pagati" | "aperti">("tutti");

  const open = moves.filter((m) => !m.paid);
  const outstanding = open.reduce((s, m) => s + m.amount, 0);
  const extra = initialMovements.filter((m) => !m.paid).reduce((s, m) => s + m.amount, 0) - outstanding;
  const collected = revenue.collected + extra;
  const paying = new Set(moves.filter((m) => m.paid).map((m) => m.clientId)).size;

  const shown = useMemo(() => moves.filter((m) => (filter === "tutti" ? true : filter === "pagati" ? m.paid : !m.paid)), [moves, filter]);

  const markPaid = (key: string) => {
    const m = moves.find((x) => x.key === key);
    if (!m) return;
    playSound("complete");
    setMoves((ms) => ms.map((x) => (x.key === key ? { ...x, paid: true } : x)));
    toast.success(`${formatEuro(m.amount)} incassati da ${clientById(m.clientId)?.name.split(" ")[0]}`);
  };

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] flex flex-col gap-[10px] pr-[18px] pl-[80px]">
      <div className="grid grid-cols-4 gap-[10px]">
        <Kpi icon={Wallet} label="Incassato a ottobre" i={0} note={<span className="inline-flex items-center gap-[3px] rounded-full bg-ok-soft px-[6px] py-[2px] font-bold text-ok"><TrendingUp size={10} /> +{revenue.delta}% su settembre</span>}>
          <CountUp key={collected} value={collected} format={formatEuro} />
        </Kpi>
        <Kpi icon={Hourglass} label="Da incassare" i={1} note={<span className="text-muted">{conta(open.length, "pagamento aperto", "pagamenti aperti")}</span>}>
          <span className={outstanding > 0 ? "text-[#d43b4f]" : "text-ok"}>{formatEuro(outstanding)}</span>
        </Kpi>
        <Kpi icon={CircleDollarSign} label="Previsto a fine mese" i={2} note={<span className="text-muted">pacchetti e rinnovi già fissati</span>}>
          <CountUp value={revenue.forecast} format={formatEuro} />
        </Kpi>
        <Kpi icon={Users} label="Clienti che hanno pagato" i={3} note={<span className="text-muted">su {clients.length} clienti attivi</span>}>
          {paying} <span className="text-[14px] text-muted">/ {clients.length}</span>
        </Kpi>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.45fr_1fr] gap-[10px]">
        <Appear i={5} className="min-h-0">
          <section className="flex h-full flex-col panel rounded-[18px] px-[16px] pt-[14px] pb-[12px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold">Andamento degli ultimi 6 mesi</h2>
              <span className="rounded-full bg-soft px-[9px] py-[3px] text-[10.5px] font-semibold">mag – ott 2026</span>
            </div>
            <div className="mt-[6px] min-h-0 flex-1">
              <RevenueChart />
            </div>
          </section>
        </Appear>
        <Appear i={6} className="min-h-0">
          <section className="flex h-full flex-col panel rounded-[18px] px-[16px] pt-[14px] pb-[12px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold">Da incassare</h2>
              <span className="rounded-full bg-soft px-[9px] py-[3px] text-[10.5px] font-semibold">{formatEuro(outstanding)}</span>
            </div>
            <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto [scrollbar-width:none]">
              <AnimatePresence initial={false}>
                {open.map((m) => {
                  const c = clientById(m.clientId)!;
                  return (
                    <motion.div
                      key={m.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                      className="flex items-center gap-[10px] rounded-[14px] border border-line px-[10px] py-[8px]"
                    >
                      <ClientAvatar c={c} size={32} />
                      <div className="min-w-0 flex-1 leading-none">
                        <Link href={ROUTES.cliente(c.id)} onClick={() => playSound("tap")} className="text-[12px] font-bold hover:underline">
                          {c.name}
                        </Link>
                        <p className="mt-[4px] truncate text-[10.5px] text-muted">
                          {m.label} · dal {m.date}
                        </p>
                      </div>
                      <p className="text-[14px] font-extrabold tabular-nums">{formatEuro(m.amount)}</p>
                      <motion.button
                        type="button"
                        aria-label="Sollecita"
                        title="Sollecita"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          playSound("tap");
                          toast(`Promemoria inviato a ${c.name.split(" ")[0]}`, { icon: "🔔" });
                        }}
                        className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full border border-line hover:bg-soft"
                      >
                        <BellRing size={13} />
                      </motion.button>
                      <motion.button
                        type="button"
                        aria-label="Segna pagato"
                        title="Segna pagato"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markPaid(m.key)}
                        className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full btn-trainer"
                      >
                        <Check size={14} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {open.length === 0 && (
                <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-[30px] text-center text-[13px] font-semibold text-ok">
                  Tutto incassato 🎉
                </motion.p>
              )}
            </div>
          </section>
        </Appear>
      </div>

      <Appear i={7}>
        <section className="flex h-[228px] flex-col panel rounded-[18px] px-[16px] pt-[13px] pb-[10px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">Movimenti</h2>
            <div className="flex gap-[5px]">
              {(
                [
                  ["tutti", "Tutti"],
                  ["pagati", "Pagati"],
                  ["aperti", "Da incassare"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playSound("tap");
                    setFilter(key);
                  }}
                  className={`relative cursor-pointer rounded-full px-[11px] py-[5px] text-[11px] font-semibold ${filter === key ? "text-ink" : "bg-soft text-ink/70"}`}
                >
                  {filter === key && <motion.span layoutId="filtro-movimenti" className="sel-trainer absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-[8px] grid grid-cols-[90px_1.3fr_1.6fr_100px_120px] px-[10px] text-[10px] font-semibold tracking-wide text-muted uppercase">
            <span>Data</span>
            <span>Cliente</span>
            <span>Descrizione</span>
            <span className="text-right">Importo</span>
            <span className="text-right">Stato</span>
          </div>
          <div className="mt-[4px] min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
            {shown.map((m, i) => {
              const c = clientById(m.clientId)!;
              return (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.03 * i, duration: 0.3, ease: EASE_OUT }}
                  className="grid grid-cols-[90px_1.3fr_1.6fr_100px_120px] items-center border-b border-line px-[10px] py-[7px] text-[12px] last:border-b-0"
                >
                  <span className="text-muted">{m.date}</span>
                  <span className="flex items-center gap-[7px] font-semibold">
                    <ClientAvatar c={c} size={22} /> {c.name}
                  </span>
                  <span className="truncate text-ink/75">{m.label}</span>
                  <span className="text-right font-bold tabular-nums">{formatEuro(m.amount)}</span>
                  <span className="text-right">
                    {m.paid ? (
                      <span className="inline-flex items-center gap-[3px] rounded-full bg-ok-soft px-[8px] py-[3px] text-[10px] font-bold text-ok">
                        <Check size={10} strokeWidth={3} /> Pagato
                      </span>
                    ) : (
                      <span className="rounded-full bg-[rgba(212,59,79,0.14)] px-[8px] py-[3px] text-[10px] font-bold text-[#d43b4f]">Da incassare</span>
                    )}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </Appear>
    </main>
  );
}
