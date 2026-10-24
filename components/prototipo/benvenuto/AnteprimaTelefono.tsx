"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BatteryFull, Check, Dumbbell, Eye, House, LineChart, Lock, Mail, MessageCircle, Play, SendHorizontal, ShieldCheck, Signal, Undo2, Wifi } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { trainer } from "@/libs/prototipo/dati-finti";
import { FRASI_TONO, inizialiStudio, linkApp, useBenvenuto, useNomeTrainer } from "@/libs/prototipo/benvenuto";
import { useStato, useTrainerPhoto } from "@/libs/prototipo/stato";
import { suonoVento } from "@/libs/ui/sound";
import { useScena } from "./scena";

// Il telefono nella vetrina del benvenuto: una versione ridotta dell'app che riceveranno i clienti del trainer
// (separata dall'app del cliente vera). Nel passo del marchio ("nascita") parte spento, a blocchi grigi, e ogni
// scelta ne accende un pezzo: nome dello studio, logo, colore, foto. Negli altri passi è già tutto acceso.
// Nel passo degli accordi ("consenso") sopra la home sale il foglio del consenso che vedranno i clienti; nel passo
// del primo cliente ("invito") lo schermo diventa l'invito che riceve il cliente, con il suo nome; nel passo di Leo
// ("leo") la chat del cliente con Leo, che risponde con il tono scelto dal trainer.

const LARGO = 270;
const ALTO = 560;
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const FATTI = [true, false, true, false, false, false, false];

export function AnteprimaTelefono({
  nascita,
  consenso = false,
  invito = false,
  leo = false,
  finale = false,
}: {
  nascita: boolean;
  consenso?: boolean;
  invito?: boolean;
  leo?: boolean;
  finale?: boolean;
}) {
  const reduce = useReducedMotion();
  const b = useBenvenuto();
  const scena = useScena();
  const cliente = invito ? scena.invito.nome.split(/\s+/)[0] || "" : "Giulia";
  const foto = useTrainerPhoto();
  const fotoScelta = useStato((s) => s.trainerPhoto) !== null;

  const acceso = {
    nome: !nascita || b.studio.trim() !== "",
    logo: !nascita || b.logo !== null,
    colore: !nascita || b.coloreScelto,
    foto: !nascita || fotoScelta,
  };
  // ogni scelta accende solo il suo pezzo: il nome dello studio accende anche i testi dell'app
  const testo = acceso.nome;
  const tutto = acceso.nome && acceso.logo && acceso.colore && acceso.foto;
  const nomeTrainer = useNomeTrainer();
  const studio = b.studio.trim() || nomeTrainer;

  // Il telefono si rimpicciolisce se la vetrina è bassa (lascia spazio alla scritta sotto).
  const spazio = useRef<HTMLDivElement>(null);
  const [scala, setScala] = useState(1);
  useLayoutEffect(() => {
    const el = spazio.current;
    if (!el) return;
    const misura = () => setScala(Math.min(1, Math.max(0.55, (el.clientHeight - 130) / ALTO)));
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Quando l'ultimo pezzo si accende passa un luccichio sullo schermo (una volta per ogni completamento).
  const [luccica, setLuccica] = useState(0);
  const prima = useRef(tutto);
  useEffect(() => {
    if (tutto && !prima.current && !reduce) setLuccica((n) => n + 1);
    prima.current = tutto;
  }, [tutto, reduce]);

  // Il telefono sale dal basso con un soffio di vento (solo all'ingresso nel passo del marchio).
  const soffiato = useRef(false); // in sviluppo React esegue gli effetti due volte: il vento suona una volta sola
  useEffect(() => {
    if (soffiato.current) return;
    soffiato.current = true;
    if (nascita && !reduce) suonoVento(0.18);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colore = (p = 100) => (acceso.colore ? (p === 100 ? "var(--trainer)" : `color-mix(in srgb, var(--trainer) ${p}%, var(--color-card))`) : "var(--color-line)");

  return (
    // nel passo di Leo e nel finale il telefono si sposta a destra: a sinistra, in basso, c'è Leo
    <motion.div
      ref={spazio}
      className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[16px]"
      initial={false}
      animate={{ x: leo || finale ? "17%" : "0%" }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* di chi è l'app nel telefono: dei clienti, non del trainer */}
      <motion.p
        className="flex items-center gap-[7px] rounded-full border border-white/80 bg-white/70 px-[12px] py-[6px] text-[11.5px] font-semibold text-ink/70 shadow-[0_8px_20px_-12px_rgba(40,20,10,0.35)] dark:border-white/12 dark:bg-[#1d1f23]/80"
        initial={{ opacity: 0, y: reduce ? 0 : -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.7 }}
      >
        <Eye size={13} /> Anteprima · {cliente ? `così la vede ${cliente}, ${invito ? "il tuo primo cliente" : "una tua cliente"}` : "così la vede il tuo cliente"}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 90, scale: reduce ? 1 : 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 30 }}
        transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 170, damping: 20, mass: 0.9, delay: 0.25 }}
        style={{ width: LARGO * scala, height: ALTO * scala }}
      >
        <div className="origin-top-left" style={{ width: LARGO, height: ALTO, transform: `scale(${scala})` }}>
          {/* cornice */}
          <div className="relative h-full w-full rounded-[44px] bg-[#16161a] p-[9px] shadow-[0_40px_80px_-30px_rgba(40,20,10,0.55),0_0_0_1.5px_rgba(255,255,255,0.08)_inset]">
            <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-soft text-ink">
              {/* isola in alto */}
              <span className="absolute left-1/2 top-[9px] z-20 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-[#16161a]" />

              <div className="flex h-[38px] items-center justify-between px-[22px] pt-[4px] text-[10.5px] font-semibold">
                <span>9:41</span>
                <span className="flex items-center gap-[4px]">
                  <Signal size={11} strokeWidth={2.5} />
                  <Wifi size={11} strokeWidth={2.5} />
                  <BatteryFull size={14} strokeWidth={2} />
                </span>
              </div>

              {/* intestazione: logo, nome dello studio, foto del trainer */}
              <div className="flex items-center gap-[10px] px-[16px] pb-[9px] pt-[4px]">
                <Accende acceso={acceso.logo} grigio={<span className="block size-[34px] rounded-[10px] bg-line" />}>
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="size-[34px] rounded-[10px] bg-white object-contain p-[3px]" />
                  ) : (
                    <span
                      className="grid size-[34px] place-items-center rounded-[10px] text-[12px] font-extrabold text-white transition-colors duration-500"
                      style={{ background: "var(--trainer)" }}
                    >
                      {inizialiStudio(b.studio, nomeTrainer)}
                    </span>
                  )}
                </Accende>
                <div className="min-w-0 flex-1">
                  <Accende
                    acceso={acceso.nome}
                    grigio={
                      <span className="block">
                        <span className="block h-[10px] w-[96px] rounded-full bg-line" />
                        <span className="mt-[6px] block h-[7px] w-[60px] rounded-full bg-line" />
                      </span>
                    }
                  >
                    <span className="block">
                      <span className="block truncate text-[13px] font-bold leading-[1.2]">{studio}</span>
                      <span className="block truncate text-[9.5px] text-muted">con {nomeTrainer}</span>
                    </span>
                  </Accende>
                </div>
                <Accende acceso={acceso.foto} grigio={<span className="block size-[32px] rounded-full bg-line" />}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto} alt="" className="size-[32px] rounded-full object-cover ring-2 ring-card" />
                </Accende>
              </div>

              {/* saluto */}
              <div className="px-[16px]">
                <Accende
                  acceso={testo}
                  grigio={
                    <span className="block">
                      <span className="block h-[16px] w-[120px] rounded-full bg-line" />
                      <span className="mt-[7px] block h-[8px] w-[84px] rounded-full bg-line" />
                    </span>
                  }
                >
                  <span className="block">
                    <span className="block text-[20px] font-bold leading-[1.15] tracking-[-0.02em]">Ciao, Giulia</span>
                    <span className="mt-[3px] block text-[10.5px] text-muted">Martedì 21 ottobre</span>
                  </span>
                </Accende>
                {(nascita || b.motto.trim()) && (
                  <div className="mt-[7px]">
                    <Accende acceso={b.motto.trim() !== ""} grigio={<span className="block h-[8px] w-[140px] rounded-full bg-line" />}>
                      <span className="block truncate text-[11px] font-medium italic text-ink/70">“{b.motto.trim()}”</span>
                    </Accende>
                  </div>
                )}
                {(nascita || b.specialita.length > 0) && (
                  <div className="mt-[8px]">
                    <Accende
                      acceso={b.specialita.length > 0}
                      grigio={
                        <span className="flex gap-[5px]">
                          <span className="block h-[18px] w-[58px] rounded-full bg-line" />
                          <span className="block h-[18px] w-[44px] rounded-full bg-line" />
                        </span>
                      }
                    >
                      <span className="flex gap-[5px] overflow-hidden">
                        {b.specialita.map((sp) => (
                          <span
                            key={sp}
                            className="shrink-0 whitespace-nowrap rounded-full px-[8px] py-[3px] text-[9.5px] font-semibold transition-colors duration-500"
                            style={{ background: acceso.colore ? colore(14) : "var(--color-card)", color: acceso.colore ? "var(--trainer)" : "var(--color-muted)" }}
                          >
                            {sp}
                          </span>
                        ))}
                      </span>
                    </Accende>
                  </div>
                )}
              </div>

              {/* obiettivo */}
              <div className="mx-[12px] mt-[10px] rounded-[18px] bg-card px-[14px] py-[11px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)]">
                <Accende
                  acceso={testo}
                  grigio={
                    <span className="block">
                      <span className="block h-[7px] w-[70px] rounded-full bg-line" />
                      <span className="mt-[9px] block h-[18px] w-[64px] rounded-full bg-line" />
                    </span>
                  }
                >
                  <span className="block">
                    <span className="block text-[10px] text-muted">Il tuo obiettivo</span>
                    <span className="mt-[2px] flex items-baseline gap-[6px]">
                      <span className="text-[22px] font-bold tracking-[-0.02em]">−8 kg</span>
                      <span className="text-[10px] text-muted">entro dicembre</span>
                    </span>
                  </span>
                </Accende>
                <div className="mt-[10px] h-[7px] overflow-hidden rounded-full transition-colors duration-500" style={{ background: colore(22) }}>
                  <motion.div
                    className="h-full rounded-full transition-colors duration-500"
                    style={{ background: colore() }}
                    initial={false}
                    animate={{ width: acceso.colore ? "39%" : "0%" }}
                    transition={{ duration: reduce ? 0 : 0.9, ease: EASE_OUT, delay: reduce ? 0 : 0.15 }}
                  />
                </div>
                <div className="mt-[6px] text-[9.5px] text-muted">{testo ? "−3,1 kg finora" : " "}</div>
              </div>

              {/* allenamento di oggi */}
              <div className="mx-[12px] mt-[8px] rounded-[18px] bg-card px-[14px] py-[11px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-[10px]">
                  <span className="grid size-[34px] place-items-center rounded-[11px] transition-colors duration-500" style={{ background: colore(16) }}>
                    <Dumbbell size={16} className="transition-colors duration-500" style={{ color: acceso.colore ? "var(--trainer)" : "var(--color-card)" }} />
                  </span>
                  <Accende
                    acceso={testo}
                    grigio={
                      <span className="block">
                        <span className="block h-[7px] w-[76px] rounded-full bg-line" />
                        <span className="mt-[7px] block h-[10px] w-[100px] rounded-full bg-line" />
                      </span>
                    }
                  >
                    <span className="block">
                      <span className="block text-[10px] text-muted">Allenamento di oggi</span>
                      <span className="block text-[13.5px] font-bold">Giorno A · Forza</span>
                    </span>
                  </Accende>
                </div>
                <div
                  className="mt-[10px] flex h-[34px] items-center justify-center gap-[6px] rounded-[11px] text-[12px] font-semibold transition-colors duration-500"
                  style={{ background: colore(), color: acceso.colore ? "#fff" : "var(--color-muted)" }}
                >
                  {testo && (
                    <>
                      <Play size={12} fill="currentColor" /> Inizia allenamento
                    </>
                  )}
                </div>
              </div>

              {/* settimana */}
              <div className="mx-[12px] mt-[8px] flex items-center justify-between rounded-[18px] bg-card px-[14px] py-[8px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.18)]">
                {GIORNI.map((g, i) => (
                  <span key={i} className="flex flex-col items-center gap-[4px]">
                    <span className="text-[8.5px] font-semibold text-muted">{testo ? g : " "}</span>
                    <span
                      className="size-[18px] rounded-full transition-colors duration-500"
                      style={{ background: FATTI[i] ? colore() : i === 3 ? colore(25) : "var(--color-soft)" }}
                    />
                  </span>
                ))}
              </div>

              {/* barra in basso */}
              <div className="absolute inset-x-0 bottom-0 flex h-[54px] items-start justify-around border-t border-line bg-card px-[10px] pt-[9px]">
                {[House, LineChart, MessageCircle].map((Icona, i) => (
                  <span
                    key={i}
                    className="grid size-[30px] place-items-center rounded-full transition-colors duration-500"
                    style={{ background: i === 0 ? colore(14) : "transparent", color: i === 0 && acceso.colore ? "var(--trainer)" : "var(--color-muted)" }}
                  >
                    <Icona size={15} />
                  </span>
                ))}
              </div>

              <AnimatePresence>{consenso && <FoglioConsenso key="consenso" studio={studio} />}</AnimatePresence>
              <AnimatePresence>{invito && <SchermoInvito key="invito" studio={studio} foto={foto} />}</AnimatePresence>
              <AnimatePresence>{leo && <SchermoLeo key="leo" studio={studio} />}</AnimatePresence>

              {/* luccichio a lavoro finito */}
              <AnimatePresence>
                {luccica > 0 && (
                  <motion.span
                    key={luccica}
                    aria-hidden
                    className="absolute inset-y-0 z-30 w-[60%] -skew-x-12"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
                    initial={{ left: "-70%" }}
                    animate={{ left: "130%" }}
                    transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={finale ? "finale" : leo ? "leo" : invito ? (scena.invito.inviato ? "inviato" : "invito") : consenso ? "consenso" : tutto ? "pronta" : "accende"}
          className="text-center text-[13px] font-semibold text-ink/60"
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {finale
            ? "Pronta per i tuoi clienti"
            : leo
            ? "Leo risponde ai tuoi clienti con il tono che scegli"
            : invito
            ? scena.invito.inviato
              ? `Invito partito: ecco cosa riceve ${cliente || "il tuo cliente"}`
              : "L'invito che riceverà il tuo cliente"
            : consenso
            ? "Il consenso che chiederemo ai tuoi clienti"
            : tutto
              ? "Così la vedranno i tuoi clienti"
              : "L'app dei tuoi clienti si accende mentre scegli"}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// Un pezzo dello schermo: grigio finché non è acceso, poi il contenuto vero entra con un piccolo scatto.
function Accende({ acceso, grigio, children }: { acceso: boolean; grigio: ReactNode; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <span className="grid">
      <AnimatePresence initial={false}>
        <motion.span
          key={acceso ? "si" : "no"}
          className="block [grid-area:1/1]"
          initial={{ opacity: 0, scale: reduce ? 1 : 0.86, filter: reduce ? "none" : "blur(3px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 420, damping: 24 }}
        >
          {acceso ? children : grigio}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Il foglio del consenso che il cliente trova alla prima apertura dell'app. La casella si spunta insieme a quella
// degli accordi del trainer (useScena().consenso): così il trainer vede cosa abilita la sua accettazione.
function FoglioConsenso({ studio }: { studio: string }) {
  const reduce = useReducedMotion();
  const { consenso: spuntato } = useScena();
  const punti = [
    { Icona: Lock, testo: "Li vedi solo tu e il tuo trainer" },
    { Icona: ShieldCheck, testo: "Server in Unione Europea" },
    { Icona: Undo2, testo: "Puoi ritirare il consenso quando vuoi" },
  ];
  return (
    <>
      {/* la home resta sotto, velata */}
      <motion.span
        aria-hidden
        className="absolute inset-0 z-[24] bg-[#16161a]/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.35 }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-[25] rounded-t-[28px] bg-card px-[16px] pb-[18px] pt-[10px] shadow-[0_-18px_40px_-20px_rgba(0,0,0,0.45)]"
        initial={{ y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
        transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 260, damping: 30, delay: 0.4 }}
      >
        <span className="mx-auto block h-[4px] w-[34px] rounded-full bg-line" />
        <span
          className="mt-[12px] grid size-[36px] place-items-center rounded-[12px]"
          style={{ background: "color-mix(in srgb, var(--trainer) 14%, var(--color-card))", color: "var(--trainer)" }}
        >
          <ShieldCheck size={18} />
        </span>
        <p className="mt-[9px] text-[16px] font-bold leading-[1.2] tracking-[-0.01em]">Prima di iniziare</p>
        <p className="mt-[4px] text-[10.5px] leading-[1.45] text-muted">
          <span className="font-semibold text-ink/80">{studio}</span> usa peso, misure e foto dei progressi solo per seguirti nel percorso.
        </p>
        <ul className="mt-[10px] space-y-[6px]">
          {punti.map(({ Icona, testo }, i) => (
            <motion.li
              key={testo}
              className="flex items-center gap-[8px] text-[10.5px] font-medium"
              initial={{ opacity: 0, x: reduce ? 0 : -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.75 + i * 0.08 }}
            >
              <Icona size={12} className="shrink-0" style={{ color: "var(--trainer)" }} />
              {testo}
            </motion.li>
          ))}
        </ul>
        <div
          className="mt-[12px] flex items-start gap-[8px] rounded-[12px] border px-[10px] py-[8px] transition-colors duration-300"
          style={{
            borderColor: spuntato ? "var(--trainer)" : "var(--color-line)",
            background: spuntato ? "color-mix(in srgb, var(--trainer) 7%, var(--color-card))" : "transparent",
          }}
        >
          <span
            className="mt-[1px] grid size-[15px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors duration-200"
            style={{ borderColor: spuntato ? "var(--trainer)" : "var(--color-line)", background: spuntato ? "var(--trainer)" : "transparent" }}
          >
            <AnimatePresence>
              {spuntato && (
                <motion.span
                  initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 24 }}
                >
                  <Check size={10} strokeWidth={3.5} className="text-white" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="text-[9.5px] leading-[1.4] text-ink/80">Acconsento al trattamento dei miei dati sulla salute per il mio percorso</span>
        </div>
        <div
          className="mt-[10px] flex h-[34px] items-center justify-center rounded-[11px] text-[12px] font-semibold transition-colors duration-300"
          style={{ background: spuntato ? "var(--trainer)" : "var(--color-soft)", color: spuntato ? "#fff" : "var(--color-muted)" }}
        >
          Continua
        </div>
      </motion.div>
    </>
  );
}

// L'invito che il cliente apre dal link: marchio del trainer, il suo nome che cambia mentre il trainer lo scrive,
// "Accetta l'invito". Quando l'invito parte, dall'alto scende la notifica dell'email.
function SchermoInvito({ studio, foto }: { studio: string; foto: string }) {
  const reduce = useReducedMotion();
  const b = useBenvenuto();
  const { invito } = useScena();
  const nomeTrainer = useNomeTrainer();
  const nome = invito.nome.split(/\s+/)[0] ?? "";
  // la notifica scende quando l'invito parte e dopo qualche secondo risale, come quelle vere (non copre il logo)
  // (tornando sul passo con l'invito già partito non riscende: si ignora quello che arriva appena montato)
  const [notifica, setNotifica] = useState(false);
  const montato = useRef(0);
  useEffect(() => {
    montato.current = Date.now();
  }, []);
  useEffect(() => {
    const appena = Date.now() - montato.current < 600;
    setNotifica(invito.inviato && !appena);
    if (!invito.inviato || appena) return;
    const t = window.setTimeout(() => setNotifica(false), 3500);
    return () => clearTimeout(t);
  }, [invito.inviato]);
  const cose = [
    { Icona: Dumbbell, testo: "Le tue schede, giorno per giorno" },
    { Icona: LineChart, testo: "Peso, misure e progressi" },
    { Icona: MessageCircle, testo: "Leo, il tuo assistente, sempre con te" },
  ];
  return (
    <motion.div
      className="absolute inset-0 z-[26] flex flex-col bg-card"
      initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: reduce ? 0 : 0.3 }}
    >
      {/* alone del colore del trainer in alto */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[230px]"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--trainer) 26%, transparent), transparent 72%)" }}
      />
      <div className="h-[38px]" />
      <div className="relative flex flex-1 flex-col items-center px-[18px] pt-[14px] text-center">
        <motion.div
          className="relative"
          initial={{ y: reduce ? 0 : 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        >
          {b.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo} alt="" className="size-[64px] rounded-[20px] bg-white object-contain p-[6px] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.4)]" />
          ) : (
            <span
              className="grid size-[64px] place-items-center rounded-[20px] text-[22px] font-extrabold text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.4)]"
              style={{ background: "var(--trainer)" }}
            >
              {inizialiStudio(b.studio, nomeTrainer)}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="" className="absolute -bottom-[8px] -right-[12px] size-[30px] rounded-full object-cover ring-[2.5px] ring-card" />
        </motion.div>

        {/* nome dello studio sotto il logo, poi chi invita (senza studio scelto basta il nome del trainer) */}
        {b.studio.trim() && <p className="mt-[16px] max-w-full truncate text-[12px] font-bold">{studio}</p>}
        <p className={`${b.studio.trim() ? "mt-[2px]" : "mt-[16px]"} text-[10.5px] font-semibold text-muted`}>{nomeTrainer} ti ha invitato</p>
        <p className="mt-[5px] flex h-[30px] items-center justify-center text-[24px] font-bold leading-none tracking-[-0.02em]">
          Ciao
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={nome}
              initial={{ opacity: 0, y: reduce ? 0 : 8, filter: reduce ? "none" : "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: reduce ? 0 : -8 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="inline-block max-w-[170px] truncate"
            >
              {nome ? `, ${nome}!` : "!"}
            </motion.span>
          </AnimatePresence>
        </p>
        <p className="mt-[7px] text-[10.5px] leading-[1.5] text-muted">Da oggi il tuo percorso di allenamento è tutto qui.</p>

        <ul className="mt-[16px] w-full space-y-[6px]">
          {cose.map(({ Icona, testo }, i) => (
            <motion.li
              key={testo}
              className="flex items-center gap-[9px] rounded-[13px] bg-soft px-[10px] py-[8px] text-left text-[10.5px] font-semibold"
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.7 + i * 0.08 }}
            >
              <span
                className="grid size-[24px] shrink-0 place-items-center rounded-[8px]"
                style={{ background: "color-mix(in srgb, var(--trainer) 15%, var(--color-card))", color: "var(--trainer)" }}
              >
                <Icona size={12} />
              </span>
              {testo}
            </motion.li>
          ))}
        </ul>

        <div className="mt-auto w-full pb-[20px]">
          <motion.div
            key={invito.inviato ? "inviato" : "attesa"}
            className="flex h-[38px] items-center justify-center rounded-[12px] text-[12.5px] font-semibold text-white"
            style={{ background: "var(--trainer)" }}
            initial={false}
            animate={invito.inviato && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.45 }}
          >
            Accetta l&apos;invito
          </motion.div>
          <p className="mt-[8px] flex items-center justify-center gap-[4px] text-[9px] text-muted">
            <Lock size={9} /> {linkApp(nomeTrainer)}
          </p>
        </div>
      </div>

      {/* la notifica dell'email quando l'invito parte */}
      <AnimatePresence>
        {notifica && (
          <motion.div
            key="notifica"
            className="absolute inset-x-[8px] top-[36px] z-10 flex items-center gap-[9px] rounded-[18px] border border-white/60 bg-white/85 px-[10px] py-[9px] text-left shadow-[0_14px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-[#2a2c31]/90"
            initial={{ y: reduce ? 0 : -90, opacity: reduce ? 0 : 1, scale: reduce ? 1 : 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: reduce ? 0 : -90, opacity: 0 }}
            transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 380, damping: 26 }}
          >
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] text-white" style={{ background: "var(--trainer)" }}>
              <Mail size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between text-[9px] font-semibold text-muted">
                <span>Email</span>
                <span>adesso</span>
              </span>
              <span className="block truncate text-[10.5px] font-bold">{studio}</span>
              <span className="block truncate text-[9.5px] text-ink/70">{nomeTrainer} ti ha invitato nella sua app</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// La chat del cliente con Leo: il cliente chiede cosa fare oggi, Leo "sta scrivendo" e risponde con il tono scelto
// dal trainer; cambiando tono la risposta si riscrive.
function SchermoLeo({ studio }: { studio: string }) {
  const reduce = useReducedMotion();
  const tono = useBenvenuto().tono;
  const [scrive, setScrive] = useState(!reduce);
  const primo = useRef(true);
  useEffect(() => {
    if (reduce) return;
    setScrive(true);
    // la prima volta Leo aspetta che la domanda del cliente sia arrivata
    const t = window.setTimeout(() => setScrive(false), primo.current ? 1700 : 850);
    primo.current = false;
    return () => clearTimeout(t);
  }, [tono, reduce]);

  return (
    <motion.div
      className="absolute inset-0 z-[26] flex flex-col bg-soft"
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay: reduce ? 0 : 0.3 }}
    >
      <div className="h-[38px]" />
      {/* intestazione della chat */}
      <div className="flex items-center gap-[9px] border-b border-line bg-card px-[14px] pb-[10px] pt-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/prototipo/coach/viso.webp"
          alt=""
          className="size-[34px] rounded-full object-cover"
          style={{ background: "color-mix(in srgb, var(--trainer) 16%, var(--color-card))" }}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-[1.2]">Leo</span>
          <span className="flex items-center gap-[4px] truncate text-[9.5px] text-muted">
            <span className="size-[6px] shrink-0 rounded-full bg-ok" /> assistente di {studio}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-[8px] px-[12px] pt-[14px]">
        <p className="self-center rounded-full bg-card px-[9px] py-[3px] text-[8.5px] font-semibold text-muted">Oggi 8:02</p>
        {/* la domanda del cliente, nel colore del trainer */}
        <motion.p
          className="max-w-[78%] self-end rounded-[16px] rounded-br-[5px] px-[11px] py-[8px] text-[11px] font-medium leading-[1.4] text-white"
          style={{ background: "var(--trainer)", transformOrigin: "100% 100%" }}
          initial={{ opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 380, damping: 24, delay: 0.75 }}
        >
          Ciao Leo! Cosa faccio oggi?
        </motion.p>
        {/* la risposta di Leo, che cambia con il tono */}
        <div className="flex items-end gap-[6px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prototipo/coach/viso.webp" alt="" className="size-[22px] shrink-0 rounded-full bg-card object-cover" />
          <AnimatePresence mode="wait" initial={false}>
            {scrive ? (
              <motion.span
                key="scrive"
                className="flex h-[30px] items-center gap-[3px] rounded-[16px] rounded-bl-[5px] bg-card px-[11px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.25)]"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-[5px] rounded-full bg-muted"
                    animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.14 }}
                  />
                ))}
              </motion.span>
            ) : (
              <motion.p
                key={tono}
                className="max-w-[80%] rounded-[16px] rounded-bl-[5px] bg-card px-[11px] py-[8px] text-[11px] font-medium leading-[1.45] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.25)]"
                initial={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 420, damping: 26 }}
                style={{ transformOrigin: "0% 100%" }}
              >
                {FRASI_TONO[tono]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* campo per scrivere e barra in basso, con la chat accesa */}
      <div className="mx-[10px] mb-[8px] flex h-[34px] items-center justify-between rounded-full border border-line bg-card pl-[12px] pr-[4px] text-[10.5px] text-muted">
        Scrivi a Leo…
        <span className="grid size-[26px] place-items-center rounded-full text-white" style={{ background: "var(--trainer)" }}>
          <SendHorizontal size={12} />
        </span>
      </div>
      <div className="flex h-[54px] items-start justify-around border-t border-line bg-card px-[10px] pt-[9px]">
        {[House, LineChart, MessageCircle].map((Icona, i) => (
          <span
            key={i}
            className="grid size-[30px] place-items-center rounded-full"
            style={{
              background: i === 2 ? "color-mix(in srgb, var(--trainer) 14%, var(--color-card))" : "transparent",
              color: i === 2 ? "var(--trainer)" : "var(--color-muted)",
            }}
          >
            <Icona size={15} />
          </span>
        ))}
      </div>
    </motion.div>
  );
}
