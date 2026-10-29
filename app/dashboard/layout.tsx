import { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/libs/supabase/server";
import { getAccess, homeOf } from "@/libs/auth/profile";
import { caricaTrainer } from "@/libs/vera/carica";
import { Cornice } from "@/components/prototipo/Cornice";
import { AvvioVero } from "@/components/vera/AvvioVero";
import { TrainerFrame } from "@/components/prototipo/trainer/Chrome";
import AuthCard from "@/components/auth/AuthCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Spotter", applicationName: "Spotter", appleWebApp: { title: "Spotter" }, robots: { index: false, follow: false } };

// Area del trainer, versione vera: le stesse pagine della demo (computer e telefono), con i dati del trainer
// collegato letti dal database con le sue regole di accesso. Il middleware già smista; qui si ricontrolla.
export default async function LayoutDashboard({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const access = await getAccess(supabase);
  const dentro = (access.role === "trainer" && access.trainerActive) || access.role === "admin";
  if (!dentro) redirect(homeOf(access));

  const { data: trainerId } = await supabase.rpc("my_trainer_id");
  if (!trainerId) return <AuthCard title="Nessuna area trainer" subtitle="Questo account è l'amministratore: l'area trainer si vede entrando con l'account di un trainer." />;

  const foto = await caricaTrainer(supabase, trainerId);
  return (
    <Cornice>
      <AvvioVero foto={foto} ruolo={{ tipo: "trainer", trainerId }} base="/dashboard">
        <TrainerFrame>{children}</TrainerFrame>
      </AvvioVero>
    </Cornice>
  );
}
