import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { getAccess, homeOf } from "@/libs/auth/profile";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({ title: "Pannello admin", canonicalUrlRelative: "/admin" });
export const dynamic = "force-dynamic";

// Solo Marco: il middleware già smista, qui si ricontrolla (le azioni lo rifanno a ogni chiamata).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAccess(await createClient());
  if (access.role !== "admin") redirect(homeOf(access));
  return <>{children}</>;
}
