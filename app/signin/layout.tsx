import { ReactNode } from "react";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `Accedi a ${config.appName}`,
  canonicalUrlRelative: "/signin",
});

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
