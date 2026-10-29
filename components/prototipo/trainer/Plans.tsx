"use client";

import { oggi } from "@/libs/orologio";
import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { Check, Dumbbell, FileText, FileUp, LoaderCircle, Play, Plus, Search, Send, Smartphone, X } from "lucide-react";
import { IconCircle } from "@/components/ui/basics";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { conta } from "@/libs/ui/testo";
import { exerciseById, library, Muscle, trainer } from "@/libs/prototipo/dati-finti";
import { useClienti, type ClienteVista } from "@/libs/dati/selettori";
import { ParsedDay } from "@/libs/prototipo/pdf-scheda";
import { buildPlanPdf } from "@/libs/prototipo/pdf-invio";
import { Day, isLink, linkHost, nextKey, Row, rowName, rowVideo, stato, useStato } from "@/libs/prototipo/stato";
import { navigate, ROUTES } from "./nav";
import { ClientAvatar } from "./shared";
import { PdfImport } from "./PdfImport";

const muscleColors: Record<Muscle, string> = {
  Gambe: "var(--color-peach-strong)",
  Glutei: "var(--color-rose-strong)",
  Petto: "var(--color-sky-strong)",
  Schiena: "var(--color-violet-strong)",
  Spalle: "var(--color-mint-strong)",
  Braccia: "#c98a1e",
  Core: "#0f9d8a",
  Cardio: "#e5484d",
};

const muscles = Object.keys(muscleColors) as Muscle[];

function MuscleChip({ m }: { m?: Muscle }) {
  const color = m ? muscleColors[m] : "var(--trainer)";
  return (
    <span className="rounded-full px-[7px] py-[2.5px] text-[9.5px] font-semibold" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
      {m ?? "Da PDF"}
    </span>
  );
}

type Field = "name" | "sets" | "load" | "rest";

// Se il nome letto dal PDF corrisponde a un esercizio della libreria, lo collega (e con lui il suo video).
const fromParsed = (days: ParsedDay[]): Day[] =>
  days.map((d) => ({
    label: d.label,
    focus: d.focus,
    rows: d.rows.map((r) => {
      const match = library.find((e) => e.name.toLowerCase() === r.name.toLowerCase());
      return { ...r, exId: match?.id, name: match ? undefined : r.name, key: nextKey(), fresh: true };
    }),
  }));

function Cell({ value, onChange, className = "", label }: { value: string; onChange: (v: string) => void; className?: string; label: string }) {
  return (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`relative w-full min-w-0 rounded-[8px] bg-transparent px-[6px] py-[4px] outline-none transition-colors hover:bg-soft focus:bg-soft focus:ring-1 focus:ring-[var(--trainer)] ${className}`}
    />
  );
}

// ——— Video dell'esecuzione ———

// Etichetta sotto l'esercizio: "Video" se c'è, "Collega video" se manca.
function VideoChip({ url, open, onToggle }: { url?: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        playSound("tap");
        onToggle();
      }}
      aria-expanded={open}
      className={`flex cursor-pointer items-center gap-[4px] rounded-full px-[7px] py-[2.5px] text-[9.5px] font-semibold transition-colors ${
        url ? "text-[var(--trainer)] hover:bg-[color-mix(in_srgb,var(--trainer)_12%,transparent)]" : "border border-dashed border-ink/25 text-ink/55 hover:border-ink/45 hover:text-ink"
      }`}
      style={url ? { background: "color-mix(in srgb, var(--trainer) 12%, transparent)" } : undefined}
    >
      {url ? <Play size={9} strokeWidth={2.6} fill="currentColor" /> : <Plus size={10} strokeWidth={2.6} />}
      {url ? `Video · ${linkHost(url)}` : "Collega video"}
    </button>
  );
}

// Riga che si apre sotto l'esercizio per incollare o cambiare il link.
function VideoEditor({
  url,
  canSaveToLibrary,
  onSave,
  onRemove,
  onClose,
}: {
  url?: string;
  canSaveToLibrary: boolean;
  onSave: (link: string, toLibrary: boolean) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(url ?? "");
  const [toLibrary, setToLibrary] = useState(true);
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isLink(value)) {
      setError(true);
      return;
    }
    onSave(value.trim(), canSaveToLibrary && toLibrary);
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="col-span-full overflow-hidden"
    >
      <div className="mt-[6px] flex flex-wrap items-center gap-[8px] rounded-[11px] bg-soft px-[10px] py-[8px]">
        <Play size={12} strokeWidth={2.4} className="shrink-0" style={{ color: "var(--trainer)" }} />
        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Incolla il link del video: YouTube, Instagram, Google Drive…"
          aria-label="Link del video dell'esecuzione"
          aria-invalid={error}
          className={`h-[30px] min-w-[150px] flex-1 rounded-[8px] bg-card px-[10px] text-[11.5px] outline-none ring-1 transition-shadow placeholder:text-muted focus:ring-[var(--trainer)] ${error ? "ring-[#e5484d]" : "ring-line"}`}
        />
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold underline underline-offset-2">
            Apri
          </a>
        )}
        {url && onRemove && (
          <button type="button" onClick={onRemove} className="cursor-pointer text-[11px] font-semibold text-ink/60 hover:text-ink">
            Togli
          </button>
        )}
        <button type="submit" className="flex h-[30px] cursor-pointer items-center gap-[5px] rounded-full btn-trainer px-[12px] text-[11px] font-semibold">
          <Check size={12} strokeWidth={2.6} /> Salva
        </button>
        {(canSaveToLibrary || error) && (
          <div className="flex w-full items-center justify-between gap-[8px] pl-[20px] text-[10.5px]">
            {error ? <span className="font-semibold text-[#d43b4f]">Serve un link che inizi con https://</span> : <span />}
            {canSaveToLibrary && (
              <label className="flex cursor-pointer items-center gap-[6px] text-ink/70">
                <input type="checkbox" checked={toLibrary} onChange={(e) => setToLibrary(e.target.checked)} className="size-[13px] accent-[var(--trainer)]" />
                Usa questo video per l’esercizio in tutte le schede
              </label>
            )}
          </div>
        )}
      </div>
    </motion.form>
  );
}

// ——— Invio ———

function SendSheet({
  client,
  days,
  exercises,
  withVideo,
  sending,
  onCancel,
  onSend,
}: {
  client: ClienteVista;
  days: number;
  exercises: number;
  withVideo: number;
  sending: boolean;
  onCancel: () => void;
  onSend: () => void;
}) {
  const first = client.name.split(" ")[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      style={{ transformOrigin: "100% 100%" }}
      role="dialog"
      aria-label={`Invia la scheda a ${first}`}
      className="absolute right-[18px] bottom-[60px] z-20 w-[340px] rounded-[18px] border border-line bg-card p-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-[10px]">
        <ClientAvatar c={client} size={34} />
        <div className="leading-tight">
          <p className="text-[14px] font-bold">Invia la scheda a {first}</p>
          <p className="text-[11px] text-muted">
            {conta(days, "giorno", "giorni")} · {conta(exercises, "esercizio", "esercizi")} · {withVideo} con video
          </p>
        </div>
      </div>
      <p className="mt-[12px] text-[11px] font-semibold text-muted">{first} riceve:</p>
      <ul className="mt-[6px] flex flex-col gap-[6px] text-[12px]">
        <li className="flex items-start gap-[8px]">
          <Smartphone size={14} className="mt-[1px] shrink-0" style={{ color: "var(--trainer)" }} />
          La scheda nella sua app, con il video sotto ogni esercizio
        </li>
        <li className="flex items-start gap-[8px]">
          <FileText size={14} className="mt-[1px] shrink-0" style={{ color: "var(--trainer)" }} />
          Il PDF della scheda in chat, che puoi riaprire quando vuoi
        </li>
      </ul>
      {withVideo < exercises && (
        <p className="mt-[10px] rounded-[10px] bg-soft px-[10px] py-[7px] text-[11px] text-ink/75">
          {exercises - withVideo} {exercises - withVideo === 1 ? "esercizio è" : "esercizi sono"} senza video: puoi inviare lo stesso o collegarli prima.
        </p>
      )}
      <div className="mt-[14px] flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="h-[34px] cursor-pointer rounded-full px-[14px] text-[12px] font-semibold text-ink/70 hover:bg-soft">
          Annulla
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          disabled={sending}
          onClick={onSend}
          className="flex h-[34px] min-w-[132px] cursor-pointer items-center justify-center gap-[7px] rounded-full px-[16px] text-[12px] font-semibold text-white disabled:cursor-wait"
          style={{ background: "var(--trainer)" }}
        >
          {sending ? (
            <>
              <LoaderCircle size={13} className="animate-spin" /> Preparo il PDF…
            </>
          ) : (
            <>
              <Send size={13} /> Invia a {first}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ——— La pagina ———

const SCHEDA_VUOTA: Day[] = [{ label: "Giorno A", focus: "", rows: [] }];

// search: i parametri dell'indirizzo (?cliente=), passati da TrainerApp.
export function PlansView({ search }: { search: string }) {
  const params = new URLSearchParams(search);
  // i clienti dello store: quelli della demo, o del database nella versione vera
  const clients = useClienti();
  const fromQuery = clients.find((c) => c.id === params.get("cliente"))?.id;
  const [scelto, setClientId] = useState(fromQuery ?? (clients.some((c) => c.id === "giulia-bianchi") ? "giulia-bianchi" : clients[0]?.id));
  const allPlans = useStato((s) => s.plans);
  const videos = useStato((s) => s.videos);
  const [dayIndex, setDayIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "senza-video" | null>(null);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // riga o esercizio della libreria con il link aperto
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const clientId = clients.some((c) => c.id === scelto) ? scelto : clients[0]?.id;
  const client = clients.find((c) => c.id === clientId);
  // chi non ha ancora una scheda parte da un giorno vuoto
  const days = allPlans[clientId] ?? SCHEDA_VUOTA;
  const current = Math.min(dayIndex, days.length - 1);
  const day = days[current];

  const allRows = days.flatMap((d) => d.rows);
  const withVideo = allRows.filter((r) => rowVideo(r, videos)).length;
  const libraryWithVideo = library.filter((e) => videos[e.id]).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter(
      (e) => (!muscle || (muscle === "senza-video" ? !videos[e.id] : e.muscle === muscle)) && (!q || e.name.toLowerCase().includes(q)),
    );
  }, [query, muscle, videos]);

  const updateDay = (fn: (rows: Row[]) => Row[]) => stato.setPlan(clientId, (ds) => ds.map((d, i) => (i === current ? { ...d, rows: fn(d.rows) } : d)));

  const add = (exId: string) => updateDay((rows) => [...rows, { exId, sets: "3 × 10", load: "—", rest: "60″", key: nextKey(), fresh: true }]);

  const edit = (key: string, field: Field, value: string) => updateDay((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const remove = (key: string) => {
    playSound("tap");
    updateDay((rows) => rows.filter((r) => r.key !== key));
  };

  const saveRowVideo = (r: Row, link: string | undefined, toLibrary: boolean) => {
    playSound("confirm");
    if (toLibrary && r.exId && link) {
      stato.setLibraryVideo(r.exId, link);
      updateDay((rows) => rows.map((x) => (x.key === r.key ? { ...x, video: undefined } : x)));
    } else {
      updateDay((rows) => rows.map((x) => (x.key === r.key ? { ...x, video: link } : x)));
    }
    setEditing(null);
  };

  const imported = (parsed: ParsedDay[]) => {
    const next = fromParsed(parsed);
    stato.setPlan(clientId, () => next);
    setDayIndex(0);
    setImporting(false);
    const linked = next.flatMap((d) => d.rows).filter((r) => rowVideo(r, videos)).length;
    toast.success(`Scheda importata: ${conta(next.length, "giorno", "giorni")}, ${conta(linked, "video collegato", "video collegati")} in automatico.`);
  };

  const send = async () => {
    setSending(true);
    try {
      const pdfDays = days.map((d) => ({
        label: d.label,
        focus: d.focus,
        rows: d.rows.map((r) => ({ name: rowName(r), sets: r.sets, load: r.load, rest: r.rest, video: rowVideo(r, videos) })),
      }));
      const blob = await buildPlanPdf({ clientName: client.name, trainerName: trainer.name, date: `${trainer.today.toLowerCase()} ${oggi().slice(0, 4)}`, color: trainer.color, days: pdfDays });
      const id = `scheda-${Date.now()}`;
      stato.addSent({
        id,
        clientId,
        fileName: `Scheda ${client.name}.pdf`,
        url: URL.createObjectURL(blob),
        days: days.map((d) => ({ ...d, rows: d.rows.map((r) => ({ ...r, video: rowVideo(r, videos), fresh: false })) })),
        exercises: allRows.length,
        withVideo,
        time: "Adesso",
      });
      playSound("complete");
      toast.success(`Scheda inviata a ${client.name.split(" ")[0]}`);
      navigate(`${ROUTES.messaggi}?cliente=${clientId}`);
    } catch {
      setSending(false);
      toast.error("Non sono riuscito a preparare il PDF. Riprova.");
    }
  };

  if (!client)
    return (
      <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid place-items-center pr-[18px] pl-[80px]">
        <p className="panel rounded-[18px] px-[22px] py-[16px] text-[13px] text-muted">Aggiungi un cliente per preparare la sua scheda.</p>
      </main>
    );

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[250px_1fr_300px] gap-x-[12px] pr-[18px] pl-[80px]">
      <section className="flex min-h-0 flex-col panel rounded-[18px] px-[12px] pt-[14px] pb-[12px]">
        <h2 className="px-[4px] text-[14px] font-bold">Schede dei clienti</h2>
        <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto [scrollbar-width:none]">
          {clients.map((c, i) => {
            const active = c.id === clientId;
            const n = allPlans[c.id]?.length ?? 0;
            return (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.04, duration: 0.4, ease: EASE_OUT }}
                onClick={() => {
                  playSound("tap");
                  setClientId(c.id);
                  setDayIndex(0);
                  setEditing(null);
                  setConfirming(false);
                }}
                className={`flex cursor-pointer items-center gap-[10px] rounded-[13px] px-[9px] py-[8px] text-left transition-colors ${active ? "sel-trainer" : "hover:bg-soft"}`}
              >
                <ClientAvatar c={c} size={32} />
                <div className="min-w-0 leading-none">
                  <p className="truncate text-[12px] font-bold">{c.name}</p>
                  <p className={`mt-[4px] truncate text-[10.5px] ${active ? "opacity-60" : "text-muted"}`}>
                    {n} {n === 1 ? "giorno" : "giorni"} · {allPlans[c.id][0]?.focus}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-0 flex-col panel rounded-[18px] px-[18px] pt-[14px] pb-[14px]">
        <div className="flex items-center gap-[12px]">
          <ClientAvatar c={client} size={40} />
          <div className="leading-none">
            <p className="text-[11px] text-muted">Scheda di</p>
            <p className="mt-[4px] text-[16px] font-bold">{client.name}</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("tap");
              setImporting(true);
            }}
            className="ml-[10px] flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full border border-line px-[12px] text-[11.5px] font-semibold"
          >
            <FileUp size={13} style={{ color: "var(--trainer)" }} /> Importa da PDF
          </motion.button>
          <div className="ml-auto flex gap-[4px] rounded-full bg-soft p-[4px]">
            {days.map((d, i) => (
              <button
                key={d.label + i}
                type="button"
                onClick={() => {
                  playSound("tap");
                  setDayIndex(i);
                  setEditing(null);
                }}
                className={`relative cursor-pointer rounded-full px-[14px] py-[6px] text-[12px] font-semibold ${i === current ? "text-ink" : "text-ink/65"}`}
              >
                {i === current && <motion.span layoutId="giorno-scheda" className="sel-trainer absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[14px] flex items-center justify-between">
          <p className="flex items-center gap-[7px] text-[13px] font-bold">
            <Dumbbell size={14} style={{ color: "var(--trainer)" }} /> {day.focus || day.label}
          </p>
          <p className="text-[11px] text-muted">
            {conta(day.rows.length, "esercizio", "esercizi")} · {day.rows.filter((r) => rowVideo(r, videos)).length} con video · clicca un valore per modificarlo
          </p>
        </div>

        <div className="mt-[10px] grid grid-cols-[28px_1fr_96px_84px_76px_28px] items-center gap-[8px] px-[10px] text-[10px] font-semibold tracking-wide text-muted uppercase">
          <span>#</span>
          <span className="pl-[6px]">Esercizio e video</span>
          <span className="pl-[6px]">Serie × rip.</span>
          <span className="pl-[6px]">Carico</span>
          <span className="pl-[6px]">Recupero</span>
          <span />
        </div>
        <div className="mt-[6px] flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto [scrollbar-width:none]">
          <AnimatePresence initial={false}>
            {day.rows.map((r, i) => {
              const ex = r.exId ? exerciseById(r.exId) : undefined;
              const video = rowVideo(r, videos);
              const open = editing === r.key;
              return (
                <motion.div
                  key={r.key}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                  transition={{ delay: r.fresh ? i * 0.06 : 0.1 + i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                  className={`relative grid grid-cols-[28px_1fr_96px_84px_76px_28px] items-center gap-x-[8px] overflow-hidden rounded-[13px] border px-[10px] py-[7px] transition-colors ${open ? "border-[color-mix(in_srgb,var(--trainer)_45%,transparent)]" : "border-line"}`}
                >
                  {r.fresh && <motion.span className="pointer-events-none absolute inset-0" style={{ background: "var(--trainer)" }} initial={{ opacity: 0.22 }} animate={{ opacity: 0 }} transition={{ duration: 1.6, delay: i * 0.06 }} />}
                  <span className="relative grid size-[24px] place-items-center rounded-full bg-soft text-[11px] font-bold">{i + 1}</span>
                  <div className="relative min-w-0 leading-none">
                    <Cell label="Esercizio" value={rowName(r)} onChange={(v) => edit(r.key, "name", v)} className="text-[12.5px] font-semibold" />
                    <div className="mt-[3px] flex flex-wrap items-center gap-[6px] pl-[6px] text-[10px] text-muted">
                      <MuscleChip m={ex?.muscle} />
                      <span>{ex?.equipment ?? "Letto dal PDF"}</span>
                      <VideoChip url={video} open={open} onToggle={() => setEditing(open ? null : r.key)} />
                    </div>
                  </div>
                  <Cell label="Serie e ripetizioni" value={r.sets} onChange={(v) => edit(r.key, "sets", v)} className="text-[12px] font-semibold tabular-nums" />
                  <Cell label="Carico" value={r.load} onChange={(v) => edit(r.key, "load", v)} className="text-[12px] tabular-nums" />
                  <Cell label="Recupero" value={r.rest} onChange={(v) => edit(r.key, "rest", v)} className="text-[12px] tabular-nums" />
                  <button type="button" aria-label="Togli esercizio" onClick={() => remove(r.key)} className="relative grid size-[26px] cursor-pointer place-items-center rounded-full text-ink/40 transition-colors hover:bg-soft hover:text-ink">
                    <X size={13} />
                  </button>
                  <AnimatePresence>
                    {open && (
                      <VideoEditor
                        key="video"
                        url={video}
                        canSaveToLibrary={!!r.exId}
                        onSave={(link, toLibrary) => saveRowVideo(r, link, toLibrary)}
                        onRemove={() => {
                          playSound("tap");
                          if (r.video) updateDay((rows) => rows.map((x) => (x.key === r.key ? { ...x, video: undefined } : x)));
                          else if (r.exId) stato.setLibraryVideo(r.exId, null);
                          setEditing(null);
                        }}
                        onClose={() => setEditing(null)}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-[12px] flex items-center justify-between gap-[12px]">
          <p className="text-[11px] text-muted">
            {client.name.split(" ")[0]} vede la scheda nella sua app appena la invii, con il video sotto ogni esercizio.
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("tap");
              setConfirming((v) => !v);
            }}
            aria-expanded={confirming}
            className="flex h-[36px] shrink-0 cursor-pointer items-center gap-[7px] rounded-full btn-trainer px-[16px] text-[12px] font-semibold"
          >
            <Send size={13} /> Invia a {client.name.split(" ")[0]}
          </motion.button>
        </div>

        <AnimatePresence>
          {confirming && (
            <SendSheet
              key="invio"
              client={client}
              days={days.length}
              exercises={allRows.length}
              withVideo={withVideo}
              sending={sending}
              onCancel={() => setConfirming(false)}
              onSend={send}
            />
          )}
        </AnimatePresence>
      </section>

      <section className="flex min-h-0 flex-col panel rounded-[18px] px-[14px] pt-[14px] pb-[12px]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-bold">Esercizi e video</h2>
          <span className="text-[10.5px] text-muted tabular-nums">
            {libraryWithVideo} di {library.length} con video
          </span>
        </div>
        <p className="mt-[4px] text-[11px] leading-snug text-muted">
          Il tuo archivio di esercizi, ognuno con il video dell’esecuzione. Aggiungili alla scheda con +; quando importi un PDF i video si collegano da soli.
        </p>
        <label className="mt-[10px] flex h-[32px] items-center gap-[8px] rounded-full bg-soft px-[12px]">
          <Search size={13} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca un esercizio" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted" />
        </label>
        <div className="mt-[9px] flex flex-wrap gap-[5px]">
          {(["senza-video", ...muscles] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                playSound("tap");
                setMuscle((cur) => (cur === m ? null : m));
              }}
              className={`cursor-pointer rounded-full px-[9px] py-[4px] text-[10.5px] font-semibold transition-colors ${muscle === m ? "sel-trainer text-ink" : "bg-soft text-ink/70 hover:text-ink"}`}
            >
              {m === "senza-video" ? "Senza video" : m}
            </button>
          ))}
        </div>
        <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[5px] overflow-y-auto [scrollbar-width:none]">
          {results.map((e) => {
            const key = `lib-${e.id}`;
            const open = editing === key;
            return (
              <div key={e.id} className={`grid grid-cols-[1fr_auto] items-center gap-x-[9px] rounded-[12px] border px-[10px] py-[7px] transition-colors ${open ? "border-[color-mix(in_srgb,var(--trainer)_45%,transparent)]" : "border-line"}`}>
                <div className="flex min-w-0 items-center gap-[9px]">
                  <span className="size-[8px] shrink-0 rounded-full" style={{ background: muscleColors[e.muscle] }} />
                  <div className="min-w-0 flex-1 leading-none">
                    <p className="truncate text-[12px] font-semibold">{e.name}</p>
                    <div className="mt-[4px] flex flex-wrap items-center gap-[6px] text-[10px] text-muted">
                      <span>
                        {e.muscle} · {e.equipment}
                      </span>
                      <VideoChip url={videos[e.id]} open={open} onToggle={() => setEditing(open ? null : key)} />
                    </div>
                  </div>
                </div>
                <IconCircle icon={Plus} label={`Aggiungi ${e.name} alla scheda`} size={26} iconSize={13} variant="dark" sound="confirm" onClick={() => add(e.id)} />
                <AnimatePresence>
                  {open && (
                    <VideoEditor
                      key="video"
                      url={videos[e.id]}
                      canSaveToLibrary={false}
                      onSave={(link) => {
                        playSound("confirm");
                        stato.setLibraryVideo(e.id, link);
                        setEditing(null);
                      }}
                      onRemove={() => {
                        playSound("tap");
                        stato.setLibraryVideo(e.id, null);
                        setEditing(null);
                      }}
                      onClose={() => setEditing(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {results.length === 0 && <p className="mt-[20px] text-center text-[11.5px] text-muted">Nessun esercizio trovato.</p>}
        </div>
      </section>

      <AnimatePresence>{importing && <PdfImport clientName={client.name} onClose={() => setImporting(false)} onImported={imported} />}</AnimatePresence>
    </main>
  );
}
