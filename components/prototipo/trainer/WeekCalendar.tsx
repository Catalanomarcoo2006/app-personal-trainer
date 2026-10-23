"use client";

import { ReactNode, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { CalendarClock, CalendarPlus, Check, MapPin, MessageCircle, Plus, Trash2, UserRound, X } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { conta } from "@/libs/ui/testo";
import { Appointment, appointmentColors, AppointmentType, clientById, clients, trainer } from "@/libs/prototipo/dati-finti";
import { navigate, ROUTES } from "./nav";
import { ClientAvatar } from "./shared";
import { useFitDensity } from "./fit";
import { duration, endTime, GlassDays, statusOf, toMinutes, typeIcons, WeekArrows, weekOf, WeekDay } from "./Agenda";

const types = Object.keys(appointmentColors) as AppointmentType[];

// Le tre fasce della giornata: le righe della griglia. "start" è l'orario proposto quando si clicca una cella vuota.
const BANDS = [
  { label: "Mattina", hint: "fino alle 12", until: 12 * 60, start: "09:00" },
  { label: "Pomeriggio", hint: "12 – 17", until: 17 * 60, start: "14:00" },
  { label: "Sera", hint: "dalle 17", until: 24 * 60, start: "18:00" },
];
const bandOf = (a: Appointment) => BANDS.findIndex((b) => toMinutes(a.time) < b.until);

const placeFor = (type: AppointmentType) => (type === "Online" ? "Videochiamata" : type === "Corsa" ? "Parco di Meolo" : "Fit Lab, Meolo");

// Una seduta nella cella (il tipo lo dicono icona e colore). density: 0 completa, 1 senza luogo, 2 una riga sola. Al clic apre il dettaglio.
function SessionCard({ day, a, i, density, onOpen }: { day: WeekDay; a: Appointment; i: number; density: number; onOpen: () => void }) {
  const c = clientById(a.clientId);
  const colors = appointmentColors[a.type];
  const Icon = typeIcons[a.type];
  const { done, live } = statusOf(day, a);
  return (
    <motion.button
      type="button"
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: done ? 0.6 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ delay: 0.04 + i * 0.04, duration: 0.3, ease: EASE_OUT }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        playSound("tap");
        onOpen();
      }}
      title={`${a.time} – ${endTime(a)} · ${c?.name ?? ""} · ${a.place}`}
      className={`relative z-10 block w-full shrink-0 cursor-pointer overflow-hidden rounded-[11px] px-[9px] text-left transition-shadow hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)] ${density === 2 ? "py-[8px]" : density === 1 ? "py-[6px]" : "pt-[7px] pb-[8px]"}`}
      style={{ background: colors.bg }}
    >
      <span className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: colors.strong }} />
      {density === 2 ? (
        <span className="flex min-w-0 items-center gap-[5px] leading-none">
          <span className="shrink-0 text-[10px] font-bold tabular-nums" style={{ color: colors.strong }}>
            {a.time}
          </span>
          {c && <ClientAvatar c={c} size={18} />}
          <span className="truncate text-[12px] font-bold">{c?.name.split(" ")[0]}</span>
          {live && <span className="btn-trainer ml-auto shrink-0 rounded-full px-[5px] py-[1px] text-[8.5px]">ora</span>}
        </span>
      ) : (
        <>
          <span className="flex items-center gap-[4px] text-[10px] leading-none font-bold tabular-nums" style={{ color: colors.strong }}>
            <Icon size={10} /> {a.time} – {endTime(a)}
            {done && <Check size={10} strokeWidth={3} className="ml-auto text-ink/50" />}
            {live && <span className="btn-trainer ml-auto rounded-full px-[5px] py-[1px] text-[8.5px]">ora</span>}
          </span>
          <span className={`flex min-w-0 items-center gap-[6px] ${density === 1 ? "mt-[4px]" : "mt-[5px]"}`}>
            {c && <ClientAvatar c={c} size={density === 1 ? 18 : 20} />}
            <span className="truncate text-[12px] font-bold">{c?.name.split(" ")[0]}</span>
          </span>
          {density === 0 && (
            <span className="mt-[4px] block truncate text-[10px] text-ink/55">{a.place}</span>
          )}
        </>
      )}
    </motion.button>
  );
}

// Linea "adesso" dentro la cella di oggi.
function NowMark() {
  return (
    <div className="relative z-10 flex shrink-0 items-center gap-[5px] px-[2px]">
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

// Fondo comune delle finestre (nuova seduta, dettaglio): sfoca la pagina, un clic fuori chiude.
function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <motion.div className="absolute inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <button type="button" aria-label="Chiudi" onClick={onClose} className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-[5px]" />
      <motion.div
        role="dialog"
        aria-label={label}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        className="absolute top-[30px] left-1/2 w-[420px] -translate-x-1/2 rounded-[22px] bg-card p-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">{label}</p>
          <button type="button" aria-label="Chiudi" onClick={onClose} className="grid size-[26px] cursor-pointer place-items-center rounded-full bg-soft transition-colors hover:bg-line">
            <X size={13} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

type Draft = { day: number; time: string; clientId?: string; type?: AppointmentType; minutes?: number; replacing?: Appointment };

// Modulo per fissare una seduta nuova o spostarne una (replacing).
function SessionForm({ days, draft, onClose, onSave }: { days: WeekDay[]; draft: Draft; onClose: () => void; onSave: (day: number, a: Appointment) => void }) {
  const [day, setDay] = useState(draft.day);
  const [clientId, setClientId] = useState(draft.clientId ?? clients[0].id);
  const [time, setTime] = useState(draft.time);
  const [type, setType] = useState<AppointmentType>(draft.type ?? "Workout");
  const [minutes, setMinutes] = useState(draft.minutes ?? 60);
  const moving = !!draft.replacing;
  const field = "h-[36px] w-full cursor-pointer rounded-[11px] border border-line bg-card px-[10px] text-[12.5px] outline-none focus:border-[var(--trainer)]";

  return (
    <Dialog label={moving ? "Sposta la seduta" : "Nuova seduta"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(day, { time, minutes, clientId, type, place: draft.replacing && draft.replacing.type === type ? draft.replacing.place : placeFor(type) });
        }}
      >
        <p className="mt-[14px] mb-[6px] text-[11px] font-semibold text-muted">Giorno</p>
        <div className="grid grid-cols-7 gap-[5px]">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setDay(i)}
              className={`flex cursor-pointer flex-col items-center rounded-[11px] py-[6px] leading-none transition-colors ${i === day ? "sel-trainer" : "bg-soft hover:bg-line"}`}
            >
              <span className="text-[9.5px] text-muted">{d.short}</span>
              <span className="mt-[3px] text-[14px] font-bold">{d.n}</span>
            </button>
          ))}
        </div>

        <div className="mt-[12px] grid grid-cols-[1fr_110px] gap-[10px]">
          <label className="block">
            <span className="mb-[6px] block text-[11px] font-semibold text-muted">Cliente</span>
            <select value={clientId} disabled={moving} onChange={(e) => setClientId(e.target.value)} className={`${field} disabled:cursor-default disabled:opacity-70`}>
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
                className={`flex cursor-pointer items-center gap-[5px] rounded-full px-[10px] py-[6px] text-[11.5px] font-semibold transition-colors ${t === type ? "sel-trainer" : "bg-soft text-ink/70 hover:text-ink"}`}
              >
                <Icon size={12} style={{ color: appointmentColors[t].strong }} /> {t}
              </button>
            );
          })}
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="ml-auto h-[30px] cursor-pointer rounded-full border border-line bg-card px-[10px] text-[11.5px] font-semibold outline-none">
            {[30, 40, 45, 50, 60, 90].map((m) => (
              <option key={m} value={m}>
                {duration(m)}
              </option>
            ))}
          </select>
        </div>

        <motion.button type="submit" whileTap={{ scale: 0.97 }} className="btn-trainer mt-[18px] flex h-[40px] w-full cursor-pointer items-center justify-center gap-[6px] rounded-full text-[13px] font-semibold">
          {moving ? <CalendarClock size={14} /> : <CalendarPlus size={14} />} {moving ? "Salva il nuovo orario" : "Fissa la seduta"}
        </motion.button>
      </form>
    </Dialog>
  );
}

// Dettaglio di una seduta: chi, quando, dove, e cosa farci.
function SessionDetail({ day, a, onClose, onMove, onCancel }: { day: WeekDay; a: Appointment; onClose: () => void; onMove: () => void; onCancel: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const c = clientById(a.clientId);
  const colors = appointmentColors[a.type];
  const Icon = typeIcons[a.type];
  const { done, live, minutesTo } = statusOf(day, a);
  const status = done ? "Fatta" : live ? "In corso" : minutesTo !== null && minutesTo > 0 ? `Tra ${duration(minutesTo)}` : "In programma";
  const action = "flex h-[38px] cursor-pointer items-center justify-center gap-[6px] rounded-full bg-soft text-[12px] font-semibold transition-colors hover:bg-line";

  return (
    <Dialog label="Seduta" onClose={onClose}>
      <div className="mt-[14px] flex items-center gap-[12px]">
        {c && <ClientAvatar c={c} size={46} />}
        <div className="min-w-0 leading-none">
          <p className="truncate text-[16px] font-bold">{c?.name}</p>
          <p className="mt-[5px] truncate text-[11.5px] text-muted">{c?.goal}</p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-[9px] py-[4px] text-[10.5px] font-bold ${done ? "bg-soft text-ink/60" : "btn-trainer"}`}>{status}</span>
      </div>

      <div className="mt-[14px] flex flex-col gap-[6px] rounded-[14px] p-[12px] text-[12.5px]" style={{ background: colors.bg }}>
        <p className="flex items-center gap-[8px] font-semibold">
          <CalendarClock size={14} style={{ color: colors.strong }} />
          {day.long} {day.n} {day.month} · {a.time} – {endTime(a)} <span className="font-normal text-ink/55">({duration(a.minutes)})</span>
        </p>
        <p className="flex items-center gap-[8px]">
          <Icon size={14} style={{ color: colors.strong }} /> {a.type}
        </p>
        <p className="flex items-center gap-[8px]">
          <MapPin size={14} style={{ color: colors.strong }} /> {a.place}
        </p>
      </div>

      <div className="mt-[14px] grid grid-cols-2 gap-[8px]">
        <button
          type="button"
          onClick={() => {
            playSound("tap");
            navigate(ROUTES.cliente(a.clientId));
          }}
          className={action}
        >
          <UserRound size={14} /> Apri profilo
        </button>
        <button
          type="button"
          onClick={() => {
            playSound("tap");
            navigate(`${ROUTES.messaggi}?cliente=${a.clientId}`);
          }}
          className={action}
        >
          <MessageCircle size={14} /> Scrivi
        </button>
        <button
          type="button"
          onClick={() => {
            playSound("tap");
            onMove();
          }}
          className={action}
        >
          <CalendarClock size={14} /> Sposta
        </button>
        <button
          type="button"
          onClick={() => {
            playSound("tap");
            if (confirming) onCancel();
            else setConfirming(true);
          }}
          className={`flex h-[38px] cursor-pointer items-center justify-center gap-[6px] rounded-full text-[12px] font-semibold transition-colors ${
            confirming ? "bg-[#e5484d] text-white" : "bg-[rgba(229,72,77,0.1)] text-[#d43b4f] hover:bg-[rgba(229,72,77,0.16)]"
          }`}
        >
          <Trash2 size={14} /> {confirming ? "Conferma annullamento" : "Annulla seduta"}
        </button>
      </div>
    </Dialog>
  );
}

// Una cella della griglia (un giorno, una fascia). Ha la sua densità: se le sedute non entrano diventano più
// compatte solo qui (prima senza luogo, poi su una riga), le altre celle restano complete.
// Tutto lo spazio libero è un tasto: clic = nuova seduta in quel giorno e in quella fascia.
function Cell({
  day,
  band,
  items,
  deps,
  onAdd,
  onOpen,
}: {
  day: WeekDay;
  band: number;
  items: Appointment[];
  deps: unknown[];
  onAdd: () => void;
  onOpen: (a: Appointment) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const density = useFitDensity(box, 2, [...deps, items.length]);
  const now = toMinutes(trainer.now);
  const showNow = day.isToday && band === BANDS.findIndex((b) => now < b.until);
  const nowAt = showNow ? items.findIndex((a) => toMinutes(a.time) + a.minutes > now) : -2;
  const b = BANDS[band];

  return (
    <div
      ref={box}
      data-fit
      className={`group/cella relative flex min-h-0 flex-col gap-[4px] overflow-hidden rounded-[12px] border p-[4px] ${day.isToday ? "" : day.isPast ? "border-line/70 bg-soft/40" : "border-line/70"}`}
      style={day.isToday ? { background: "color-mix(in srgb, var(--trainer) 6%, transparent)", borderColor: "color-mix(in srgb, var(--trainer) 22%, transparent)" } : undefined}
    >
      <button
        type="button"
        aria-label={`Nuova seduta ${day.long} ${day.n}, ${b.label.toLowerCase()}`}
        title={`Nuova seduta: ${day.long} ${day.n}, ${b.label.toLowerCase()}`}
        onClick={() => {
          playSound("tap");
          onAdd();
        }}
        className="absolute inset-0 z-0 cursor-pointer rounded-[12px] transition-colors hover:bg-[color-mix(in_srgb,var(--trainer)_7%,transparent)]"
      >
        {items.length === 0 && (
          <span className="grid h-full place-items-center opacity-0 transition-opacity group-hover/cella:opacity-100">
            <span className="grid size-[24px] place-items-center rounded-full border border-dashed text-ink/60" style={{ borderColor: "var(--trainer)" }}>
              <Plus size={13} />
            </span>
          </span>
        )}
      </button>

      <AnimatePresence mode="popLayout" initial={false}>
        {items.flatMap((a, i) => {
          const out = [];
          if (i === nowAt) out.push(<NowMark key="adesso" />);
          out.push(<SessionCard key={`${a.time}-${a.clientId}`} day={day} a={a} i={i} density={density} onOpen={() => onOpen(a)} />);
          return out;
        })}
      </AnimatePresence>
      {showNow && (nowAt === -1 || items.length === 0) && <NowMark />}
    </div>
  );
}

// Calendario della settimana: griglia 7 giorni × 3 fasce (mattina, pomeriggio, sera), tutto in vista senza scorrere.
// Si clicca una seduta per il dettaglio, una cella vuota per fissarne una in quel giorno e in quella fascia.
export function WeekCalendar() {
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const [hidden, setHidden] = useState<AppointmentType[]>([]);
  // modifiche della settimana (sedute nuove, spostate, annullate): partono dalla settimana della demo
  const [edits, setEdits] = useState<Record<number, Appointment[][]>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState<{ day: number; a: Appointment } | null>(null);

  const week = weekOf(offset);
  const items = edits[offset] ?? week.days.map((d) => d.items);
  const days: WeekDay[] = week.days.map((d, i) => ({ ...d, items: [...items[i]].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)) }));
  const total = days.reduce((s, d) => s + d.items.length, 0);
  const todayIndex = days.findIndex((d) => d.isToday);

  const update = (fn: (week: Appointment[][]) => Appointment[][]) => setEdits((e) => ({ ...e, [offset]: fn((e[offset] ?? week.days.map((d) => d.items)).map((d) => [...d])) }));

  const move = (step: number) => {
    setDirection(step);
    setOffset((o) => o + step);
  };

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] pr-[18px] pl-[80px]">
      <section className="flex h-full min-h-0 flex-col panel rounded-[18px] px-[16px] pt-[14px] pb-[14px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <WeekArrows label={`${week.label} 2026`} onMove={move} size={30} className="text-[15px] font-bold" />
            <span className="rounded-full bg-soft px-[10px] py-[5px] text-[11px] font-semibold">{conta(total, "seduta", "sedute")}</span>
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
                  title={off ? `Mostra ${t}` : `Nascondi ${t}`}
                  onClick={() => {
                    playSound("tap");
                    setHidden((h) => (off ? h.filter((x) => x !== t) : [...h, t]));
                  }}
                  className={`flex cursor-pointer items-center gap-[5px] rounded-full px-[10px] py-[5px] text-[11px] font-semibold transition-opacity hover:opacity-80 ${off ? "opacity-40" : ""}`}
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
                setDraft({ day: todayIndex >= 0 ? todayIndex : 0, time: "17:00" });
              }}
              className="btn-trainer ml-[6px] flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full px-[14px] text-[12px] font-semibold"
            >
              <CalendarPlus size={13} /> Nuova seduta
            </motion.button>
          </div>
        </div>

        {/* intestazione: i giorni in lastre di vetro, allineati alle colonne della griglia */}
        <div className="mt-[12px] grid grid-cols-[64px_1fr] gap-x-[6px]">
          <span />
          <GlassDays days={days} selected={todayIndex >= 0 ? todayIndex : null} weekKey={offset} direction={direction} height={58} />
        </div>

        <div className="mt-[8px] grid min-h-0 flex-1 grid-cols-[64px_1fr] gap-x-[6px]">
          {/* etichette delle fasce */}
          <div className="grid grid-rows-3 gap-y-[6px]">
            {BANDS.map((b) => (
              <div key={b.label} className="flex flex-col justify-center pr-[4px] text-right leading-none">
                <span className="text-[11.5px] font-bold">{b.label}</span>
                <span className="mt-[4px] text-[9.5px] text-muted">{b.hint}</span>
              </div>
            ))}
          </div>

          <div className="min-h-0 px-[6px]">
            <motion.div
              key={offset}
              initial={{ opacity: 0, x: direction * 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              className="grid h-full grid-flow-col grid-cols-7 grid-rows-3 gap-[6px]"
            >
              {days.map((d, di) =>
                BANDS.map((band, bi) => (
                  <Cell
                    key={`${di}-${bi}`}
                    day={d}
                    band={bi}
                    items={d.items.filter((a) => !hidden.includes(a.type) && bandOf(a) === bi)}
                    deps={[offset, hidden, edits]}
                    onAdd={() => setDraft({ day: di, time: band.start })}
                    onOpen={(a) => setOpen({ day: di, a })}
                  />
                )),
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <SessionDetail
            key="dettaglio"
            day={days[open.day]}
            a={open.a}
            onClose={() => setOpen(null)}
            onMove={() => {
              setDraft({ day: open.day, time: open.a.time, clientId: open.a.clientId, type: open.a.type, minutes: open.a.minutes, replacing: open.a });
              setOpen(null);
            }}
            onCancel={() => {
              const { day, a } = open;
              update((w) => w.map((items, i) => (i === day ? items.filter((x) => x !== a) : items)));
              setOpen(null);
              playSound("confirm");
              toast.success(`Seduta annullata: ${clientById(a.clientId)?.name.split(" ")[0]}, ${days[day].long} alle ${a.time}`);
            }}
          />
        )}
        {draft && (
          <SessionForm
            key="modulo"
            days={days}
            draft={draft}
            onClose={() => setDraft(null)}
            onSave={(day, a) => {
              const old = draft.replacing;
              update((w) => w.map((items, i) => [...items.filter((x) => x !== old), ...(i === day ? [a] : [])]));
              setDraft(null);
              playSound("confirm");
              toast.success(old ? `Seduta spostata a ${days[day].long} ${days[day].n} alle ${a.time}` : `Seduta fissata: ${days[day].long} ${days[day].n} alle ${a.time}`);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
