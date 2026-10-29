import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import { createClient } from "@/libs/supabase/server";
import { getAccess } from "@/libs/auth/profile";
import { validateSlug } from "@/libs/slug";
import AccessoCliente from "./AccessoCliente";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function marchio(slug: string) {
  if (!validateSlug(slug).ok) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("trainer_branding", { p_slug: slug });
  return data?.[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await marchio(slug);
  return { title: m ? m.name : "Pagina non trovata" };
}

// La pagina del trainer (app.it/<slug>): login del cliente con il marchio del trainer; per il cliente collegato,
// la sua app (segnaposto finché la Fase 3 non porta qui l'app del prototipo).
export default async function PaginaTrainer({ params }: Props) {
  const { slug } = await params;
  const m = await marchio(slug);
  if (!m) notFound();

  const logo = (
    <span className="flex size-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ background: m.color }}>
      {m.name.charAt(0).toUpperCase()}
    </span>
  );

  if (!m.active) return <AuthCard title="Accesso sospeso" subtitle="Per ora l'app non è disponibile: contatta il tuo trainer." color={m.color} logo={logo} />;

  const supabase = await createClient();
  const access = await getAccess(supabase);

  if (access.role === "client") {
    const { data } = await supabase.rpc("my_client");
    const nome = data?.[0]?.name.split(" ")[0] ?? "";
    return <AuthCard title={`Ciao ${nome}!`} subtitle={`Sei nell'app di ${m.name}. Qui arriveranno scheda, progressi e messaggi.`} color={m.color} logo={logo} />;
  }

  if (access.role) return <AuthCard title={m.name} subtitle="Questa è la pagina d'accesso dei tuoi clienti." color={m.color} logo={logo} />;

  return (
    <AuthCard title={m.name} subtitle="Scrivi la tua email: ti mandiamo il link per entrare." color={m.color} logo={logo}>
      <AccessoCliente />
    </AuthCard>
  );
}
