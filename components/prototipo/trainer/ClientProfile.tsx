"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import {
  Bot,
  CalendarClock,
  CalendarPlus,
  Check,
  ClipboardList,
  Dumbbell,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Ruler,
  Scale,
  StickyNote,
  Target,
  TrendingDown,
  TrendingUp,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { Appear, CountUp, EASE_OUT, formatEuro, ProgressBar } from "@/components/ui/motion";
import SoftAreaChart from "@/components/ui/SoftAreaChart";
import { playSound } from "@/libs/ui/sound";
import { agenda, appointmentColors, Client, progressOf, TODAY_INDEX, toneColors, trainer, week } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";
import { ClientAvatar } from "./shared";

const card = "rounded-[18px] bg-card";
const kg = (n: number) => n.toFixed(1).replace(".", ",");

function Ring({ percent, color, track, size = 46 }: { percent: number; color: string; track: string; size?: number }) {
  const r = (size - 6) / 2;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={5} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: percent / 100 }}
        transition={{ delay: 0.4, duration: 1.1, ease: EASE_OUT }}
      />
    </svg>
  );
}

function SideRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex h-[40px] items-center gap-[9px] rounded-[11px] border border-line px-[8px]">
      <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-soft text-ink/70">
        <Icon size={13} />
      </span>
      <div className="min-w-0 leading-none">
        <p className="text-[9.5px] text-muted">{label}</p>
        <p className="mt-[3px] truncate text-[12px] font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function ClientProfile({ c }: { c: Client }) {
  const tone = toneColors[c.tone];
  const percent = progressOf(c);
  const first = c.weights[0];
  const last = c.weights[c.weights.length - 1];
  const delta = +(last - first).toFixed(1);
  const goalLeft = c.unit === "%" ? `Al ${percent}%` : `Mancano ${kg(Math.abs(c.target - c.current))} ${c.unit}`;
  const [payments, setPayments] = useState(c.payments);
  const outstanding = payments.filter((p) => !p.paid).reduce((s, p) => s + p.amount, 0);

  const upcoming = agenda.flatMap((day, d) => day.filter((a) => a.clientId === c.id).map((a) => ({ ...a, d })));

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[372px_1fr] gap-x-[14px] pr-[18px] pl-[80px]">
      {/* Colonna sinistra: chi è e il suo percorso */}
      <Appear i={1} className="min-h-0">
        <section className={`${card} flex h-full flex-col px-[16px] pt-[14px] pb-[14px]`}>
          <div className="flex items-center gap-[12px]">
            <span className="grid size-[66px] shrink-0 place-items-center rounded-full border-2 bg-card p-[2px]" style={{ borderColor: tone.strong }}>
              <ClientAvatar c={c} size={58} />
            </span>
            <div className="min-w-0 leading-none">
              <span className="rounded-full px-[7px] py-[2.5px] text-[9.5px] font-semibold" style={{ background: tone.bg }}>
                {c.since}
              </span>
              <p className="mt-[7px] truncate text-[19px] font-bold tracking-[-0.02em]">{c.name}</p>
              <p className="mt-[5px] truncate text-[12px] text-muted">{c.goal}</p>
            </div>
          </div>

          <div className="mt-[12px] flex gap-[5px]">
            <IconCircle icon={Mail} label="Email" variant="dark" size={32} iconSize={14} />
            <IconCircle icon={Phone} label="Chiama" size={32} iconSize={14} />
            <IconCircle icon={MessageCircle} label="Messaggio" size={32} iconSize={14} />
            <IconCircle icon={Video} label="Videochiamata" size={32} iconSize={14} />
          </div>

          <div className="mt-[14px] rounded-[14px] px-[12px] py-[11px]" style={{ background: tone.bg }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-ink/70">Avanzamento verso l’obiettivo</p>
              <p className="text-[15px] font-extrabold">
                <CountUp value={percent} delay={0.35} />%
              </p>
            </div>
            <div className="mt-[8px]">
              <ProgressBar percent={percent} fill={tone.strong} track={tone.track} />
            </div>
            <p className="mt-[7px] text-[10px] text-ink/55">
              Partenza {String(c.start).replace(".", ",")} {c.unit} · oggi {String(c.current).replace(".", ",")} {c.unit} · traguardo {c.target} {c.unit}
            </p>
          </div>

          <div className="mt-[12px] flex flex-col gap-[7px]">
            <SideRow icon={Package} label="Pacchetto" value={`${c.pkg.label} · ${c.pkg.left}`} />
            <SideRow icon={Dumbbell} label="Scheda attuale" value={c.plan} />
            <SideRow icon={CalendarClock} label="Ultimo allenamento" value={c.lastWorkout} />
            <SideRow icon={Phone} label="Telefono" value={c.phone} />
            <SideRow icon={Mail} label="Email" value={c.email} />
          </div>

          <div className="mt-[12px] min-h-0 flex-1 rounded-[14px] bg-soft px-[12px] py-[10px]">
            <p className="flex items-center gap-[5px] text-[11px] font-semibold text-ink/70">
              <StickyNote size={12} /> Note del trainer
            </p>
            <p className="mt-[6px] text-[12px] leading-relaxed">{c.notes}</p>
          </div>

          <div className="mt-[12px] grid grid-cols-2 gap-[8px]">
            <Link
              href={`${ROUTES.schede}?cliente=${c.id}`}
              onClick={() => playSound("tap")}
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-line text-[12px] font-semibold transition-colors hover:bg-soft"
            >
              <ClipboardList size={14} /> Modifica scheda
            </Link>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                playSound("confirm");
                toast.success(`Seduta proposta a ${c.name.split(" ")[0]}`);
              }}
              className="flex h-[36px] cursor-pointer items-center justify-center gap-[6px] rounded-full bg-contrast text-[12px] font-semibold text-on-contrast"
            >
              <CalendarPlus size={14} /> Fissa seduta
            </motion.button>
          </div>
        </section>
      </Appear>

      {/* Colonna destra: numeri, grafici, attività */}
      <div className="flex min-h-0 flex-col gap-[10px]">
        <div className="grid h-[92px] grid-cols-4 gap-[10px]">
          {[
            { icon: Scale, label: "Peso attuale", node: <><CountUp value={last} format={kg} delay={0.3} /> <span className="text-[13px] text-muted">kg</span></> },
            {
              icon: delta <= 0 ? TrendingDown : TrendingUp,
              label: "Variazione",
              node: (
                <span className={delta <= 0 ? "text-ok" : "text-[#2f7dac]"}>
                  {delta > 0 ? "+" : "−"}
                  <CountUp value={Math.abs(delta)} format={kg} delay={0.35} /> <span className="text-[13px]">kg</span>
                </span>
              ),
            },
            { icon: Target, label: "Obiettivo", ring: true },
            { icon: Package, label: "Pacchetto", node: <span className="text-[13px] whitespace-normal">{c.pkg.left}</span> },
          ].map((k, i) => (
            <Appear key={k.label} i={1 + i}>
              <div className={`${card} flex h-[92px] items-center gap-[10px] px-[14px]`}>
                {k.ring ? (
                  <div className="relative grid place-items-center">
                    <Ring percent={percent} color={tone.strong} track={tone.track} />
                    <span className="absolute text-[11px] font-bold">{percent}%</span>
                  </div>
                ) : (
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-soft text-ink/70">
                    <k.icon size={17} />
                  </span>
                )}
                <div className="min-w-0 leading-none">
                  <p className="text-[10.5px] text-muted">{k.label}</p>
                  <p className="mt-[6px] truncate text-[22px] font-bold tracking-[-0.03em]">{k.ring ? <span className="text-[15px]">{goalLeft}</span> : k.node}</p>
                </div>
              </div>
            </Appear>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1.75fr_1fr] gap-[10px]">
          <Appear i={3} className="min-h-0">
            <section className={`${card} flex h-full flex-col px-[16px] pt-[13px] pb-[12px]`}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
                  Andamento del peso <Scale size={13} className="text-ink/60" />
                </h2>
                <span className="rounded-full bg-soft px-[9px] py-[3px] text-[10.5px] font-semibold">Ultime 8 settimane</span>
              </div>
              <div className="mt-[10px] min-h-0 flex-1 overflow-hidden px-[4px] py-[8px]">
                <SoftAreaChart points={c.weights} color={tone.strong} />
              </div>
              <div className="mt-[6px] flex justify-between px-[6px] text-[10px] text-muted">
                {c.weights.map((w, i) => (
                  <span key={i} className="text-center leading-tight">
                    S{i + 1}
                    <br />
                    <b className="text-ink/70">{kg(w)}</b>
                  </span>
                ))}
              </div>
            </section>
          </Appear>
          <Appear i={4} className="min-h-0">
            <section className={`${card} flex h-full flex-col px-[15px] pt-[13px] pb-[12px]`}>
              <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
                Misure <Ruler size={13} className="text-ink/60" />
              </h2>
              <div className="mt-[10px] flex flex-1 flex-col justify-between">
                {c.measures.map((m, i) => {
                  const d = m.current - m.start;
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-semibold">{m.label}</span>
                        <span className="text-muted">
                          {m.start} → <b className="text-ink">{m.current} cm</b>
                          <span className={`ml-[6px] rounded-full px-[6px] py-[1.5px] text-[9.5px] font-bold ${d < 0 ? "bg-ok-soft text-ok" : d > 0 ? "bg-sky text-sky-strong" : "bg-soft text-ink/50"}`}>
                            {d > 0 ? "+" : d < 0 ? "−" : "±"}
                            {Math.abs(d)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-[5px]">
                        <ProgressBar percent={(m.current / Math.max(m.start, m.current)) * 100} fill={tone.strong} track={tone.track} delay={0.4 + i * 0.06} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </Appear>
        </div>

        <div className="grid h-[206px] grid-cols-3 gap-[10px]">
          <Appear i={5} className="min-h-0">
            <section className={`${card} flex h-full flex-col px-[15px] pt-[13px] pb-[12px]`}>
              <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
                Appuntamenti <CalendarClock size={13} className="text-ink/60" />
              </h2>
              <div className="mt-[9px] flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto [scrollbar-width:none]">
                {upcoming.length === 0 && <p className="mt-[16px] text-center text-[11.5px] text-muted">Nessun appuntamento questa settimana.</p>}
                {upcoming.map((a) => {
                  const col = appointmentColors[a.type];
                  const past = a.d < TODAY_INDEX;
                  const today = a.d === TODAY_INDEX;
                  return (
                    <div key={`${a.d}-${a.time}`} className={`flex items-center gap-[8px] rounded-[11px] px-[9px] py-[7px] ${past ? "opacity-50" : ""}`} style={{ background: col.bg }}>
                      <span className="w-[42px] shrink-0 leading-none">
                        <span className="block text-[9.5px] text-ink/55">{week[a.d].long.slice(0, 3)} {week[a.d].n}</span>
                        <b className="mt-[2px] block text-[12px] tabular-nums">{a.time}</b>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold">{a.type}</span>
                      {today && <span className="rounded-full bg-contrast px-[7px] py-[2.5px] text-[9px] font-bold text-on-contrast">oggi</span>}
                      {past && <Check size={12} strokeWidth={3} />}
                    </div>
                  );
                })}
              </div>
            </section>
          </Appear>

          <Appear i={6} className="min-h-0">
            <section className={`${card} flex h-full flex-col px-[15px] pt-[13px] pb-[12px]`}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
                  Pagamenti <Wallet size={13} className="text-ink/60" />
                </h2>
                {outstanding > 0 ? (
                  <span className="rounded-full bg-[rgba(212,59,79,0.14)] px-[8px] py-[3px] text-[10px] font-bold text-[#d43b4f]">Da incassare {formatEuro(outstanding)}</span>
                ) : (
                  <span className="rounded-full bg-ok-soft px-[8px] py-[3px] text-[10px] font-bold text-ok">Tutto pagato</span>
                )}
              </div>
              <div className="mt-[9px] flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto [scrollbar-width:none]">
                {payments.map((p, i) => (
                  <div key={p.label + p.date} className="flex items-center gap-[8px] rounded-[11px] border border-line px-[9px] py-[7px]">
                    <div className="min-w-0 flex-1 leading-none">
                      <p className="truncate text-[11.5px] font-semibold">{p.label}</p>
                      <p className="mt-[3px] text-[9.5px] text-muted">
                        {p.date} · {formatEuro(p.amount)}
                      </p>
                    </div>
                    {p.paid ? (
                      <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-[3px] rounded-full bg-ok-soft px-[7px] py-[3px] text-[9.5px] font-bold text-ok">
                        <Check size={10} strokeWidth={3} /> Pagato
                      </motion.span>
                    ) : (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          playSound("confirm");
                          setPayments((ps) => ps.map((x, k) => (k === i ? { ...x, paid: true } : x)));
                          toast.success(`${formatEuro(p.amount)} segnati come incassati`);
                        }}
                        className="cursor-pointer rounded-full bg-contrast px-[9px] py-[4px] text-[9.5px] font-bold text-on-contrast"
                      >
                        Segna pagato
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </Appear>

          <Appear i={7} className="min-h-0">
            <section className={`${card} flex h-full flex-col px-[15px] pt-[13px] pb-[12px]`}>
              <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
                Domande all’assistente <Bot size={14} className="text-ink/60" />
              </h2>
              <div className="mt-[9px] flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto [scrollbar-width:none]">
                {c.questions.length === 0 && <p className="mt-[16px] text-center text-[11.5px] text-muted">Ancora nessuna domanda.</p>}
                {c.questions.map((q, i) => (
                  <motion.p
                    key={q}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className={`rounded-[13px] rounded-br-[5px] px-[10px] py-[7px] text-[11px] ${/male|dolore/i.test(q) ? "border border-[rgba(212,59,79,0.22)] bg-[rgba(212,59,79,0.07)]" : "bg-soft"}`}
                  >
                    {q}
                  </motion.p>
                ))}
              </div>
              <p className="mt-[6px] text-[9.5px] text-muted">Il cliente sa che {trainer.name.split(" ")[0]} vede queste domande.</p>
            </section>
          </Appear>
        </div>
      </div>
    </main>
  );
}

export function ClientNotFound() {
  return (
    <main className="absolute inset-x-0 top-[90px] grid place-items-center pl-[80px]">
      <div className="rounded-[18px] bg-card px-[28px] py-[24px] text-center">
        <p className="text-[15px] font-bold">Cliente non trovato</p>
        <Link href={ROUTES.clienti} className="mt-[10px] inline-block text-[12px] font-semibold underline">
          Torna alla lista dei clienti
        </Link>
      </div>
    </main>
  );
}
