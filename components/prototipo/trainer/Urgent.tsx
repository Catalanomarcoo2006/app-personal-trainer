"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronRight, Clock, Package, TriangleAlert, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { clientById, clients, urgent, UrgentKind } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./Chrome";
import { ClientAvatar } from "./shared";

const kinds: Record<UrgentKind, { icon: LucideIcon; color: string; bg: string; group: string }> = {
  imminente: { icon: Clock, color: "#e0562b", bg: "rgba(224,86,43,0.14)", group: "Appuntamenti imminenti" },
  pagamento: { icon: Wallet, color: "#c98a1e", bg: "rgba(201,138,30,0.16)", group: "Pagamenti mancanti" },
  dolore: { icon: TriangleAlert, color: "#d43b4f", bg: "rgba(212,59,79,0.14)", group: "Segnalazioni" },
  pacchetto: { icon: Package, color: "#6a5ae0", bg: "rgba(106,90,224,0.16)", group: "Pacchetti in scadenza" },
};

const order: UrgentKind[] = ["imminente", "pagamento", "dolore", "pacchetto"];

// Tasto "Clienti" accanto al titolo: porta alla lista dei clienti.
export function ClientsButton() {
  return (
    <Link href={ROUTES.clienti} onClick={() => playSound("tap")}>
      <motion.span
        whileHover={{ y: -1.5 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-[26px] items-center gap-[7px] rounded-full bg-contrast pr-[4px] pl-[12px] text-[12px] font-semibold text-on-contrast"
      >
        <Users size={13} /> Clienti
        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-on-contrast px-[5px] text-[10px] font-bold text-contrast">{clients.length}</span>
      </motion.span>
    </Link>
  );
}

// Campanello delle urgenze: oscilla ogni pochi secondi; al clic apre l'elenco di tutto ciò che va fatto subito.
export function UrgentBell() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <motion.button
        type="button"
        whileHover={{ y: -1.5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          playSound("tap");
          setOpen((o) => !o);
        }}
        className="flex h-[26px] cursor-pointer items-center gap-[7px] rounded-full bg-card pr-[4px] pl-[11px] text-[11.5px] font-semibold"
      >
        <motion.span
          className="grid origin-top"
          animate={{ rotate: [0, -16, 14, -10, 8, -4, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.6 }}
        >
          <Bell size={13} strokeWidth={2.2} />
        </motion.span>
        Urgenti
        <span className="relative grid size-[18px] place-items-center rounded-full bg-[#e5484d] text-[10px] font-bold text-white">
          <motion.span
            className="absolute inset-0 rounded-full bg-[#e5484d]"
            animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="relative">{urgent.length}</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="absolute top-[34px] right-0 z-50 w-[360px] origin-top-right rounded-[20px] bg-card p-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold">Da fare subito</p>
              <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="grid size-[24px] cursor-pointer place-items-center rounded-full bg-soft">
                <X size={12} />
              </button>
            </div>
            <div className="mt-[8px] flex max-h-[430px] flex-col gap-[10px] overflow-y-auto [scrollbar-width:none]">
              {order.map((kind) => {
                const items = urgent.filter((u) => u.kind === kind);
                if (!items.length) return null;
                const k = kinds[kind];
                return (
                  <div key={kind}>
                    <p className="mb-[5px] text-[10px] font-semibold tracking-wide text-muted uppercase">{k.group}</p>
                    <div className="flex flex-col gap-[5px]">
                      {items.map((u, i) => {
                        const c = clientById(u.clientId);
                        return (
                          <motion.div key={u.title + u.clientId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                            <Link
                              href={ROUTES.cliente(u.clientId)}
                              onClick={() => playSound("tap")}
                              className="group flex items-center gap-[9px] rounded-[12px] border border-line px-[9px] py-[7px] transition-colors hover:bg-soft"
                            >
                              <span className="grid size-[28px] shrink-0 place-items-center rounded-full" style={{ background: k.bg, color: k.color }}>
                                <k.icon size={14} />
                              </span>
                              <div className="min-w-0 flex-1 leading-none">
                                <p className="text-[12px] font-bold">{u.title}</p>
                                <p className="mt-[3px] truncate text-[10.5px] text-muted">{u.detail}</p>
                              </div>
                              {c && <ClientAvatar c={c} size={24} />}
                              <ChevronRight size={14} className="text-ink/40 transition-transform group-hover:translate-x-[2px]" />
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Avviso che scivola dall'alto per l'appuntamento imminente, poi si ritira da solo.
export function UrgentToast() {
  const [show, setShow] = useState(false);
  const next = urgent.find((u) => u.kind === "imminente");

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setShow(true);
      playSound("confirm");
    }, 1800);
    const t2 = window.setTimeout(() => setShow(false), 9000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (!next) return null;
  const c = clientById(next.clientId);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -40, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="absolute top-[47px] left-1/2 z-40 flex h-[40px] items-center gap-[10px] rounded-full bg-contrast pr-[5px] pl-[6px] text-on-contrast shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
        >
          <span className="relative grid size-[30px] place-items-center rounded-full bg-on-contrast/10">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[var(--trainer)]"
              animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
              transition={{ duration: 1.3, repeat: Infinity }}
            />
            <Clock size={14} />
          </span>
          <p className="text-[12px] whitespace-nowrap">
            <b>{next.title}</b> <span className="text-on-contrast/65">· {c?.name}, ore 11:00</span>
          </p>
          <Link
            href={ROUTES.cliente(next.clientId)}
            onClick={() => playSound("tap")}
            className="rounded-full bg-on-contrast px-[12px] py-[7px] text-[11px] font-bold text-contrast"
          >
            Apri scheda
          </Link>
          <button type="button" aria-label="Chiudi" onClick={() => setShow(false)} className="grid size-[28px] cursor-pointer place-items-center rounded-full text-on-contrast/60 hover:text-on-contrast">
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
