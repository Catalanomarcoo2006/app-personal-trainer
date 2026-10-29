"use client";

// Profilo del cliente (si apre dalla foto in alto): il suo trainer, il pacchetto, l'obiettivo, ogni quanto si pesa,
// i documenti (dieta del nutrizionista, scheda sempre aggiornata, analisi, quello che carica lui: decisione di Marco
// del 28/10), suoni e tema, informativa e consenso.

import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { ChevronRight, Dumbbell, FileText, Image as Foto, MessageCircle, Moon, RotateCcw, ShieldCheck, Trash2, Upload, Volume2 } from "lucide-react";
import { Toggle } from "@/components/ui/basics";
import { useAppearance } from "@/components/ui/appearance";
import { isSoundEnabled, onSoundChange, playSound, setSoundEnabled } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { stato, useStato, useTrainerPhoto } from "@/libs/prototipo/stato";
import { controllaFile, rimpicciolisciFoto, type Documento } from "@/libs/prototipo/documenti";
import { useCliente } from "@/libs/dati/selettori";
import { impostaPesata } from "@/libs/dati/sportello";
import { OGGI } from "@/libs/dati/iniziali";
import { dataBreve, dataLunga } from "@/libs/dati/vista";
import { FREQUENZE } from "@/libs/domain/pesate";
import { navigate } from "@/components/prototipo/trainer/nav";
import { Foglio } from "./Foglio";
import { apriFile, pdfScheda } from "./apri-file";
import { usePesata, quandoPesata } from "./pesata";
import { CLIENTE_DEMO } from "./scheda";
import { FOTO_CLIENTE } from "./Shell";
import { ID_FOGLI, ROTTE_CLIENTE } from "./nav";

const nomeTrainer = trainer.name.split(" ")[0];
const numero = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });
const DA: Record<Documento["da"], string> = { nutrizionista: "Dal nutrizionista", trainer: `Da ${nomeTrainer}`, cliente: "Caricato da te" };

const Titolo = ({ children }: { children: ReactNode }) => <h2 className="mt-[20px] mb-[8px] px-[2px] text-[15px] font-bold tracking-[-0.01em]">{children}</h2>;

// Una riga di un elenco: se si tocca, il tasto è icona + testo; quello a destra (interruttore, cestino) sta fuori,
// così non c'è mai un tasto dentro un altro.
function Riga({ icona, titolo, sotto, destra, onClick }: { icona: ReactNode; titolo: string; sotto?: string; destra?: ReactNode; onClick?: () => void }) {
  const testo = (
    <>
      <span className="sel-trainer grid size-[38px] shrink-0 place-items-center rounded-[12px]" style={{ color: "var(--trainer)" }}>
        {icona}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[14px] font-semibold">{titolo}</span>
        {sotto && <span className="mt-[2px] block truncate text-[12px] text-muted">{sotto}</span>}
      </span>
    </>
  );
  return (
    <div className="flex w-full items-center gap-[12px] border-b border-line/60 px-[14px] py-[11px] last:border-0">
      {onClick ? (
        <button type="button" onClick={onClick} className="flex min-w-0 flex-1 cursor-pointer items-center gap-[12px] text-left">
          {testo}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-[12px]">{testo}</span>
      )}
      {destra}
    </div>
  );
}

function Informativa() {
  return (
    <ul className="mt-[12px] flex flex-col gap-[8px] text-[13px] leading-snug">
      <li className="glass-row rounded-[16px] px-[14px] py-[11px]">
        <b>Cosa raccogliamo</b>: peso, misure, allenamenti fatti e i dolori che segnali a Leo.
      </li>
      <li className="glass-row rounded-[16px] px-[14px] py-[11px]">
        <b>Chi li vede</b>: solo {trainer.name}, il tuo trainer.
      </li>
      <li className="glass-row rounded-[16px] px-[14px] py-[11px]">
        <b>Dove stanno</b>: su server in Unione Europea.
      </li>
      <li className="px-[4px] pt-[4px] text-[12.5px] text-muted">Hai dato il consenso al trattamento dei dati sulla salute alla registrazione. Per toglierlo scrivi a {nomeTrainer}.</li>
    </ul>
  );
}

export function Profilo() {
  const c = useCliente(CLIENTE_DEMO);
  const foto = useTrainerPhoto();
  const documenti = useStato((s) => s.documenti);
  const giorni = useStato((s) => s.plans[CLIENTE_DEMO]) ?? [];
  const videos = useStato((s) => s.videos);
  const pacchetto = useStato((s) => s.dati.pacchetti.find((p) => p.clientId === CLIENTE_DEMO));
  const proposto = useStato((s) => s.dati.clienti.find((x) => x.id === CLIENTE_DEMO)?.obiettivoProposto);
  const pesata = usePesata();
  const { theme, setTheme } = useAppearance();
  const [suoni, setSuoni] = useState(true);
  const [informativa, setInformativa] = useState(false);
  const [fogli, setFogli] = useState<HTMLElement | null>(null);
  const carica = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSuoni(isSoundEnabled());
    setFogli(document.getElementById(ID_FOGLI));
    return onSoundChange(setSuoni);
  }, []);
  if (!c) return null;

  const usate = pacchetto?.lessonsUsed ?? 0;
  const totali = pacchetto?.lessonsTotal ?? 0;

  const caricaFile = async (f: File | undefined) => {
    if (!f) return;
    const v = controllaFile(f);
    if ("motivo" in v) return toast.error(v.motivo);
    try {
      const file = v.tipo === "foto" ? await rimpicciolisciFoto(f) : f;
      stato.addDocumento({ nome: v.tipo === "foto" ? f.name.replace(/\.\w+$/, ".jpg") : f.name, tipo: v.tipo, da: "cliente", data: OGGI, file });
      playSound("complete");
      toast.success(`Caricato: ${nomeTrainer} lo trova tra i tuoi documenti`);
    } catch {
      toast.error("Non riesco a leggere questa foto: prova con una JPG o PNG");
    }
  };

  return (
    <div className="mt-[14px]">
      {/* chi sei */}
      <section className="panel flex items-center gap-[14px] rounded-[24px] px-[16px] py-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FOTO_CLIENTE} alt="" className="size-[64px] rounded-full object-cover ring-[3px] ring-white/70" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[19px] font-extrabold tracking-[-0.02em]">{c.name}</p>
          <p className="mt-[3px] text-[12.5px] text-muted">Con {nomeTrainer} {c.since.toLowerCase()}</p>
        </div>
      </section>

      <Titolo>Il tuo trainer</Titolo>
      <section className="panel flex items-center gap-[12px] rounded-[24px] px-[14px] py-[12px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt="" className="size-[48px] rounded-full object-cover" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-bold">{trainer.name}</p>
          <p className="mt-[2px] text-[12px] text-muted">{trainer.role}</p>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => navigate(ROTTE_CLIENTE.messaggi)} className="btn-trainer flex h-[38px] cursor-pointer items-center gap-[6px] rounded-full px-[14px] text-[13px] font-bold">
          <MessageCircle size={15} /> Scrivi
        </motion.button>
      </section>

      <Titolo>Il tuo percorso</Titolo>
      <section className="panel overflow-hidden rounded-[24px]">
        <div className="px-[14px] pt-[12px] pb-[12px]">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold">{c.pkg.label}</p>
            <span className={`rounded-full px-[9px] py-[3px] text-[11.5px] font-bold ${c.pkg.expiring ? "text-white" : "bg-ink/6"}`} style={c.pkg.expiring ? { background: "var(--trainer)" } : undefined}>
              {c.pkg.left}
            </span>
          </div>
          {totali > 0 && (
            <>
              <div className="mt-[9px] flex gap-[3px]">
                {Array.from({ length: totali }, (_, i) => (
                  <span key={i} className="h-[7px] flex-1 rounded-full" style={{ background: i < usate ? "var(--trainer)" : "color-mix(in srgb, var(--trainer) 16%, transparent)" }} />
                ))}
              </div>
              <p className="mt-[6px] text-[11.5px] text-muted">
                {usate} lezioni fatte su {totali}
                {c.pkg.expiring ? ` · per rinnovare scrivi a ${nomeTrainer}` : ""}
              </p>
            </>
          )}
          {pacchetto?.endsOn && <p className="mt-[6px] text-[11.5px] text-muted">Scade il {dataLunga(pacchetto.endsOn)}</p>}
        </div>
        <Riga
          icona={<span className="text-[17px]">🎯</span>}
          titolo={c.goal}
          sotto={proposto ? `Hai proposto ${numero(proposto.start)} → ${numero(proposto.target)} kg: in attesa di ${nomeTrainer}` : `Da ${numero(c.start)} a ${numero(c.target)} kg · oggi ${numero(c.current)} kg`}
          destra={<ChevronRight size={17} className="shrink-0 text-ink/35" />}
          onClick={() => navigate(ROTTE_CLIENTE.progressi)}
        />
        <div className="border-t border-line/60 px-[14px] pt-[11px] pb-[12px]">
          <p className="text-[14px] font-semibold">Ogni quanto ti pesi</p>
          <p className="mt-[2px] text-[12px] text-muted">Prossima pesata: {quandoPesata(pesata.prossima)}</p>
          <div role="radiogroup" aria-label="Ogni quanto ti pesi" className="mt-[9px] grid grid-cols-3 gap-[6px]">
            {FREQUENZE.map((x) => {
              const qui = x.f === pesata.frequenza;
              return (
                <button
                  key={x.f}
                  type="button"
                  role="radio"
                  aria-checked={qui}
                  onClick={() => {
                    if (qui) return;
                    playSound("tap");
                    void impostaPesata(CLIENTE_DEMO, x.f);
                  }}
                  className={`h-[38px] cursor-pointer rounded-full text-[12.5px] font-semibold ${qui ? "sel-trainer" : "bg-ink/5 text-ink/65"}`}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Titolo>I tuoi documenti</Titolo>
      <section className="panel overflow-hidden rounded-[24px]">
        <Riga icona={<Dumbbell size={17} />} titolo="Scheda di allenamento.pdf" sotto={`Da ${nomeTrainer} · sempre aggiornata`} destra={<ChevronRight size={17} className="shrink-0 text-ink/35" />} onClick={() => (playSound("tap"), void apriFile(pdfScheda(giorni, videos)))} />
        {documenti.map((d) => (
          <Riga
            key={d.id}
            icona={d.tipo === "pdf" ? <FileText size={17} /> : <Foto size={17} />}
            titolo={d.nome}
            sotto={`${DA[d.da]} · ${d.data === OGGI ? "oggi" : dataBreve(d.data)}`}
            destra={
              d.da === "cliente" && typeof d.file !== "string" ? (
                <button
                  type="button"
                  aria-label={`Togli ${d.nome}`}
                  onClick={() => {
                    stato.removeDocumento(d.id);
                    playSound("tap");
                    toast.success("Documento tolto");
                  }}
                  className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full text-ink/40 hover:bg-ink/5"
                >
                  <Trash2 size={15} />
                </button>
              ) : (
                <ChevronRight size={17} className="shrink-0 text-ink/35" />
              )
            }
            onClick={() => (playSound("tap"), void apriFile(d.file))}
          />
        ))}
        <input ref={carica} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => (void caricaFile(e.target.files?.[0]), (e.target.value = ""))} />
        <div className="border-t border-line/60 p-[12px]">
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => carica.current?.click()} className="glass flex h-[44px] w-full cursor-pointer items-center justify-center gap-[7px] rounded-full text-[13.5px] font-bold">
            <Upload size={15} style={{ color: "var(--trainer)" }} /> Carica un documento
          </motion.button>
          <p className="mt-[6px] text-center text-[11px] text-muted">PDF o foto, fino a 10 MB. La dieta te la dà solo il tuo nutrizionista.</p>
        </div>
      </section>

      <Titolo>Impostazioni</Titolo>
      <section className="panel overflow-hidden rounded-[24px]">
        <Riga icona={<Volume2 size={17} />} titolo="Suoni ai tocchi" destra={<Toggle on={suoni} label="Suoni ai tocchi" onChange={(v) => setSoundEnabled(v)} />} />
        <Riga icona={<Moon size={17} />} titolo="Tema scuro" destra={<Toggle on={theme === "dark"} label="Tema scuro" onChange={(v) => setTheme(v ? "dark" : "light")} />} />
        <Riga icona={<ShieldCheck size={17} />} titolo="Informativa e consenso" sotto="Cosa salviamo e chi lo vede" destra={<ChevronRight size={17} className="shrink-0 text-ink/35" />} onClick={() => setInformativa(true)} />
        <Riga
          icona={<RotateCcw size={17} />}
          titolo="Rifai la registrazione"
          sotto="Solo nella demo"
          onClick={() => {
            try {
              localStorage.removeItem("registrazione-cliente");
            } catch {
              // niente memoria del browser: ricaricando riparte comunque
            }
            window.location.href = `${ROTTE_CLIENTE.home}?registrazione`;
          }}
        />
      </section>
      <p className="mt-[14px] text-center text-[11px] text-muted">App di {trainer.name} · dati su server in Unione Europea</p>

      {fogli &&
        createPortal(
          <Foglio aperto={informativa} onChiudi={() => setInformativa(false)} titolo="Informativa e consenso">
            <Informativa />
          </Foglio>,
          fogli,
        )}
    </div>
  );
}
