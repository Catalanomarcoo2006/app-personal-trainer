"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { Bell, CalendarDays, ChartLine, Check, CircleDot, Droplet, EllipsisVertical, Footprints, FolderOpen, House, Info, Plus, User } from "lucide-react";
import { Avatar, IconCircle, Pill } from "@/components/ui/basics";
import { CountUp, EASE_OUT, ProgressBar } from "@/components/ui/motion";
import SoftAreaChart from "@/components/ui/SoftAreaChart";
import { playSound } from "@/libs/ui/sound";
import { client, trainer, workout } from "@/libs/prototipo/dati-finti";

const tint = (p: number) => `color-mix(in srgb, var(--trainer) ${p}%, white)`;
const card = "rounded-[20px] bg-card";

export function ClientHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <span className="grid size-[40px] place-items-center rounded-[12px] bg-card text-[14px] font-extrabold tracking-[-0.03em]" style={{ color: "var(--trainer)" }}>
          {trainer.initials}
        </span>
        <div className="leading-none">
          <p className="text-[18px] font-bold tracking-[-0.02em]">Ciao, {client.name}</p>
          <p className="mt-[5px] text-[11.5px] text-muted">
            {trainer.name} · {trainer.role}
          </p>
        </div>
      </div>
      <div className="flex h-[38px] items-center gap-[10px] rounded-full bg-card pr-[4px] pl-[12px]">
        <span className="relative">
          <Bell size={16} strokeWidth={1.9} />
          <span className="absolute -top-[2px] right-0 size-[5px] rounded-full bg-[#e5484d]" />
        </span>
        <Avatar initials="GB" size={30} tone={2} />
      </div>
    </div>
  );
}

const week = [
  { d: "L", n: 19, kind: "done" },
  { d: "M", n: 20, kind: "done" },
  { d: "M", n: 21, kind: "today" },
  { d: "G", n: 22, kind: "default" },
  { d: "V", n: 23, kind: "planned" },
  { d: "S", n: 24, kind: "default" },
  { d: "D", n: 25, kind: "default" },
] as const;

export function WeekStrip() {
  return (
    <section className={`${card} px-[14px] pt-[12px] pb-[12px]`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Questa settimana <CalendarDays size={13} className="text-ink/60" />
        </h2>
        <Pill className="h-[24px] border border-line px-[10px] text-[11px] font-medium">
          <b>{client.lessonsLeft}</b> lezioni rimaste
        </Pill>
      </div>
      <div className="mt-[12px] grid grid-cols-7 gap-[4px]">
        {week.map((w, i) => (
          <motion.div
            key={w.n}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.04, type: "spring", stiffness: 420, damping: 22 }}
            className={`flex h-[50px] flex-col items-center justify-center gap-[3px] rounded-[10px] text-[10px] ${
              w.kind === "done"
                ? "bg-cal-done text-white"
                : w.kind === "planned"
                  ? "bg-cal-planned text-white"
                  : w.kind === "today"
                    ? "text-white shadow-[inset_0_0_0_2px_#2b2b2b]"
                    : "bg-cal-default text-[#9a9da0]"
            }`}
            style={w.kind === "today" ? { background: "var(--trainer)" } : undefined}
          >
            <span className="opacity-80">{w.d}</span>
            <span className="text-[13px] font-bold">{w.n}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function GoalCard() {
  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      onClick={() => playSound("tap")}
      className="flex flex-col rounded-[20px] px-[15px] pt-[12px] pb-[12px]"
      style={{ background: tint(11) }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-card/90 px-[8px] py-[3px] text-[10px] leading-none font-semibold text-ink/85">{client.since}</span>
        <EllipsisVertical size={14} className="text-ink/60" />
      </div>
      <div className="mt-[11px] flex items-center justify-between">
        <h3 className="text-[17px] leading-none font-bold">{client.goal}</h3>
        <Info size={14} className="text-ink/45" />
      </div>
      <div className="mt-[9px] flex items-center justify-between">
        <p className="text-[12px] leading-none text-ink/55">{client.goalDetail}</p>
        <span className="flex items-center gap-[5px] rounded-full bg-card px-[8px] py-[3px] text-[10px] leading-none">
          <b className="text-[11px]">
            <CountUp value={client.goalPercent} delay={0.45} />%
          </b>
          <span className="text-ink/70">Obiettivo</span>
        </span>
      </div>
      <div className="mt-[11px]">
        <ProgressBar percent={client.goalPercent} fill="var(--trainer)" track={tint(28)} delay={0.45} />
      </div>
      <div className="mt-[12px] flex items-center justify-between">
        <div className="flex items-center">
          {client.weekDone.map((d, k) => (
            <span
              key={k}
              className="-ml-[5px] grid size-[22px] place-items-center rounded-full border-[1.5px] border-card text-[9px] font-bold text-white first:ml-0"
              style={{ background: "var(--trainer)" }}
            >
              {d}
            </span>
          ))}
          <span className="-ml-[4px] grid size-[17px] place-items-center rounded-full border border-card" style={{ background: tint(30), color: "var(--trainer)" }}>
            <Plus size={10} strokeWidth={3} />
          </span>
        </div>
        <span className="rounded-full bg-card px-[9px] py-[4px] text-[10px] leading-none font-medium text-ink/80">2 allenamenti su 3</span>
      </div>
    </motion.article>
  );
}

export function NextSession() {
  const [sent, setSent] = useState(false);
  return (
    <motion.div whileTap={{ scale: 0.985 }} className="flex h-[58px] items-center gap-[10px] rounded-[16px] bg-contrast px-[10px] text-on-contrast shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
      <span className="grid size-[36px] place-items-center rounded-full bg-on-contrast/10">
        <CalendarDays size={16} />
      </span>
      <div className="min-w-0 leading-none">
        <p className="text-[12.5px] font-bold">Prossima seduta con {trainer.name.split(" ")[0]}</p>
        <p className="mt-[4px] truncate text-[10.5px] text-on-contrast/65">
          {client.nextSession.when} · {client.nextSession.where}
        </p>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        disabled={sent}
        onClick={() => {
          playSound("confirm");
          setSent(true);
          toast.success(`Richiesta inviata a ${trainer.name.split(" ")[0]}`);
        }}
        className="ml-auto flex h-[28px] shrink-0 cursor-pointer items-center gap-[4px] rounded-full bg-on-contrast px-[11px] text-[11px] font-semibold text-contrast disabled:cursor-default"
      >
        {sent ? (
          <>
            Inviata <Check size={12} strokeWidth={3} />
          </>
        ) : (
          "Sposta"
        )}
      </motion.button>
    </motion.div>
  );
}

export function WorkoutCard() {
  const [done, setDone] = useState<boolean[]>(workout.exercises.map((_, i) => i === 0));
  const count = done.filter(Boolean).length;
  const all = count === done.length;

  const toggle = (i: number) => {
    const next = done.map((v, k) => (k === i ? !v : v));
    setDone(next);
    if (next.every(Boolean)) playSound("complete");
    else playSound(next[i] ? "confirm" : "tap");
  };

  return (
    <section className={`${card} px-[14px] pt-[12px] pb-[14px]`}>
      <div className="flex items-center justify-between">
        <div className="leading-none">
          <p className="text-[10.5px] text-muted">Allenamento di oggi</p>
          <h2 className="mt-[4px] text-[15px] font-bold">{workout.title}</h2>
        </div>
        <motion.span
          key={count}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`rounded-full px-[10px] py-[5px] text-[11px] font-bold ${all ? "bg-ok text-white" : "bg-contrast text-on-contrast"}`}
        >
          {count}/{done.length}
        </motion.span>
      </div>
      <div className="mt-[10px] flex flex-col gap-[7px]">
        {workout.exercises.map((ex, i) => (
          <motion.button
            type="button"
            key={ex.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.07, duration: 0.45, ease: EASE_OUT }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggle(i)}
            className="flex h-[50px] cursor-pointer items-center gap-[10px] rounded-[12px] border border-line px-[11px] text-left"
          >
            <CircleDot size={14} strokeWidth={2.4} className="shrink-0" style={{ color: done[i] ? "var(--trainer)" : undefined }} />
            <div className="min-w-0 leading-none">
              <p className="truncate text-[10px] text-muted">{ex.detail}</p>
              <p className={`mt-[4px] truncate text-[13px] font-semibold transition-opacity ${done[i] ? "opacity-45" : ""}`}>{ex.name}</p>
            </div>
            <motion.span
              animate={{ scale: done[i] ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={`ml-auto grid size-[30px] shrink-0 place-items-center rounded-full border border-line transition-colors duration-300 ${done[i] ? "bg-contrast text-on-contrast" : "bg-card text-ink/35"}`}
            >
              <Check size={14} strokeWidth={2.6} />
            </motion.span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {all && (
          <motion.p
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="mt-[10px] rounded-[12px] bg-contrast px-[12px] py-[10px] text-center text-[12.5px] font-semibold text-on-contrast"
          >
            Allenamento completato! {trainer.name.split(" ")[0]} lo vedrà nella tua scheda.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}

export function WeightCard() {
  const first = client.weight[0];
  const last = client.weight[client.weight.length - 1];
  return (
    <section className={`${card} px-[14px] pt-[12px] pb-[10px]`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-bold">Peso</h2>
        <span className="rounded-full border border-ok-line bg-ok-soft px-[9px] py-[3px] text-[10.5px] font-semibold text-ok">
          −{(first - last).toFixed(1).replace(".", ",")} kg dall’inizio
        </span>
      </div>
      <p className="mt-[8px] text-[28px] leading-none font-bold tracking-[-0.03em]">
        <CountUp value={last} format={(n) => n.toFixed(1).replace(".", ",")} delay={0.2} duration={1.1} />
        <span className="ml-[4px] text-[14px] font-semibold text-muted">kg</span>
      </p>
      <div className="mt-[6px]">
        <SoftAreaChart points={client.weight} height={78} />
      </div>
    </section>
  );
}

export function HabitsRow() {
  const [water, setWater] = useState(client.water.done);
  const glasses = Math.round(water / 0.25);
  return (
    <div className="grid grid-cols-2 gap-[10px]">
      <section className={`${card} px-[13px] pt-[12px] pb-[12px]`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-[5px] text-[12px] font-bold">
            <Droplet size={13} className="text-sky-strong" /> Acqua
          </span>
          <IconCircle
            icon={Plus}
            label="Aggiungi un bicchiere"
            size={26}
            iconSize={13}
            variant="dark"
            sound="confirm"
            onClick={() => setWater((w) => Math.min(client.water.target, +(w + 0.25).toFixed(2)))}
          />
        </div>
        <p className="mt-[8px] text-[18px] leading-none font-bold">
          {water.toFixed(2).replace(/0$/, "").replace(".", ",")}
          <span className="text-[12px] font-semibold text-muted"> / {client.water.target} L</span>
        </p>
        <div className="mt-[10px] grid grid-cols-8 gap-[3px]">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.span
              key={i}
              animate={{ scaleY: i < glasses ? 1 : 0.7 }}
              transition={{ duration: 0.3 }}
              className={`h-[16px] rounded-[4px] transition-colors duration-300 ${i < glasses ? "bg-sky-strong" : "bg-cal-default"}`}
            />
          ))}
        </div>
      </section>
      <section className={`${card} px-[13px] pt-[12px] pb-[12px]`}>
        <span className="flex items-center gap-[5px] text-[12px] font-bold">
          <Footprints size={13} className="text-violet-strong" /> Passi
        </span>
        <p className="mt-[16px] text-[18px] leading-none font-bold">
          <CountUp value={client.steps} format={(n) => new Intl.NumberFormat("it-IT", { useGrouping: "always" }).format(Math.round(n))} delay={0.5} />
        </p>
        <p className="mt-[4px] text-[10.5px] text-muted">su 10.000 di oggi</p>
        <div className="mt-[8px]">
          <ProgressBar percent={(client.steps / 10000) * 100} fill="var(--color-violet-strong)" track="var(--color-violet-track)" delay={0.5} />
        </div>
      </section>
    </div>
  );
}

const tabs = [
  { label: "Oggi", icon: House },
  { label: "Progressi", icon: ChartLine },
  { label: "Documenti", icon: FolderOpen },
  { label: "Profilo", icon: User },
];

export function BottomNav() {
  const [active, setActive] = useState("Oggi");
  return (
    <motion.nav
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
      className="absolute bottom-[14px] left-[16px] z-30 flex h-[58px] w-[248px] items-center justify-around rounded-full bg-pill px-[8px] shadow-[0_14px_30px_rgba(0,0,0,0.25)]"
    >
      {tabs.map(({ label, icon: Icon }) => (
        <motion.button
          key={label}
          type="button"
          aria-label={label}
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            playSound("tap");
            setActive(label);
          }}
          className={`grid size-[42px] cursor-pointer place-items-center rounded-full transition-colors duration-200 ${
            active === label ? "bg-[#4c4c4e] text-white" : "text-[#a9a9ad]"
          }`}
        >
          <Icon size={19} strokeWidth={1.9} />
        </motion.button>
      ))}
    </motion.nav>
  );
}
