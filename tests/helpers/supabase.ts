// Client Supabase per i test d'integrazione (npm run test:db).
// Le chiavi arrivano da SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY e SUPABASE_TEST_SERVICE_ROLE_KEY
// (ambiente o .env.test.local); se mancano si usa il Supabase locale (npx supabase start).
// Mai il progetto di produzione: i test creano e cancellano utenti.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

export type Db = SupabaseClient<Database>;

type Chiavi = { url: string; anon: string; service: string };
let chiavi: Chiavi | null = null;

function leggiChiavi(): Chiavi {
  if (chiavi) return chiavi;
  if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");
  const { SUPABASE_TEST_URL: url, SUPABASE_TEST_ANON_KEY: anon, SUPABASE_TEST_SERVICE_ROLE_KEY: service } = process.env;
  if (url && anon && service) return (chiavi = { url, anon, service });

  let out: string;
  try {
    out = execSync("npx supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    throw new Error("Nessun Supabase per i test: avvia quello locale (npx supabase start) o imposta SUPABASE_TEST_* in .env.test.local");
  }
  const v = (k: string) => out.match(new RegExp(`^${k}="(.*)"$`, "m"))?.[1] ?? "";
  chiavi = { url: v("API_URL"), anon: v("ANON_KEY"), service: v("SERVICE_ROLE_KEY") };
  if (!chiavi.url || !chiavi.anon || !chiavi.service) throw new Error("supabase status non ha restituito le chiavi");
  return chiavi;
}

const senzaSessione = { auth: { persistSession: false, autoRefreshToken: false } };

export function supabaseUrl(): string {
  return leggiChiavi().url;
}

// Chiave di servizio: salta le regole di accesso. Solo per preparare e controllare i dati.
export function adminClient(): Db {
  const { url, service } = leggiChiavi();
  return createClient<Database>(url, service, senzaSessione);
}

export function anonClient(): Db {
  const { url, anon } = leggiChiavi();
  return createClient<Database>(url, anon, senzaSessione);
}

export async function signInAs(email: string, password: string): Promise<Db> {
  const db = anonClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Accesso di ${email} non riuscito: ${error.message}`);
  return db;
}
