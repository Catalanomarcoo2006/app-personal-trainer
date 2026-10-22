"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { CalendarPlus, Check, Plus, X } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { Appointment, appointmentColors, AppointmentType, clientById, clients, trainer } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./nav";
import { ClientAvatar } from "./shared";
import { useFitDensity } from "./fit";
import { duration, endTime, GlassDays, statusOf, toMinutes, typeIcons, WeekArrows, weekOf, WeekDay } from "./Agenda";

const types = Object.keys(appointmentColors) as AppointmentType[];

// Una seduta nella colonna del giorno. density: 0 completa, 1 senza tipo e luogo, 2 una riga sola.
function SessionCard({ day, a, i, col, density }: { day: WeekDay; a: Appointment; i: number; col: number; density: number }) {
  const c = clientById(a.clientId);
  const colors = appointmentColors[a.type];
  const Icon = typeIcons[a.type];
  const { done, live } = statusOf(day, a);
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: done ? 0.55 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ delay: 0.05 + col * 0.03 + i * 0.04, duration: 0.35, ease: EASE_OUT }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={ROUTES.cliente(a.clientId)}
        onClick={() => playSound("tap")}
        title={`${a.time} – ${endTime(a)} · ${c?.name ?? ""} · ${a.place}`}
        className={`relative block overflow-hidden rounded-[12px] px-[9px] transition-shadow hover:shadow-[0_10px_22px_rgba(0,0,0,0.10)] ${density === 2 ? "py-[9px]" : "pt-[7px] pb-[8px]"}`}
        style={{ background: colors.bg }}
      >
        <span className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: colors.strong }} />
        {density === 2 ? (
          <p className="flex min-w-0 items-center gap-[5px] leading-none">
            <span className="shrink-0 text-[10px] font-bold tabular-nums" style={{ color: colors.strong }}>
              {a.time}
            </span>
            {c && <ClientAvatar c={c} size={18} />}
            <span className="truncate text-[12px] font-bold">{c?.name.split(" ")[0]}</span>
            {done && <Check size={10} strokeWidth={3} className="ml-auto shrink-0 text-ink/50" />}
            {live && <span className="btn-trainer ml-auto shrink-0 rounded-full px-[5px] py-[1px] text-[8.5px]">ora</span>}
          </p>
        ) : (
          <>
            <p className="flex items-center gap-[4px] text-[10px] font-bold tabular-nums" style={{ color: colors.strong }}>
              <Icon size={10} /> {a.time} – {endTime(a)}
              {done && <Check size={10} strokeWidth={3} className="ml-auto text-ink/50" />}
              {live && <span className="btn-trainer ml-auto rounded-full px-[5px] py-[1px] text-[8.5px]">ora</span>}
            </p>
            <p className="mt-[5px] flex min-w-0 items-center gap-[6px]">
              {c && <ClientAvatar c={c} size={20} />}
              <span className="truncate text-[12px] font-bold">{c?.name.split(" ")[0]}</span>
            </p>
            {density === 0 && (
              <p className="mt-[4px] truncate text-[10px] text-ink/55">
                {a.type} · {a.place}
              </p>
            )}
          </>
        )}
      </Link>
    </motion.div>
  );
}

// Tempo libero fra due sedute, solo se è almeno un'ora e mezza.
function FreeGap({ minutes }: { minutes: number }) {
  if (minutes < 90) return null;
  return (
    <div className="flex items-center gap-[5px] px-[4px] text-[9.5px] font-medium text-muted">
      <span className="h-px flex-1 border-t border-dashed border-line" />
      libero {duration(minutes)}
      <span className="h-px flex-1 border-t border-dashed border-line" />
    </div>
  );
}

function NowMark() {
  return (
    <div className="flex items-center gap-[5px] px-[2px]">
      <span className="relative grid size-[7px] place-items-center">
        <motion.span className="absolute inset-0 rounded-full" style={{ background: "var(--trainer)" }} animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <span className="size-[7px] rounded-full" style={{ background: "var(--trainer)" }} />
      </span>
      <span className="text-[9.5px] font-bold tabular-nums" style={{ color: "var(--trainer)" }}>
        {trainer.now}
      </span>
      <span className="h-[1.5px] flex-1 rounded-full" style={{ background: "color-mix(in srgb, var(--trainer) 45%, transparent)" }} />
    </div>
  );
}

// Finestra per fissare una seduta nuova.
function NewSession({ days, initialDay, onClose, onSave }: { days: WeekDay[]; initialDay: number; onClose: () => void; onSave: (day: number, a: Appointment) => void }) {
  const [day, setDay] = useState(initialDay);
  const [clientId, setClientId] = useState(clients[0].id);
  const [time, setTime] = useState("17:00");
  const [type, setType] = useState<AppointmentType>("Workout");
  const [minutes, setMinutes] = useState(60);
  const field = "h-[36px] w-full rounded-[11px] border border-line bg-card px-[10px] text-[12.5px] outline-none focus:border-[var(--trainer)]";

  return (
    <motion.div className="absolute inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <button type="button" aria-label="Chiudi" onClick={onClose} className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-[5px]" />
      <motion.form
        role="dialog"
        aria-label="Nuova seduta"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        onSubmit={(e) => {
          e.preventDefault();
          const place = type === "Online" ? "Videochiamata" : type === "Corsa" ? "Parco di Meolo" : "Fit Lab, Meolo";
          onSave(day, { time, minutes, clientId, type, place });
        }}
        className="absolute top-[30px] left-1/2 w-[420px] -translate-x-1/2 rounded-[22px] bg-card p-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">Nuova seduta</p>
          <button type="button" aria-label="Chiudi" onClick={onClose} className="grid size-[26px] cursor-pointer place-items-center rounded-full bg-soft">
            <X size={13} />
          </button>
        </div>

        <p className="mt-[14px] mb-[6px] text-[11px] font-semibold text-muted">Giorno</p>
        <div className="grid grid-cols-7 gap-[5px]">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setDay(i)}
              className={`flex cursor-pointer flex-col items-center rounded-[11px] py-[6px] leading-none ${i === day ? "sel-trainer" : "bg-soft"}`}
            >
              <span className="text-[9.5px] text-muted">{d.short}</span>
              <span className="mt-[3px] text-[14px] font-bold">{d.n}</span>
            </button>
          ))}
        </div>

        <div className="mt-[12px] grid grid-cols-[1fr_110px] gap-[10px]">
          <label className="block">
            <span className="mb-[6px] block text-[11px] font-semibold text-muted">Cliente</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={field}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-[6px] block text-[11px] font-semibold text-muted">Ora</span>
            <input type="time" value={time} step={900} required onChange={(e) => setTime(e.target.value)} className={field} />
          </label>
        </div>

        <p className="mt-[12px] mb-[6px] text-[11px] font-semibold text-muted">Tipo e durata</p>
        <div className="flex flex-wrap gap-[6px]">
          {types.map((t) => {
            const Icon = typeIcons[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex cursor-pointer items-center gap-[5px] rounded-full px-[10px] py-[6px] text-[11.5px] font-semibold ${t === type ? "sel-trainer" : "bg-soft text-ink/70"}`}
              >
                <Icon size={12} style={{ color: appointmentColors[t].strong }} /> {t}
              </button>
            );
          })}
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="ml-auto h-[30px] rounded-full border border-line bg-card px-[10px] text-[11.5px] font-semibold outline-none">
            {[30, 40, 45, 50, 60, 90].map((m) => (
              <option key={m} value={m}>
                {duration(m)}
              </option>
            ))}
          </select>
        </div>

        <motion.button type="submit" whileTap={{ scale: 0.97 }} className="btn-trainer mt-[18px] flex h-[40px] w-full cursor-pointer items-center justify-center gap-[6px] rounded-full text-[13px] font-semibold">
          <CalendarPlus size={14} /> Fissa la seduta
        </motion.button>
      </motion.form>
    </motion.div>
  );
}

// Calendario della settimana: una colonna per giorno, le sedute in fila per orario. Tutto in vista, niente da scorrere.
export function WeekCalendar() {
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const [hidden, setHidden] = useState<AppointmentType[]>([]);
  const [added, setAdded] = useState<Record<string, Appointment[]>>({});
  const [creating, setCreating] = useState<number | null>(null);

  const week = weekOf(offset);
  const days = week.days.map((d, i) => ({
    ...d,
    items: [...d.items, ...(added[`${offset}-${i}`] ?? [])].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)),
  }));
  const total = days.reduce((s, d) => s + d.items.length, 0);
  const todayIndex = days.findIndex((d) => d.isToday);
  const now = toMinutes(trainer.now);
  // se in una colonna le sedute non entrano, tutte le schede diventano più compatte (prima senza luogo, poi su una riga)
  const board = useRef<HTMLDivElement>(null);
  const density = useFitDensity(board, 2, [offset, hidden, added]);

  const move = (step: number) => {
    setDirection(step);
    setOffset((o) => o + step);
  };

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] pr-[18px] pl-[80px]">
      <section className="flex h-full min-h-0 flex-col rounded-[18px] bg-card px-[16px] pt-[14px] pb-[14px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <WeekArrows label={`${week.label} 2026`} onMove={move} size={30} className="text-[15px] font-bold" />
            <span className="rounded-full bg-soft px-[10px] py-[5px] text-[11px] font-semibold">{total} sedute</span>
            {offset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  playSound("tap");
                  setDirection(-Math.sign(offset));
                  setOffset(0);
                }}
                className="cursor-pointer rounded-full px-[10px] py-[5px] text-[11px] font-semibold underline underline-offset-2"
              >
                Torna a oggi
              </button>
            )}
          </div>
          <div className="flex items-center gap-[6px]">
            {types.map((t) => {
              const off = hidden.includes(t);
              const Icon = typeIcons[t];
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={!off}
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
                setCreating(todayIndex >= 0 ? todayIndex : 0);
              }}
              className="btn-trainer ml-[6px] flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full px-[14px] text-[12px] font-semibold"
            >
              <CalendarPlus size={13} /> Nuova seduta
            </motion.button>
          </div>
        </div>

        <div className="mt-[12px]">
          <GlassDays days={days} selected={todayIndex >= 0 ? todayIndex : null} weekKey={offset} direction={direction} height={64} />
        </div>

        <div ref={board} className="mt-[8px] min-h-0 flex-1">
          <motion.div
            key={offset}
            initial={{ opacity: 0, x: direction * 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="grid h-full grid-cols-7 gap-[6px] px-[6px]"
          >
          {days.map((d, di) => {
            const shown = d.items.filter((a) => !hidden.includes(a.type));
            const nowAt = d.isToday ? shown.findIndex((a) => toMinutes(a.time) + a.minutes > now) : -2;
            return (
              <div
                key={di}
                data-fit
                className={`relative flex min-h-0 flex-col overflow-hidden rounded-[14px] p-[5px] ${density ? "gap-[4px]" : "gap-[6px]"}`}
                style={d.isToday ? { background: "color-mix(in srgb, var(--trainer) 6%, transparent)" } : undefined}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {shown.flatMap((a, i) => {
                    const prev = shown[i - 1];
                    const gap = prev ? toMinutes(a.time) - (toMinutes(prev.time) + prev.minutes) : 0;
                    const out = [];
                    if (prev && density === 0) out.push(<FreeGap key={`gap-${a.time}`} minutes={gap} />);
                    if (i === nowAt) out.push(<NowMark key="adesso" />);
                    out.push(<SessionCard key={`${a.time}-${a.clientId}`} day={d} a={a} i={i} col={di} density={density} />);
                    return out;
                  })}
                </AnimatePresence>
                {d.isToday && nowAt === -1 && shown.length > 0 && <NowMark />}
                {shown.length === 0 && (
                  <>
                    <p className="mt-[14px] text-center text-[11px] font-medium text-muted">Libero</p>
                    <button
                      type="button"
                      aria-label={`Nuova seduta ${d.long} ${d.n}`}
                      onClick={() => {
                        playSound("tap");
                        setCreating(di);
                      }}
                      className="flex h-[30px] shrink-0 cursor-pointer items-center justify-center gap-[4px] rounded-[11px] border border-dashed border-line text-[10.5px] font-semibold text-muted transition-colors hover:border-[var(--trainer)] hover:text-ink"
                    >
                      <Plus size={11} /> Aggiungi
                    </button>
                  </>
                )}
              </div>
            );
          })}
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {creating !== null && (
          <NewSession
            days={days}
            initialDay={creating}
            onClose={() => setCreating(null)}
            onSave={(day, a) => {
              setAdded((s) => ({ ...s, [`${offset}-${day}`]: [...(s[`${offset}-${day}`] ?? []), a] }));
              setCreating(null);
              playSound("confirm");
              toast.success(`Seduta fissata: ${days[day].long} ${days[day].n} alle ${a.time}`);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
