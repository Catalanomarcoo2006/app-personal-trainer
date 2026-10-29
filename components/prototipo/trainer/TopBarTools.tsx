"use client";

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  CalendarPlus,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { notifications, NotificationKind } from "@/libs/prototipo/dati-finti";
import { useClienti, useTrovaCliente } from "@/libs/dati/selettori";
import { navigate, ROUTES } from "./nav";
import { chiediNuovaSeduta } from "./richieste";
import { ClientAvatar } from "./shared";

// ——— Novità: cosa è successo di recente (nel pannello degli urgenti, sotto "Da fare subito") ———

const kindIcon: Record<NotificationKind, LucideIcon> = { allenamento: Dumbbell, messaggio: MessageSquare, pagamento: Wallet, misure: Ruler, scheda: SquarePen };

export function NovitaRecenti({ onScelta }: { onScelta: () => void }) {
  const clientById = useTrovaCliente();
  const hrefOf = (n: (typeof notifications)[number]) =>
    n.to === "messaggi" ? `${ROUTES.messaggi}?cliente=${n.clientId}` : n.to === "incassi" ? ROUTES.incassi : ROUTES.cliente(n.clientId);

  return (
    <div className="flex flex-col gap-[4px]">
      {notifications.map((n, i) => {
        const c = clientById(n.clientId);
        const Icon = kindIcon[n.kind];
        return (
          <motion.button
            key={n.text}
            type="button"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 + i * 0.035, duration: 0.25, ease: EASE_OUT }}
            onClick={() => {
              playSound("tap");
              onScelta();
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
            <ChevronRight size={14} className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-[2px]" />
          </motion.button>
        );
      })}
    </div>
  );
}

// ——— Ricerca: la lente si apre dentro la barra in un campo (anche con Ctrl+K); i risultati scendono sotto ———

type Result = { group: "Clienti" | "Sezioni" | "Azioni"; label: string; detail: string; href: string; icon?: LucideIcon; clientId?: string; prima?: () => void };

const sections: Result[] = [
  { group: "Sezioni", label: "Oggi", detail: "La tua giornata", get href() { return ROUTES.oggi; }, icon: House },
  { group: "Sezioni", label: "Messaggi", detail: "Conversazioni con i clienti", get href() { return ROUTES.messaggi; }, icon: MessageSquare },
  { group: "Sezioni", label: "Clienti", detail: "Tutti i tuoi clienti", get href() { return ROUTES.clienti; }, icon: Users },
  { group: "Sezioni", label: "Schede", detail: "Schede di allenamento", get href() { return ROUTES.schede; }, icon: Dumbbell },
  { group: "Sezioni", label: "Calendario", detail: "Appuntamenti della settimana", get href() { return ROUTES.calendario; }, icon: CalendarDays },
  { group: "Sezioni", label: "Incassi", detail: "Pagamenti e pacchetti", get href() { return ROUTES.incassi; }, icon: Wallet },
  { group: "Sezioni", label: "Impostazioni", detail: "Profilo, colore, avvisi", get href() { return ROUTES.impostazioni; }, icon: Settings },
];

const actions: Result[] = [
  { group: "Azioni", label: "Nuova scheda", detail: "Crea una scheda di allenamento", get href() { return ROUTES.schede; }, icon: SquarePen },
  { group: "Azioni", label: "Nuova seduta", detail: "Fissa un appuntamento", get href() { return ROUTES.calendario; }, icon: CalendarPlus, prima: chiediNuovaSeduta },
  { group: "Azioni", label: "Registra un pagamento", detail: "Segna un incasso", get href() { return ROUTES.incassi; }, icon: Wallet },
];

// minuscole e senza accenti: "lunedi" trova "Lunedì"
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const MOLLA = { type: "spring" as const, stiffness: 380, damping: 30 };

export function RicercaInBarra() {
  const clientById = useTrovaCliente();
  const clients = useClienti();
  const clientResults: Result[] = useMemo(() => clients.map((c) => ({ group: "Clienti", label: c.name, detail: `${c.goal} · ${c.pkg.left}`, href: ROUTES.cliente(c.id), clientId: c.id })), [clients]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  const apri = () => {
    setQuery("");
    setActive(0);
    setOpen(true);
  };
  const chiudi = () => setOpen(false);

  // Ctrl+K apre la ricerca da qualsiasi pagina; un clic fuori la chiude
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        playSound("open");
        apri();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => input.current?.focus(), 30);
    const fuori = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fuori);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", fuori);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [...clientResults.slice(0, 4), ...sections.slice(1, 6)];
    return [...clientResults, ...sections, ...actions].filter((r) => norm(`${r.label} ${r.detail}`).includes(q));
  }, [query, clientResults]);

  const choose = (r: Result | undefined) => {
    if (!r) return;
    playSound("tap");
    setOpen(false);
    r.prima?.();
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
      playSound("close");
      chiudi();
    }
  };

  return (
    <div ref={box} className="relative flex items-center">
      {/* la lente si allunga in un campo: la barra cresce con lei e spinge le altre icone */}
      <motion.div
        initial={false}
        animate={{ width: open ? 214 : 22 }}
        transition={MOLLA}
        className="flex h-[27px] items-center overflow-hidden rounded-full"
        style={open ? { background: "var(--color-card)", boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, var(--trainer) 75%, transparent)" } : undefined}
      >
        <button
          type="button"
          aria-label="Cerca"
          title="Cerca (Ctrl+K)"
          onClick={() => {
            if (open) return input.current?.focus();
            playSound("open");
            apri();
          }}
          className="grid size-[22px] shrink-0 cursor-pointer place-items-center"
          style={open ? { color: "var(--trainer)", marginLeft: 4 } : undefined}
        >
          <Search size={open ? 13 : 15} strokeWidth={open ? 2.2 : 1.9} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div key="campo" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.08 } }} exit={{ opacity: 0, transition: { duration: 0.08 } }} className="flex min-w-0 flex-1 items-center gap-[4px] pr-[4px]">
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Cerca clienti, sezioni…"
                className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted"
              />
              <kbd className="rounded-[5px] bg-soft px-[4px] py-[1px] text-[8.5px] font-bold text-muted">ESC</kbd>
              <button
                type="button"
                aria-label="Chiudi la ricerca"
                onClick={() => {
                  playSound("close");
                  chiudi();
                }}
                className="grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Risultati della ricerca"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.14 } }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="absolute top-[38px] -right-[46px] z-50 w-[380px] origin-top-right overflow-hidden rounded-[20px] bg-card shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
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
            <div className="flex items-center gap-[14px] border-t border-line px-[16px] py-[8px] text-[10.5px] text-muted">
              <span>↑ ↓ per muoverti</span>
              <span>Invio per aprire</span>
              <span className="ml-auto">Ctrl K per riaprire</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
