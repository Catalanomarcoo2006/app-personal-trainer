"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { Dumbbell, FileUp, Plus, Search, Send, X } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { clients, defaultPlan, exerciseById, library, Muscle, PlanDay, plans } from "@/libs/prototipo/dati-finti";
import { ParsedDay } from "@/libs/prototipo/pdf-scheda";
import { ClientAvatar } from "./shared";
import { PdfImport } from "./PdfImport";

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

function MuscleChip({ m }: { m?: Muscle }) {
  const color = m ? muscleColors[m] : "var(--trainer)";
  return (
    <span className="rounded-full px-[7px] py-[2.5px] text-[9.5px] font-semibold" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
      {m ?? "Da PDF"}
    </span>
  );
}

// Una riga della scheda: esercizio della libreria (exId) oppure scritto a mano / letto dal PDF (name).
type Row = { exId?: string; name?: string; sets: string; load: string; rest: string; key: string; fresh?: boolean };
type Day = { label: string; focus: string; rows: Row[] };
type Field = "name" | "sets" | "load" | "rest";

let seq = 0;
const nextKey = () => `r${++seq}`;

const fromPlan = (days: PlanDay[]): Day[] => days.map((d) => ({ ...d, rows: d.rows.map((r) => ({ ...r, key: nextKey() })) }));

// Se il nome letto dal PDF corrisponde a un esercizio della libreria, lo collega.
const fromParsed = (days: ParsedDay[]): Day[] =>
  days.map((d) => ({
    label: d.label,
    focus: d.focus,
    rows: d.rows.map((r) => {
      const match = library.find((e) => e.name.toLowerCase() === r.name.toLowerCase());
      return { ...r, exId: match?.id, name: match ? undefined : r.name, key: nextKey(), fresh: true };
    }),
  }));

const rowName = (r: Row) => r.name ?? exerciseById(r.exId ?? "")?.name ?? "Esercizio";

function Cell({ value, onChange, className = "", label }: { value: string; onChange: (v: string) => void; className?: string; label: string }) {
  return (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`relative w-full min-w-0 rounded-[8px] bg-transparent px-[6px] py-[4px] outline-none transition-colors hover:bg-soft focus:bg-soft focus:ring-1 focus:ring-[var(--trainer)] ${className}`}
    />
  );
}

export function PlansView() {
  const params = useSearchParams();
  const fromQuery = clients.find((c) => c.id === params.get("cliente"))?.id;
  const [clientId, setClientId] = useState(fromQuery ?? "giulia-bianchi");
  const [allPlans, setAllPlans] = useState<Record<string, Day[]>>(() => Object.fromEntries(clients.map((c) => [c.id, fromPlan(plans[c.id] ?? defaultPlan)])));
  const [dayIndex, setDayIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [importing, setImporting] = useState(false);

  const client = clients.find((c) => c.id === clientId)!;
  const days = allPlans[clientId];
  const current = Math.min(dayIndex, days.length - 1);
  const day = days[current];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter((e) => (!muscle || e.muscle === muscle) && (!q || e.name.toLowerCase().includes(q)));
  }, [query, muscle]);

  const updateDay = (fn: (rows: Row[]) => Row[]) => setAllPlans((p) => ({ ...p, [clientId]: p[clientId].map((d, i) => (i === current ? { ...d, rows: fn(d.rows) } : d)) }));

  const add = (exId: string) => updateDay((rows) => [...rows, { exId, sets: "3 × 10", load: "—", rest: "60″", key: nextKey(), fresh: true }]);

  const edit = (key: string, field: Field, value: string) => updateDay((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const remove = (key: string) => {
    playSound("tap");
    updateDay((rows) => rows.filter((r) => r.key !== key));
  };

  const imported = (parsed: ParsedDay[]) => {
    const next = fromParsed(parsed);
    setAllPlans((p) => ({ ...p, [clientId]: next }));
    setDayIndex(0);
    setImporting(false);
    toast.success(`Scheda importata: ${next.length} giorni. Controlla e modifica quello che vuoi.`);
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
                    {n} {n === 1 ? "giorno" : "giorni"} · {allPlans[c.id][0]?.focus}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-0 flex-col rounded-[18px] bg-card px-[18px] pt-[14px] pb-[14px]">
        <div className="flex items-center gap-[12px]">
          <ClientAvatar c={client} size={40} />
          <div className="leading-none">
            <p className="text-[11px] text-muted">Scheda di</p>
            <p className="mt-[4px] text-[16px] font-bold">{client.name}</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("tap");
              setImporting(true);
            }}
            className="ml-[10px] flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full border border-line px-[12px] text-[11.5px] font-semibold"
          >
            <FileUp size={13} style={{ color: "var(--trainer)" }} /> Importa da PDF
          </motion.button>
          <div className="ml-auto flex gap-[4px] rounded-full bg-soft p-[4px]">
            {days.map((d, i) => (
              <button
                key={d.label + i}
                type="button"
                onClick={() => {
                  playSound("tap");
                  setDayIndex(i);
                }}
                className={`relative cursor-pointer rounded-full px-[14px] py-[6px] text-[12px] font-semibold ${i === current ? "text-on-contrast" : "text-ink/65"}`}
              >
                {i === current && <motion.span layoutId="giorno-scheda" className="absolute inset-0 rounded-full bg-contrast" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[14px] flex items-center justify-between">
          <p className="flex items-center gap-[7px] text-[13px] font-bold">
            <Dumbbell size={14} style={{ color: "var(--trainer)" }} /> {day.focus || day.label}
          </p>
          <p className="text-[11px] text-muted">{day.rows.length} esercizi · clicca un valore per modificarlo</p>
        </div>

        <div className="mt-[10px] grid grid-cols-[28px_1fr_96px_84px_76px_28px] items-center gap-[8px] px-[10px] text-[10px] font-semibold tracking-wide text-muted uppercase">
          <span>#</span>
          <span className="pl-[6px]">Esercizio</span>
          <span className="pl-[6px]">Serie × rip.</span>
          <span className="pl-[6px]">Carico</span>
          <span className="pl-[6px]">Recupero</span>
          <span />
        </div>
        <div className="mt-[6px] flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto [scrollbar-width:none]">
          <AnimatePresence initial={false}>
            {day.rows.map((r, i) => {
              const ex = r.exId ? exerciseById(r.exId) : undefined;
              return (
                <motion.div
                  key={r.key}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                  transition={{ delay: r.fresh ? i * 0.06 : 0.1 + i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                  className="relative grid grid-cols-[28px_1fr_96px_84px_76px_28px] items-center gap-[8px] overflow-hidden rounded-[13px] border border-line px-[10px] py-[7px]"
                >
                  {r.fresh && <motion.span className="pointer-events-none absolute inset-0" style={{ background: "var(--trainer)" }} initial={{ opacity: 0.22 }} animate={{ opacity: 0 }} transition={{ duration: 1.6, delay: i * 0.06 }} />}
                  <span className="relative grid size-[24px] place-items-center rounded-full bg-soft text-[11px] font-bold">{i + 1}</span>
                  <div className="relative min-w-0 leading-none">
                    <Cell label="Esercizio" value={rowName(r)} onChange={(v) => edit(r.key, "name", v)} className="text-[12.5px] font-semibold" />
                    <p className="mt-[2px] flex items-center gap-[6px] pl-[6px] text-[10px] text-muted">
                      <MuscleChip m={ex?.muscle} /> {ex?.equipment ?? "Letto dal PDF"}
                    </p>
                  </div>
                  <Cell label="Serie e ripetizioni" value={r.sets} onChange={(v) => edit(r.key, "sets", v)} className="text-[12px] font-semibold tabular-nums" />
                  <Cell label="Carico" value={r.load} onChange={(v) => edit(r.key, "load", v)} className="text-[12px] tabular-nums" />
                  <Cell label="Recupero" value={r.rest} onChange={(v) => edit(r.key, "rest", v)} className="text-[12px] tabular-nums" />
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

      <AnimatePresence>{importing && <PdfImport clientName={client.name} onClose={() => setImporting(false)} onImported={imported} />}</AnimatePresence>
    </main>
  );
}
