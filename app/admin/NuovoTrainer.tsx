"use client";

import { useActionState, useState } from "react";
import { slugify } from "@/libs/slug";
import { creaTrainerAction, type EsitoAzione } from "./actions";
import LinkDaCopiare from "./LinkDaCopiare";

// Nuovo trainer: nome, email e indirizzo (proposto dal nome, si può cambiare).
export default function NuovoTrainer() {
  const [esito, azione, inCorso] = useActionState<EsitoAzione, FormData>(creaTrainerAction, null);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugToccato, setSlugToccato] = useState(false);
  const slugMostrato = slugToccato ? slug : slugify(nome);

  return (
    <section className="rounded-3xl bg-card p-6 shadow-xl shadow-black/5">
      <h2 className="text-lg font-semibold text-ink">Nuovo trainer</h2>
      <form action={azione} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input name="name" required placeholder="Nome e cognome" className="input input-bordered rounded-2xl" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input name="email" required type="email" placeholder="Email" className="input input-bordered rounded-2xl" />
        <label className="input input-bordered flex items-center gap-1 rounded-2xl">
          <span className="text-muted">/</span>
          <input
            name="slug"
            placeholder="indirizzo"
            className="grow"
            value={slugMostrato}
            onChange={(e) => {
              setSlugToccato(true);
              setSlug(e.target.value);
            }}
          />
        </label>
        <button type="submit" className="btn btn-trainer rounded-2xl border-0" disabled={inCorso}>
          {inCorso && <span className="loading loading-spinner loading-xs" />}
          Crea e invita
        </button>
      </form>
      {esito && <p className={`mt-3 text-sm ${esito.ok ? "text-ink" : "text-error"}`}>{esito.messaggio}</p>}
      {esito?.ok && esito.link && <LinkDaCopiare link={esito.link} />}
    </section>
  );
}
