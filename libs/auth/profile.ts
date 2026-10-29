// Chi è l'utente collegato, per lo smistamento (resolveRoute): una sola chiamata a my_access() nel database.
// Senza utente, o se il database non risponde, vale come anonimo: le aree riservate portano al login.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import type { Access } from "./routing";

export const ANONIMO: Access = { role: null, trainerActive: false, clientTrainerSlug: null };

export async function getAccess(supabase: SupabaseClient<Database>): Promise<Access> {
  const { data, error } = await supabase.rpc("my_access");
  const riga = data?.[0];
  if (error || !riga) return ANONIMO;
  return { role: riga.role, trainerActive: riga.trainer_active, clientTrainerSlug: riga.client_trainer_slug };
}

// Dove va ognuno dopo l'accesso.
export function homeOf(access: Access): string {
  switch (access.role) {
    case "admin":
      return "/admin";
    case "trainer":
      return access.trainerActive ? "/dashboard" : "/sospeso";
    case "client":
      return access.clientTrainerSlug ? `/${access.clientTrainerSlug}` : "/sospeso";
    default:
      return "/signin";
  }
}
