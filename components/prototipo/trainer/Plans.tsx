"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { Dumbbell, Plus, Search, Send, X } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { clients, defaultPlan, exerciseById, library, Muscle, PlanDay, plans } from "@/libs/prototipo/dati-finti";
import { ClientAvatar } from "./shared";

const muscleColors: Record<Muscle, string> = {
  Gambe: "var(--color-peach-strong)",
  Glutei: "var(--color-rose-strong)",
  Petto: "var(--color-sky-strong)",
  Schiena: "var(--color-violet-strong)",
  Spalle: "var(--color-mint-strong)",
  Braccia: "#c98a1e",
  Core: "#0f9d8a",
  Cardio: "#e5484d",
};

const muscles = Object.keys(muscleColors) as Muscle[];

function MuscleChip({ m }: { m: Muscle }) {
  return (
    <span className="rounded-full px-[7px] py-[2.5px] text-[9.5px] font-semibold" style={{ color: muscleColors[m], background: `color-mix(in srgb, ${muscleColors[m]} 14%, transparent)` }}>
      {m}
    </span>
  );
}

type Row = PlanDay["rows"][number] & { key: string; fresh?: boolean };
type Day = Omit<PlanDay, "rows"> & { rows: Row[] };

const withKeys = (days: PlanDay[]): Day[] => days.map((d) => ({ ...d, rows: d.rows.map((r, i) => ({ ...r, key: `${d.label}-${r.exId}-${i}` })) }));

export function PlansView() {
  const [clientId, setClientId] = useState("giulia-bianchi");
  const [allPlans, setAllPlans] = useState<Record<string, Day[]>>(() =>
    Object.fromEntries(clients.map((c) => [c.id, withKeys(plans[c.id] ?? defaultPlan)])),
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);

  const client = clients.find((c) => c.id === clientId)!;
  const days = allPlans[clientId];
  const day = days[Math.min(dayIndex, days.length - 1)];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter((e) => (!muscle || e.muscle === muscle) && (!q || e.name.toLowerCase().includes(q)));
  }, [query, muscle]);

  const updateDay = (fn: (rows: Row[]) => Row[]) =>
    setAllPlans((p) => ({ ...p, [clientId]: p[clientId].map((d, i) => (i === Math.min(dayIndex, days.length - 1) ? { ...d, rows: fn(d.rows) } : d)) }));

  const add = (exId: string) => {
    updateDay((rows) => [...rows, { exId, sets: "3 × 10", load: "—", rest: "60″", key: `${exId}-${Date.now()}`, fresh: true }]);
  };

  const remove = (key: string) => {
    playSound("tap");
    updateDay((rows) => rows.filter((r) => r.key !== key));
  };

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[260px_1fr_300px] gap-x-[12px] pr-[18px] pl-[80px]">
      <section className="flex min-h-0 flex-col rounded-[18px] bg-card px-[12px] pt-[14px] pb-[12px]">
        <h2 className="px-[4px] text-[14px] font-bold">Schede dei clienti</h2>
        <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto [scrollbar-width:none]">
          {clients.map((c, i) => {
            const active = c.id === clientId;
            const n = allPlans[c.id].length;
            return (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.04, duration: 0.4, ease: EASE_OUT }}
                onClick={() => {
                  playSound("tap");
                  setClientId(c.id);
                  setDayIndex(0);
                }}
                className={`flex cursor-pointer items-center gap-[10px] rounded-[13px] px-[9px] py-[8px] text-left transition-colors ${active ? "bg-contrast text-on-contrast" : "hover:bg-soft"}`}
              >
                <ClientAvatar c={c} size={32} />
                <div className="min-w-0 leading-none">
                  <p className="truncate text-[12px] font-bold">{c.name}</p>
                  <p className={`mt-[4px] truncate text-[10.5px] ${active ? "opacity-60" : "text-muted"}`}>
                    {n} {n === 1 ? "giorno" : "giorni"} · {c.plan}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="flex min-h-0 flex-col rounded-[18px] bg-card px-[18px] pt-[14px] pb-[14px]">
        <div className="flex items-center gap-[12px]">
          <ClientAvatar c={client} size={40} />
          <div className="leading-none">
            <p className="text-[11px] text-muted">Scheda di</p>
            <p className="mt-[4px] text-[16px] font-bold">{client.name}</p>
          </div>
          <div className="ml-auto flex gap-[4px] rounded-full bg-soft p-[4px]">
            {days.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => {
                  playSound("tap");
                  setDayIndex(i);
                }}
                className={`relative cursor-pointer rounded-full px-[14px] py-[6px] text-[12px] font-semibold ${i === dayIndex ? "text-on-contrast" : "text-ink/65"}`}
              >
                {i === dayIndex && <motion.span layoutId="giorno-scheda" className="absolute inset-0 rounded-full bg-contrast" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[14px] flex items-center justify-between">
          <p className="flex items-center gap-[7px] text-[13px] font-bold">
            <Dumbbell size={14} style={{ color: "var(--trainer)" }} /> {day.focus}
          </p>
          <p className="text-[11px] text-muted">{day.rows.length} esercizi</p>
        </div>

        <div className="mt-[10px] grid grid-cols-[28px_1fr_90px_70px_70px_28px] items-center gap-[10px] px-[10px] text-[10px] font-semibold tracking-wide text-muted uppercase">
          <span>#</span>
          <span>Esercizio</span>
          <span>Serie × rip.</span>
          <span>Carico</span>
          <span>Recupero</span>
          <span />
        </div>
        <div className="mt-[6px] flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto [scrollbar-width:none]">
          <AnimatePresence initial={false}>
            {day.rows.map((r, i) => {
              const ex = exerciseById(r.exId);
              if (!ex) return null;
              return (
                <motion.div
                  key={r.key}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                  transition={{ delay: r.fresh ? 0 : 0.1 + i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                  className="relative grid grid-cols-[28px_1fr_90px_70px_70px_28px] items-center gap-[10px] overflow-hidden rounded-[13px] border border-line px-[10px] py-[9px]"
                >
                  {r.fresh && (
                    <motion.span className="absolute inset-0" style={{ background: "var(--trainer)" }} initial={{ opacity: 0.22 }} animate={{ opacity: 0 }} transition={{ duration: 1.4 }} />
                  )}
                  <span className="relative grid size-[24px] place-items-center rounded-full bg-soft text-[11px] font-bold">{i + 1}</span>
                  <div className="relative min-w-0 leading-none">
                    <p className="truncate text-[12.5px] font-semibold">{ex.name}</p>
                    <p className="mt-[4px] flex items-center gap-[6px] text-[10px] text-muted">
                      <MuscleChip m={ex.muscle} /> {ex.equipment}
                    </p>
                  </div>
                  <span className="relative text-[12px] font-semibold tabular-nums">{r.sets}</span>
                  <span className="relative text-[12px] tabular-nums">{r.load}</span>
                  <span className="relative text-[12px] tabular-nums">{r.rest}</span>
                  <button type="button" aria-label="Togli esercizio" onClick={() => remove(r.key)} className="relative grid size-[26px] cursor-pointer place-items-center rounded-full text-ink/40 transition-colors hover:bg-soft hover:text-ink">
                    <X size={13} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-[12px] flex items-center justify-between">
          <p className="text-[11px] text-muted">Il cliente vede la scheda nella sua app appena la invii.</p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("complete");
              toast.success(`Scheda inviata a ${client.name.split(" ")[0]}`);
            }}
            className="flex h-[36px] cursor-pointer items-center gap-[7px] rounded-full bg-contrast px-[16px] text-[12px] font-semibold text-on-contrast"
          >
            <Send size={13} /> Invia al cliente
          </motion.button>
        </div>
      </section>

      <section className="flex min-h-0 flex-col rounded-[18px] bg-card px-[14px] pt-[14px] pb-[12px]">
        <h2 className="text-[14px] font-bold">Libreria esercizi</h2>
        <label className="mt-[10px] flex h-[32px] items-center gap-[8px] rounded-full bg-soft px-[12px]">
          <Search size={13} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca un esercizio" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted" />
        </label>
        <div className="mt-[9px] flex flex-wrap gap-[5px]">
          {muscles.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                playSound("tap");
                setMuscle((cur) => (cur === m ? null : m));
              }}
              className={`cursor-pointer rounded-full px-[9px] py-[4px] text-[10.5px] font-semibold transition-colors ${muscle === m ? "bg-contrast text-on-contrast" : "bg-soft text-ink/70"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[5px] overflow-y-auto [scrollbar-width:none]">
          {results.map((e) => (
            <div key={e.id} className="flex items-center gap-[9px] rounded-[12px] border border-line px-[10px] py-[7px]">
              <span className="size-[8px] shrink-0 rounded-full" style={{ background: muscleColors[e.muscle] }} />
              <div className="min-w-0 flex-1 leading-none">
                <p className="truncate text-[12px] font-semibold">{e.name}</p>
                <p className="mt-[3px] text-[10px] text-muted">
                  {e.muscle} · {e.equipment}
                </p>
              </div>
              <IconCircle icon={Plus} label={`Aggiungi ${e.name}`} size={26} iconSize={13} variant="dark" sound="confirm" onClick={() => add(e.id)} />
            </div>
          ))}
          {results.length === 0 && <p className="mt-[20px] text-center text-[11.5px] text-muted">Nessun esercizio trovato.</p>}
        </div>
      </section>
    </main>
  );
}
