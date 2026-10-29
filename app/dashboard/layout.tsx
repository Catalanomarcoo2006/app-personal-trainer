import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { getAccess, homeOf } from "@/libs/auth/profile";

export const dynamic = "force-dynamic";

// Area del trainer: il middleware già smista, qui si ricontrolla (trainer attivo, o l'admin che guarda).
export default async function LayoutPrivate({ children }: { children: ReactNode }) {
  const access = await getAccess(await createClient());
  const dentro = (access.role === "trainer" && access.trainerActive) || access.role === "admin";
  if (!dentro) redirect(homeOf(access));
  return <>{children}</>;
}
