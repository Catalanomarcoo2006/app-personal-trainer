"use client";

import { ReactNode, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Dumbbell,
  FileText,
  House,
  MessageSquare,
  Moon,
  PanelTop,
  Search,
  Settings,
  Sun,
  TextAlignStart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar, FitCanvas } from "@/components/ui/basics";
import { Appear } from "@/components/ui/motion";
import { useAppearance } from "@/components/ui/appearance";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { CoachAssistant } from "./CoachAssistant";

const BASE = "/prototipo/trainer";

export const ROUTES = {
  oggi: BASE,
  clienti: `${BASE}/clienti`,
  cliente: (id: string) => `${BASE}/clienti/${id}`,
  messaggi: `${BASE}/messaggi`,
  schede: `${BASE}/schede`,
  calendario: `${BASE}/calendario`,
  incassi: `${BASE}/incassi`,
  impostazioni: `${BASE}/impostazioni`,
};

type Section = "Oggi" | "Messaggi" | "Clienti" | "Schede" | "Calendario" | "Incassi" | "Impostazioni";
type NavItem = { label: Section; icon: LucideIcon; href: string };

const tap = { whileTap: { scale: 0.92 }, whileHover: { y: -1.5 }, transition: { type: "spring" as const, stiffness: 500, damping: 28 } };

function useSection(): Section {
  const path = usePathname();
  const found = (["Messaggi", "Clienti", "Schede", "Calendario", "Incassi", "Impostazioni"] as const).find((s) =>
    path.startsWith(ROUTES[s.toLowerCase() as "messaggi"]),
  );
  return found ?? "Oggi";
}

function SquareButton({ icon: Icon, label, size = 16 }: { icon: LucideIcon; label: string; size?: number }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      {...tap}
      onClick={() => playSound("tap")}
      className="grid size-[33px] cursor-pointer place-items-center rounded-[10px] bg-card text-ink"
    >
      <Icon size={size} strokeWidth={2} />
    </motion.button>
  );
}

const navItems: NavItem[] = [
  { label: "Oggi", icon: House, href: ROUTES.oggi },
  { label: "Clienti", icon: Users, href: ROUTES.clienti },
  { label: "Incassi", icon: FileText, href: ROUTES.incassi },
  { label: "Impostazioni", icon: Settings, href: ROUTES.impostazioni },
];

// Interruttore del tema: il nuovo tema parte dal punto del clic.
export function ThemeButton({ size = 15 }: { size?: number }) {
  const { theme, setTheme } = useAppearance();
  const dark = theme === "dark";
  return (
    <motion.button
      type="button"
      aria-label={dark ? "Tema chiaro" : "Tema scuro"}
      title={dark ? "Tema chiaro" : "Tema scuro"}
      {...tap}
      onClick={(e) => {
        playSound("tap");
        setTheme(dark ? "light" : "dark", { x: e.clientX, y: e.clientY });
      }}
      className="relative grid cursor-pointer place-items-center"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="grid"
        >
          {dark ? <Sun size={size} strokeWidth={1.9} /> : <Moon size={size} strokeWidth={1.9} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
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

      <nav className="flex h-[35px] w-[395px] items-center justify-between rounded-full bg-card px-[4px]">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = label === section;
          return (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound("tap");
                router.push(href);
              }}
              className={`relative flex h-[27px] cursor-pointer items-center gap-[6px] rounded-full px-[14px] text-[12.5px] font-medium transition-colors duration-300 ${
                isActive ? "text-on-contrast" : "text-ink/75 hover:text-ink"
              }`}
            >
              {isActive && <span className="absolute inset-0 rounded-full bg-contrast" />}
              <Icon size={14} strokeWidth={1.9} className="relative" />
              <span className="relative">{label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="flex h-[35px] w-[147px] items-center justify-between rounded-full bg-card pr-[4px] pl-[14px] text-ink">
        <ThemeButton />
        <motion.button type="button" {...tap} onClick={() => playSound("tap")} className="relative cursor-pointer" aria-label="Avvisi">
          <Bell size={15} strokeWidth={1.9} />
          <motion.span
            className="absolute -top-[2px] right-[0px] size-[5px] rounded-full bg-[#e5484d]"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </motion.button>
        <motion.button type="button" {...tap} onClick={() => playSound("tap")} className="cursor-pointer" aria-label="Cerca">
          <Search size={15} strokeWidth={1.9} />
        </motion.button>
        <Link href={ROUTES.impostazioni} onClick={() => playSound("tap")} aria-label="Il tuo profilo">
          <Avatar initials={trainer.initials} src={trainer.photo} size={27} />
        </Link>
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
        <h1 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h1>
        {left}
      </div>
      <div className="flex items-center gap-[8px]">{right}</div>
    </div>
  );
}

const sideItems: NavItem[] = [
  { label: "Oggi", icon: House, href: ROUTES.oggi },
  { label: "Messaggi", icon: MessageSquare, href: ROUTES.messaggi },
  { label: "Clienti", icon: Users, href: ROUTES.clienti },
  { label: "Schede", icon: Dumbbell, href: ROUTES.schede },
  { label: "Calendario", icon: CalendarDays, href: ROUTES.calendario },
  { label: "Incassi", icon: Wallet, href: ROUTES.incassi },
  { label: "Impostazioni", icon: Settings, href: ROUTES.impostazioni },
];

// Macchie di colore molto sfocate dietro l'interfaccia: il vetro della barra laterale le sfoca e le ravviva.
function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="ambient-blob" style={{ left: -70, top: "calc(50% - 170px)", width: 210, height: 210, background: "var(--trainer)" }} />
      <span className="ambient-blob" style={{ left: -40, top: "calc(50% + 40px)", width: 180, height: 180, background: "var(--color-sky-strong)", animationDelay: "-6s" }} />
      <span className="ambient-blob" style={{ left: 10, top: "calc(50% + 170px)", width: 140, height: 140, background: "var(--color-mint-strong)", animationDelay: "-11s" }} />
    </div>
  );
}

const SPRING = { type: "spring" as const, duration: 0.5, bounce: 0.2 };

export function Sidebar() {
  const section = useSection();
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  // Prima etichetta con un piccolo ritardo; spostandosi sulle icone vicine compaiono subito e senza animazione.
  const [warm, setWarm] = useState(false);
  const timer = useRef<number | null>(null);

  const enter = (label: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    if (warm) setHover(label);
    else
      timer.current = window.setTimeout(() => {
        setHover(label);
        setWarm(true);
      }, 280);
  };
  const leaveBar = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setHover(null);
    timer.current = window.setTimeout(() => setWarm(false), 300);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onMouseLeave={leaveBar}
      className="glass glass-3d absolute top-[calc(50%+40px)] left-[16px] z-20 flex h-[420px] w-[56px] -translate-y-1/2 flex-col items-center gap-[19px] rounded-full pt-[32px]"
    >
      {sideItems.map(({ label, icon: Icon, href }) => {
        const isActive = section === label;
        return (
          <div key={label} className="relative" onMouseEnter={() => enter(label)}>
            {isActive && <motion.span layoutId="goccia-barra" className="glass-drop absolute inset-[-1px] rounded-full" transition={SPRING} />}
            <motion.button
              type="button"
              aria-label={label}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={() => {
                playSound("tap");
                router.push(href);
              }}
              className={`relative grid size-[36px] cursor-pointer place-items-center rounded-full transition-colors duration-200 ${
                isActive ? "text-ink" : "text-ink/50 [@media(hover:hover)]:hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.1 : 1.8} />
            </motion.button>
            <AnimatePresence>
              {hover === label && (
                <motion.span
                  initial={warm ? false : { opacity: 0, scale: 0.97, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="glass pointer-events-none absolute top-1/2 left-[50px] origin-left -translate-y-1/2 rounded-full px-[11px] py-[5px] text-[11px] font-semibold whitespace-nowrap text-ink"
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
      <AmbientBackdrop />
      <Appear i={0} className="relative z-30 pt-[11px]">
        <TopBar />
        <TitleRow title={title} back={back} left={titleLeft} right={titleRight} />
      </Appear>
      <Sidebar />
      {children}
      <CoachAssistant />
    </FitCanvas>
  );
}
