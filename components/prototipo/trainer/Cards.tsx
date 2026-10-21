"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  CalendarClock,
  ChevronDown,
  CirclePlus,
  EllipsisVertical,
  Funnel,
  Heart,
  Info,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Reply,
  UserRoundSearch,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Avatar, IconCircle } from "@/components/ui/basics";
import { CountUp, EASE_OUT, ProgressBar } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { alerts, clientById, pathCards, progressOf, quickStats, toneColors, trainer } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";

const card = "rounded-[18px] bg-white";

const statIcons: Record<(typeof quickStats)[number]["key"], { icon: LucideIcon; alert?: boolean }> = {
  clienti: { icon: Users },
  sedute: { icon: CalendarClock },
  scadenza: { icon: Package, alert: true },
  seguire: { icon: UserRoundSearch, alert: true },
};

// Profilo del trainer con, subito sotto, le informazioni importanti della giornata (cliccabili).
export function ProfileCard() {
  return (
    <section className={`${card} px-[16px] pt-[10px] pb-[14px]`}>
      <div className="flex items-center">
        <span className="grid size-[46px] shrink-0 place-items-center rounded-full border-[2px] border-[#f3a54a] bg-white p-[2px]">
          <Avatar initials={trainer.initials} src={trainer.photo} size={38} />
        </span>
        <div className="ml-[9px] leading-none">
          <p className="text-[15px] font-bold tracking-[-0.01em]">{trainer.name}</p>
          <p className="mt-[5px] text-[12px] text-muted">{trainer.role}</p>
        </div>
        <div className="ml-auto flex gap-[4px]">
          <IconCircle icon={Mail} label="Email" variant="dark" size={30} iconSize={13} />
          <IconCircle icon={Phone} label="Chiama" size={30} iconSize={13} />
          <IconCircle icon={MessageCircle} label="Messaggi" size={30} iconSize={13} />
          <IconCircle icon={Video} label="Videochiamata" size={30} iconSize={13} />
        </div>
      </div>

      <p className="mt-[14px] mb-[8px] text-[11px] leading-none font-semibold">Da tenere d’occhio oggi</p>
      <div className="grid grid-cols-2 gap-[8px]">
        {quickStats.map((s, i) => {
          const { icon: Icon, alert } = statIcons[s.key];
          const hot = alert && s.value > 0;
          return (
            <motion.div key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.45, ease: EASE_OUT }}>
              <Link
                href={s.href}
                onClick={() => playSound("tap")}
                className="group flex h-[54px] items-center gap-[9px] rounded-[13px] border border-line px-[10px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_22px_rgba(0,0,0,0.06)]"
              >
                <span className={`relative grid size-[30px] shrink-0 place-items-center rounded-full ${hot ? "bg-[#fff3d6] text-[#b7791f]" : "bg-soft text-ink/70"}`}>
                  <Icon size={14} />
                  {hot && (
                    <motion.span
                      className="absolute -top-[1px] -right-[1px] size-[8px] rounded-full border-2 border-white bg-[#f5a524]"
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}
                </span>
                <div className="min-w-0 leading-none">
                  <p className="text-[18px] font-bold tracking-[-0.02em]">
                    <CountUp value={s.value} delay={0.35 + i * 0.06} />
                  </p>
                  <p className="mt-[3px] truncate text-[10px] text-muted">{s.label}</p>
                </div>
              </Link>
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
      <Link href={ROUTES.clienti} onClick={() => playSound("tap")}>
        <motion.span
          whileTap={{ scale: 0.95 }}
          className="flex h-[24px] w-[145px] items-center justify-center gap-[6px] rounded-full bg-[#131313] text-[12px] font-semibold text-white"
        >
          Percorsi attivi <ChevronDown size={13} />
        </motion.span>
      </Link>
      <div className="flex gap-[8px]">
        <IconCircle icon={CirclePlus} label="Nuovo cliente" size={24} iconSize={13} variant="white" />
        <IconCircle icon={Funnel} label="Filtra" size={24} iconSize={12} variant="white" />
        <IconCircle icon={Heart} label="Preferiti" size={24} iconSize={12} variant="white" />
      </div>
    </div>
  );
}

export function PathCards() {
  return (
    <div className="mt-[8px] grid grid-cols-3 gap-[10px]">
      {pathCards.map((id, i) => {
        const c = clientById(id);
        if (!c) return null;
        const tone = toneColors[c.tone];
        const percent = progressOf(c);
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 + i * 0.06, duration: 0.55, ease: EASE_OUT }}
            whileHover={{ y: -3 }}
          >
            <Link
              href={ROUTES.cliente(c.id)}
              onClick={() => playSound("tap")}
              className="flex h-[121px] flex-col rounded-[16px] px-[13px] pt-[10px] pb-[8px] transition-shadow duration-200 hover:shadow-[0_12px_26px_rgba(0,0,0,0.08)]"
              style={{ background: tone.bg }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/90 px-[7px] py-[2.5px] text-[9.5px] leading-none font-semibold text-ink/85">{c.since}</span>
                <EllipsisVertical size={13} className="text-ink/60" />
              </div>
              <div className="mt-[9px] flex items-center justify-between">
                <h3 className="text-[14px] leading-none font-bold">{c.name}</h3>
                <Info size={13} className="text-ink/45" />
              </div>
              <div className="mt-[8px] flex items-center justify-between">
                <p className="truncate text-[11px] leading-none" style={{ color: tone.sub }}>
                  {c.goal}
                </p>
                <span className="flex shrink-0 items-center gap-[5px] rounded-full bg-white px-[7px] py-[2.5px] text-[9.5px] leading-none">
                  <b className="text-[10px]">
                    <CountUp value={percent} delay={0.4 + i * 0.06} />%
                  </b>
                  <span className="text-ink/70">Obiettivo</span>
                </span>
              </div>
              <div className="mt-[9px]">
                <ProgressBar percent={percent} fill={tone.strong} track={tone.track} delay={0.4 + i * 0.06} />
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar initials={c.initials} size={18} className="border-[1.5px] border-white" />
                  <span className="-ml-[4px] grid size-[14px] place-items-center rounded-full border border-white" style={{ background: tone.track, color: tone.strong }}>
                    <Plus size={9} strokeWidth={3} />
                  </span>
                  <span className="ml-[6px] text-[9.5px] text-ink/55">Ultimo: {c.lastWorkout.toLowerCase()}</span>
                </div>
                <span className="rounded-full bg-white px-[8px] py-[3px] text-[9.5px] leading-none font-medium text-ink/80">{c.pkg.left}</span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// Messaggi dei clienti: il nome porta al profilo; quello urgente è in nero.
export function MessagesCard() {
  return (
    <section className={`${card} flex min-h-0 flex-1 flex-col px-[15px] pt-[11px] pb-[10px]`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Messaggi <MessageSquare size={13} strokeWidth={2} className="text-ink/70" />
        </h2>
        <button type="button" onClick={() => playSound("tap")} className="cursor-pointer text-[11px] font-semibold underline underline-offset-2">
          Vedi tutti
        </button>
      </div>
      <div className="mt-[9px] flex flex-1 flex-col justify-between gap-[8px]">
        {alerts.map((a, i) => {
          const c = clientById(a.clientId);
          if (!c) return null;
          return (
            <motion.div
              key={a.clientId}
              initial={{ opacity: 0, scale: a.urgent ? 0.94 : 1, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.5, ease: EASE_OUT }}
              whileHover={{ y: -2 }}
            >
              <Link
                href={ROUTES.cliente(c.id)}
                onClick={() => playSound("tap")}
                className={`flex items-center gap-[8px] px-[9px] py-[9px] ${
                  a.urgent ? "-mx-[1px] rounded-[12px] bg-[#131411] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]" : "rounded-[11px] border border-line"
                }`}
              >
                <Avatar initials={c.initials} size={28} />
                <div className="min-w-0 leading-snug">
                  <p className="text-[11.5px] font-bold">{c.name}</p>
                  <p className={`line-clamp-2 text-[10px] ${a.urgent ? "text-white/70" : "text-muted"}`}>{a.text}</p>
                </div>
                <Reply size={13} className={`ml-auto shrink-0 ${a.urgent ? "text-white/80" : "text-ink/50"}`} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
