"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Dumbbell,
  FileText,
  House,
  Mail,
  Maximize2,
  MessageSquare,
  PanelTop,
  Search,
  Settings,
  TextAlignStart,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar, FitCanvas } from "@/components/ui/basics";
import { Appear } from "@/components/ui/motion";
import { isSoundEnabled, onSoundChange, playSound, setSoundEnabled } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";

export const ROUTES = {
  oggi: "/prototipo/trainer",
  clienti: "/prototipo/trainer/clienti",
  cliente: (id: string) => `/prototipo/trainer/clienti/${id}`,
};

const tap = { whileTap: { scale: 0.92 }, whileHover: { y: -1.5 }, transition: { type: "spring" as const, stiffness: 500, damping: 28 } };

const notYet = (label: string) => toast(`${label}: arriva nelle prossime fasi`, { icon: "🛠️" });

function SquareButton({ icon: Icon, label, size = 16 }: { icon: LucideIcon; label: string; size?: number }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      {...tap}
      onClick={() => playSound("tap")}
      className="grid size-[33px] cursor-pointer place-items-center rounded-[10px] bg-white text-ink"
    >
      <Icon size={size} strokeWidth={2} />
    </motion.button>
  );
}

type NavItem = { label: string; icon: LucideIcon; href?: string };

const navItems: NavItem[] = [
  { label: "Oggi", icon: House, href: ROUTES.oggi },
  { label: "Clienti", icon: Users, href: ROUTES.clienti },
  { label: "Incassi", icon: FileText },
  { label: "Impostazioni", icon: Settings },
];

function useSection() {
  const path = usePathname();
  return path.startsWith(ROUTES.clienti) ? "Clienti" : "Oggi";
}

export function TopBar() {
  const section = useSection();
  const router = useRouter();

  return (
    <div className="flex h-[35px] items-center justify-between pr-[18px] pl-[20px]">
      <div className="flex gap-[10px]">
        <SquareButton icon={TextAlignStart} label="Menu" />
        <SquareButton icon={PanelTop} label="Pannelli" size={14} />
      </div>

      <nav className="flex h-[35px] w-[395px] items-center justify-between rounded-full bg-white px-[4px]">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = label === section;
          return (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound("tap");
                if (href) router.push(href);
                else notYet(label);
              }}
              className={`relative flex h-[27px] cursor-pointer items-center gap-[6px] rounded-full px-[14px] text-[12.5px] font-medium transition-colors duration-300 ${
                isActive ? "text-white" : "text-ink/75 hover:text-ink"
              }`}
            >
              {isActive && <span className="absolute inset-0 rounded-full bg-[#101214]" />}
              <Icon size={14} strokeWidth={1.9} className="relative" />
              <span className="relative">{label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="flex h-[35px] w-[147px] items-center justify-between rounded-full bg-white pr-[4px] pl-[14px] text-ink">
        {[Mail, Bell, Search].map((Icon, i) => (
          <motion.button key={i} type="button" {...tap} onClick={() => playSound("tap")} className="relative cursor-pointer" aria-label={["Email", "Avvisi", "Cerca"][i]}>
            <Icon size={15} strokeWidth={1.9} />
            {i === 1 && (
              <motion.span
                className="absolute -top-[2px] right-[0px] size-[5px] rounded-full bg-[#e5484d]"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            )}
          </motion.button>
        ))}
        <Avatar initials={trainer.initials} src={trainer.photo} size={27} />
      </div>
    </div>
  );
}

// Riga del titolo: freccia indietro (se c'è dove tornare), titolo, contenuti a sinistra e a destra.
export function TitleRow({ title, back, left, right }: { title: string; back?: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="relative z-30 mt-[10px] flex h-[24px] items-center justify-between pr-[18px] pl-[24px]">
      <div className="flex items-center gap-[12px]">
        {back && (
          <Link href={back} onClick={() => playSound("tap")} aria-label="Indietro" className="grid place-items-center">
            <motion.span whileHover={{ x: -2 }} whileTap={{ scale: 0.9 }}>
              <ArrowLeft size={17} strokeWidth={2.1} />
            </motion.span>
          </Link>
        )}
        <h1 className="text-[17px] font-bold tracking-[-0.02em] text-[#1f2421]">{title}</h1>
        {left}
      </div>
      <div className="flex items-center gap-[8px]">{right}</div>
    </div>
  );
}

const sideItems: NavItem[] = [
  { label: "Oggi", icon: House, href: ROUTES.oggi },
  { label: "Messaggi", icon: MessageSquare },
  { label: "Clienti", icon: Users, href: ROUTES.clienti },
  { label: "Schede", icon: Dumbbell },
  { label: "Calendario", icon: CalendarDays },
  { label: "Incassi", icon: Wallet },
  { label: "Impostazioni", icon: Settings },
];

export function Sidebar() {
  const section = useSection();
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-[218px] left-[18px] z-20 flex h-[420px] w-[49px] flex-col items-center gap-[19.7px] rounded-full bg-pill pt-[33px]"
    >
      {sideItems.map(({ label, icon: Icon, href }) => {
        const isActive = section === label;
        return (
          <div key={label} className="relative" onMouseEnter={() => setHover(label)} onMouseLeave={() => setHover(null)}>
            <motion.button
              type="button"
              aria-label={label}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                playSound("tap");
                if (href) router.push(href);
                else notYet(label);
              }}
              className={`grid size-[34px] cursor-pointer place-items-center rounded-full transition-colors duration-200 ${
                isActive ? "bg-[#4c4c4e] text-white" : hover === label ? "bg-[#2c2c2f] text-white" : "text-[#a9a9ad]"
              }`}
            >
              <Icon size={18} strokeWidth={1.9} />
            </motion.button>
            <AnimatePresence>
              {hover === label && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-none absolute top-1/2 left-[46px] -translate-y-1/2 rounded-full bg-pill px-[10px] py-[5px] text-[11px] font-medium whitespace-nowrap text-white shadow-lg"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.aside>
  );
}

export function SoundPill() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(isSoundEnabled());
    return onSoundChange(setOn);
  }, []);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        const next = !on;
        setSoundEnabled(next);
        if (next) playSound("confirm");
      }}
      className="absolute right-[14px] bottom-[12px] z-30 flex h-[36px] cursor-pointer items-center gap-[10px] rounded-full bg-[#1d1f22] pr-[6px] pl-[14px] text-[12px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
    >
      <span className={`size-[7px] rounded-full ${on ? "bg-[#3ddc84]" : "bg-[#6b6b70]"}`} />
      {on ? "Suoni attivi" : "Suoni spenti"}
      {on ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span className="grid size-[24px] place-items-center rounded-full bg-white/10">
        <Maximize2 size={11} />
      </span>
    </motion.button>
  );
}

// Cornice comune delle pagine del trainer: tela 1303 px, barra in alto, titolo, barra laterale, suoni.
export function TrainerShell({
  title,
  back,
  titleLeft,
  titleRight,
  children,
}: {
  title: string;
  back?: string;
  titleLeft?: ReactNode;
  titleRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <FitCanvas width={1303} minHeight={640}>
      <Appear i={0} className="relative z-30 pt-[11px]">
        <TopBar />
        <TitleRow title={title} back={back} left={titleLeft} right={titleRight} />
      </Appear>
      <Sidebar />
      {children}
      <SoundPill />
    </FitCanvas>
  );
}
