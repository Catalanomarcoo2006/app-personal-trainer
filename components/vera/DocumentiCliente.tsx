"use client";

// I documenti di un cliente visti dal trainer (finestra di Moduli): quelli caricati dal cliente (analisi, foto), la
// dieta del nutrizionista e i suoi. Il trainer li apre, carica la dieta (che il cliente trova nel suo Profilo) o un
// documento suo, e toglie quelli caricati da lui. Il file passa da documenti-carica (Storage nella versione vera).

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileText, Image as Foto, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useStato } from "@/libs/prototipo/stato";
import type { Documento } from "@/libs/prototipo/documenti";
import { caricaDocumento, togliDocumento } from "@/libs/prototipo/documenti-carica";
import { apriFile } from "@/components/prototipo/cliente/apri-file";
import { playSound } from "@/libs/ui/sound";
import { oggi } from "@/libs/orologio";

const DA: Record<Documento["da"], string> = { nutrizionista: "Dal nutrizionista", trainer: "Caricato da te", cliente: "Caricato dal cliente" };
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const quando = (data: string) => (data === oggi() ? "oggi" : `${Number(data.slice(8, 10))} ${MESI[Number(data.slice(5, 7)) - 1]}`);

export function DocumentiCliente({ clientId, nome }: { clientId: string; nome: string }) {
  const tutti = useStato((s) => s.documenti);
  const documenti = useMemo(() => tutti.filter((d) => d.clientId === clientId), [tutti, clientId]);
  const [da, setDa] = useState<"nutrizionista" | "trainer">("nutrizionista");
  const [caricando, setCaricando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const carica = async (f: File | undefined): Promise<void> => {
    if (!f || caricando) return;
    setCaricando(true);
    const esito = await caricaDocumento(f, clientId, da);
    setCaricando(false);
    if ("motivo" in esito) return void toast.error(esito.motivo);
    playSound("complete");
    toast.success(`Caricato: ${nome} lo trova nel suo Profilo`);
  };

  const togli = async (d: Documento): Promise<void> => {
    const esito = await togliDocumento(d);
    if ("motivo" in esito) return void toast.error(esito.motivo);
    playSound("tap");
    toast.success("Documento tolto");
  };

  const apri = async (d: Documento): Promise<void> => {
    playSound("tap");
    if (!(await apriFile(d.file))) toast.error("Non riesco ad aprire il documento: riprova");
  };

  return (
    <div>
      <div className="-mx-[4px] flex max-h-[260px] flex-col gap-[6px] overflow-y-auto px-[4px] [scrollbar-width:none]">
        {documenti.length === 0 && <p className="rounded-[14px] bg-soft px-[12px] py-[16px] text-center text-[12.5px] text-muted">Nessun documento per ora.</p>}
        {documenti.map((d) => (
          <div key={d.id} className="flex items-center gap-[9px] rounded-[14px] border border-line px-[10px] py-[8px]">
            <button type="button" onClick={() => void apri(d)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-[9px] text-left">
              <span className="grid size-[32px] shrink-0 place-items-center rounded-full bg-soft text-ink/70">{d.tipo === "pdf" ? <FileText size={15} /> : <Foto size={15} />}</span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-semibold">{d.nome}</span>
                <span className="mt-[2px] block text-[11px] text-muted">
                  {DA[d.da]} · {quando(d.data)}
                </span>
              </span>
            </button>
            {d.da !== "cliente" && (
              <button type="button" aria-label={`Togli ${d.nome}`} onClick={() => void togli(d)} className="grid size-[32px] shrink-0 cursor-pointer place-items-center rounded-full text-ink/40 hover:bg-soft">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-[14px] mb-[6px] text-[11.5px] font-semibold text-ink/70">Carica per {nome}</p>
      <div className="flex gap-[6px]">
        {(
          [
            ["nutrizionista", "Dieta del nutrizionista"],
            ["trainer", "Documento tuo"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" onClick={() => (playSound("tap"), setDa(v))} className={`h-[34px] flex-1 cursor-pointer rounded-[11px] text-[12px] font-semibold ${v === da ? "sel-trainer" : "bg-soft"}`}>
            {l}
          </button>
        ))}
      </div>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => (void carica(e.target.files?.[0]), (e.target.value = ""))} />
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={caricando}
        onClick={() => input.current?.click()}
        className="btn-trainer mt-[10px] flex h-[40px] w-full cursor-pointer items-center justify-center gap-[7px] rounded-full text-[13px] font-bold disabled:opacity-60"
      >
        <Upload size={15} /> {caricando ? "Carico…" : "Scegli il file"}
      </motion.button>
      <p className="mt-[6px] text-center text-[11px] text-muted">PDF o foto, fino a 10 MB.</p>
    </div>
  );
}
