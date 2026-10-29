import Link from "next/link";
import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({ title: "Spotter", canonicalUrlRelative: "/" });

// Pagina d'ingresso finché non c'è la vetrina vera: le tre demo con i dati finti e le tre versioni vere,
// collegate al database (si entra con l'account).
type Voce = { href: string; titolo: string; testo: string; icona: ReactNode };

const ic = (d: string) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const COMPUTER = ic("M3 5h18v11H3zM8 20h8M12 16v4");
const TELEFONO = ic("M7 3h10v18H7zM11 18h2");
const CLIENTE = ic("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6");

const DEMO: Voce[] = [
  { href: "/demo/trainer", titolo: "Trainer da computer", testo: "Il gestionale completo, con Leo", icona: COMPUTER },
  { href: "/demo/telefono", titolo: "Trainer da telefono", testo: "Oggi, clienti, messaggi e calendario", icona: TELEFONO },
  { href: "/demo/cliente", titolo: "App del cliente", testo: "Scheda, progressi, messaggi e Leo", icona: CLIENTE },
];

const VERE: Voce[] = [
  { href: "/dashboard?computer", titolo: "Trainer da computer", testo: "Entra con il tuo account", icona: COMPUTER },
  { href: "/dashboard?telefono", titolo: "Trainer da telefono", testo: "Entra con il tuo account", icona: TELEFONO },
  { href: "/signin?cliente", titolo: "App del cliente", testo: "Si apre dal link del proprio trainer", icona: CLIENTE },
];

function Gruppo({ titolo, sottotitolo, voci }: { titolo: string; sottotitolo: string; voci: Voce[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">{titolo}</h2>
      <p className="text-sm text-muted">{sottotitolo}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {voci.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            className="group rounded-3xl bg-card p-5 shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-black/10"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl text-white" style={{ background: "var(--trainer)" }}>
              {v.icona}
            </span>
            <p className="mt-4 font-semibold text-ink">{v.titolo}</p>
            <p className="text-sm text-muted">{v.testo}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Ingresso() {
  return (
    <main className="min-h-dvh bg-salvia px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-leo-anello.svg" alt="" className="size-12" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Spotter</h1>
            <p className="text-sm text-muted">L&apos;app del personal trainer, con il suo marchio</p>
          </div>
        </header>
        <Gruppo titolo="Demo" sottotitolo="Con dati inventati: si può toccare tutto, ricaricando si riparte da capo." voci={DEMO} />
        <Gruppo titolo="App vera" sottotitolo="Collegata al database: dati veri, salvati." voci={VERE} />
      </div>
    </main>
  );
}
