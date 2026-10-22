"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { EllipsisVertical, Search, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { EASE_OUT, ProgressBar } from "@/components/ui/motion";
import SoftAreaChart from "@/components/ui/SoftAreaChart";
import { playSound } from "@/libs/ui/sound";
import { Client, clients, progressOf, toneColors } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./nav";
import { ClientAvatar } from "./shared";

const unpaid = (c: Client) => c.payments.some((p) => !p.paid);

const filters = [
  { key: "tutti", label: "Tutti", test: () => true },
  { key: "scadenza", label: "In scadenza", test: (c: Client) => c.pkg.expiring },
  { key: "seguire", label: "Da seguire", test: (c: Client) => c.needsAttention },
  { key: "pagamenti", label: "Pagamenti mancanti", test: unpaid },
] as const;

type FilterKey = (typeof filters)[number]["key"];

// search: i parametri dell'indirizzo (?filtro=), passati da TrainerApp.
export function ClientList({ search }: { search: string }) {
  const params = new URLSearchParams(search);
  const initial = (filters.find((f) => f.key === params.get("filtro"))?.key ?? "tutti") as FilterKey;
  const [filter, setFilter] = useState<FilterKey>(initial);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const test = filters.find((f) => f.key === filter)!.test;
    const q = query.trim().toLowerCase();
    return clients.filter((c) => test(c) && (!q || c.name.toLowerCase().includes(q) || c.goal.toLowerCase().includes(q)));
  }, [filter, query]);

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] flex flex-col pr-[18px] pl-[80px]">
      <div className="flex h-[34px] items-center justify-between">
        <div className="flex gap-[6px]">
          {filters.map((f) => {
            const count = clients.filter(f.test).length;
            const active = f.key === filter;
            return (
              <motion.button
                key={f.key}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playSound("tap");
                  setFilter(f.key);
                }}
                className={`relative flex h-[30px] cursor-pointer items-center gap-[7px] rounded-full px-[13px] text-[12px] font-semibold transition-colors ${
                  active ? "text-ink" : "bg-card text-ink/75 hover:text-ink"
                }`}
              >
                {active && <motion.span layoutId="filtro-clienti" className="sel-trainer absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{f.label}</span>
                <span className={`relative grid h-[18px] min-w-[18px] place-items-center rounded-full px-[5px] text-[10px] font-bold ${active ? "bg-card text-ink" : "bg-soft"}`}>{count}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="flex gap-[8px]">
          <label className="flex h-[30px] w-[230px] items-center gap-[7px] rounded-full bg-card px-[12px]">
            <Search size={13} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca un cliente o un obiettivo"
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted"
            />
          </label>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("tap");
              toast("Nuovo cliente: arriva nella Fase 2", { icon: "🛠️" });
            }}
            className="flex h-[30px] cursor-pointer items-center gap-[6px] rounded-full btn-trainer px-[13px] text-[12px] font-semibold"
          >
            <UserPlus size={13} /> Nuovo cliente
          </motion.button>
        </div>
      </div>

      <div className="mt-[12px] grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-[12px]">
        {shown.map((c, i) => (
          <ClientTile key={`${filter}-${c.id}`} c={c} i={i} />
        ))}
        {shown.length === 0 && <p className="col-span-4 mt-[40px] text-center text-[13px] text-muted">Nessun cliente corrisponde alla ricerca.</p>}
      </div>
    </main>
  );
}

function ClientTile({ c, i }: { c: Client; i: number }) {
  const tone = toneColors[c.tone];
  const percent = progressOf(c);
  const weight = c.weights[c.weights.length - 1];
  const badges = [
    c.needsAttention && { label: "Da seguire", cls: "bg-[rgba(201,138,30,0.16)] text-[#c98a1e]" },
    c.pkg.expiring && { label: "In scadenza", cls: "bg-[rgba(106,90,224,0.16)] text-violet-strong" },
    unpaid(c) && { label: "Pagamento mancante", cls: "bg-[rgba(212,59,79,0.14)] text-[#d43b4f]" },
  ].filter(Boolean) as { label: string; cls: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.06 + i * 0.05, duration: 0.5, ease: EASE_OUT }}
      whileHover={{ y: -4 }}
      className="min-h-0"
    >
      <Link
        href={ROUTES.cliente(c.id)}
        onClick={() => playSound("tap")}
        className="flex h-full flex-col rounded-[18px] px-[14px] pt-[12px] pb-[12px] transition-shadow duration-200 hover:shadow-[0_14px_30px_rgba(0,0,0,0.09)]"
        style={{ background: tone.bg }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-card/90 px-[7px] py-[2.5px] text-[9.5px] leading-none font-semibold text-ink/85">{c.since}</span>
          <EllipsisVertical size={13} className="text-ink/60" />
        </div>
        <div className="mt-[10px] flex items-center gap-[10px]">
          <ClientAvatar c={c} size={40} className="ring-2 ring-card" />
          <div className="min-w-0 leading-none">
            <p className="truncate text-[15px] font-bold">{c.name}</p>
            <p className="mt-[4px] truncate text-[11px]" style={{ color: tone.sub }}>
              {c.goal}
            </p>
          </div>
        </div>

        <div className="mt-[10px] min-h-0 flex-1 overflow-hidden px-[4px] py-[8px]">
          <SoftAreaChart points={c.weights} color={tone.strong} />
        </div>

        <div className="mt-[6px] flex items-center justify-between text-[10px]">
          <span className="text-ink/60">
            Peso <b className="text-ink">{weight.toString().replace(".", ",")} kg</b>
          </span>
          <span className="rounded-full bg-card px-[7px] py-[2.5px] leading-none">
            <b>{percent}%</b> <span className="text-ink/70">obiettivo</span>
          </span>
        </div>
        <div className="mt-[7px]">
          <ProgressBar percent={percent} fill={tone.strong} track={tone.track} delay={0.3 + i * 0.05} />
        </div>
        <div className="mt-[9px] flex items-center justify-between text-[10px] text-ink/60">
          <span>Ultimo allenamento: {c.lastWorkout.toLowerCase()}</span>
          <span className="rounded-full bg-card px-[7px] py-[2.5px] leading-none font-medium text-ink/80">{c.pkg.left}</span>
        </div>
        <div className="mt-[8px] flex h-[18px] flex-wrap gap-[4px] overflow-hidden">
          {badges.map((b) => (
            <span key={b.label} className={`rounded-full px-[7px] py-[3px] text-[9.5px] leading-none font-semibold ${b.cls}`}>
              {b.label}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
