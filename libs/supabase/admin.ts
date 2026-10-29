import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

// Client con la chiave di servizio: salta le regole di accesso. Solo sul server (azioni dell'admin, inviti),
// sempre dopo aver controllato chi sta chiedendo. La chiave non ha NEXT_PUBLIC_: nel browser non esiste.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof window !== "undefined") throw new Error("Il client di servizio si usa solo sul server");
  if (!url || !key) throw new Error("Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
