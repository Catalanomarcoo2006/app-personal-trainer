import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/db";
import { ANONIMO, getAccess } from "@/libs/auth/profile";
import { isPublicPath, resolveRoute, type Access } from "@/libs/auth/routing";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Senza chiavi Supabase (in locale prima del Task 3) non c'è sessione da rinnovare:
  // la pagina si apre lo stesso invece di dare errore 500.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // rinnova il token di accesso; se Supabase non risponde vale come anonimo (le aree riservate portano al login)
  const path = request.nextUrl.pathname;
  let access: Access = ANONIMO;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && !isPublicPath(path)) access = await getAccess(supabase);
  } catch (e) {
    console.warn("Supabase non raggiungibile dal middleware", e instanceof Error ? e.message : e);
  }

  // smistamento: ognuno nella sua area (libs/auth/routing.ts)
  const decision = resolveRoute(path, access);
  if (decision.action === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.to, request.url));
    // i cookie del token appena rinnovato devono arrivare anche con il reindirizzamento
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return supabaseResponse;
}
