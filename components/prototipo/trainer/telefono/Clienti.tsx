"use client";

// Clienti del trainer da telefono: l'elenco con la ricerca e il profilo semplificato (obiettivo, peso, misure,
// prossime sedute, pacchetto, note), con le proposte dalla sua app da confermare. Niente pagamenti né schede:
// quelli restano sul computer (Marco, 29/10).

import { useMemo, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { CalendarPlus, Mail, MessageCircle, Phone, Search, X } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { progressOf } from "@/libs/prototipo/dati-finti";
import { useStato } from "@/libs/prototipo/stato";
import { ADESSO } from "@/libs/prototipo/leo-azioni";
import { giornoDi, isoDi, SHORT } from "@/libs/prototipo/calendario";
import { useClienti, type ClienteVista } from "@/libs/dati/selettori";
import { navigate, ROUTES } from "../nav";
import { ClientAvatar } from "../shared";
import { DaConfermare } from "../DaConfermare";
import { minutiDi, Riga, Riquadro, Titoletto, Vuoto } from "./pezzi";

const numero = (n: number) => String(n).replace(".", ",");

export function ClientiTelefono() {
  const clienti = useClienti();
  const [cerca, setCerca] = useState("");
  const [filtro, setFiltro] = useState<"tutti" | "seguire">("tutti");
  const q = cerca.trim().toLowerCase();
  const visibili = clienti.filter((c) => (!q || c.name.toLowerCase().includes(q)) && (filtro === "tutti" || c.needsAttention));

  return (
    <>
      <label className="glass mt-[14px] flex h-[44px] items-center gap-[8px] rounded-full px-[14px]">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          placeholder="Cerca un cliente"
          aria-label="Cerca un cliente"
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
        {cerca && (
          <button type="button" aria-label="Cancella la ricerca" onClick={() => setCerca("")} className="grid size-[24px] cursor-pointer place-items-center rounded-full bg-soft">
            <X size={12} />
          </button>
        )}
      </label>
      <div className="mt-[10px] flex gap-[8px]">
        {(
          [
            ["tutti", `Tutti · ${clienti.length}`],
            ["seguire", `Da seguire · ${clienti.filter((c) => c.needsAttention).length}`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              playSound("tap");
              setFiltro(k);
            }}
            className={`cursor-pointer rounded-full px-[13px] py-[7px] text-[13px] font-semibold ${filtro === k ? "btn-trainer" : "glass"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Riquadro className="mt-[14px]">
        {visibili.map((c) => (
          <Riga
            key={c.id}
            href={ROUTES.cliente(c.id)}
            sinistra={<ClientAvatar c={c} size={44} />}
            titolo={c.name}
            sotto={`${c.goal} · ultimo allenamento: ${c.lastWorkout.toLowerCase()}`}
            destra={<Avanzamento c={c} />}
          />
        ))}
        {!visibili.length && <Vuoto>Nessun cliente trovato</Vuoto>}
      </Riquadro>
    </>
  );
}

// La percentuale verso l'obiettivo: un solo colore per tutti (nel colore di ogni cliente l'elenco sembrava un
// arcobaleno, Marco 30/10); in rosso solo chi è da seguire.
function Avanzamento({ c }: { c: ClienteVista }) {
  const p = progressOf(c);
  return (
    <span className="shrink-0 text-right leading-none">
      <span className="block text-[16px] font-extrabold tabular-nums" style={{ color: c.needsAttention ? "#d43b4f" : undefined }}>
        {p}%
      </span>
      {c.needsAttention && <span className="mt-[4px] block text-[10.5px] font-semibold text-[#d43b4f]">da seguire</span>}
    </span>
  );
}

// Le prossime sedute del cliente (da adesso in avanti, nelle due settimane della demo).
function useProssime(id: string) {
  const sedute = useStato((s) => s.sedute);
  return useMemo(
    () =>
      sedute
        .filter((s) => s.clientId === id && (s.date > ADESSO.data || (s.date === ADESSO.data && minutiDi(s.time) >= minutiDi(ADESSO.ora))))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 4),
    [sedute, id],
  );
}

const giornoBreve = (iso: string) => {
  if (iso === ADESSO.data) return "Oggi";
  for (let i = 0; i < 14; i++) {
    const d = giornoDi(0, i);
    if (isoDi(d) === iso) return `${SHORT[i % 7]} ${d.getDate()}`;
  }
  return iso;
};

export function ProfiloTelefono({ c, onNuovaSeduta }: { c: ClienteVista; onNuovaSeduta: (clientId: string) => void }) {
  const prossime = useProssime(c.id);
  // un solo colore, quello del trainer (come le percentuali dell'elenco): il tono del cliente qui era un colore in più
  const tono = { strong: "var(--trainer)", track: "var(--trainer-velo)" }; // al buio il velo diventa vetro (classi dark:)
  const p = progressOf(c);
  const primo = c.name.split(" ")[0];
  const pesi = c.weights;
  const [min, max] = [Math.min(...pesi), Math.max(...pesi)];

  return (
    <>
      <div className="mt-[14px] flex gap-[8px]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playSound("tap");
            navigate(`${ROUTES.messaggi}?cliente=${c.id}`);
          }}
          className="btn-trainer flex h-[44px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-full text-[14px] font-semibold"
        >
          <MessageCircle size={17} /> Scrivi
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playSound("open");
            onNuovaSeduta(c.id);
          }}
          className="glass flex h-[44px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-full text-[14px] font-semibold"
        >
          <CalendarPlus size={17} /> Seduta
        </motion.button>
        {c.phone && (
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} aria-label={`Chiama ${primo}`} className="glass grid size-[44px] shrink-0 place-items-center rounded-full">
            <Phone size={17} />
          </a>
        )}
      </div>

      <DaConfermare clientId={c.id} nome={c.name} posto="relative mt-[14px] w-full" />

      {/* obiettivo: i numeri in evidenza, la barra nel colore del trainer */}
      <Riquadro className="mt-[14px] px-[16px] py-[14px]">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-muted">{c.goal}</p>
          <p className="text-[13px] font-bold tabular-nums" style={{ color: tono.strong }}>
            {p}%
          </p>
        </div>
        <div className="mt-[8px] flex items-end justify-between leading-none">
          <span>
            <span className="block text-[11px] text-muted">Partenza</span>
            <span className="mt-[4px] block text-[16px] font-bold tabular-nums">
              {numero(c.start)} {c.unit}
            </span>
          </span>
          <span className="text-center">
            <span className="block text-[11px] text-muted">Oggi</span>
            <span className="mt-[4px] block text-[28px] font-extrabold tracking-[-0.03em] tabular-nums">
              {numero(c.current)} <span className="text-[14px] font-bold">{c.unit}</span>
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[11px] text-muted">Traguardo</span>
            <span className="mt-[4px] block text-[16px] font-bold tabular-nums">
              {numero(c.target)} {c.unit}
            </span>
          </span>
        </div>
        <div className="mt-[12px] h-[8px] overflow-hidden rounded-full bg-[var(--trainer-velo)] dark:bg-white/12">
          <motion.div className="h-full rounded-full" style={{ background: tono.strong }} initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        {pesi.length > 1 && (
          <div className="mt-[14px] flex h-[54px] items-end gap-[6px]" aria-label="Pesi delle ultime settimane">
            {pesi.map((w, i) => (
              <motion.span
                key={i}
                title={`${numero(w)} kg`}
                // le settimane passate: al buio vetro chiaro, perché il colore pallido sul nero diventa marrone
                className={`flex-1 rounded-t-[6px] ${i === pesi.length - 1 ? "" : "bg-[var(--barra)] dark:bg-white/15"}`}
                style={i === pesi.length - 1 ? { background: tono.strong } : ({ "--barra": tono.track } as CSSProperties)}
                initial={{ height: 0 }}
                animate={{ height: `${30 + (max === min ? 70 : ((w - min) / (max - min)) * 70)}%` }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </div>
        )}
        {pesi.length > 1 && (
          <p className="mt-[6px] flex justify-between text-[11.5px] text-muted">
            <span>Peso, ultime {pesi.length} settimane</span>
            <span className="font-semibold text-ink tabular-nums">{numero(pesi[pesi.length - 1])} kg</span>
          </p>
        )}
      </Riquadro>

      {c.measures.length > 0 && (
        <>
          <Titoletto>Misure</Titoletto>
          <Riquadro>
            {c.measures.map((m) => {
              const diff = +(m.current - m.start).toFixed(1);
              return (
                <Riga
                  key={m.label}
                  titolo={m.label}
                  sotto={`Partenza ${numero(m.start)} cm`}
                  destra={
                    <span className="text-right leading-none">
                      <span className="block text-[16px] font-extrabold tabular-nums">{numero(m.current)} cm</span>
                      {diff !== 0 && (
                        <span className="mt-[3px] block text-[11.5px] font-semibold tabular-nums" style={{ color: tono.strong }}>
                          {diff > 0 ? "+" : ""}
                          {numero(diff)}
                        </span>
                      )}
                    </span>
                  }
                />
              );
            })}
          </Riquadro>
        </>
      )}

      <Titoletto>Prossime sedute</Titoletto>
      <Riquadro>
        {prossime.map((s) => (
          <Riga
            key={s.id}
            href={`${ROUTES.calendario}?giorno=${s.date}`}
            sinistra={
              <span className="w-[52px] shrink-0 leading-none">
                <span className="block text-[12px] font-semibold text-muted">{giornoBreve(s.date)}</span>
                <span className="mt-[4px] block text-[16px] font-extrabold tabular-nums">{s.time}</span>
              </span>
            }
            titolo={s.type}
            sotto={`${s.minutes} min · ${s.place}`}
          />
        ))}
        {!prossime.length && <Vuoto>Nessuna seduta in programma</Vuoto>}
      </Riquadro>

      <Titoletto>Pacchetto</Titoletto>
      <Riquadro>
        <Riga titolo={c.pkg.label} sotto={c.pkg.left} destra={c.pkg.expiring ? <span className="shrink-0 rounded-full bg-[rgba(106,90,224,0.16)] px-[8px] py-[3px] text-[11px] font-bold text-[#6a5ae0]">In scadenza</span> : undefined} />
      </Riquadro>

      {c.notes && (
        <>
          <Titoletto>Note</Titoletto>
          <Riquadro className="px-[16px] py-[13px]">
            <p className="text-[14px] leading-snug">{c.notes}</p>
          </Riquadro>
        </>
      )}

      {(c.phone || c.email) && (
        <>
          <Titoletto>Contatti</Titoletto>
          <Riquadro>
            {c.phone && (
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-[12px] border-b border-line/60 px-[14px] py-[12px] text-[14.5px] font-semibold last:border-0">
                <Phone size={17} style={{ color: "var(--trainer)" }} /> {c.phone}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-[12px] border-b border-line/60 px-[14px] py-[12px] text-[14.5px] font-semibold last:border-0">
                <Mail size={17} style={{ color: "var(--trainer)" }} /> <span className="truncate">{c.email}</span>
              </a>
            )}
          </Riquadro>
        </>
      )}
    </>
  );
}

export function ClienteNonTrovato() {
  return (
    <Riquadro className="mt-[14px]">
      <Vuoto>Questo cliente non c&apos;è più.</Vuoto>
    </Riquadro>
  );
}
