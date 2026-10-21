"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, appointmentColors, AppointmentType, clientById, TODAY_INDEX, trainer, week } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";
import { ClientAvatar } from "./shared";
import { endTime, HourGrid, scrollTargetFor, TIMELINE_HEIGHT, toMinutes, typeIcons } from "./Agenda";

const HOUR_PX = 58; // stessa scala dell'agenda della home
const FIRST = 7 * 60;
const GUTTER = 52;
const yOf = (m: number) => ((m - FIRST) / 60) * HOUR_PX;

const types = Object.keys(appointmentColors) as AppointmentType[];

export function WeekCalendar() {
  const scroller = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<AppointmentType[]>([]);
  const now = toMinutes(trainer.now);
  const total = agenda.flat().length;

  useEffect(() => {
    const t = window.setTimeout(() => scroller.current?.scrollTo({ top: scrollTargetFor(8 * 60), behavior: "smooth" }), 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] pr-[18px] pl-[80px]">
      <section className="flex h-full min-h-0 flex-col rounded-[18px] bg-card px-[16px] pt-[14px] pb-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <IconCircle icon={ChevronLeft} label="Settimana precedente" size={30} variant="soft" />
            <p className="px-[4px] text-[15px] font-bold">19 – 25 ottobre 2026</p>
            <IconCircle icon={ChevronRight} label="Settimana successiva" size={30} variant="soft" />
            <span className="ml-[6px] rounded-full bg-soft px-[10px] py-[5px] text-[11px] font-semibold">{total} appuntamenti</span>
          </div>
          <div className="flex items-center gap-[6px]">
            {types.map((t) => {
              const off = hidden.includes(t);
              const Icon = typeIcons[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    playSound("tap");
                    setHidden((h) => (off ? h.filter((x) => x !== t) : [...h, t]));
                  }}
                  className={`flex cursor-pointer items-center gap-[5px] rounded-full px-[10px] py-[5px] text-[11px] font-semibold transition-opacity ${off ? "opacity-40" : ""}`}
                  style={{ background: appointmentColors[t].bg }}
                >
                  <Icon size={11} style={{ color: appointmentColors[t].strong }} /> {t}
                </button>
              );
            })}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound("tap");
                toast("Scegli un orario libero nella griglia", { icon: "🗓️" });
              }}
              className="ml-[6px] flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full bg-contrast px-[14px] text-[12px] font-semibold text-on-contrast"
            >
              <CalendarPlus size={13} /> Nuova seduta
            </motion.button>
          </div>
        </div>

        <div className="mt-[14px] grid grid-cols-7 gap-[6px]" style={{ marginLeft: GUTTER }}>
          {week.map((d, i) => (
            <div
              key={d.n}
              className={`flex items-center justify-center gap-[8px] rounded-[12px] border py-[8px] ${i === TODAY_INDEX ? "" : "border-transparent bg-soft"}`}
              style={i === TODAY_INDEX ? { background: "color-mix(in srgb, var(--trainer) 13%, var(--color-card))", borderColor: "color-mix(in srgb, var(--trainer) 35%, transparent)" } : undefined}
            >
              <span className="text-[11px] text-muted">{d.long.slice(0, 3)}</span>
              <span className="text-[15px] font-bold">{d.n}</span>
              {agenda[i].length > 0 && (
                <span className="grid size-[17px] place-items-center rounded-full text-[9.5px] font-bold text-white" style={{ background: "var(--trainer)" }}>
                  {agenda[i].length}
                </span>
              )}
            </div>
          ))}
        </div>

        <div ref={scroller} className="relative mt-[8px] min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
          <div className="relative" style={{ height: TIMELINE_HEIGHT + 10 }}>
            <HourGrid gutter={GUTTER} />
            <div className="absolute inset-y-0 right-0 grid grid-cols-7 gap-[6px]" style={{ left: GUTTER }}>
              {week.map((d, di) => (
                <div key={d.n} className={`relative rounded-[12px] ${di === TODAY_INDEX ? "bg-soft/60" : ""}`}>
                  {agenda[di]
                    .filter((a) => !hidden.includes(a.type))
                    .map((a, i) => {
                      const c = clientById(a.clientId);
                      const col = appointmentColors[a.type];
                      const Icon = typeIcons[a.type];
                      const done = di < TODAY_INDEX || (di === TODAY_INDEX && toMinutes(a.time) + a.minutes <= now);
                      const h = (a.minutes / 60) * HOUR_PX - 4;
                      return (
                        <motion.div
                          key={a.time + a.clientId}
                          initial={{ opacity: 0, y: 12, scale: 0.94 }}
                          animate={{ opacity: done ? 0.55 : 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.15 + di * 0.05 + i * 0.04, type: "spring", stiffness: 260, damping: 24 }}
                          whileHover={{ scale: 1.03, zIndex: 5 }}
                          className="absolute right-[3px] left-[3px]"
                          style={{ top: yOf(toMinutes(a.time)) + 2, height: h }}
                        >
                          <Link
                            href={ROUTES.cliente(a.clientId)}
                            onClick={() => playSound("tap")}
                            className="relative flex h-full flex-col overflow-hidden rounded-[11px] px-[8px] py-[6px] hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                            style={{ background: col.bg }}
                          >
                            <span className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: col.strong }} />
                            <span className="flex items-center gap-[5px] text-[10px] font-semibold" style={{ color: col.strong }}>
                              <Icon size={10} /> {a.time} – {endTime(a)}
                            </span>
                            <span className="mt-[3px] flex min-w-0 items-center gap-[5px]">
                              {c && <ClientAvatar c={c} size={18} />}
                              <span className="truncate text-[11px] font-bold">{c?.name.split(" ")[0]}</span>
                            </span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  {di === TODAY_INDEX && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.6, ease: EASE_OUT }}
                      className="pointer-events-none absolute right-0 left-0 z-10 flex origin-left items-center"
                      style={{ top: yOf(now) - 1 }}
                    >
                      <span className="relative grid size-[9px] place-items-center">
                        <motion.span className="absolute inset-0 rounded-full" style={{ background: "var(--trainer)" }} animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <span className="size-[9px] rounded-full" style={{ background: "var(--trainer)" }} />
                      </span>
                      <span className="h-[2px] flex-1" style={{ background: "var(--trainer)" }} />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
