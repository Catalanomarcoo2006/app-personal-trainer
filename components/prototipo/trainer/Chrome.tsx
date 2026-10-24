"use client";

import { memo, ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  FileText,
  House,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar, FitCanvas } from "@/components/ui/basics";
import { Appear, EASE_OUT } from "@/components/ui/motion";
import { useAppearance } from "@/components/ui/appearance";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { useTrainerPhoto } from "@/libs/prototipo/stato";
import { benvenutoAttuale } from "@/libs/prototipo/benvenuto";
import { BENVENUTO } from "@/components/prototipo/benvenuto/Benvenuto";
import { CoachAssistant } from "./CoachAssistant";
import { BASE, navigate, ROUTES } from "./nav";
import { NotificationsButton, SearchButton, SearchPalette } from "./TopBarTools";

export { BASE, ROUTES, navigate };

type Section = "Oggi" | "Messaggi" | "Clienti" | "Schede" | "Calendario" | "Incassi" | "Impostazioni";
type NavItem = { label: Section; icon: LucideIcon; href: string };

// Molla stile Apple per le "gocce" di vetro che scivolano tra le voci.
const SPRING = { type: "spring" as const, duration: 0.38, bounce: 0.18 };

const tap = { whileTap: { scale: 0.92 }, whileHover: { y: -1.5 }, transition: { type: "spring" as const, stiffness: 500, damping: 28 } };

// ——— Navigazione istantanea (vedi nav.ts) ———

// Anche i link normali (schede, "Vedi tutti", azioni di Leo, freccia indietro) passano da qui invece che dal server.
function InstantLinks(): null {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      // data-macchia: il link gestisce da sé la navigazione, con la macchia d'olio (link di Leo)
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-macchia")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE)) return;
      e.preventDefault();
      navigate(url.pathname + url.search);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

function useSection(): Section {
  const at = usePathname();
  const found = (["Messaggi", "Clienti", "Schede", "Calendario", "Incassi", "Impostazioni"] as const).find((s) => at.startsWith(ROUTES[s.toLowerCase() as "messaggi"]));
  return found ?? "Oggi";
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

  return (
    <div className="grid h-[35px] grid-cols-[1fr_auto_1fr] items-center pr-[18px] pl-[20px]">
      <span />

      <nav className="glass glass-3d relative flex h-[35px] w-[395px] items-center justify-between rounded-full px-[4px]">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = label === section;
          return (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.95 }}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                navigate(href);
                playSound("tap");
              }}
              className={`relative flex h-[27px] cursor-pointer items-center gap-[6px] rounded-full px-[14px] text-[12.5px] font-medium transition-colors duration-300 ${
                isActive ? "text-ink" : "text-ink/60 [@media(hover:hover)]:hover:text-ink"
              }`}
            >
              {isActive && <motion.span layoutId="goccia-menu" className="glass-drop absolute inset-0 rounded-full" transition={SPRING} />}
              <Icon size={14} strokeWidth={1.9} className="relative" />
              <span className="relative">{label}</span>
            </motion.button>
          );
        })}
      </nav>

      <TopBarRight />
    </div>
  );
}

// Tema, avvisi, ricerca e profilo: non dipendono dalla sezione, quindi cambiando pagina non si ridisegnano.
const TopBarRight = memo(function TopBarRight() {
  const photo = useTrainerPhoto();
  return (
    <div className="glass glass-3d relative flex h-[35px] w-[147px] items-center justify-between justify-self-end rounded-full pr-[4px] pl-[14px] text-ink">
      <ThemeButton />
      <NotificationsButton />
      <SearchButton />
      <Link href={ROUTES.impostazioni} onClick={() => playSound("tap")} aria-label="Il tuo profilo" className="relative">
        <Avatar initials={trainer.initials} src={photo} size={27} />
      </Link>
    </div>
  );
});

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
// Niente ritaglio ai bordi della tela: sugli schermi larghi le macchie sfumano anche nelle fasce laterali,
// invece di finire con un taglio verticale.
function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="ambient-blob" style={{ left: -120, top: "calc(50% - 190px)", width: 250, height: 230, background: "var(--trainer)" }} />
      <span className="ambient-blob" style={{ left: -100, top: "calc(50% + 30px)", width: 230, height: 190, background: "var(--color-sky-strong)", animationDelay: "-6s" }} />
      <span className="ambient-blob" style={{ left: -40, top: "calc(50% + 170px)", width: 170, height: 140, background: "var(--color-mint-strong)", animationDelay: "-11s" }} />
      <span className="ambient-blob" style={{ left: 470, top: -90, width: 220, height: 130, background: "var(--trainer)", animationDelay: "-3s" }} />
      <span className="ambient-blob" style={{ left: 700, top: -80, width: 200, height: 120, background: "var(--color-violet-strong)", animationDelay: "-9s" }} />
      <span className="ambient-blob" style={{ right: 40, top: -80, width: 180, height: 120, background: "var(--color-sky-strong)", animationDelay: "-13s" }} />
      <span className="ambient-blob" style={{ left: 0, top: -70, width: 160, height: 110, background: "var(--color-mint-strong)", animationDelay: "-5s" }} />
    </div>
  );
}

export function Sidebar() {
  const section = useSection();
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
      initial={{ opacity: 0, transform: "translateX(-16px)" }}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onMouseLeave={leaveBar}
      className="mosso glass glass-3d absolute top-[calc(50%+40px)] left-[16px] z-20 flex h-[420px] w-[56px] -translate-y-1/2 flex-col items-center gap-[19px] rounded-full pt-[32px]"
    >
      {sideItems.map(({ label, icon: Icon, href }) => {
        const isActive = section === label;
        return (
          <div key={label} className="relative" onMouseEnter={() => enter(label)}>
            {isActive && <motion.span layoutId="goccia-barra" className="glass-drop absolute inset-[-1px] rounded-full" transition={SPRING} />}
            <motion.button
              type="button"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={() => {
                navigate(href);
                playSound("tap");
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

// Cornice delle pagine del trainer, montata una volta sola dal layout: tela 1303 px, barra in alto,
// barra laterale e Leo restano fermi mentre cambia solo il contenuto.
export function TrainerFrame({ children }: { children: ReactNode }) {
  // primo accesso: prima il benvenuto (lo stato salvato si legge solo nel browser, dopo il montaggio)
  useEffect(() => {
    if (!benvenutoAttuale().fatto) window.location.replace(BENVENUTO);
  }, []);
  return (
    <FitCanvas width={1303} minHeight={640}>
      <AmbientBackdrop />
      <Appear i={0} className="relative z-40 pt-[11px]">
        <TopBar />
      </Appear>
      <Sidebar />
      {children}
      <CoachAssistant />
      <SearchPalette />
      <InstantLinks />
    </FitCanvas>
  );
}

// Parte di ogni pagina: titolo e contenuto. Barra in alto, barra laterale e Leo sono nel layout.
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
    <>
      <motion.div initial={{ opacity: 0, transform: "translateY(3px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.18, ease: EASE_OUT }} className="mosso relative z-30">
        <TitleRow title={title} back={back} left={titleLeft} right={titleRight} />
      </motion.div>
      {children}
    </>
  );
}
