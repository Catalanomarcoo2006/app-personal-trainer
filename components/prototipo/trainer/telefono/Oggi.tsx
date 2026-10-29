"use client";

// "Oggi" del trainer da telefono. Al centro la giornata (Marco, 30/10): la prossima seduta in grande, poi la linea
// del tempo di oggi con il segno di "adesso". Sotto, più discreti, i promemoria: proposte dei clienti da confermare,
// dolori segnalati, pacchetti quasi finiti (non sono urgenze: niente rosso). Niente pagamenti: da telefono gli incassi
// non ci sono. Leo si apre dalla sua faccia in basso a destra (tocco: chat; tieni premuto: vocale).

import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, ClipboardCheck, MapPin } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { useStato } from "@/libs/prototipo/stato";
import { seduteDelGiorno } from "@/libs/prototipo/calendario";
import { ADESSO, type Seduta } from "@/libs/prototipo/leo-azioni";
import { useTrovaCliente, useUrgenti } from "@/libs/dati/selettori";
import { misureInAttesa } from "@/libs/dati/sportello";
import { conta } from "@/libs/ui/testo";
import { kinds } from "../Urgent";
import { ClientAvatar } from "../shared";
import { navigate, ROUTES } from "../nav";
import { fineDi, LinkTitoletto, minutiDi, Riga, Titoletto } from "./pezzi";

// i minuti di adesso (nella demo le 10:20)
const oraAdesso = () => minutiDi(ADESSO.ora);

// 40 → "tra 40 minuti", 130 → "tra 2 h 10 min"
function traQuanto(min: number): string {
  if (min <= 0) return "adesso";
  if (min < 60) return `tra ${conta(min, "minuto", "minuti")}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `tra ${h} h${m ? ` ${m} min` : ""}`;
}

export function OggiTelefono() {
  const sedute = seduteDelGiorno(
    useStato((s) => s.sedute),
    ADESSO.data,
  );
  const prossima = sedute.find((s) => minutiDi(s.time) + s.minutes > oraAdesso());

  return (
    <>
      {prossima ? <ProssimaSeduta s={prossima} /> : <GiornataFinita fatte={sedute.length} />}

      <Titoletto destra={<LinkTitoletto href={ROUTES.calendario}>Calendario</LinkTitoletto>}>La tua giornata</Titoletto>
      <LineaDelTempo sedute={sedute} />

      <Promemoria />
    </>
  );
}

// La prossima seduta (o quella in corso), in grande: l'ora protagonista, il cliente, quanto manca.
function ProssimaSeduta({ s }: { s: Seduta }) {
  const c = useTrovaCliente()(s.clientId);
  const reduce = useReducedMotion();
  const manca = minutiDi(s.time) - oraAdesso();
  const inCorso = manca <= 0;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        playSound("tap");
        navigate(ROUTES.cliente(s.clientId));
      }}
      className="panel relative mt-[16px] block w-full cursor-pointer overflow-hidden rounded-[26px] px-[18px] pt-[16px] pb-[16px] text-left"
      style={{ background: "linear-gradient(140deg, color-mix(in srgb, var(--trainer) 18%, var(--color-card)), var(--color-card) 65%)" }}
    >
      <span className="flex items-center gap-[7px] text-[12.5px] font-bold" style={{ color: "var(--trainer)" }}>
        <span className="relative grid size-[8px] place-items-center">
          {!reduce && <motion.span className="absolute inset-0 rounded-full" style={{ background: "var(--trainer)" }} animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />}
          <span className="size-[8px] rounded-full" style={{ background: "var(--trainer)" }} />
        </span>
        {inCorso ? "In corso adesso" : `Prossima seduta · ${traQuanto(manca)}`}
      </span>
      <span className="mt-[10px] flex items-end justify-between gap-[12px]">
        <span className="leading-none">
          <span className="block text-[46px] font-extrabold tracking-[-0.04em] tabular-nums">{s.time}</span>
          <span className="mt-[6px] block text-[13px] text-muted tabular-nums">
            fino alle {fineDi(s.time, s.minutes)} · {s.minutes} min
          </span>
        </span>
        {c && <ClientAvatar c={c} size={58} className="ring-[3px] ring-[var(--color-card)]" />}
      </span>
      <span className="mt-[14px] flex items-center justify-between gap-[10px] border-t border-line/60 pt-[12px]">
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[16px] font-bold">{c?.name ?? "Cliente"}</span>
          <span className="mt-[3px] flex items-center gap-[4px] truncate text-[12.5px] text-muted">
            {s.type} · <MapPin size={12} className="shrink-0" /> {s.place}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-ink/35" />
      </span>
    </motion.button>
  );
}

function GiornataFinita({ fatte }: { fatte: number }) {
  return (
    <div className="panel mt-[16px] rounded-[26px] px-[18px] py-[18px]">
      <p className="text-[20px] font-extrabold tracking-[-0.02em]">{fatte ? "Giornata finita 💪" : "Oggi niente sedute"}</p>
      <p className="mt-[4px] text-[13px] text-muted">{fatte ? `${conta(fatte, "seduta fatta", "sedute fatte")} oggi. Le prossime sono nel calendario.` : "Le prossime sono nel calendario."}</p>
    </div>
  );
}

// Le sedute di oggi su una linea verticale: pallino pieno per quelle fatte, il segno di "adesso" al suo posto.
function LineaDelTempo({ sedute }: { sedute: Seduta[] }) {
  const trova = useTrovaCliente();
  const primaFutura = sedute.findIndex((s) => minutiDi(s.time) + s.minutes > oraAdesso());
  const adessoPrima = primaFutura === -1 ? sedute.length : primaFutura;

  const Adesso = (
    <div key="adesso" className="relative flex items-center gap-[10px] py-[6px] pl-[76px]">
      <span className="absolute left-[58px] size-[9px] rounded-full ring-[3px] ring-[var(--color-card)]" style={{ background: "var(--trainer)" }} />
      <span className="text-[11.5px] font-bold tabular-nums" style={{ color: "var(--trainer)" }}>
        Adesso · {ADESSO.ora}
      </span>
      <span className="h-px flex-1" style={{ background: "color-mix(in srgb, var(--trainer) 45%, transparent)" }} />
    </div>
  );

  if (!sedute.length) return <div className="panel rounded-[24px] px-[16px] py-[18px] text-center text-[13px] text-muted">Nessuna seduta oggi</div>;

  return (
    <div className="panel relative rounded-[24px] px-[12px] py-[8px]">
      {/* la linea: passa al centro dei pallini (12 di margine + 42 dell'ora + 10 + 4 + 6) */}
      <span aria-hidden className="absolute top-[22px] bottom-[22px] left-[73px] w-[2px] rounded-full bg-line" />
      {sedute.map((s, i) => {
        const c = trova(s.clientId);
        const inizio = minutiDi(s.time);
        const fatta = inizio + s.minutes <= oraAdesso();
        const ora = inizio <= oraAdesso() && !fatta;
        return (
          <Fragment key={s.id}>
            {i === adessoPrima && !ora && Adesso}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSound("tap");
                navigate(ROUTES.cliente(s.clientId));
              }}
              className={`relative flex w-full cursor-pointer items-center gap-[10px] py-[10px] text-left ${fatta ? "opacity-50" : ""}`}
            >
              <span className="w-[42px] shrink-0 text-right leading-none">
                <span className="block text-[15px] font-extrabold tabular-nums">{s.time}</span>
                <span className="mt-[3px] block text-[10.5px] text-muted tabular-nums">{s.minutes} min</span>
              </span>
              <span
                aria-hidden
                className="relative z-10 ml-[4px] size-[12px] shrink-0 rounded-full ring-[3px] ring-[var(--color-card)]"
                style={{ background: fatta ? "var(--color-ink)" : ora ? "var(--trainer)" : "var(--color-card)", boxShadow: fatta || ora ? undefined : "inset 0 0 0 2px var(--color-line)" }}
              />
              <span className="glass-row flex min-w-0 flex-1 items-center gap-[10px] rounded-[16px] px-[10px] py-[8px]">
                {c && <ClientAvatar c={c} size={32} />}
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[14px] font-semibold">{c?.name ?? "Cliente"}</span>
                  <span className="mt-[2px] block truncate text-[11.5px] text-muted">
                    {s.type} · {s.place}
                  </span>
                </span>
                {fatta && <span className="shrink-0 text-[11px] text-muted">Fatta</span>}
                {ora && <span className="btn-trainer shrink-0 rounded-full px-[8px] py-[3px] text-[10.5px] font-bold">Adesso</span>}
              </span>
            </motion.button>
          </Fragment>
        );
      })}
      {adessoPrima === sedute.length && Adesso}
    </div>
  );
}

// I promemoria: in vetro chiaro, piccoli, senza numeri rossi. La seduta imminente non c'è: sta già in alto.
function Promemoria() {
  const urgenti = useUrgenti().filter((u) => u.kind !== "pagamento" && u.kind !== "imminente");
  const dati = useStato((s) => s.dati);
  const trova = useTrovaCliente();
  const daConfermare = dati.clienti.flatMap((c) => {
    const n = misureInAttesa(dati, c.id).length + (c.obiettivoProposto ? 1 : 0);
    return n ? [{ id: c.id, nome: c.name, n }] : [];
  });
  const quanti = urgenti.length + daConfermare.length;
  if (!quanti) return null;

  const icona = (Icon: typeof ClipboardCheck, color: string, bg: string) => (
    <span className="grid size-[30px] shrink-0 place-items-center rounded-full" style={{ background: bg, color }}>
      <Icon size={15} />
    </span>
  );

  return (
    <>
      <Titoletto destra={<span className="text-[12.5px] font-semibold text-muted">{quanti}</span>}>Da tenere d&apos;occhio</Titoletto>
      <div className="glass overflow-hidden rounded-[22px] [&_button]:py-[9px] [&_button_span.block]:text-[13px]">
        {daConfermare.map((d) => (
          <Riga
            key={`conferma-${d.id}`}
            href={ROUTES.cliente(d.id)}
            sinistra={icona(ClipboardCheck, "var(--trainer)", "color-mix(in srgb, var(--trainer) 14%, transparent)")}
            titolo={`${d.nome.split(" ")[0]} aspetta una conferma`}
            sotto={`${conta(d.n, "proposta", "proposte")} dalla sua app`}
          />
        ))}
        {urgenti.map((u) => {
          const k = kinds[u.kind];
          const c = trova(u.clientId);
          return <Riga key={u.title + u.clientId} href={ROUTES.cliente(u.clientId)} sinistra={icona(k.icon, k.color, k.bg)} titolo={u.title} sotto={c ? u.detail.replace(`${c.name} · `, `${c.name.split(" ")[0]} · `) : u.detail} />;
        })}
      </div>
    </>
  );
}
