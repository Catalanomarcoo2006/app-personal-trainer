import { createClient } from "@/libs/supabase/server";
import { romeDayKey } from "@/libs/domain/time";
import NuovoTrainer from "./NuovoTrainer";
import RigaTrainer from "./RigaTrainer";

// Pannello di Marco: i trainer con indirizzo, stato e scadenza della licenza; crea, rinnova, sospendi.
// L'elenco lo legge l'admin con le sue regole di accesso (trainers sì, dati dei clienti no).
export default async function Admin() {
  const supabase = await createClient();
  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, name, slug, status, license_expires_at, created_at")
    .order("created_at", { ascending: false });
  const oggi = romeDayKey(new Date());

  return (
    <main className="testo-normale min-h-dvh bg-salvia px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Trainer</h1>
            <p className="text-sm text-muted">{trainers?.length ?? 0} account</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost btn-sm rounded-xl">
              Esci
            </button>
          </form>
        </header>

        <NuovoTrainer />

        <section className="space-y-3">
          {trainers?.length ? (
            trainers.map((t) => <RigaTrainer key={t.id} trainer={t} scaduta={t.license_expires_at < oggi} />)
          ) : (
            <p className="rounded-3xl bg-card p-8 text-center text-muted">Ancora nessun trainer: crea il primo qui sopra.</p>
          )}
        </section>
      </div>
    </main>
  );
}
