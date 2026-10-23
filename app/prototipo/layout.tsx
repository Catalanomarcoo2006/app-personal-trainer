import { ReactNode } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/ui/motion";
import { AppearanceProvider } from "@/components/ui/appearance";
import { ClickSound } from "@/components/ui/ClickSound";
import { appearanceBootScript } from "@/libs/ui/appearance-boot";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Prototipo · APP PERSONAL TRAINER",
  robots: { index: false, follow: false },
  other: { google: "notranslate" },
};

export default function PrototipoLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-screen bg-salvia text-ink antialiased transition-colors`}>
      <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      <AppearanceProvider>
        <MotionProvider>{children}</MotionProvider>
      </AppearanceProvider>
      <ClickSound />
    </div>
  );
}
