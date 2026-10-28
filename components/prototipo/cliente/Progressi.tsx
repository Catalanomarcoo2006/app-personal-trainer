"use client";

// Progressi del cliente: obiettivo in grande, peso con il grafico, circonferenze con quanto sono calate e lo storico
// delle rilevazioni. "Aggiungi misure" salva con lo sportello dei dati (libs/dati/sportello.ts), con gli stessi
// controlli di quando le aggiunge il trainer: le nuove misure le vede subito anche lui nel profilo del cliente.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Plus, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import SoftAreaChart from "@/components/ui/SoftAreaChart";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { useCliente } from "@/libs/dati/selettori";
import { useStato } from "@/libs/prototipo/stato";
import { aggiungiMisura } from "@/libs/dati/sportello";
import { OGGI } from "@/libs/dati/iniziali";
import { dataBreve } from "@/libs/dati/vista";
import type { Misura } from "@/libs/dati/tipi";
import { Foglio } from "./Foglio";
import { CLIENTE_DEMO } from "./scheda";
import { ID_FOGLI } from "./nav";

const numero = (n: number, cifre = 1) => n.toLocaleString("it-IT", { maximumFractionDigits: cifre });
const CAMPI: { k: Exclude<keyof Misura, "id" | "clientId" | "takenOn">; label: string; unita: string }[] = [
  { k: "weightKg", label: "Peso", unita: "kg" },
  { k: "waistCm", label: "Vita", unita: "cm" },
  { k: "hipsCm", label: "Fianchi", unita: "cm" },
  { k: "chestCm", label: "Petto", unita: "cm" },
  { k: "armCm", label: "Braccio", unita: "cm" },
  { k: "thighCm", label: "Coscia", unita: "cm" },
];

// "68,5", "68.5", " 68 " → numero; vuoto → undefined; "abc" → NaN (il controllo lo rifiuta con il suo messaggio)
const leggi = (t: string): number | undefined => (t.trim() ? Number(t.trim().replace(",", ".")) : undefined);

function AggiungiMisure({ aperto, onChiudi }: { aperto: boolean; onChiudi: () => void }) {
  const [valori, setValori] = useState<Record<string, string>>({});
  const [errore, setErrore] = useState<string | null>(null);
  const chiudi = () => {
    setErrore(null);
    onChiudi();
  };
  const salva = async () => {
    const m: Omit<Misura, "id"> = { clientId: CLIENTE_DEMO, takenOn: OGGI };
    for (const c of CAMPI) {
      const v = leggi(valori[c.k] ?? "");
      if (v !== undefined && Number.isNaN(v)) return setErrore(`${c.label}: scrivi solo il numero, per esempio 68,5`);
      if (v !== undefined) m[c.k] = v;
    }
    const esito = await aggiungiMisura(m);
    if ("motivo" in esito) return setErrore(esito.motivo);
    playSound("complete");
    toast.success(`Misure salvate: ${trainer.name.split(" ")[0]} le vede nella tua scheda`);
    setValori({});
    chiudi();
  };
  return (
    <Foglio aperto={aperto} onChiudi={chiudi} titolo="Aggiungi misure">
      <p className="mt-[4px] text-[12.5px] text-muted">Di oggi. Scrivi solo quelle che hai preso, le altre lasciale vuote.</p>
      <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
        {CAMPI.map((c) => (
          <label key={c.k} className="block">
            <span className="mb-[5px] block text-[12px] font-semibold text-muted">{c.label}</span>
            <span className="flex h-[48px] items-center rounded-[14px] border border-line bg-soft px-[12px] focus-within:border-[var(--trainer)]">
              <input
                inputMode="decimal"
                value={valori[c.k] ?? ""}
                onChange={(e) => {
                  setErrore(null);
                  setValori((v) => ({ ...v, [c.k]: e.target.value }));
                }}
                placeholder="—"
                className="min-w-0 flex-1 bg-transparent text-[16px] font-bold tabular-nums outline-none placeholder:font-normal placeholder:text-muted"
              />
              <span className="text-[12px] text-muted">{c.unita}</span>
            </span>
          </label>
        ))}
      </div>
      {errore && <p className="mt-[10px] text-[12.5px] font-semibold text-[#e5484d]">{errore}</p>}
      <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void salva()} disabled={!Object.values(valori).some((v) => v.trim())} className="btn-trainer mt-[16px] h-[48px] w-full cursor-pointer rounded-full text-[14px] font-bold disabled:cursor-default disabled:opacity-40">
        Salva le misure
      </motion.button>
    </Foglio>
  );
}

export function Progressi() {
  const c = useCliente(CLIENTE_DEMO);
  const tutte = useStato((s) => s.dati.misure);
  const righe = useMemo(() => tutte.filter((m) => m.clientId === CLIENTE_DEMO).sort((a, b) => b.takenOn.localeCompare(a.takenOn)), [tutte]);
  const [aggiungi, setAggiungi] = useState(false);
  // il punto d'aggancio dei fogli c'è solo dopo il primo disegno
  const [fogli, setFogli] = useState<HTMLElement | null>(null);
  useEffect(() => setFogli(document.getElementById(ID_FOGLI)), []);
  if (!c) return null;

  const fatti = c.start - c.current;
  const totale = c.start - c.target;
  const percento = Math.round(Math.min(100, Math.max(0, (fatti / totale) * 100)));
  const prima = c.weights[0];

  return (
    <div className="mt-[16px] flex flex-col gap-[12px]">
      {/* obiettivo */}
      <section className="panel overflow-hidden rounded-[24px] px-[16px] pt-[14px] pb-[16px]" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--trainer) 20%, var(--color-card)), var(--color-card))" }}>
        <p className="text-[12.5px] font-semibold text-ink/60">{c.goal}</p>
        <div className="mt-[6px] flex items-end justify-between">
          <p className="text-[44px] leading-none font-extrabold tabular-nums tracking-[-0.04em]">
            {percento}
            <span className="text-[22px]">%</span>
          </p>
          <p className="pb-[4px] text-right text-[12.5px] leading-snug">
            <b className="font-extrabold">−{numero(fatti)} kg</b> fatti
            <br />
            <span className="text-muted">ne mancano {numero(Math.max(0, c.current - c.target))}</span>
          </p>
        </div>
        <div className="mt-[12px] h-[10px] overflow-hidden rounded-full bg-ink/8">
          <motion.div className="h-full rounded-full" style={{ background: "var(--trainer)" }} initial={{ width: 0 }} animate={{ width: `${percento}%` }} transition={{ delay: 0.2, duration: 0.9, ease: EASE_OUT }} />
        </div>
        <div className="mt-[8px] flex justify-between text-[11.5px] text-muted">
          <span>Partenza {numero(c.start)} kg</span>
          <span className="font-bold text-ink">Oggi {numero(c.current)} kg</span>
          <span>Traguardo {numero(c.target)} kg</span>
        </div>
      </section>

      {/* peso */}
      <section className="panel rounded-[24px] px-[16px] pt-[14px] pb-[10px]">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">Peso</p>
          <span className="inline-flex items-center gap-[4px] rounded-full bg-ok/12 px-[9px] py-[4px] text-[11.5px] font-bold text-ok">
            <TrendingDown size={12} /> {numero(c.current - prima)} kg dall&apos;inizio
          </span>
        </div>
        <p className="mt-[6px] text-[32px] leading-none font-extrabold tabular-nums tracking-[-0.03em]">
          {numero(c.current)} <span className="text-[15px] font-semibold text-muted">kg</span>
        </p>
        <div className="mt-[6px] h-[96px]">
          <SoftAreaChart points={c.weights} />
        </div>
        <p className="text-[11px] text-muted">Le ultime {c.weights.length} pesate, una a settimana</p>
      </section>

      {/* circonferenze */}
      <section className="panel rounded-[24px] px-[16px] pt-[14px] pb-[14px]">
        <p className="text-[15px] font-bold">Misure</p>
        <div className="mt-[10px] grid grid-cols-3 gap-[8px]">
          {c.measures.map((m) => {
            const d = m.current - m.start;
            return (
              <div key={m.label} className="glass-row rounded-[16px] px-[10px] py-[10px] leading-none">
                <p className="text-[11.5px] text-muted">{m.label}</p>
                <p className="mt-[6px] text-[18px] font-extrabold tabular-nums">
                  {numero(m.current)} <span className="text-[11px] font-semibold text-muted">cm</span>
                </p>
                <p className={`mt-[5px] text-[11px] font-bold tabular-nums ${d < 0 ? "text-ok" : "text-muted"}`}>{d === 0 ? "uguale" : `${d > 0 ? "+" : "−"}${numero(Math.abs(d))} cm`}</p>
              </div>
            );
          })}
        </div>
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setAggiungi(true)} className="btn-trainer mt-[14px] flex h-[46px] w-full cursor-pointer items-center justify-center gap-[6px] rounded-full text-[14px] font-bold">
          <Plus size={16} strokeWidth={2.6} /> Aggiungi misure
        </motion.button>
      </section>

      {/* storico */}
      <section className="panel rounded-[24px] px-[16px] pt-[14px] pb-[8px]">
        <p className="text-[15px] font-bold">Le tue rilevazioni</p>
        <ul className="mt-[6px]">
          {righe.slice(0, 6).map((r) => {
            const giri = CAMPI.slice(1).filter((x) => r[x.k] !== undefined);
            return (
              <li key={r.id} className="flex items-center gap-[10px] border-b border-line/70 py-[10px] last:border-0">
                <span className="w-[52px] shrink-0 text-[12px] font-semibold text-muted">{r.takenOn === OGGI ? "Oggi" : dataBreve(r.takenOn)}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink/75">{giri.length ? giri.map((x) => `${x.label} ${numero(r[x.k] as number)}`).join(" · ") : "Solo peso"}</span>
                {r.weightKg !== undefined && <b className="shrink-0 text-[14px] font-extrabold tabular-nums">{numero(r.weightKg)} kg</b>}
              </li>
            );
          })}
        </ul>
      </section>

      {fogli && createPortal(<AggiungiMisure aperto={aggiungi} onChiudi={() => setAggiungi(false)} />, fogli)}
    </div>
  );
}
