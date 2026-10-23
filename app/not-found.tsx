import Link from "next/link";

// Pagina che non esiste: messaggio breve e un tasto per tornare all'app.
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-salvia p-6 text-ink">
      <section className="panel w-full max-w-[380px] rounded-[26px] px-[26px] py-[30px] text-center">
        <p className="text-[56px] leading-none font-extrabold tabular-nums" style={{ color: "var(--trainer)" }}>
          404
        </p>
        <h1 className="mt-[12px] text-[19px] font-bold">Questa pagina non esiste</h1>
        <p className="mt-[6px] text-[13px] leading-relaxed text-muted">Forse l’indirizzo è sbagliato o la pagina è stata spostata.</p>
        <Link href="/" className="btn-trainer mt-[20px] inline-flex rounded-full px-[18px] py-[9px] text-[13px] font-semibold">
          Torna all’app
        </Link>
      </section>
    </main>
  );
}
