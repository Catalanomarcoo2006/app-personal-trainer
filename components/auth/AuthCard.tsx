import type { CSSProperties, ReactNode } from "react";

// Scheda centrata delle pagine d'accesso (login, nuova password, sospeso, pagina del trainer),
// con il colore del trainer quando c'è (variabile --trainer, la usa .btn-trainer).
export default function AuthCard({ title, subtitle, color, logo, children }: { title: string; subtitle?: ReactNode; color?: string; logo?: ReactNode; children?: ReactNode }) {
  const style = color ? ({ "--trainer": color } as CSSProperties) : undefined;
  return (
    <main className="testo-normale min-h-dvh flex items-center justify-center bg-salvia px-4 py-12" style={style}>
      <section className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-xl shadow-black/5">
        {logo && <div className="mb-6 flex justify-center">{logo}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-ink text-center">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </section>
    </main>
  );
}
