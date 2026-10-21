"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CirclePlus,
  Clock,
  EllipsisVertical,
  Funnel,
  Heart,
  Info,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  Reply,
  Users,
  Video,
} from "lucide-react";
import { Avatar, IconCircle, Pill } from "@/components/ui/basics";
import { CountUp, EASE_OUT, formatEuro, ProgressBar } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { alerts, calendarDays, DayKind, monthRows, pathCards, PathCard, trainer } from "@/libs/prototipo/dati-finti";

const card = "rounded-[18px] bg-white";

export function ProfileCard() {
  return (
    <section className={`${card} h-[153px] px-[16px] pt-[8px] pb-[9px]`}>
      <div className="flex items-center">
        <span className="grid size-[46px] shrink-0 place-items-center rounded-full border-[2px] border-[#f3a54a] bg-white p-[2px]">
          <Avatar initials={trainer.initials} size={38} tone={0} />
        </span>
        <div className="ml-[9px] leading-none">
          <p className="text-[15px] font-bold tracking-[-0.01em]">{trainer.name}</p>
          <p className="mt-[5px] text-[12px] text-muted">{trainer.role}</p>
        </div>
        <IconCircle icon={EllipsisVertical} label="Altro" size={25} iconSize={13} variant="outline" className="ml-auto" />
      </div>
      <div className="mt-[7px] flex gap-[4px]">
        <IconCircle icon={Mail} label="Email" variant="dark" />
        <IconCircle icon={Phone} label="Chiama" />
        <IconCircle icon={MessageCircle} label="Messaggi" />
        <IconCircle icon={Video} label="Videochiamata" />
      </div>
      <p className="mt-[8px] text-[11px] leading-none font-semibold">Sedute di oggi</p>
      <div className="mt-[7px] flex items-center justify-between">
        <Pill className="h-[24px] border border-line px-[10px] text-[11px] font-medium">
          {trainer.today} <CalendarDays size={12} strokeWidth={2} />
        </Pill>
        <Pill className="h-[24px] border border-line pr-[4px] pl-[11px] text-[11px] font-medium">
          Sedute
          <span className="grid size-[16px] place-items-center rounded-full bg-[#141416] text-[9.5px] font-bold text-white">{trainer.sessionsToday}</span>
        </Pill>
      </div>
    </section>
  );
}

const rowIcons = { users: Users, clock: Clock, info: Info, calendar: CalendarDays };

export function MonthCard() {
  return (
    <section className={`${card} flex h-full flex-col px-[15px] pt-[10px] pb-[10px]`}>
      <h2 className="text-[14px] font-bold">Il tuo mese</h2>
      <div className="mt-[7px] flex flex-1 flex-col justify-between">
        {monthRows.map((row, i) => {
          const Icon = row.right.kind === "icon" ? rowIcons[row.right.icon] : null;
          return (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.45, ease: EASE_OUT }}
              whileHover={{ x: 2 }}
              className="flex h-[38px] items-center gap-[9px] rounded-[10px] border border-line px-[10px]"
            >
              <CircleDot size={13} strokeWidth={2.4} className="shrink-0" />
              <div className="min-w-0 leading-none">
                <p className="text-[9px] text-muted">{row.label}</p>
                <p className="mt-[3px] truncate text-[12px] font-semibold">
                  <CountUp value={row.value} format={row.format === "euro" ? formatEuro : undefined} delay={0.35 + i * 0.07} />
                  {row.suffix}
                </p>
              </div>
              <div className="ml-auto">
                {row.right.kind === "badge" ? (
                  <span className="rounded-full border border-ok-line bg-ok-soft px-[8px] py-[2px] text-[10px] font-semibold text-ok">{row.right.text}</span>
                ) : (
                  <IconCircle icon={Icon} label={row.label} size={24} iconSize={12} variant="outline" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function PathHeader() {
  return (
    <div className="flex h-[24px] items-center justify-between">
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => playSound("tap")}
        className="flex h-[24px] w-[145px] cursor-pointer items-center justify-center gap-[6px] rounded-full bg-[#131313] text-[12px] font-semibold text-white"
      >
        Percorsi attivi <ChevronDown size={13} />
      </motion.button>
      <div className="flex gap-[8px]">
        <IconCircle icon={CirclePlus} label="Nuovo cliente" size={24} iconSize={13} variant="white" />
        <IconCircle icon={Funnel} label="Filtra" size={24} iconSize={12} variant="white" />
        <IconCircle icon={Heart} label="Preferiti" size={24} iconSize={12} variant="white" />
      </div>
    </div>
  );
}

const tones = {
  peach: { bg: "var(--color-peach)", strong: "var(--color-peach-strong)", track: "var(--color-peach-track)", sub: "#9b9184" },
  sky: { bg: "var(--color-sky)", strong: "var(--color-sky-strong)", track: "var(--color-sky-track)", sub: "#7f909b" },
  rose: { bg: "var(--color-rose)", strong: "var(--color-rose-strong)", track: "var(--color-rose-track)", sub: "#a08890" },
};

export function PathCardView({ data, i }: { data: PathCard; i: number }) {
  const tone = tones[data.tone];
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 + i * 0.06, duration: 0.55, ease: EASE_OUT }}
      whileHover={{ y: -3, boxShadow: "0 12px 26px rgba(0,0,0,0.08)" }}
      onClick={() => playSound("tap")}
      className="flex h-[121px] cursor-pointer flex-col rounded-[16px] px-[13px] pt-[10px] pb-[8px]"
      style={{ background: tone.bg }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/90 px-[7px] py-[2.5px] text-[9.5px] leading-none font-semibold text-ink/85">{data.since}</span>
        <EllipsisVertical size={13} className="text-ink/60" />
      </div>
      <div className="mt-[9px] flex items-center justify-between">
        <h3 className="text-[14px] leading-none font-bold">{data.client}</h3>
        <Info size={13} className="text-ink/45" />
      </div>
      <div className="mt-[8px] flex items-center justify-between">
        <p className="text-[11px] leading-none" style={{ color: tone.sub }}>
          {data.goal}
        </p>
        <span className="flex items-center gap-[5px] rounded-full bg-white px-[7px] py-[2.5px] text-[9.5px] leading-none">
          <b className="text-[10px]">
            <CountUp value={data.percent} delay={0.4 + i * 0.06} />%
          </b>
          <span className="text-ink/70">Obiettivo</span>
        </span>
      </div>
      <div className="mt-[9px]">
        <ProgressBar percent={data.percent} fill={tone.strong} track={tone.track} delay={0.4 + i * 0.06} />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center">
          {data.days.map((d, k) => (
            <span
              key={k}
              className="-ml-[5px] grid size-[18px] place-items-center rounded-full border-[1.5px] border-white text-[8px] font-bold text-white first:ml-0"
              style={{ background: tone.strong, opacity: 1 - k * 0.18 }}
            >
              {d}
            </span>
          ))}
          <span className="-ml-[4px] grid size-[14px] place-items-center rounded-full border border-white" style={{ background: tone.track, color: tone.strong }}>
            <Plus size={9} strokeWidth={3} />
          </span>
        </div>
        <span className="rounded-full bg-white px-[8px] py-[3px] text-[9.5px] leading-none font-medium text-ink/80">{data.left}</span>
      </div>
    </motion.article>
  );
}

export function PathCards() {
  return (
    <div className="mt-[8px] grid grid-cols-3 gap-[10px]">
      {pathCards.map((c, i) => (
        <PathCardView key={c.client} data={c} i={i} />
      ))}
    </div>
  );
}

const dayStyle: Record<DayKind, string> = {
  default: "bg-cal-default text-[#b3b6b8]",
  done: "bg-cal-done text-white",
  planned: "bg-cal-planned text-white",
  plannedLight: "bg-cal-planned-light text-white",
  check: "bg-cal-check text-white",
  payment: "bg-cal-payment text-white",
  event: "bg-cal-event text-white",
};

export function CalendarCard() {
  const [selected, setSelected] = useState(21);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section className={`${card} flex flex-col px-[15px] pt-[10px] pb-[12px]`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Calendario <CalendarDays size={13} strokeWidth={2} className="text-ink/70" />
        </h2>
        <IconCircle icon={EllipsisVertical} label="Altro" size={24} iconSize={12} variant="outline" />
      </div>
      <div className="mt-[3px] flex items-center justify-center">
        <IconCircle icon={ChevronLeft} label="Mese precedente" size={22} iconSize={12} variant="soft" />
        <span className="w-[94px] text-center text-[12px] font-semibold">Ottobre</span>
        <IconCircle icon={ChevronRight} label="Mese successivo" size={22} iconSize={12} variant="soft" />
      </div>
      <div className="grid flex-1 content-center">
        <div className="grid grid-cols-7 gap-x-[2.33px] gap-y-[2.6px]">
          {calendarDays.map(({ day, kind, tip }, i) => {
            const isSelected = day === selected;
            return (
              <div key={day} className="relative" onMouseEnter={() => setHover(day)} onMouseLeave={() => setHover(null)}>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.012, type: "spring", stiffness: 420, damping: 24 }}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    playSound("tap");
                    setSelected(day);
                  }}
                  className={`grid h-[24px] w-full cursor-pointer place-items-center rounded-[5px] text-[10px] font-medium transition-colors duration-200 ${
                    isSelected ? "bg-cal-selected text-white shadow-[inset_0_0_0_2px_#2b2b2b]" : dayStyle[kind]
                  }`}
                >
                  {day}
                </motion.button>
                <AnimatePresence>
                  {hover === day && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="pointer-events-none absolute bottom-[30px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-pill px-[9px] py-[4px] text-[10px] font-medium whitespace-nowrap text-white"
                    >
                      {day} ott · {tip}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AlertsCard() {
  return (
    <section className={`${card} flex flex-col px-[15px] pt-[11px] pb-[10px]`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Avvisi <MessageSquare size={13} strokeWidth={2} className="text-ink/70" />
        </h2>
        <button type="button" onClick={() => playSound("tap")} className="cursor-pointer text-[11px] font-semibold underline underline-offset-2">
          Vedi tutti
        </button>
      </div>
      <div className="mt-[7px] flex flex-1 flex-col justify-between">
        {alerts.map((a, i) => (
          <motion.div
            key={a.from}
            initial={{ opacity: 0, scale: a.urgent ? 0.94 : 1, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.08, duration: 0.5, ease: EASE_OUT }}
            whileHover={{ y: -2 }}
            onClick={() => playSound("tap")}
            className={`flex cursor-pointer items-center gap-[8px] px-[8px] ${
              a.urgent
                ? "-mx-[1px] h-[39px] rounded-[11px] bg-[#131411] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
                : "h-[38px] rounded-[10px] border border-line"
            }`}
          >
            <Avatar initials={a.initials} size={24} />
            <div className="min-w-0 leading-none">
              <p className="text-[11px] font-bold">{a.from}</p>
              <p className={`mt-[3px] truncate text-[9.5px] ${a.urgent ? "text-white/70" : "text-muted"}`}>{a.text}</p>
            </div>
            <Reply size={13} className={`ml-auto shrink-0 ${a.urgent ? "text-white/80" : "text-ink/50"}`} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
