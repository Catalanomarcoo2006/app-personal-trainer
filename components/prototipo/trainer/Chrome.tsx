"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
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
import { Appear, EASE_OUT } from "@/components/ui/motion";
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

// Molla stile Apple per le "gocce" di vetro che scivolano tra le voci.
const SPRING = { type: "spring" as const, duration: 0.5, bounce: 0.2 };

const tap = { whileTap: { scale: 0.92 }, whileHover: { y: -1.5 }, transition: { type: "spring" as const, stiffness: 500, damping: 28 } };

// ——— Navigazione: risponde al clic subito, anche mentre la pagina nuova arriva ———

type Nav = { target: string | null; pending: boolean; go: (href: string) => void };
const NavContext = createContext<Nav>({ target: null, pending: false, go: () => {} });
const useNav = () => useContext(NavContext);

function NavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [target, setTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Arrivati alla pagina nuova, la richiesta è chiusa.
  useEffect(() => setTarget(null), [path]);

  const go = useCallback(
    (href: string) => {
      if (href === path) return;
      setTarget(href);
      startTransition(() => router.push(href));
    },
    [path, router],
  );

  // Anche i link normali (schede, "Vedi tutti", azioni di Leo) accendono subito la barra di avanzamento.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE) || url.pathname === window.location.pathname) return;
      setTarget(url.pathname);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Se per qualche motivo la pagina non cambia, la richiesta non resta appesa.
  useEffect(() => {
    if (!target) return;
    const t = window.setTimeout(() => setTarget(null), 10000);
    return () => window.clearTimeout(t);
  }, [target]);

  return <NavContext.Provider value={{ target, pending: pending || !!target, go }}>{children}</NavContext.Provider>;
}

// Barra sottile in alto mentre la pagina nuova arriva.
function NavProgress() {
  const { pending } = useNav();
  return (
    <AnimatePresence>
      {pending && (
        <motion.div key="avanzamento" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[60] h-[2.5px] overflow-hidden" exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.1 } }}>
          <motion.div
            className="h-full origin-left rounded-r-full"
            style={{ background: "var(--trainer)", boxShadow: "0 0 10px var(--trainer)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.85 }}
            exit={{ scaleX: 1 }}
            transition={{ duration: 2.4, ease: EASE_OUT }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Prepara in sottofondo le altre pagine, così il primo clic non aspetta.
// In sviluppo Next compila ogni pagina alla prima visita: la "visitiamo" noi prima del trainer.
const WARM_ROUTES = [ROUTES.oggi, ROUTES.messaggi, ROUTES.clienti, ROUTES.schede, ROUTES.calendario, ROUTES.incassi, ROUTES.impostazioni, ROUTES.cliente("giulia-bianchi")];

function RouteWarmup(): null {
  const router = useRouter();
  useEffect(() => {
    WARM_ROUTES.forEach((r) => router.prefetch(r));
    if (process.env.NODE_ENV !== "development") return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      for (const r of WARM_ROUTES) {
        if (cancelled) return;
        if (r === window.location.pathname) continue;
        try {
          await fetch(r, { credentials: "same-origin" });
        } catch {}
      }
    }, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [router]);
  return null;
}

function useSection(): Section {
  const path = usePathname();
  const { target } = useNav();
  const at = target ?? path;
  const found = (["Messaggi", "Clienti", "Schede", "Calendario", "Incassi", "Impostazioni"] as const).find((s) => at.startsWith(ROUTES[s.toLowerCase() as "messaggi"]));
  return found ?? "Oggi";
}

function SquareButton({ icon: Icon, label, size = 16 }: { icon: LucideIcon; label: string; size?: number }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      {...tap}
      onClick={() => playSound("tap")}
      className="glass glass-3d relative grid size-[33px] cursor-pointer place-items-center rounded-[11px] text-ink"
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
  const { go } = useNav();

  return (
    <div className="flex h-[35px] items-center justify-between pr-[18px] pl-[20px]">
      <div className="flex gap-[10px]">
        <SquareButton icon={TextAlignStart} label="Menu" />
        <SquareButton icon={PanelTop} label="Pannelli" size={14} />
      </div>

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
                playSound("tap");
                go(href);
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

      <div className="glass glass-3d relative flex h-[35px] w-[147px] items-center justify-between rounded-full pr-[4px] pl-[14px] text-ink">
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
      <span className="ambient-blob" style={{ left: 470, top: -90, width: 220, height: 130, background: "var(--trainer)", animationDelay: "-3s" }} />
      <span className="ambient-blob" style={{ left: 700, top: -80, width: 200, height: 120, background: "var(--color-violet-strong)", animationDelay: "-9s" }} />
      <span className="ambient-blob" style={{ right: 40, top: -80, width: 180, height: 120, background: "var(--color-sky-strong)", animationDelay: "-13s" }} />
      <span className="ambient-blob" style={{ left: 0, top: -70, width: 160, height: 110, background: "var(--color-mint-strong)", animationDelay: "-5s" }} />
    </div>
  );
}

export function Sidebar() {
  const section = useSection();
  const { go } = useNav();
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
              aria-current={isActive ? "page" : undefined}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={() => {
                playSound("tap");
                go(href);
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
  return (
    <NavProvider>
      <FitCanvas width={1303} minHeight={640}>
        <AmbientBackdrop />
        <NavProgress />
        <Appear i={0} className="relative z-30 pt-[11px]">
          <TopBar />
        </Appear>
        <Sidebar />
        {children}
        <CoachAssistant />
        <RouteWarmup />
      </FitCanvas>
    </NavProvider>
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
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="relative z-30">
        <TitleRow title={title} back={back} left={titleLeft} right={titleRight} />
      </motion.div>
      {children}
    </>
  );
}
