import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import { createClient } from "@/libs/supabase/server";
import { getAccess } from "@/libs/auth/profile";
import { validateSlug } from "@/libs/slug";
import AccessoCliente from "./AccessoCliente";
import { caricaCliente } from "@/libs/vera/carica";
import { Cornice } from "@/components/prototipo/Cornice";
import { AvvioVero } from "@/components/vera/AvvioVero";
import { ClientApp } from "@/components/prototipo/cliente/ClientApp";

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
// la sua app: la stessa della demo, con i suoi dati letti dal database (/<slug>/allenamento, /progressi, …).
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
    const foto = await caricaCliente(supabase, slug);
    if (!foto?.clienteIo) return <AuthCard title="Accesso sospeso" subtitle="Per ora l'app non è disponibile: contatta il tuo trainer." color={m.color} logo={logo} />;
    return (
      <Cornice>
        <AvvioVero foto={foto} ruolo={{ tipo: "cliente", clientId: foto.clienteIo }} base={`/${slug}`}>
          <ClientApp />
        </AvvioVero>
      </Cornice>
    );
  }

  if (access.role) return <AuthCard title={m.name} subtitle="Questa è la pagina d'accesso dei tuoi clienti." color={m.color} logo={logo} />;

  return (
    <AuthCard title={m.name} subtitle="Scrivi la tua email: ti mandiamo il link per entrare." color={m.color} logo={logo}>
      <AccessoCliente />
    </AuthCard>
  );
}
