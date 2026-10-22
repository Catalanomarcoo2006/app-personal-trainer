"use client";

import { DragEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, FileText, FileUp, Loader2, Sparkles, X } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { ParsedDay, parsePlan, readPdfLines } from "@/libs/prototipo/pdf-scheda";

const STEPS = ["Apro il PDF", "Leggo il testo", "Riconosco giorni ed esercizi"];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = { kind: "pick" } | { kind: "reading"; step: number; file: string } | { kind: "done"; file: string; days: ParsedDay[] } | { kind: "error"; message: string };

// Finestra "Importa da PDF": legge davvero il testo del PDF nel browser e trasforma la tabella in una scheda.
export function PdfImport({ clientName, onClose, onImported }: { clientName: string; onClose: () => void; onImported: (days: ParsedDay[]) => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: "pick" });
  const [over, setOver] = useState(false);

  const read = async (data: ArrayBuffer, file: string) => {
    playSound("tap");
    try {
      setPhase({ kind: "reading", step: 0, file });
      await wait(500);
      setPhase({ kind: "reading", step: 1, file });
      const lines = await readPdfLines(data);
      await wait(600);
      setPhase({ kind: "reading", step: 2, file });
      const days = parsePlan(lines);
      await wait(700);
      if (!days.length) {
        setPhase({ kind: "error", message: "Non ho trovato esercizi in questo PDF. Serve un PDF con il testo (non la foto di un foglio) e righe come “Squat 4 x 10 40 kg 90''”." });
        return;
      }
      playSound("complete");
      setPhase({ kind: "done", file, days });
    } catch {
      setPhase({ kind: "error", message: "Non riesco ad aprire questo file. Controlla che sia un PDF valido." });
    }
  };

  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setPhase({ kind: "error", message: "Il file deve essere un PDF." });
      return;
    }
    await read(await f.arrayBuffer(), f.name);
  };

  const sample = async () => {
    const res = await fetch("/prototipo/scheda-esempio.pdf");
    await read(await res.arrayBuffer(), "scheda-antonella.pdf");
  };

  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void fromFile(e.dataTransfer.files[0]);
  };

  const exercises = phase.kind === "done" ? phase.days.reduce((s, d) => s + d.rows.length, 0) : 0;

  return (
    <motion.div className="absolute inset-0 z-40 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Chiudi" onClick={onClose} className="absolute inset-0 bg-black/15 backdrop-blur-[5px]" />
      <motion.div
        initial={{ y: 20, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="relative w-[480px] rounded-[24px] bg-card p-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[16px] font-bold">Importa la scheda da PDF</p>
            <p className="mt-[3px] text-[11.5px] text-muted">Per {clientName}: la leggo e la trasformo in una scheda modificabile.</p>
          </div>
          <button type="button" aria-label="Chiudi" onClick={onClose} className="grid size-[28px] cursor-pointer place-items-center rounded-full bg-soft">
            <X size={14} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase.kind === "pick" && (
            <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={drop}
                className={`mt-[16px] flex cursor-pointer flex-col items-center rounded-[18px] border-2 border-dashed px-[20px] py-[28px] text-center transition-colors ${over ? "bg-soft" : "border-line"}`}
                style={over ? { borderColor: "var(--trainer)" } : undefined}
              >
                <motion.span animate={{ y: over ? -4 : [0, -4, 0] }} transition={over ? {} : { duration: 2, repeat: Infinity }} className="grid size-[48px] place-items-center rounded-full text-white" style={{ background: "var(--trainer)" }}>
                  <FileUp size={22} />
                </motion.span>
                <p className="mt-[12px] text-[13px] font-semibold">Trascina qui il PDF della scheda</p>
                <p className="mt-[3px] text-[11px] text-muted">oppure clicca per sceglierlo dal computer</p>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void fromFile(e.target.files?.[0])} />
              </label>
              <button type="button" onClick={() => void sample()} className="mt-[12px] flex w-full cursor-pointer items-center justify-center gap-[6px] rounded-full bg-soft py-[9px] text-[12px] font-semibold">
                <FileText size={13} /> Usa il PDF di esempio
              </button>
            </motion.div>
          )}

          {phase.kind === "reading" && (
            <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-[18px]">
              <p className="flex items-center gap-[8px] rounded-[12px] bg-soft px-[12px] py-[9px] text-[12px] font-semibold">
                <FileText size={14} /> {phase.file}
              </p>
              <div className="mt-[14px] flex flex-col gap-[10px]">
                {STEPS.map((s, i) => {
                  const done = i < phase.step;
                  const active = i === phase.step;
                  return (
                    <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= phase.step ? 1 : 0.4, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-[10px] text-[12.5px]">
                      <span className={`grid size-[22px] place-items-center rounded-full ${done ? "bg-ok text-white" : "bg-soft"}`}>
                        {done ? <Check size={12} strokeWidth={3} /> : active ? <Loader2 size={12} className="animate-spin" /> : null}
                      </span>
                      <span className={active ? "font-semibold" : ""}>{s}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-[16px] h-[4px] overflow-hidden rounded-full bg-soft">
                <motion.div className="h-full rounded-full" style={{ background: "var(--trainer)" }} animate={{ width: `${((phase.step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease: EASE_OUT }} />
              </div>
            </motion.div>
          )}

          {phase.kind === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-[16px]">
              <p className="flex items-center gap-[8px] text-[13px] font-semibold">
                <Sparkles size={15} style={{ color: "var(--trainer)" }} /> Trovati {phase.days.length} giorni e {exercises} esercizi
              </p>
              <div className="mt-[10px] flex max-h-[220px] flex-col gap-[8px] overflow-y-auto [scrollbar-width:none]">
                {phase.days.map((d, i) => (
                  <motion.div key={d.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="rounded-[14px] border border-line px-[12px] py-[10px]">
                    <p className="text-[12px] font-bold">
                      {d.label} <span className="font-medium text-muted">· {d.focus}</span>
                    </p>
                    <p className="mt-[4px] text-[11px] text-ink/70">{d.rows.map((r) => r.name).join(" · ")}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-[14px] grid grid-cols-2 gap-[8px]">
                <button type="button" onClick={() => setPhase({ kind: "pick" })} className="cursor-pointer rounded-full border border-line py-[9px] text-[12px] font-semibold">
                  Scegli un altro PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound("confirm");
                    onImported(phase.days);
                  }}
                  className="cursor-pointer rounded-full btn-trainer py-[9px] text-[12px] font-semibold"
                >
                  Usa questa scheda
                </button>
              </div>
            </motion.div>
          )}

          {phase.kind === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-[16px]">
              <p className="rounded-[14px] bg-[rgba(212,59,79,0.12)] px-[14px] py-[12px] text-[12px] text-[#d43b4f]">{phase.message}</p>
              <button type="button" onClick={() => setPhase({ kind: "pick" })} className="mt-[12px] w-full cursor-pointer rounded-full bg-soft py-[9px] text-[12px] font-semibold">
                Riprova
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
