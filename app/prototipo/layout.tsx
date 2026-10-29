import { ReactNode } from "react";
import type { Metadata } from "next";
import { Cornice } from "@/components/prototipo/Cornice";
import { RestaDemo } from "@/components/vera/RestaDemo";

export const metadata: Metadata = {
  title: "Prototipo · APP PERSONAL TRAINER",
  // il nome sotto l'icona quando si aggiunge alla schermata Home dell'iPhone (nome provvisorio, Marco 27/10)
  applicationName: "Spotter",
  appleWebApp: { title: "Spotter" },
  robots: { index: false, follow: false },
  other: { google: "notranslate" },
};

export default function PrototipoLayout({ children }: { children: ReactNode }) {
  return (
    <Cornice>
      <RestaDemo>{children}</RestaDemo>
    </Cornice>
  );
}
