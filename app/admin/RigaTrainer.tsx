"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { cambiaStatoAction, nuovoLinkAction, rinnovaAction, type EsitoAzione } from "./actions";
import LinkDaCopiare from "./LinkDaCopiare";

type Trainer = { id: string; name: string; slug: string; status: "active" | "suspended"; license_expires_at: string };

const data = (iso: string) => iso.split("-").reverse().join("/");

export default function RigaTrainer({ trainer: t, scaduta }: { trainer: Trainer; scaduta: boolean }) {
  const [inCorso, avvia] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  const esegui = (fn: () => Promise<EsitoAzione>, conferma?: string) => {
    if (conferma && !window.confirm(conferma)) return;
    avvia(async () => {
      try {
        const r = await fn();
        if (r?.ok) {
          toast.success(r.messaggio);
          if (r.link) setLink(r.link);
        }
      } catch {
        toast.error("Non è riuscito, riprova");
      }
    });
  };

  const sospeso = t.status === "suspended";
  return (
    <article className="rounded-3xl bg-card p-5 shadow-xl shadow-black/5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-40 flex-1">
          <p className="font-semibold text-ink">{t.name}</p>
          <p className="text-sm text-muted">/{t.slug}</p>
        </div>
        <span className={`badge rounded-xl ${sospeso ? "badge-error badge-soft" : "badge-success badge-soft"}`}>{sospeso ? "Sospeso" : "Attivo"}</span>
        <p className={`text-sm ${scaduta ? "text-error font-medium" : "text-muted"}`}>
          {scaduta ? "Scaduta il" : "Scade il"} {data(t.license_expires_at)}
        </p>
        <div className="flex gap-2">
          <button className="btn btn-sm rounded-xl" disabled={inCorso} onClick={() => esegui(() => rinnovaAction(t.id))}>
            Rinnova
          </button>
          <button
            className="btn btn-sm rounded-xl"
            disabled={inCorso}
            onClick={() =>
              esegui(
                () => cambiaStatoAction(t.id, sospeso ? "active" : "suspended"),
                sospeso ? undefined : `Sospendere ${t.name}? Lui e i suoi clienti non potranno più entrare (i dati restano).`,
              )
            }
          >
            {sospeso ? "Riattiva" : "Sospendi"}
          </button>
          <button className="btn btn-ghost btn-sm rounded-xl" disabled={inCorso} onClick={() => esegui(() => nuovoLinkAction(t.id))}>
            Link d&apos;accesso
          </button>
        </div>
      </div>
      {link && <LinkDaCopiare link={link} />}
    </article>
  );
}
