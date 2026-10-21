"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CalendarDays, ChevronDown, ChevronRight, CirclePlus, EllipsisVertical, Funnel, Heart, Mail, MessageCircle, MessageSquare, Phone, Video } from "lucide-react";
import { Avatar, IconCircle, Pill } from "@/components/ui/basics";
import { CountUp, EASE_OUT, ProgressBar } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { agenda, alerts, clientById, pathCards, progressOf, TODAY_INDEX, toneColors, trainer } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";
import { ClientAvatar } from "./shared";

const card = "rounded-[18px] bg-card";

// Profilo del trainer, compatto come nel riferimento.
export function ProfileCard() {
  const today = agenda[TODAY_INDEX].length;
  return (
    <section className={`${card} px-[16px] pt-[10px] pb-[12px]`}>
      <div className="flex items-center">
        <span className="grid size-[50px] shrink-0 place-items-center rounded-full border-[2px] bg-card p-[2px]" style={{ borderColor: "var(--trainer)" }}>
          <Avatar initials={trainer.initials} src={trainer.photo} size={42} />
        </span>
        <div className="ml-[10px] leading-none">
          <p className="text-[15px] font-bold tracking-[-0.01em]">{trainer.name}</p>
          <p className="mt-[5px] text-[12px] text-muted">{trainer.role}</p>
        </div>
        <IconCircle icon={EllipsisVertical} label="Altro" size={26} iconSize={13} variant="outline" className="ml-auto" />
      </div>
      <div className="mt-[10px] flex items-center justify-between">
        <div className="flex gap-[5px]">
          <IconCircle icon={Mail} label="Email" variant="dark" />
          <IconCircle icon={Phone} label="Chiama" />
          <IconCircle icon={MessageCircle} label="Messaggi" />
          <IconCircle icon={Video} label="Videochiamata" />
        </div>
        <Link href={ROUTES.calendario} onClick={() => playSound("tap")}>
          <Pill className="h-[28px] border border-line pr-[5px] pl-[11px] text-[11px] font-medium transition-transform hover:-translate-y-[1.5px]">
            <CalendarDays size={12} strokeWidth={2} /> Oggi
            <span className="grid size-[19px] place-items-center rounded-full bg-contrast text-[10px] font-bold text-on-contrast">{today}</span>
          </Pill>
        </Link>
      </div>
    </section>
  );
}

// Intestazione della riga dei clienti in evidenza.
export function ClientsHeader() {
  return (
    <div className="flex h-[26px] items-center justify-between">
      <Link href={ROUTES.clienti} onClick={() => playSound("tap")}>
        <motion.span whileHover={{ y: -1.5 }} whileTap={{ scale: 0.95 }} className="flex h-[26px] items-center gap-[6px] rounded-full bg-contrast px-[14px] text-[12px] font-semibold text-on-contrast">
          I miei clienti <ChevronDown size={13} />
        </motion.span>
      </Link>
      <div className="flex gap-[8px]">
        <IconCircle icon={CirclePlus} label="Nuovo cliente" size={26} iconSize={13} variant="white" />
        <IconCircle icon={Funnel} label="Filtra" size={26} iconSize={12} variant="white" />
        <IconCircle icon={Heart} label="Preferiti" size={26} iconSize={12} variant="white" />
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
              className="flex h-[124px] flex-col rounded-[18px] px-[14px] pt-[12px] pb-[12px] transition-shadow duration-200 hover:shadow-[0_12px_26px_rgba(0,0,0,0.08)]"
              style={{ background: tone.bg }}
            >
              <div className="flex items-center gap-[10px]">
                <ClientAvatar c={c} size={38} className="ring-2 ring-card" />
                <div className="min-w-0 flex-1 leading-none">
                  <h3 className="truncate text-[14px] font-bold">{c.name}</h3>
                  <p className="mt-[4px] truncate text-[11px] text-ink/55">{c.goal}</p>
                </div>
                <ChevronRight size={15} className="text-ink/40" />
              </div>
              <div className="mt-auto flex items-end justify-between">
                <p className="text-[22px] leading-none font-extrabold tracking-[-0.03em]">
                  <CountUp value={percent} delay={0.4 + i * 0.06} />
                  <span className="text-[12px] font-semibold text-ink/50">%</span>
                </p>
                <span className="rounded-full bg-card/90 px-[8px] py-[3.5px] text-[10px] leading-none font-medium text-ink/80">{c.pkg.left}</span>
              </div>
              <div className="mt-[8px]">
                <ProgressBar percent={percent} fill={tone.strong} track={tone.track} delay={0.4 + i * 0.06} />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// Messaggi dei clienti: il nome porta al profilo; quello urgente è evidenziato.
export function MessagesCard() {
  return (
    <section className={`${card} flex min-h-0 flex-1 flex-col px-[15px] pt-[12px] pb-[12px]`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[6px] text-[14px] font-bold">
          Messaggi <MessageSquare size={13} strokeWidth={2} className="text-ink/60" />
        </h2>
        <Link href={ROUTES.messaggi} onClick={() => playSound("tap")} className="text-[11px] font-semibold underline underline-offset-2">
          Vedi tutti
        </Link>
      </div>
      <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto [scrollbar-width:none]">
        {alerts.slice(0, 4).map((a, i) => {
          const c = clientById(a.clientId);
          if (!c) return null;
          return (
            <motion.div
              key={a.clientId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.07, duration: 0.45, ease: EASE_OUT }}
              whileHover={{ y: -2 }}
            >
              <Link
                href={ROUTES.messaggi}
                onClick={() => playSound("tap")}
                className={`flex items-center gap-[10px] rounded-[14px] px-[10px] py-[10px] ${a.urgent ? "bg-contrast text-on-contrast shadow-[0_10px_24px_rgba(0,0,0,0.18)]" : "border border-line"}`}
              >
                <ClientAvatar c={c} size={32} />
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="flex items-center gap-[6px] text-[12px] font-bold">
                    {c.name}
                    {a.urgent && <span className="rounded-full bg-[#e5484d] px-[6px] py-[1px] text-[9px] font-bold text-white">dolore</span>}
                  </p>
                  <p className={`truncate text-[10.5px] ${a.urgent ? "text-on-contrast/70" : "text-muted"}`}>{a.text}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
