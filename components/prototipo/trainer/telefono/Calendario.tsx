"use client";

// Calendario del trainer da telefono: i 14 giorni della demo in due righe (questa settimana e la prossima), le sedute
// del giorno scelto e il foglio per fissarne una nuova (cliente, giorno, ora con le rotelle, durata, tipo, posto).
// Toccando una seduta: aprire il profilo, scrivere al cliente o cancellarla. Gli stessi controlli di Leo
// (verificaAzione): niente sedute nel passato o sovrapposte. Quando Leo fissa o sposta, il giorno giusto si apre
// e la seduta si accende.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { CalendarX, MessageCircle, Plus, UserRound } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { stato, useFocusLeo, useStato } from "@/libs/prototipo/stato";
import { giornoDi, isoDi, LONG, MONTHS, SHORT, seduteDelGiorno } from "@/libs/prototipo/calendario";
import { ADESSO, luogoPredefinito, TIPI, verificaAzione, type Seduta } from "@/libs/prototipo/leo-azioni";
import { datiLeo } from "@/libs/prototipo/leo-esegui";
import type { AppointmentType } from "@/libs/prototipo/dati-finti";
import { useClienti, useTrovaCliente } from "@/libs/dati/selettori";
import { SelettoreOra } from "@/components/ui/Rotella";
import { Foglio } from "@/components/prototipo/cliente/Foglio";
import { ID_FOGLI } from "@/components/prototipo/cliente/nav";
import { conta } from "@/libs/ui/testo";
import { navigate, ROUTES } from "../nav";
import { ClientAvatar } from "../shared";
import { fineDi, minutiDi, Riga, Riquadro, Titoletto, Vuoto } from "./pezzi";

// i minuti di adesso (nella demo le 10:20)
const oraAdesso = () => minutiDi(ADESSO.ora);

// Una seduta: ora e fine a sinistra (i numeri in evidenza), il cliente, il tipo e il posto.
// Quelle già finite sono spente; quella in corso ha la scritta "Adesso".
function RigaSeduta({ s, onClick }: { s: Seduta; onClick: () => void }) {
  const c = useTrovaCliente()(s.clientId);
  const oggi = s.date === ADESSO.data;
  const inizio = minutiDi(s.time);
  const finita = s.date < ADESSO.data || (oggi && inizio + s.minutes <= oraAdesso());
  const adesso = oggi && inizio <= oraAdesso() && oraAdesso() < inizio + s.minutes;
  return (
    <Riga
      onClick={onClick}
      spenta={finita}
      sinistra={
        <span className="w-[46px] shrink-0 leading-none">
          <span className="block text-[16px] font-extrabold tabular-nums">{s.time}</span>
          <span className="mt-[4px] block text-[11px] text-muted tabular-nums">{fineDi(s.time, s.minutes)}</span>
        </span>
      }
      titolo={
        <span className="flex items-center gap-[8px]">
          {c && <ClientAvatar c={c} size={22} />}
          <span className="truncate">{c?.name ?? "Cliente"}</span>
        </span>
      }
      sotto={`${s.type} · ${s.place}`}
      destra={adesso ? <span className="btn-trainer shrink-0 rounded-full px-[8px] py-[3px] text-[11px] font-bold">Adesso</span> : finita ? <span className="shrink-0 text-[11.5px] text-muted">Fatta</span> : undefined}
    />
  );
}

// questa settimana e la prossima (calcolate a ogni disegno: nella versione vera il giorno cambia)
const settimane = () => [0, 1].map((w) => Array.from({ length: 7 }, (_, i) => giornoDi(w, i)));
const DURATE = [30, 45, 60, 90];

export const giornoLungo = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const data = new Date(y, m - 1, d);
  return `${LONG[(data.getDay() + 6) % 7]} ${d} ${MONTHS[m - 1]}`;
};

// Le due settimane, un giorno per cella: il pallino dice che ci sono sedute.
function Giorni({ scelto, onScegli }: { scelto: string; onScegli: (iso: string) => void }) {
  const sedute = useStato((s) => s.sedute);
  return (
    <div className="flex flex-col gap-[6px]">
      {settimane().map((settimana, w) => (
        <div key={w} className="grid grid-cols-7 gap-[4px]">
          {settimana.map((d, i) => {
            const iso = isoDi(d);
            const qui = iso === scelto;
            const passato = iso < ADESSO.data;
            const piene = sedute.some((s) => s.date === iso);
            return (
              <button
                key={iso}
                type="button"
                aria-pressed={qui}
                aria-label={giornoLungo(iso)}
                onClick={() => {
                  playSound("tap");
                  onScegli(iso);
                }}
                // i giorni passati: spenti, su fondo pieno (con un fondo trasparente le macchie colorate dietro li facevano beige)
                className={`relative flex h-[54px] cursor-pointer flex-col items-center justify-center rounded-[16px] leading-none ${qui ? "btn-trainer" : passato ? "bg-soft text-ink/35" : "glass"}`}
              >
                <span className={`text-[10.5px] font-semibold ${qui ? "" : "text-muted"}`}>{SHORT[i]}</span>
                <span className="mt-[4px] text-[17px] font-extrabold tabular-nums">{d.getDate()}</span>
                {iso === ADESSO.data && !qui && <span className="absolute top-[5px] right-[6px] size-[5px] rounded-full" style={{ background: "var(--trainer)" }} />}
                <span className={`mt-[4px] size-[4px] rounded-full ${piene ? (qui ? "bg-white" : "bg-ink/40") : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// I prossimi tre giorni con sedute dopo quello scelto (nelle due settimane mostrate): la pagina non resta mezza
// vuota e si vede la settimana a colpo d'occhio. Un tocco apre quel giorno.
function ProssimiGiorni({ dopo, onScegli }: { dopo: string; onScegli: (iso: string) => void }) {
  const tutte = useStato((s) => s.sedute);
  const giorni = settimane()
    .flat()
    .map(isoDi)
    .filter((iso) => iso > dopo)
    .map((iso) => ({ iso, sedute: seduteDelGiorno(tutte, iso) }))
    .filter((g) => g.sedute.length)
    .slice(0, 3);
  if (!giorni.length) return null;
  return (
    <>
      <Titoletto>Nei prossimi giorni</Titoletto>
      <Riquadro>
        {giorni.map((g) => (
          <Riga
            key={g.iso}
            onClick={() => {
              playSound("tap");
              onScegli(g.iso);
            }}
            sinistra={
              <span className="grid size-[40px] shrink-0 place-items-center rounded-[13px] bg-soft text-center leading-none">
                <span>
                  <span className="block text-[9.5px] font-semibold text-muted">{giornoLungo(g.iso).slice(0, 3)}</span>
                  <span className="mt-[2px] block text-[15px] font-extrabold tabular-nums">{Number(g.iso.slice(8))}</span>
                </span>
              </span>
            }
            titolo={conta(g.sedute.length, "seduta", "sedute")}
            sotto={g.sedute.map((s) => s.time).join(" · ")}
          />
        ))}
      </Riquadro>
    </>
  );
}

export function CalendarioTelefono({ giorno, onNuova }: { giorno?: string; onNuova: (r: { date: string }) => void }) {
  const [scelto, setScelto] = useState(giorno ?? ADESSO.data);
  const sedute = seduteDelGiorno(
    useStato((s) => s.sedute),
    scelto,
  );
  const [aperta, setAperta] = useState<Seduta | null>(null);
  const [fogli, setFogli] = useState<HTMLElement | null>(null);
  useEffect(() => setFogli(document.getElementById(ID_FOGLI)), []);
  useEffect(() => {
    if (giorno) setScelto(giorno);
  }, [giorno]);

  // Leo ha fissato, spostato o cancellato: si apre il giorno e la seduta si accende per un attimo
  const focus = useFocusLeo();
  const [accesa, setAccesa] = useState<string | null>(null);
  useEffect(() => {
    if (!focus || !["fissa", "sposta", "cancella"].includes(focus.tipo)) return;
    const s = stato.get().sedute.find((x) => x.id === focus.id);
    const data = s?.date ?? focus.da?.date;
    if (data) setScelto(data);
    if (!s) return;
    setAccesa(s.id);
    const t = window.setTimeout(() => setAccesa(null), 2200);
    return () => window.clearTimeout(t);
  }, [focus]);

  return (
    <>
      <div className="mt-[14px]">
        <Giorni scelto={scelto} onScegli={setScelto} />
      </div>

      <Titoletto
        destra={
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              playSound("open");
              onNuova({ date: scelto });
            }}
            className="btn-trainer flex h-[34px] cursor-pointer items-center gap-[5px] rounded-full px-[12px] text-[13px] font-semibold"
          >
            <Plus size={15} strokeWidth={2.6} /> Nuova
          </motion.button>
        }
      >
        <span className="block leading-tight">
          {giornoLungo(scelto)}
          <span className="block text-[12px] font-semibold text-muted">{sedute.length ? conta(sedute.length, "seduta", "sedute") : "Giornata libera"}</span>
        </span>
      </Titoletto>
      <Riquadro>
        {sedute.map((s) => (
          <motion.div
            key={s.id}
            animate={accesa === s.id ? { backgroundColor: ["color-mix(in srgb, var(--trainer) 0%, transparent)", "color-mix(in srgb, var(--trainer) 22%, transparent)", "color-mix(in srgb, var(--trainer) 0%, transparent)"] } : undefined}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="border-b border-line/60 last:border-0 [&>*]:border-0"
          >
            <RigaSeduta s={s} onClick={() => setAperta(s)} />
          </motion.div>
        ))}
        {!sedute.length && <Vuoto>Nessuna seduta: tocca “Nuova” per fissarne una</Vuoto>}
      </Riquadro>

      <ProssimiGiorni dopo={scelto} onScegli={setScelto} />

      {fogli && createPortal(<SchedaSeduta s={aperta} onChiudi={() => setAperta(null)} />, fogli)}
    </>
  );
}

// Il foglio di una seduta: chi, quando, dove; aprire il profilo, scrivere, cancellare (con un secondo tocco).
function SchedaSeduta({ s, onChiudi }: { s: Seduta | null; onChiudi: () => void }) {
  const c = useTrovaCliente()(s?.clientId ?? "");
  const [sicuro, setSicuro] = useState(false);
  useEffect(() => setSicuro(false), [s]);
  const primo = c?.name.split(" ")[0] ?? "il cliente";
  const vai = (href: string) => {
    playSound("tap");
    onChiudi();
    navigate(href);
  };

  return (
    <Foglio aperto={!!s} onChiudi={onChiudi} titolo={s ? `${s.type} · ${s.time}` : "Seduta"}>
      {s && (
        <div className="mt-[6px]">
          <p className="text-[14px] text-muted">
            {c?.name} · {giornoLungo(s.date)} · {s.minutes} min · {s.place}
          </p>
          <div className="mt-[16px] flex flex-col gap-[8px]">
            <button type="button" onClick={() => vai(ROUTES.cliente(s.clientId))} className="glass flex h-[48px] cursor-pointer items-center gap-[10px] rounded-[16px] px-[14px] text-[14.5px] font-semibold">
              <UserRound size={18} style={{ color: "var(--trainer)" }} /> Apri il profilo di {primo}
            </button>
            <button type="button" onClick={() => vai(`${ROUTES.messaggi}?cliente=${s.clientId}`)} className="glass flex h-[48px] cursor-pointer items-center gap-[10px] rounded-[16px] px-[14px] text-[14.5px] font-semibold">
              <MessageCircle size={18} style={{ color: "var(--trainer)" }} /> Scrivi a {primo}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!sicuro) {
                  playSound("tap");
                  return setSicuro(true);
                }
                stato.removeSeduta(s.id);
                playSound("close");
                toast.success("Seduta cancellata");
                onChiudi();
              }}
              className={`flex h-[48px] cursor-pointer items-center gap-[10px] rounded-[16px] px-[14px] text-[14.5px] font-semibold ${sicuro ? "bg-[#e5484d] text-white" : "glass text-[#d43b4f]"}`}
            >
              <CalendarX size={18} /> {sicuro ? "Tocca di nuovo per cancellarla" : "Cancella la seduta"}
            </button>
          </div>
        </div>
      )}
    </Foglio>
  );
}

// Il foglio per fissare una seduta: dal Calendario (col giorno scelto) o dal profilo (col cliente).
export function NuovaSeduta({ aperta, clientId, date, onChiudi }: { aperta: boolean; clientId?: string; date?: string; onChiudi: () => void }) {
  const clienti = useClienti();
  const [cliente, setCliente] = useState(clientId ?? clienti[0]?.id ?? "");
  const [giorno, setGiorno] = useState(date ?? ADESSO.data);
  const [ora, setOra] = useState("18:00");
  const [durata, setDurata] = useState(60);
  const [tipo, setTipo] = useState<AppointmentType>("Workout");
  const [luogo, setLuogo] = useState(luogoPredefinito("Workout"));
  const [errore, setErrore] = useState<string | null>(null);

  // a ogni apertura riparte da quello che passa chi lo apre
  useEffect(() => {
    if (!aperta) return;
    if (clientId) setCliente(clientId);
    setGiorno(date && date >= ADESSO.data ? date : ADESSO.data);
    setErrore(null);
  }, [aperta, clientId, date]);

  const fissa = () => {
    const v = verificaAzione({ nome: "fissa_appuntamento", dati: { cliente, data: giorno, ora, durata, tipo, luogo } }, datiLeo());
    if ("motivo" in v) {
      playSound("tap");
      return setErrore(v.motivo);
    }
    stato.addSeduta({ date: giorno, time: ora, minutes: durata, clientId: cliente, type: tipo, place: luogo.trim() || luogoPredefinito(tipo) });
    playSound("complete");
    toast.success(`Seduta fissata: ${giornoLungo(giorno).toLowerCase()} alle ${ora}`);
    onChiudi();
  };

  const scelta = (on: boolean) => `cursor-pointer rounded-full px-[12px] py-[7px] text-[13px] font-semibold ${on ? "btn-trainer" : "glass"}`;

  return (
    <Foglio aperto={aperta} onChiudi={onChiudi} titolo="Nuova seduta">
      <div className="mt-[12px] flex flex-col gap-[14px] pb-[4px]">
        <label className="block">
          <span className="mb-[6px] block text-[12.5px] font-semibold text-muted">Cliente</span>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)} className="glass h-[44px] w-full cursor-pointer rounded-[14px] px-[12px] text-[16px] outline-none">
            {clienti.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="mb-[6px] block text-[12.5px] font-semibold text-muted">Giorno</span>
          <Giorni scelto={giorno} onScegli={setGiorno} />
        </div>
        <div>
          <span className="mb-[6px] block text-[12.5px] font-semibold text-muted">Ora</span>
          {aperta && <SelettoreOra valore={ora} onChange={setOra} />}
        </div>
        <div>
          <span className="mb-[6px] block text-[12.5px] font-semibold text-muted">Durata</span>
          <div className="flex flex-wrap gap-[6px]">
            {DURATE.map((m) => (
              <button key={m} type="button" onClick={() => setDurata(m)} className={scelta(durata === m)}>
                {m} min
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-[6px] block text-[12.5px] font-semibold text-muted">Tipo</span>
          <div className="flex flex-wrap gap-[6px]">
            {TIPI.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t);
                  setLuogo(luogoPredefinito(t));
                }}
                className={scelta(tipo === t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-[6px] block text-[12.5px] font-semibold text-muted">Dove</span>
          <input value={luogo} onChange={(e) => setLuogo(e.target.value)} maxLength={60} className="glass h-[44px] w-full rounded-[14px] px-[12px] text-[16px] outline-none" />
        </label>
        {errore && <p className="text-[13px] font-semibold text-[#d43b4f]">{errore}</p>}
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={fissa} className="btn-trainer h-[50px] w-full cursor-pointer rounded-full text-[15px] font-bold">
          Fissa la seduta
        </motion.button>
      </div>
    </Foglio>
  );
}
