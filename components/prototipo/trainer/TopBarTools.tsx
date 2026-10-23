"use client";

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  CheckCheck,
  ChevronRight,
  Dumbbell,
  House,
  MessageSquare,
  Ruler,
  Search,
  Settings,
  SquarePen,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { clientById, clients, notifications, NotificationKind } from "@/libs/prototipo/dati-finti";
import { navigate, ROUTES } from "./nav";
import { ClientAvatar } from "./shared";

const tap = { whileTap: { scale: 0.92 }, whileHover: { y: -1.5 }, transition: { type: "spring" as const, stiffness: 500, damping: 28 } };

// ——— Campanello: cosa è successo di recente ———

const kindIcon: Record<NotificationKind, LucideIcon> = { allenamento: Dumbbell, messaggio: MessageSquare, pagamento: Wallet, misure: Ruler, scheda: SquarePen };

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const hrefOf = (n: (typeof notifications)[number]) =>
    n.to === "messaggi" ? `${ROUTES.messaggi}?cliente=${n.clientId}` : n.to === "incassi" ? ROUTES.incassi : ROUTES.cliente(n.clientId);

  return (
    <div ref={box} className="relative grid">
      <motion.button
        type="button"
        {...tap}
        aria-label="Avvisi"
        aria-expanded={open}
        title="Avvisi"
        onClick={() => {
          playSound(open ? "close" : "open");
          setOpen((o) => !o);
        }}
        className="relative cursor-pointer"
      >
        <Bell size={15} strokeWidth={1.9} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="pallino"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="absolute -top-[2px] right-[0px] size-[5px] rounded-full bg-[#e5484d]"
            />
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.14 } }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="absolute top-[30px] -right-[60px] z-50 w-[340px] origin-top-right rounded-[20px] bg-card p-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold">Avvisi</p>
              <button
                type="button"
                disabled={unread === 0}
                onClick={() => {
                  playSound("tap");
                  setUnread(0);
                }}
                className="flex cursor-pointer items-center gap-[4px] text-[11px] font-semibold text-muted transition-colors hover:text-ink disabled:cursor-default disabled:opacity-50 disabled:hover:text-muted"
              >
                <CheckCheck size={13} /> {unread ? "Segna come letti" : "Tutto letto"}
              </button>
            </div>
            <div className="mt-[10px] flex flex-col gap-[4px]">
              {notifications.map((n, i) => {
                const c = clientById(n.clientId);
                const Icon = kindIcon[n.kind];
                const isNew = i < unread;
                return (
                  <motion.button
                    key={n.text}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 + i * 0.035, duration: 0.25, ease: EASE_OUT }}
                    onClick={() => {
                      playSound("tap");
                      setOpen(false);
                      navigate(hrefOf(n));
                    }}
                    className="group flex cursor-pointer items-center gap-[10px] rounded-[13px] px-[8px] py-[7px] text-left transition-colors hover:bg-soft"
                  >
                    <span className="relative shrink-0">
                      {c && <ClientAvatar c={c} size={32} />}
                      <span className="absolute -right-[3px] -bottom-[3px] grid size-[17px] place-items-center rounded-full border-2 border-card text-white" style={{ background: "var(--trainer)" }}>
                        <Icon size={9} strokeWidth={2.4} />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className="block text-[12px]">
                        <b className="font-bold">{c?.name.split(" ")[0]}</b> {n.text}
                      </span>
                      <span className="mt-[1px] block text-[10.5px] text-muted">{n.when}</span>
                    </span>
                    {isNew ? (
                      <span className="size-[7px] shrink-0 rounded-full" style={{ background: "var(--trainer)" }} />
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-[2px]" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ——— Ricerca: clienti, sezioni e azioni rapide (anche con Ctrl+K) ———

const OPEN_SEARCH = "apri-ricerca";

export function SearchButton() {
  return (
    <motion.button
      type="button"
      {...tap}
      aria-label="Cerca"
      title="Cerca (Ctrl+K)"
      onClick={() => {
        playSound("open");
        window.dispatchEvent(new Event(OPEN_SEARCH));
      }}
      className="relative grid cursor-pointer"
    >
      <Search size={15} strokeWidth={1.9} />
    </motion.button>
  );
}

type Result = { group: "Clienti" | "Sezioni" | "Azioni"; label: string; detail: string; href: string; icon?: LucideIcon; clientId?: string };

const sections: Result[] = [
  { group: "Sezioni", label: "Oggi", detail: "La tua giornata", href: ROUTES.oggi, icon: House },
  { group: "Sezioni", label: "Messaggi", detail: "Conversazioni con i clienti", href: ROUTES.messaggi, icon: MessageSquare },
  { group: "Sezioni", label: "Clienti", detail: "Tutti i tuoi clienti", href: ROUTES.clienti, icon: Users },
  { group: "Sezioni", label: "Schede", detail: "Schede di allenamento", href: ROUTES.schede, icon: Dumbbell },
  { group: "Sezioni", label: "Calendario", detail: "Appuntamenti della settimana", href: ROUTES.calendario, icon: CalendarDays },
  { group: "Sezioni", label: "Incassi", detail: "Pagamenti e pacchetti", href: ROUTES.incassi, icon: Wallet },
  { group: "Sezioni", label: "Impostazioni", detail: "Profilo, colore, avvisi", href: ROUTES.impostazioni, icon: Settings },
];

const actions: Result[] = [
  { group: "Azioni", label: "Nuova scheda", detail: "Crea una scheda di allenamento", href: ROUTES.schede, icon: SquarePen },
  { group: "Azioni", label: "Nuova seduta", detail: "Fissa un appuntamento", href: ROUTES.calendario, icon: CalendarPlus },
  { group: "Azioni", label: "Registra un pagamento", detail: "Segna un incasso", href: ROUTES.incassi, icon: Wallet },
];

const clientResults: Result[] = clients.map((c) => ({ group: "Clienti", label: c.name, detail: `${c.goal} · ${c.pkg.left}`, href: ROUTES.cliente(c.id), clientId: c.id }));

// minuscole e senza accenti: "lunedi" trova "Lunedì"
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const show = () => {
      setQuery("");
      setActive(0);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(OPEN_SEARCH, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 10);
  }, [open]);

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [...clientResults.slice(0, 4), ...sections.slice(1, 6)];
    return [...clientResults, ...sections, ...actions].filter((r) => norm(`${r.label} ${r.detail}`).includes(q));
  }, [query]);

  const choose = (r: Result | undefined) => {
    if (!r) return;
    playSound("tap");
    setOpen(false);
    navigate(r.href);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="ricerca" className="absolute inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.18 }}>
          <button type="button" aria-label="Chiudi la ricerca" onClick={() => {
            playSound("close");
            setOpen(false);
          }} className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-[5px]" />
          <motion.div
            role="dialog"
            aria-label="Cerca"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="absolute top-[80px] left-1/2 w-[540px] -translate-x-1/2 overflow-hidden rounded-[22px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-[10px] border-b border-line px-[18px]">
              <Search size={17} strokeWidth={2} className="shrink-0 text-muted" />
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Cerca un cliente, una sezione o un'azione"
                className="h-[54px] flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
              />
              <kbd className="rounded-[6px] border border-line px-[6px] py-[2px] text-[10px] font-semibold text-muted">Esc</kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-[8px] [scrollbar-width:none]">
              {results.length === 0 && <p className="px-[12px] py-[26px] text-center text-[13px] text-muted">Nessun risultato per “{query}”</p>}
              {results.map((r, i) => {
                const c = r.clientId ? clientById(r.clientId) : undefined;
                const Icon = r.icon;
                const first = i === 0 || results[i - 1].group !== r.group;
                return (
                  <div key={r.group + r.label}>
                    {first && <p className="px-[10px] pt-[8px] pb-[4px] text-[10px] font-semibold tracking-wide text-muted uppercase">{r.group}</p>}
                    <button
                      type="button"
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(r)}
                      className="relative flex w-full cursor-pointer items-center gap-[11px] rounded-[13px] px-[10px] py-[8px] text-left"
                    >
                      {i === active && <motion.span layoutId="risultato-attivo" className="absolute inset-0 rounded-[13px] bg-soft" transition={{ type: "spring", stiffness: 600, damping: 40 }} />}
                      {c ? (
                        <ClientAvatar c={c} size={30} className="relative" />
                      ) : (
                        <span className="relative grid size-[30px] shrink-0 place-items-center rounded-full bg-soft text-ink/70">{Icon && <Icon size={14} />}</span>
                      )}
                      <span className="relative min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[13px] font-semibold">{r.label}</span>
                        <span className="block truncate text-[11px] text-muted">{r.detail}</span>
                      </span>
                      {i === active && <ChevronRight size={15} className="relative shrink-0 text-ink/40" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-[14px] border-t border-line px-[18px] py-[9px] text-[10.5px] text-muted">
              <span>↑ ↓ per muoverti</span>
              <span>Invio per aprire</span>
              <span className="ml-auto">Ctrl K per riaprire</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
