"use client";

import { useEffect } from "react";
import Link from "next/link";

// Se una pagina si rompe: messaggio in italiano, "Riprova" ricarica solo la parte rotta.
// Il dettaglio tecnico va in console, non davanti all'utente.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-salvia p-6 text-ink">
      <section className="panel w-full max-w-[380px] rounded-[26px] px-[26px] py-[30px] text-center">
        <p className="text-[44px] leading-none">🥲</p>
        <h1 className="mt-[12px] text-[19px] font-bold">Qualcosa è andato storto</h1>
        <p className="mt-[6px] text-[13px] leading-relaxed text-muted">Riprova: se il problema resta, ricarica la pagina tra qualche secondo.</p>
        <div className="mt-[20px] flex justify-center gap-[10px]">
          <button type="button" onClick={reset} className="btn-trainer cursor-pointer rounded-full px-[18px] py-[9px] text-[13px] font-semibold">
            Riprova
          </button>
          <Link href="/" className="rounded-full bg-soft px-[18px] py-[9px] text-[13px] font-semibold transition-colors hover:bg-line">
            Torna all’app
          </Link>
        </div>
      </section>
    </main>
  );
}
