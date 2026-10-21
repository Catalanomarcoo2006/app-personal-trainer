"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Dumbbell, Footprints, Video, type LucideIcon } from "lucide-react";
import { Avatar, IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, appointmentColors, AppointmentType, clientById, TODAY_INDEX, trainer, week } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";

const typeIcons: Record<AppointmentType, LucideIcon> = { Workout: Dumbbell, Valutazione: ClipboardCheck, Online: Video, Corsa: Footprints };

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function AgendaCard() {
  const [day, setDay] = useState(TODAY_INDEX);
  const items = agenda[day];
  const now = minutes(trainer.now);
  const isToday = day === TODAY_INDEX;
  const nextIndex = isToday ? items.findIndex((a) => minutes(a.time) > now) : -1;

  return (
    <section id="agenda" className="flex min-h-0 flex-1 flex-col rounded-[18px] bg-white px-[15px] pt-[11px] pb-[12px]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Agenda <CalendarDays size={13} strokeWidth={2} className="text-ink/70" />
        </h2>
        <div className="flex items-center gap-[4px]">
          <IconCircle icon={ChevronLeft} label="Settimana precedente" size={22} iconSize={12} variant="soft" />
          <span className="px-[4px] text-[11px] font-semibold">19 – 25 ottobre</span>
          <IconCircle icon={ChevronRight} label="Settimana successiva" size={22} iconSize={12} variant="soft" />
        </div>
      </div>

      <div className="mt-[10px] grid grid-cols-7 gap-[5px]">
        {week.map((d, i) => {
          const selected = i === day;
          const count = agenda[i].length;
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
              className={`relative flex h-[56px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[14px] transition-colors duration-200 ${
                selected ? "text-white" : "bg-cal-default text-ink"
              }`}
            >
              {selected && <motion.span layoutId="giorno-agenda" className="absolute inset-0 rounded-[14px] bg-[#131313]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              {!selected && i === TODAY_INDEX && <span className="absolute inset-0 rounded-[14px] shadow-[inset_0_0_0_1.5px_var(--trainer)]" />}
              <span className={`relative text-[10px] ${selected ? "text-white/60" : "text-muted"}`}>{d.short}</span>
              <span className="relative text-[15px] leading-none font-bold">{d.n}</span>
              <span className="relative flex h-[4px] gap-[2px]">
                {Array.from({ length: Math.min(count, 4) }, (_, k) => (
                  <span key={k} className="size-[4px] rounded-full" style={{ background: selected ? "var(--trainer)" : "#b9bdc0" }} />
                ))}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-[12px] flex items-center justify-between">
        <p className="text-[13px] font-bold">
          {week[day].long} {week[day].n} ottobre
          <span className="ml-[6px] text-[11px] font-medium text-muted">
            {items.length ? `${items.length} appuntament${items.length === 1 ? "o" : "i"}` : "nessun appuntamento"}
          </span>
        </p>
        {isToday && (
          <span className="flex items-center gap-[5px] rounded-full bg-soft px-[9px] py-[3px] text-[10.5px] font-semibold">
            <motion.span className="size-[6px] rounded-full" style={{ background: "var(--trainer)" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            Adesso {trainer.now}
          </span>
        )}
      </div>

      <div className="relative mt-[8px] min-h-0 flex-1 overflow-y-auto pr-[2px] [scrollbar-width:none]">
        <AnimatePresence mode="wait">
          <motion.ol
            key={day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex flex-col"
          >
            {items.length === 0 && (
              <li className="mt-[30px] text-center text-[12px] text-muted">Giornata libera: nessun cliente in agenda.</li>
            )}
            {items.map((a, i) => {
              const c = clientById(a.clientId);
              const colors = appointmentColors[a.type];
              const Icon = typeIcons[a.type];
              const done = isToday && minutes(a.time) + a.minutes <= now;
              const imminent = i === nextIndex;
              const lastItem = i === items.length - 1;
              return (
                <motion.li
                  key={a.time + a.clientId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                  className="flex gap-[10px]"
                >
                  <div className="w-[38px] shrink-0 pt-[9px] text-right leading-none">
                    <p className="text-[12px] font-bold tabular-nums">{a.time}</p>
                    <p className="mt-[3px] text-[9.5px] text-muted">{a.minutes}′</p>
                  </div>
                  <div className="relative flex w-[10px] shrink-0 justify-center">
                    <span className="mt-[12px] size-[9px] rounded-full border-2 bg-white" style={{ borderColor: colors.strong }} />
                    {!lastItem && <span className="absolute top-[24px] bottom-[-4px] w-[1.5px] bg-line" />}
                  </div>
                  <Link
                    href={ROUTES.cliente(a.clientId)}
                    onClick={() => playSound("tap")}
                    className={`group mb-[8px] flex min-w-0 flex-1 items-center gap-[9px] rounded-[13px] px-[10px] py-[8px] transition-transform duration-200 hover:-translate-y-[1.5px] ${
                      done ? "opacity-55" : ""
                    } ${imminent ? "shadow-[0_10px_24px_rgba(255,107,44,0.22)]" : ""}`}
                    style={{ background: colors.bg }}
                  >
                    {c && <Avatar initials={c.initials} size={30} />}
                    <div className="min-w-0 flex-1 leading-none">
                      <p className="truncate text-[12.5px] font-bold">
                        {a.type} con <span className="underline-offset-2 group-hover:underline">{c?.name}</span>
                      </p>
                      <p className="mt-[4px] flex items-center gap-[4px] truncate text-[10px] text-ink/55">
                        <Icon size={10} /> {a.place}
                      </p>
                    </div>
                    {done && (
                      <span className="flex items-center gap-[3px] rounded-full bg-white px-[7px] py-[3px] text-[9.5px] font-semibold">
                        <Check size={10} strokeWidth={3} /> Fatta
                      </span>
                    )}
                    {imminent && (
                      <span className="relative flex items-center rounded-full bg-[#131313] px-[8px] py-[4px] text-[9.5px] font-bold text-white">
                        <motion.span
                          className="absolute inset-0 rounded-full border-2"
                          style={{ borderColor: "var(--trainer)" }}
                          animate={{ scale: [1, 1.18], opacity: [0.9, 0] }}
                          transition={{ duration: 1.3, repeat: Infinity }}
                        />
                        tra {minutes(a.time) - now} min
                      </span>
                    )}
                    {!done && !imminent && <ChevronRight size={14} className="text-ink/35 transition-transform group-hover:translate-x-[2px]" />}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ol>
        </AnimatePresence>
      </div>
    </section>
  );
}
