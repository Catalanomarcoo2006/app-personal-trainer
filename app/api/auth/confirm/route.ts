import { NextResponse, NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/server";
import { getAccess, homeOf } from "@/libs/auth/profile";
import { safeNext } from "@/libs/auth/next-path";

export const dynamic = "force-dynamic";

const TIPI: EmailOtpType[] = ["invite", "magiclink", "recovery", "email", "signup", "email_change"];

// Link delle email (invito del trainer, link d'accesso del cliente, password dimenticata):
// /api/auth/confirm?token_hash=…&type=…&next=…. Funziona anche se il link si apre in un altro browser
// (l'app della posta sul telefono), a differenza del codice PKCE. Vedi docs/supabase.md per i modelli delle email.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !TIPI.includes(type)) return NextResponse.redirect(`${url.origin}/signin?errore=link`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return NextResponse.redirect(`${url.origin}/signin?errore=link`);

  // invito e recupero: prima si sceglie la password
  const fallback = type === "invite" || type === "recovery" ? "/nuova-password" : homeOf(await getAccess(supabase));
  return NextResponse.redirect(url.origin + safeNext(url.searchParams.get("next"), fallback));
}
