"use client";

// "Oggi" del trainer da telefono: Leo in cima (il tasto luminoso dell'app del cliente), le cose da fare subito
// (senza i pagamenti: da telefono gli incassi non ci sono, Marco 29/10) con le misure che i clienti aspettano di
// vedere confermate, e le sedute di oggi.

import { ClipboardCheck } from "lucide-react";
import { useStato } from "@/libs/prototipo/stato";
import { seduteDelGiorno } from "@/libs/prototipo/calendario";
import { ADESSO } from "@/libs/prototipo/leo-azioni";
import { useTrovaCliente, useUrgenti } from "@/libs/dati/selettori";
import { misureInAttesa } from "@/libs/dati/sportello";
import { conta } from "@/libs/ui/testo";
import { ChiediALeo } from "@/components/prototipo/cliente/Home";
import { kinds } from "../Urgent";
import { ClientAvatar } from "../shared";
import { ROUTES } from "../nav";
import { fineDi, LinkTitoletto, minutiDi, Riga, Riquadro, Titoletto, Vuoto } from "./pezzi";
import type { Seduta } from "@/libs/prototipo/leo-azioni";

const ORA = minutiDi(ADESSO.ora);

export function OggiTelefono({ onLeo }: { onLeo: () => void }) {
  const sedute = seduteDelGiorno(
    useStato((s) => s.sedute),
    ADESSO.data,
  );
  const urgenti = useUrgenti().filter((u) => u.kind !== "pagamento");
  const dati = useStato((s) => s.dati);
  const trova = useTrovaCliente();
  const daConfermare = dati.clienti.flatMap((c) => {
    const n = misureInAttesa(dati, c.id).length + (c.obiettivoProposto ? 1 : 0);
    return n ? [{ id: c.id, nome: c.name, n }] : [];
  });
  const quante = urgenti.length + daConfermare.length;

  return (
    <>
      <ChiediALeo onApri={onLeo} sotto="Sedute, messaggi, clienti: dimmi e lo faccio" />

      <Titoletto
        destra={
          quante > 0 && (
            <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#e5484d] px-[6px] text-[11.5px] font-bold text-white">{quante}</span>
          )
        }
      >
        Da fare subito
      </Titoletto>
      <Riquadro>
        {daConfermare.map((d) => {
          const c = trova(d.id);
          return (
            <Riga
              key={`conferma-${d.id}`}
              href={ROUTES.cliente(d.id)}
              sinistra={
                <span className="sel-trainer grid size-[38px] shrink-0 place-items-center rounded-full" style={{ color: "var(--trainer)" }}>
                  <ClipboardCheck size={18} />
                </span>
              }
              titolo="Da confermare"
              sotto={`${d.nome} · ${conta(d.n, "proposta", "proposte")} dalla sua app`}
              destra={c && <ClientAvatar c={c} size={28} />}
            />
          );
        })}
        {urgenti.map((u) => {
          const k = kinds[u.kind];
          const c = trova(u.clientId);
          return (
            <Riga
              key={u.title + u.clientId}
              href={ROUTES.cliente(u.clientId)}
              sinistra={
                <span className="grid size-[38px] shrink-0 place-items-center rounded-full" style={{ background: k.bg, color: k.color }}>
                  <k.icon size={18} />
                </span>
              }
              titolo={u.title}
              sotto={u.detail}
              destra={c && <ClientAvatar c={c} size={28} />}
            />
          );
        })}
        {!quante && <Vuoto>Tutto a posto: niente di urgente 🎉</Vuoto>}
      </Riquadro>

      <Titoletto destra={<LinkTitoletto href={ROUTES.calendario}>Calendario</LinkTitoletto>}>
        Oggi in agenda
      </Titoletto>
      <Riquadro>
        {sedute.map((s) => (
          <RigaSeduta key={s.id} s={s} />
        ))}
        {!sedute.length && <Vuoto>Nessuna seduta oggi</Vuoto>}
      </Riquadro>
    </>
  );
}

// Una seduta: ora e durata a sinistra (i numeri in evidenza), il cliente, il tipo e il posto.
// Quelle già finite sono spente; quella in corso ha la scritta "Adesso".
export function RigaSeduta({ s, onClick }: { s: Seduta; onClick?: () => void }) {
  const c = useTrovaCliente()(s.clientId);
  const oggi = s.date === ADESSO.data;
  const inizio = minutiDi(s.time);
  const finita = s.date < ADESSO.data || (oggi && inizio + s.minutes <= ORA);
  const adesso = oggi && inizio <= ORA && ORA < inizio + s.minutes;
  return (
    <Riga
      href={onClick ? undefined : ROUTES.cliente(s.clientId)}
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
      destra={
        adesso ? (
          <span className="btn-trainer shrink-0 rounded-full px-[8px] py-[3px] text-[11px] font-bold">Adesso</span>
        ) : finita ? (
          <span className="shrink-0 text-[11.5px] text-muted">Fatta</span>
        ) : undefined
      }
    />
  );
}
