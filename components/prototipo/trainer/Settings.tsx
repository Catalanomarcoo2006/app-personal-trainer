"use client";

import { MouseEvent as ReactMouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { Bot, Check, Globe, Moon, Palette, Sun, Volume2 } from "lucide-react";
import { Avatar, Toggle } from "@/components/ui/basics";
import { Appear, ProgressBar } from "@/components/ui/motion";
import { ACCENTS, useAppearance } from "@/components/ui/appearance";
import { isSoundEnabled, onSoundChange, playSound, setSoundEnabled } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { shrinkPhoto, stato, useTrainerPhoto } from "@/libs/prototipo/stato";

function Card({ title, icon, children, className = "" }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col panel rounded-[18px] px-[16px] pt-[14px] pb-[14px] ${className}`}>
      <h2 className="flex items-center gap-[7px] text-[14px] font-bold">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const [v, setV] = useState(value);
  return (
    <label className="block">
      <span className="text-[10.5px] text-muted">{label}</span>
      <input value={v} onChange={(e) => setV(e.target.value)} className="mt-[4px] h-[36px] w-full rounded-[11px] border border-line bg-card px-[12px] text-[12.5px] font-medium outline-none focus:border-[var(--trainer)]" />
    </label>
  );
}

function Row({ label, hint, initial = true }: { label: string; hint: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center gap-[12px] rounded-[13px] border border-line px-[12px] py-[10px]">
      <div className="min-w-0 flex-1 leading-snug">
        <p className="text-[12px] font-semibold">{label}</p>
        <p className="text-[10.5px] text-muted">{hint}</p>
      </div>
      <Toggle
        on={on}
        label={label}
        onChange={(next) => {
          playSound(next ? "confirm" : "tap");
          setOn(next);
        }}
      />
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange, id }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T, e: ReactMouseEvent) => void; id: string }) {
  return (
    <div className="flex gap-[4px] rounded-full bg-soft p-[4px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={(e) => onChange(o.value, e)}
          className={`relative flex flex-1 cursor-pointer items-center justify-center gap-[6px] rounded-full py-[7px] text-[12px] font-semibold ${value === o.value ? "text-ink" : "text-ink/65"}`}
        >
          {value === o.value && <motion.span layoutId={id} className="sel-trainer absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="relative flex items-center gap-[6px]">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SettingsView() {
  const photo = useTrainerPhoto();
  const photoInput = useRef<HTMLInputElement>(null);
  const { theme, setTheme, accent, setAccent } = useAppearance();
  const [sound, setSound] = useState(true);
  const [tone, setTone] = useState<"amichevole" | "professionale" | "motivante">("amichevole");

  useEffect(() => {
    setSound(isSoundEnabled());
    return onSoundChange(setSound);
  }, []);

  return (
    <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[372px_1fr_1fr] gap-x-[12px] pr-[18px] pl-[80px]">
      <div className="flex min-h-0 flex-col gap-[10px]">
        <Appear i={1}>
          <Card title="Il tuo profilo">
            <div className="mt-[12px] flex items-center gap-[14px]">
              <span className="grid size-[74px] place-items-center rounded-full border-[2px] p-[3px]" style={{ borderColor: "var(--trainer)" }}>
                <Avatar initials={trainer.initials} src={photo} size={64} />
              </span>
              <div className="leading-none">
                <p className="text-[17px] font-bold">{trainer.name}</p>
                <p className="mt-[5px] text-[12px] text-muted">{trainer.role}</p>
                <div className="mt-[8px] flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("tap");
                      photoInput.current?.click();
                    }}
                    className="cursor-pointer text-[11px] font-semibold underline underline-offset-2"
                  >
                    Cambia foto
                  </button>
                  {photo !== trainer.photo && (
                    <button
                      type="button"
                      onClick={() => {
                        playSound("tap");
                        stato.setTrainerPhoto(null);
                        toast("Rimessa la foto di prima");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-muted underline underline-offset-2"
                    >
                      Ripristina
                    </button>
                  )}
                </div>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      stato.setTrainerPhoto(await shrinkPhoto(file));
                      playSound("confirm");
                      toast.success("Foto aggiornata");
                    } catch {
                      toast.error("Non riesco a leggere questa immagine");
                    }
                  }}
                />
              </div>
            </div>
            <div className="mt-[12px] flex flex-col gap-[8px]">
              <Field label="Nome e cognome" value={trainer.name} />
              <Field label="Email" value="marco.rossi@esempio.it" />
              <Field label="Telefono" value="+39 340 000 0100" />
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                playSound("confirm");
                toast.success("Profilo salvato");
              }}
              className="mt-[14px] flex h-[38px] cursor-pointer items-center justify-center gap-[6px] rounded-full btn-trainer text-[12.5px] font-semibold"
            >
              <Check size={14} /> Salva le modifiche
            </motion.button>
          </Card>
        </Appear>
        <Appear i={2}>
          <Card title="Abbonamento">
            <div className="mt-[10px] flex items-center justify-between">
              <span className="rounded-full bg-ok-soft px-[9px] py-[3px] text-[10.5px] font-bold text-ok">Attivo</span>
              <span className="text-[11px] text-muted">Rinnovo 200 € all’anno</span>
            </div>
            <p className="mt-[8px] text-[12.5px]">
              Licenza valida fino al <b>21 ottobre 2027</b>
            </p>
            <div className="mt-[8px]">
              <ProgressBar percent={2} fill="var(--trainer)" track="var(--color-soft)" />
            </div>
          </Card>
        </Appear>
      </div>

      <div className="flex min-h-0 flex-col gap-[10px]">
        <Appear i={2}>
          <Card title="Il tuo marchio" icon={<Palette size={14} className="text-ink/60" />}>
            <p className="mt-[4px] text-[11px] text-muted">I tuoi clienti vedono l’app con il tuo logo e il tuo colore.</p>
            <div className="mt-[12px] flex items-center gap-[14px]">
              <motion.span
                key={accent}
                initial={{ scale: 0.8, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="grid size-[64px] place-items-center rounded-[18px] text-[22px] font-extrabold text-white"
                style={{ background: "var(--trainer)" }}
              >
                {trainer.initials}
              </motion.span>
              <div className="flex flex-wrap gap-[7px] pl-[4px]">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Colore ${c}`}
                    onClick={() => {
                      playSound("tap");
                      setAccent(c);
                    }}
                    className="relative grid size-[27px] cursor-pointer place-items-center rounded-full transition-transform [@media(hover:hover)]:hover:scale-110"
                    style={{ background: c }}
                  >
                    {accent === c && (
                      <motion.span layoutId="colore-scelto" className="absolute inset-[-4px] rounded-full border-2" style={{ borderColor: c }} transition={{ type: "spring", stiffness: 420, damping: 30 }} />
                    )}
                    {accent === c && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-[14px] rounded-[16px] px-[14px] py-[12px] transition-colors duration-500" style={{ background: "color-mix(in srgb, var(--trainer) 12%, var(--color-card))" }}>
              <p className="text-[10.5px] text-ink/55">Anteprima nell’app del cliente</p>
              <p className="mt-[4px] text-[15px] font-bold">Obiettivo −8 kg</p>
              <div className="mt-[8px]">
                <ProgressBar percent={39} fill="var(--trainer)" track="color-mix(in srgb, var(--trainer) 25%, var(--color-card))" />
              </div>
            </div>
            <p className="mt-[12px] flex items-center gap-[7px] rounded-full bg-soft px-[12px] py-[8px] text-[12px]">
              <Globe size={13} className="text-muted" /> nomeprodotto.it/<b>marco-rossi</b>
            </p>
          </Card>
        </Appear>
        <Appear i={3} className="min-h-0 flex-1">
          <Card title="Aspetto" className="h-full">
            <div className="mt-[12px]">
              <Segmented
                id="tema"
                value={theme}
                onChange={(v, e) => {
                  playSound("tap");
                  setTheme(v, { x: e.clientX, y: e.clientY });
                }}
                options={[
                  { value: "light", label: <><Sun size={13} /> Chiaro</> },
                  { value: "dark", label: <><Moon size={13} /> Scuro</> },
                ]}
              />
            </div>
            <div className="mt-[12px] flex items-center gap-[12px] rounded-[13px] border border-line px-[12px] py-[10px]">
              <Volume2 size={16} className="text-ink/60" />
              <div className="min-w-0 flex-1 leading-snug">
                <p className="text-[12px] font-semibold">Suoni ai clic</p>
                <p className="text-[10.5px] text-muted">Brevi e discreti, anche sul telefono dei clienti</p>
              </div>
              <Toggle
                on={sound}
                label="Suoni ai clic"
                onChange={(next) => {
                  setSoundEnabled(next);
                  if (next) playSound("confirm");
                }}
              />
            </div>
          </Card>
        </Appear>
      </div>

      <div className="flex min-h-0 flex-col gap-[10px]">
        <Appear i={3}>
          <Card title="Notifiche">
            <div className="mt-[12px] flex flex-col gap-[8px]">
              <Row label="Dolore segnalato" hint="Email subito quando l’assistente rileva un fastidio" />
              <Row label="Richiesta di spostamento" hint="Email quando un cliente chiede di cambiare seduta" />
              <Row label="Pacchetti in scadenza" hint="Avviso quando restano 2 lezioni o 7 giorni" />
              <Row label="Riepilogo del lunedì" hint="Incassi e sedute della settimana via email" initial={false} />
            </div>
          </Card>
        </Appear>
        <Appear i={4} className="min-h-0 flex-1">
          <Card title="Assistente virtuale" icon={<Bot size={15} className="text-ink/60" />} className="h-full">
            <p className="mt-[4px] text-[11px] text-muted">Risponde ai tuoi clienti su allenamento e abitudini, mai su diete.</p>
            <p className="mt-[12px] text-[10.5px] text-muted">Tono delle risposte</p>
            <div className="mt-[5px]">
              <Segmented
                id="tono"
                value={tone}
                onChange={(v) => {
                  playSound("tap");
                  setTone(v);
                }}
                options={[
                  { value: "amichevole", label: "Amichevole" },
                  { value: "professionale", label: "Professionale" },
                  { value: "motivante", label: "Motivante" },
                ]}
              />
            </div>
            <div className="mt-[12px] flex flex-col gap-[8px]">
              <Row label="Avvisami sui dolori" hint="L’assistente propone un’alternativa prudente e ti avvisa" />
            </div>
            <p className="mt-auto rounded-[12px] bg-soft px-[12px] py-[9px] text-[11px] text-ink/70">
              Rete di sicurezza: fino a <b>300 domande al mese</b> per cliente.
            </p>
          </Card>
        </Appear>
      </div>
    </main>
  );
}
