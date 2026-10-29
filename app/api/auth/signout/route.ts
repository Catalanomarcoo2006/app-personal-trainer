import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// Esce e torna al login (tasto "Esci" delle pagine senza JavaScript, come /sospeso).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/signin", req.url), { status: 303 });
}
