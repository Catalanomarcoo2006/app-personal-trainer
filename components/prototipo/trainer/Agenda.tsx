"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, ClipboardCheck, Dumbbell, Footprints, Video, type LucideIcon } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { conta } from "@/libs/ui/testo";
import { Appointment, appointmentColors, AppointmentType, TODAY_INDEX, trainer } from "@/libs/prototipo/dati-finti";
import { useTrovaCliente } from "@/libs/dati/selettori";
import { giornoDi, isoDi, LONG, MONTHS, seduteDemo, SETTIMANE_LEO, SHORT } from "@/libs/prototipo/calendario";
import type { Seduta } from "@/libs/prototipo/leo-azioni";
import { useStato } from "@/libs/prototipo/stato";
import { ROUTES } from "./nav";
import { ClientAvatar } from "./shared";
import { useFitDensity } from "./fit";

export const typeIcons: Record<AppointmentType, LucideIcon> = { Workout: Dumbbell, Valutazione: ClipboardCheck, Online: Video, Corsa: Footprints };

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const endTime = (a: Appointment) => {
  const end = toMinutes(a.time) + a.minutes;
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
};

export const duration = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`);

// ——— Settimane: quella del prototipo (19–25 ottobre) e, spostandosi, settimane credibili prima e dopo ———

export type WeekDay = { short: string; long: string; n: number; month: string; items: Appointment[]; isToday: boolean; isPast: boolean };

// sedute: quelle dello store (settimane 0 e 1, che Leo può modificare); senza, le sedute della demo.
export function weekOf(offset: number, sedute?: Seduta[]): { label: string; days: WeekDay[] } {
  const days = SHORT.map((short, i) => {
    const date = giornoDi(offset, i);
    const items = sedute && SETTIMANE_LEO.includes(offset) ? sedute.filter((s) => s.date === isoDi(date)).sort((a, b) => toMinutes(a.time) - toMinutes(b.time)) : seduteDemo(offset, i);
    return {
      short,
      long: LONG[i],
      n: date.getDate(),
      month: MONTHS[date.getMonth()],
      items,
      isToday: offset === 0 && i === TODAY_INDEX,
      isPast: offset < 0 || (offset === 0 && i < TODAY_INDEX),
    };
  });
  const first = days[0];
  const last = days[6];
  const label = first.month === last.month ? `${first.n} – ${last.n} ${last.month}` : `${first.n} ${first.month.slice(0, 3)} – ${last.n} ${last.month.slice(0, 3)}`;
  return { label, days };
}

// Stato di un appuntamento rispetto ad adesso.
export function statusOf(day: WeekDay, a: Appointment) {
  const now = toMinutes(trainer.now);
  const start = toMinutes(a.time);
  const done = day.isPast || (day.isToday && start + a.minutes <= now);
  const live = day.isToday && start <= now && now < start + a.minutes;
  return { done, live, minutesTo: day.isToday ? start - now : null };
}

// Freccette della settimana.
export function WeekArrows({ label, onMove, size = 26, className = "" }: { label: string; onMove: (step: number) => void; size?: number; className?: string }) {
  const arrow = (step: number, Icon: LucideIcon, aria: string) => (
    <motion.button
      type="button"
      aria-label={aria}
      title={aria}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        playSound("tap");
        onMove(step);
      }}
      className="grid shrink-0 cursor-pointer place-items-center rounded-full bg-soft text-ink/70 transition-colors hover:text-ink"
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.48} strokeWidth={2} />
    </motion.button>
  );
  return (
    <div className={`flex items-center gap-[4px] ${className}`}>
      {arrow(-1, ChevronLeft, "Settimana precedente")}
      <span className="min-w-[104px] text-center font-semibold tabular-nums">{label}</span>
      {arrow(1, ChevronRight, "Settimana successiva")}
    </div>
  );
}

// Giorni della settimana come lastre di vetro. Dietro c'è un po' di colore sfocato, così il vetro si vede.
export function GlassDays({
  days,
  selected,
  onSelect,
  weekKey,
  direction,
  height = 62,
}: {
  days: WeekDay[];
  selected: number | null;
  onSelect?: (i: number) => void;
  weekKey: number;
  direction: number;
  height?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] bg-soft p-[6px]">
      <span aria-hidden className="absolute top-[-30px] left-[8%] h-[90px] w-[34%] rounded-full opacity-45 blur-[22px]" style={{ background: "var(--trainer)" }} />
      <span aria-hidden className="absolute bottom-[-40px] left-[42%] h-[90px] w-[30%] rounded-full opacity-35 blur-[22px]" style={{ background: "var(--color-sky-strong)" }} />
      <span aria-hidden className="absolute top-[-20px] right-[2%] h-[80px] w-[26%] rounded-full opacity-35 blur-[22px]" style={{ background: "var(--color-mint-strong)" }} />

      <motion.div
        key={weekKey}
        initial={{ opacity: 0, x: direction * 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT }}
        className="relative grid grid-cols-7 gap-[6px]"
      >
        {days.map((d, i) => {
          const isSel = i === selected;
          const Tag = onSelect ? motion.button : motion.div;
          return (
            <Tag
              key={i}
              {...(onSelect
                ? {
                    type: "button" as const,
                    onClick: () => {
                      playSound("tap");
                      onSelect(i);
                    },
                    whileHover: { y: -2 },
                    whileTap: { scale: 0.94 },
                  }
                : {})}
              animate={{ y: isSel ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              aria-pressed={onSelect ? isSel : undefined}
              aria-label={`${d.long} ${d.n} ${d.month}, ${d.items.length ? conta(d.items.length, "appuntamento", "appuntamenti") : "libero"}`}
              className={`glass-tile relative flex flex-col items-center justify-center rounded-[14px] ${onSelect ? "cursor-pointer" : ""}`}
              style={{ height }}
            >
              {isSel && (
                <motion.span
                  layoutId={`giorno-vetro-${onSelect ? "sel" : "fisso"}`}
                  className="absolute inset-[-1px] rounded-[14px]"
                  style={{
                    background: "linear-gradient(180deg, color-mix(in srgb, var(--trainer) 26%, transparent), color-mix(in srgb, var(--trainer) 12%, transparent))",
                    boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, var(--trainer) 55%, transparent), 0 10px 22px -10px var(--trainer)",
                  }}
                  transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
                />
              )}
              {d.isToday && (
                <span className="absolute top-[6px] right-[7px] grid size-[6px] place-items-center">
                  <motion.span className="absolute inset-0 rounded-full" style={{ background: "var(--trainer)" }} animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
                  <span className="size-[6px] rounded-full" style={{ background: "var(--trainer)" }} />
                </span>
              )}
              <span className={`relative text-[10px] font-medium ${d.isPast && !isSel ? "text-muted/70" : "text-muted"}`}>{d.short}</span>
              <span className={`relative mt-[2px] text-[16px] leading-none font-extrabold tracking-[-0.02em] tabular-nums ${d.isPast && !isSel ? "text-ink/45" : ""}`}>{d.n}</span>
              <span className="relative mt-[5px] flex h-[4px] items-center gap-[3px]">
                {d.items.slice(0, 4).map((a, k) => (
                  <span key={k} className="size-[4px] rounded-full" style={{ background: d.isPast ? "var(--color-muted)" : appointmentColors[a.type].strong, opacity: d.isPast ? 0.5 : 1 }} />
                ))}
              </span>
            </Tag>
          );
        })}
      </motion.div>
    </div>
  );
}

// Una riga dell'agenda: orario grande, cliente, tipo e luogo. Il prossimo appuntamento ha un bordo che gira.
function AppointmentRow({ day, a, i, compact }: { day: WeekDay; a: Appointment; i: number; compact: boolean }) {
  const clientById = useTrovaCliente();
  const c = clientById(a.clientId);
  const colors = appointmentColors[a.type];
  const Icon = typeIcons[a.type];
  const { done, live, minutesTo } = statusOf(day, a);
  const imminent = !done && !live && minutesTo !== null && minutesTo > 0 && day.items.findIndex((x) => toMinutes(x.time) - toMinutes(trainer.now) > 0) === day.items.indexOf(a);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: done ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ delay: 0.04 + i * 0.05, duration: 0.35, ease: EASE_OUT }}
      whileHover={{ x: 2 }}
    >
      <Link href={ROUTES.cliente(a.clientId)} onClick={() => playSound("tap")} className={`relative block overflow-hidden rounded-[14px] ${imminent ? "p-[2px] shadow-[0_10px_24px_rgba(0,0,0,0.10)]" : ""}`}>
        {imminent && (
          <motion.span
            className="absolute inset-[-150%]"
            style={{ background: "conic-gradient(from 0deg, var(--trainer), transparent 30%, transparent 70%, var(--trainer))" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}
        <div
          className={`relative flex items-center gap-[9px] px-[10px] ${compact ? "h-[30px]" : "h-[40px]"} ${imminent ? "rounded-[12px]" : "rounded-[14px]"}`}
          style={{ background: imminent ? "var(--color-card)" : colors.bg }}
        >
          <div className="w-[40px] shrink-0 leading-none">
            <p className="text-[13px] font-extrabold tracking-[-0.02em] tabular-nums">{a.time}</p>
            {!compact && <p className="mt-[3px] text-[9.5px] font-medium text-ink/50">{duration(a.minutes)}</p>}
          </div>
          <span className={`w-[3px] shrink-0 rounded-full ${compact ? "h-[16px]" : "h-[22px]"}`} style={{ background: colors.strong }} />
          {c && <ClientAvatar c={c} size={compact ? 20 : 26} />}
          <div className="min-w-0 flex-1 leading-none">
            <p className="truncate text-[12px] font-bold">{c?.name}</p>
            {!compact && (
              <p className="mt-[3px] flex items-center gap-[4px] truncate text-[10px] text-ink/55">
                <Icon size={10} style={{ color: colors.strong }} /> {a.type} · {a.place}
              </p>
            )}
          </div>
          {done && (
            <span className="flex shrink-0 items-center gap-[3px] rounded-full bg-card px-[7px] py-[3px] text-[9.5px] font-semibold">
              <Check size={10} strokeWidth={3} /> Fatta
            </span>
          )}
          {live && <span className="btn-trainer shrink-0 rounded-full px-[8px] py-[4px] text-[9.5px] font-bold">In corso</span>}
          {imminent && <span className="btn-trainer shrink-0 rounded-full px-[8px] py-[4px] text-[9.5px] font-bold">tra {minutesTo} min</span>}
        </div>
      </Link>
    </motion.div>
  );
}

// Linea "adesso" fra gli appuntamenti già fatti e quelli che arrivano.
function NowDivider() {
  return (
    <motion.div layout="position" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }} className="flex origin-left items-center gap-[6px] px-[4px]">
      <span className="relative grid size-[7px] place-items-center">
        <motion.span className="absolute inset-0 rounded-full" style={{ background: "var(--trainer)" }} animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <span className="size-[7px] rounded-full" style={{ background: "var(--trainer)" }} />
      </span>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--trainer)" }}>
        Adesso {trainer.now}
      </span>
      <span className="h-[1.5px] flex-1 rounded-full" style={{ background: "color-mix(in srgb, var(--trainer) 45%, transparent)" }} />
    </motion.div>
  );
}

// Agenda della home: la settimana in lastre di vetro e, sotto, gli appuntamenti del giorno scelto.
// Niente griglia oraria da scorrere: una giornata intera si legge in un colpo d'occhio.
export function AgendaCard() {
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selected, setSelected] = useState(TODAY_INDEX);
  const sedute = useStato((s) => s.sedute);
  const { label, days } = weekOf(offset, sedute);
  const day = days[selected];
  const total = day.items.reduce((s, a) => s + a.minutes, 0);
  const now = toMinutes(trainer.now);
  const nowAt = day.isToday ? day.items.findIndex((a) => toMinutes(a.time) + a.minutes > now) : -1;
  // se gli appuntamenti del giorno non entrano, le righe si fanno più basse (senza tipo e luogo)
  const list = useRef<HTMLDivElement>(null);
  const density = useFitDensity(list, 1, [offset, selected, sedute]);

  const move = (step: number) => {
    const next = offset + step;
    setDirection(step);
    setOffset(next);
    setSelected(next === 0 ? TODAY_INDEX : 0);
  };

  return (
    <section id="agenda" className="flex min-h-0 flex-1 flex-col panel rounded-[18px] px-[14px] pt-[12px] pb-[12px]">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.calendario} onClick={() => playSound("tap")} className="group flex items-center gap-[6px] text-[14px] font-bold">
          Agenda <CalendarDays size={13} strokeWidth={2} className="text-ink/60" />
          <ChevronRight size={13} className="text-ink/35 transition-transform group-hover:translate-x-[2px]" />
        </Link>
        <WeekArrows label={label} onMove={move} size={24} className="text-[11px]" />
      </div>

      <div className="mt-[8px]">
        <GlassDays days={days} selected={selected} onSelect={setSelected} weekKey={offset} direction={direction} height={52} />
      </div>

      <div className="mt-[8px] flex items-center justify-between">
        <p className="text-[13px] font-bold">
          {day.long} {day.n}
        </p>
        <div className="flex gap-[5px] text-[10.5px] font-semibold">
          <span className="rounded-full bg-soft px-[8px] py-[3px]">{day.items.length ? conta(day.items.length, "appuntamento", "appuntamenti") : "Giornata libera"}</span>
          {total > 0 && <span className="rounded-full bg-soft px-[8px] py-[3px]">{duration(total)}</span>}
        </div>
      </div>

      <div ref={list} data-fit className="relative mt-[6px] flex min-h-0 flex-1 flex-col gap-[5px] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {day.items.length === 0 ? (
            <motion.div
              key={`vuoto-${offset}-${selected}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="flex flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-line text-center"
            >
              <p className="text-[13px] font-bold">Nessun appuntamento</p>
              <p className="mt-[3px] text-[11px] text-muted">Una giornata per recuperare, o per un cliente nuovo.</p>
              <Link href={ROUTES.calendario} onClick={() => playSound("tap")} className="btn-trainer mt-[10px] flex items-center gap-[5px] rounded-full px-[12px] py-[6px] text-[11px] font-semibold">
                <CalendarPlus size={12} /> Fissa una seduta
              </Link>
            </motion.div>
          ) : (
            day.items.flatMap((a, i) => {
              const row = <AppointmentRow key={`${offset}-${selected}-${a.time}-${a.clientId}`} day={day} a={a} i={i} compact={density > 0} />;
              return i === nowAt ? [<NowDivider key={`adesso-${offset}-${selected}`} />, row] : [row];
            })
          )}
        </AnimatePresence>
        {day.isToday && nowAt === -1 && day.items.length > 0 && <NowDivider />}
      </div>
    </section>
  );
}
