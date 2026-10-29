import { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/ui/motion";
import { AppearanceProvider } from "@/components/ui/appearance";
import { ClickSound } from "@/components/ui/ClickSound";
import { appearanceBootScript } from "@/libs/ui/appearance-boot";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

// Cornice comune delle app (demo e versione vera): font, tema chiaro/scuro, animazioni e suoni al tocco.
export function Cornice({ children }: { children: ReactNode }) {
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
