import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getAccess, homeOf } from "@/libs/auth/profile";
import { safeNext } from "@/libs/auth/next-path";

export const dynamic = "force-dynamic";

// Dopo un accesso con codice (PKCE): scambia il codice con la sessione e manda ognuno nella sua area,
// o in ?next= se c'è (per esempio /nuova-password).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${requestUrl.origin}/signin?errore=link`);
  }

  const home = homeOf(await getAccess(supabase));
  return NextResponse.redirect(requestUrl.origin + safeNext(requestUrl.searchParams.get("next"), home));
}
