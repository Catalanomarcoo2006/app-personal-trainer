import { type NextRequest } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // /prototipo è escluso: pagine statiche con dati finti, girano senza chiavi Supabase
    "/((?!_next/static|_next/image|favicon.ico|prototipo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
