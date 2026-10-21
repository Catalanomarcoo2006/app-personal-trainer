"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Dumbbell, Footprints, Video, type LucideIcon } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, Appointment, appointmentColors, AppointmentType, clientById, TODAY_INDEX, trainer, week } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";
import { ClientAvatar } from "./shared";

export const typeIcons: Record<AppointmentType, LucideIcon> = { Workout: Dumbbell, Valutazione: ClipboardCheck, Online: Video, Corsa: Footprints };

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const endTime = (a: Appointment) => {
  const end = toMinutes(a.time) + a.minutes;
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
};

const FIRST_HOUR = 7;
const LAST_HOUR = 21;
const HOUR_PX = 58;
const yOf = (minutes: number) => ((minutes - FIRST_HOUR * 60) / 60) * HOUR_PX;

// Blocco di un appuntamento nella linea del tempo. Il prossimo ha un bordo luminoso che gira.
export function AppointmentBlock({ a, i, done, imminent, compact = false }: { a: Appointment; i: number; done: boolean; imminent: boolean; compact?: boolean }) {
  const c = clientById(a.clientId);
  const colors = appointmentColors[a.type];
  const Icon = typeIcons[a.type];
  const height = (a.minutes / 60) * HOUR_PX - 4;
  const short = height < 44;
  const now = toMinutes(trainer.now);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: done ? 0.55 : 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: 0.08 + i * 0.07, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="absolute right-[4px] left-[50px]"
      style={{ top: yOf(toMinutes(a.time)) + 2, height }}
    >
      <Link
        href={ROUTES.cliente(a.clientId)}
        onClick={() => playSound("tap")}
        className={`relative block h-full overflow-hidden rounded-[14px] ${imminent ? "p-[2px] shadow-[0_12px_28px_rgba(0,0,0,0.12)]" : ""}`}
      >
        {imminent && (
          <motion.span
            className="absolute inset-[-60%]"
            style={{ background: "conic-gradient(from 0deg, var(--trainer), transparent 35%, transparent 65%, var(--trainer))" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
          />
        )}
        <div className={`relative flex h-full items-center gap-[9px] overflow-hidden px-[10px] ${imminent ? "rounded-[12px]" : "rounded-[14px]"}`} style={{ background: imminent ? "var(--color-card)" : colors.bg }}>
          <span className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: colors.strong }} />
          {c && <ClientAvatar c={c} size={short ? 22 : 28} />}
          <div className="min-w-0 flex-1 leading-none">
            <p className="truncate text-[12px] font-bold">
              {a.type} · {c?.name}
            </p>
            {!short && !compact && (
              <p className="mt-[4px] flex items-center gap-[4px] truncate text-[10px] text-ink/55">
                <Icon size={10} /> {a.time} – {endTime(a)} · {a.place}
              </p>
            )}
          </div>
          {done && (
            <span className="flex shrink-0 items-center gap-[3px] rounded-full bg-card px-[7px] py-[3px] text-[9.5px] font-semibold">
              <Check size={10} strokeWidth={3} /> Fatta
            </span>
          )}
          {imminent && (
            <span className="shrink-0 rounded-full px-[8px] py-[4px] text-[9.5px] font-bold text-white" style={{ background: "var(--trainer)" }}>
              tra {toMinutes(a.time) - now} min
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Linea "adesso": attraversa la giornata all'ora corrente e pulsa.
export function NowLine({ left = 0 }: { left?: number }) {
  const top = yOf(toMinutes(trainer.now));
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: EASE_OUT }}
      className="pointer-events-none absolute right-0 z-10 flex origin-left items-center"
      style={{ top: top - 1, left }}
    >
      <span className="relative grid size-[9px] place-items-center">
        <motion.span className="absolute inset-0 rounded-full" style={{ background: "var(--trainer)" }} animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <span className="size-[9px] rounded-full" style={{ background: "var(--trainer)" }} />
      </span>
      <span className="h-[2px] flex-1" style={{ background: "var(--trainer)" }} />
    </motion.div>
  );
}

export function HourGrid({ gutter = 44 }: { gutter?: number }) {
  return (
    <>
      {Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, k) => (
        <div key={k} className="absolute right-0 left-0 flex items-start" style={{ top: k * HOUR_PX }}>
          <span className="-mt-[6px] text-right text-[10px] text-muted tabular-nums" style={{ width: gutter - 8 }}>
            {String(FIRST_HOUR + k).padStart(2, "0")}:00
          </span>
          <span className="ml-[8px] flex-1 border-t border-dashed border-line" />
        </div>
      ))}
    </>
  );
}

export const TIMELINE_HEIGHT = (LAST_HOUR - FIRST_HOUR) * HOUR_PX;
export const scrollTargetFor = (minutes: number) => Math.max(0, yOf(minutes) - HOUR_PX * 0.6);

export function AgendaCard() {
  const [day, setDay] = useState(TODAY_INDEX);
  const items = agenda[day];
  const now = toMinutes(trainer.now);
  const isToday = day === TODAY_INDEX;
  const nextIndex = isToday ? items.findIndex((a) => toMinutes(a.time) > now) : -1;
  const total = items.reduce((s, a) => s + a.minutes, 0);
  const scroller = useRef<HTMLDivElement>(null);

  // All'apertura e a ogni cambio di giorno la linea del tempo scorre fino al momento giusto.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = isToday ? now - 60 : items.length ? toMinutes(items[0].time) : 8 * 60;
    const t = window.setTimeout(() => el.scrollTo({ top: scrollTargetFor(target), behavior: "smooth" }), 450);
    return () => window.clearTimeout(t);
  }, [day, isToday, items, now]);

  return (
    <section id="agenda" className="flex min-h-0 flex-1 flex-col rounded-[18px] bg-card px-[15px] pt-[12px] pb-[10px]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Agenda <CalendarDays size={13} strokeWidth={2} className="text-ink/60" />
        </h2>
        <div className="flex items-center gap-[4px]">
          <IconCircle icon={ChevronLeft} label="Settimana precedente" size={24} iconSize={12} variant="soft" />
          <Link href={ROUTES.calendario} onClick={() => playSound("tap")} className="px-[4px] text-[11px] font-semibold hover:underline">
            19 – 25 ottobre
          </Link>
          <IconCircle icon={ChevronRight} label="Settimana successiva" size={24} iconSize={12} variant="soft" />
        </div>
      </div>

      <div className="mt-[10px] grid grid-cols-7 gap-[5px]">
        {week.map((d, i) => {
          const selected = i === day;
          const load = Math.min(agenda[i].length / 4, 1);
          return (
            <motion.button
              key={d.n}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => {
                playSound("tap");
                setDay(i);
              }}
              className={`relative flex h-[56px] cursor-pointer flex-col items-center justify-center gap-[4px] rounded-[14px] transition-colors duration-200 ${
                selected ? "text-on-contrast" : "bg-soft text-ink"
              }`}
            >
              {selected && <motion.span layoutId="giorno-agenda" className="absolute inset-0 rounded-[14px] bg-contrast" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              {i === TODAY_INDEX && (
                <motion.span
                  className="absolute top-[6px] right-[7px] size-[5px] rounded-full"
                  style={{ background: "var(--trainer)" }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
              <span className={`relative text-[10px] ${selected ? "opacity-60" : "text-muted"}`}>{d.short}</span>
              <span className="relative text-[15px] leading-none font-bold">{d.n}</span>
              <span className={`relative h-[3px] w-[22px] overflow-hidden rounded-full ${selected ? "bg-on-contrast/20" : "bg-line"}`}>
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: "var(--trainer)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${load * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: EASE_OUT }}
                />
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-[11px] flex items-center justify-between">
        <p className="text-[13px] font-bold">
          {week[day].long} {week[day].n}
        </p>
        <div className="flex gap-[5px] text-[10.5px] font-semibold">
          <span className="rounded-full bg-soft px-[8px] py-[3px]">
            {items.length ? `${items.length} appuntament${items.length === 1 ? "o" : "i"}` : "Giornata libera"}
          </span>
          {total > 0 && (
            <span className="rounded-full bg-soft px-[8px] py-[3px]">
              {Math.floor(total / 60)} h {total % 60 ? `${total % 60} min` : ""}
            </span>
          )}
          {isToday && (
            <span className="flex items-center gap-[5px] rounded-full px-[8px] py-[3px] text-white" style={{ background: "var(--trainer)" }}>
              Adesso {trainer.now}
            </span>
          )}
        </div>
      </div>

      <div ref={scroller} className="relative mt-[8px] min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
        <div className="relative" style={{ height: TIMELINE_HEIGHT + 8 }}>
          <HourGrid />
          <AnimatePresence>
            {items.map((a, i) => (
              <AppointmentBlock
                key={`${day}-${a.time}-${a.clientId}`}
                a={a}
                i={i}
                done={isToday && toMinutes(a.time) + a.minutes <= now}
                imminent={i === nextIndex}
              />
            ))}
          </AnimatePresence>
          {isToday && <NowLine left={40} />}
        </div>
      </div>
    </section>
  );
}
