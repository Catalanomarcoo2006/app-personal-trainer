"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronRight, TrendingUp } from "lucide-react";
import { CountUp, EASE_OUT, formatEuro } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { revenue } from "@/libs/prototipo/dati-finti";
import { useClienti, useIncassi, usePagamenti } from "@/libs/dati/selettori";
import { ROUTES } from "./nav";
import { ClientAvatar } from "./shared";

type Month = { label: string; value: number };

// L'ultimo mese del grafico è quello in corso: segue l'incassato vero (pagamenti segnati nell'app e da Leo).
export const mesiConOggi = (collected: number): Month[] => revenue.months.map((m, i, all) => (i === all.length - 1 ? { ...m, value: collected } : m));

const FULL: Record<string, string> = {
  Gen: "Gennaio",
  Feb: "Febbraio",
  Mar: "Marzo",
  Apr: "Aprile",
  Mag: "Maggio",
  Giu: "Giugno",
  Lug: "Luglio",
  Ago: "Agosto",
  Set: "Settembre",
  Ott: "Ottobre",
  Nov: "Novembre",
  Dic: "Dicembre",
};

const compact = (v: number) => `${(v / 1000).toFixed(1).replace(".", ",")}k`;

// Incassi degli ultimi mesi, una serie sola nel colore del trainer: il mese in corso è pieno e ha la cifra
// scritta, gli altri sono tenui e mostrano la cifra al passaggio del mouse. La linea tratteggiata è la media.
// Le barre crescono una volta all'apertura, poi il grafico resta fermo: niente animazioni continue.
export function RevenueChart({ months = revenue.months }: { months?: Month[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...months.map((m) => m.value)) * 1.18;
  const avg = months.reduce((s, m) => s + m.value, 0) / months.length;
  const last = months.length - 1;
  const pct = (v: number) => `${(v / max) * 100}%`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1" onMouseLeave={() => setHover(null)}>
        {/* griglia leggera */}
        {[0.33, 0.66].map((t) => (
          <span key={t} aria-hidden className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${t * 100}%` }} />
        ))}
        <span aria-hidden className="absolute inset-x-0 bottom-0 border-t border-line" />

        {/* media */}
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.6, ease: EASE_OUT }}
          className="absolute inset-x-0 z-10 origin-left border-t-[1.5px] border-dashed border-ink/30"
          style={{ bottom: pct(avg) }}
        >
          <span className="absolute left-0 bottom-[3px] rounded-full bg-card/80 px-[5px] text-[9.5px] font-semibold text-muted">media {compact(avg)}</span>
        </motion.div>

        <div className="absolute inset-0 grid gap-[8px]" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
          {months.map((m, i) => {
            const isLast = i === last;
            const lit = isLast || hover === i;
            return (
              <div key={m.label} className="relative flex cursor-default items-end justify-center" onMouseEnter={() => setHover(i)}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: pct(m.value) }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.6, ease: EASE_OUT }}
                  className="relative w-[58%] max-w-[34px] rounded-t-[8px] rounded-b-[3px] transition-[background,box-shadow] duration-200"
                  style={{
                    background: isLast
                      ? "linear-gradient(180deg, color-mix(in srgb, var(--trainer) 72%, white), var(--trainer))"
                      : `color-mix(in srgb, var(--trainer) ${hover === i ? 42 : 20}%, transparent)`,
                    boxShadow: isLast ? "0 10px 22px -8px color-mix(in srgb, var(--trainer) 70%, transparent), inset 0 1px 0 rgba(255,255,255,0.45)" : undefined,
                  }}
                >
                  {isLast && (
                    <span className="absolute -top-[19px] left-1/2 -translate-x-1/2 text-[11px] font-extrabold tabular-nums">{compact(m.value)}</span>
                  )}
                </motion.div>
                <AnimatePresence>
                  {hover === i && !isLast && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.08 } }}
                      transition={{ duration: 0.14 }}
                      className="pointer-events-none absolute z-20 rounded-[9px] bg-card px-[8px] py-[5px] text-center whitespace-nowrap shadow-[0_8px_20px_rgba(0,0,0,0.14)]"
                      style={{ bottom: `calc(${pct(m.value)} + 6px)` }}
                    >
                      <span className="block text-[9.5px] text-muted">{FULL[m.label] ?? m.label}</span>
                      <span className="block text-[12px] font-bold tabular-nums">{formatEuro(m.value)}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                {lit && <span className="sr-only">{`${FULL[m.label] ?? m.label}: ${formatEuro(m.value)}`}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-[6px] grid gap-[8px]" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
        {months.map((m, i) => (
          <span key={m.label} className={`text-center text-[10px] font-semibold ${i === last ? "text-ink" : "text-muted"}`}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RevenueCard() {
  // incassato e da incassare dallo store: seguono i pagamenti segnati nell'app e da Leo
  const incassi = useIncassi();
  const clients = useClienti();
  const pending = usePagamenti()
    .filter((p) => !p.paidOn)
    .map((p) => ({ id: p.id, clientId: p.clientId, amount: p.amountCents / 100, detail: p.description.toLowerCase() }));
  const collected = incassi.collectedCents / 100;
  const outstanding = incassi.outstandingCents / 100;
  const clientById = (id: string) => clients.find((c) => c.id === id);
  const collectedPct = (collected / revenue.forecast) * 100;
  const outstandingPct = (outstanding / revenue.forecast) * 100;
  const missing = Math.max(0, revenue.forecast - collected - outstanding);

  return (
    <section className="panel flex h-full flex-col rounded-[18px] px-[16px] pt-[13px] pb-[13px]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-ink/60">Incassi di {revenue.month.toLowerCase()}</p>
        <Link
          href={ROUTES.incassi}
          onClick={() => playSound("tap")}
          aria-label="Apri incassi"
          className="grid size-[28px] place-items-center rounded-full border border-line transition-transform hover:-translate-y-[1.5px]"
        >
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="mt-[4px] flex items-end justify-between gap-[8px]">
        <p className="text-[34px] leading-none font-extrabold tracking-[-0.04em]">
          <CountUp value={collected} format={formatEuro} delay={0.15} duration={0.9} />
        </p>
        <span className="mb-[4px] flex shrink-0 items-center gap-[4px] rounded-full bg-ok-soft px-[8px] py-[3px] text-[10.5px] font-bold text-ok">
          <TrendingUp size={11} strokeWidth={2.6} /> +{revenue.delta}% su settembre
        </span>
      </div>

      {/* verso il previsto del mese: incassato pieno, da incassare tenue, il resto è binario */}
      <div className="mt-[12px]">
        <div className="flex h-[10px] gap-[2px] overflow-hidden rounded-full bg-soft">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${collectedPct}%` }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE_OUT }}
            className="h-full rounded-full"
            style={{ background: "var(--trainer)" }}
          />
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${outstandingPct}%` }}
            transition={{ delay: 0.75, duration: 0.4, ease: EASE_OUT }}
            className="h-full rounded-full"
            style={{
              background: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--trainer) 55%, transparent) 0 3px, color-mix(in srgb, var(--trainer) 25%, transparent) 3px 6px)",
            }}
          />
        </div>
        <div className="mt-[7px] flex items-center justify-between text-[10.5px]">
          <span className="text-muted">
            <b className="font-bold text-ink">{Math.round(collectedPct)}%</b> del previsto · {formatEuro(revenue.forecast)}
          </span>
          <span className="text-muted">mancano {formatEuro(missing)}</span>
        </div>
      </div>

      <p className="mt-[14px] text-[11px] font-semibold text-ink/60">Ultimi 6 mesi</p>
      <div className="mt-[18px] min-h-[90px] flex-1">
        <RevenueChart months={mesiConOggi(collected)} />
      </div>

      {/* chi deve ancora pagare: un clic e si apre il profilo */}
      <div className="mt-[12px]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-[6px] text-[11px] font-semibold text-ink/60">
            <span className="size-[6px] rounded-full bg-[#f5a524]" /> Da incassare
          </p>
          <span className="text-[11px] font-bold tabular-nums">{formatEuro(outstanding)}</span>
        </div>
        <div className="mt-[6px] flex flex-col gap-[5px]">
          {pending.map((p) => {
            const c = clientById(p.clientId);
            if (!c) return null;
            return (
              <Link
                key={p.id}
                href={ROUTES.cliente(p.clientId)}
                onClick={() => playSound("tap")}
                className="glass-row group flex items-center gap-[9px] rounded-[12px] px-[9px] py-[6px]"
              >
                <ClientAvatar c={c} size={24} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[11.5px] font-bold">{c.name}</span>
                  <span className="block truncate text-[10px] text-muted">{p.detail}</span>
                </span>
                <span className="text-[12px] font-bold tabular-nums">{formatEuro(p.amount)}</span>
                <ChevronRight size={13} className="text-ink/35 transition-transform group-hover:translate-x-[2px]" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
