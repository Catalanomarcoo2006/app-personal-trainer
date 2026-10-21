import { ReactNode } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/ui/motion";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Prototipo · APP PERSONAL TRAINER",
  robots: { index: false, follow: false },
};

export default function PrototipoLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-screen bg-salvia text-ink antialiased`}>
      <MotionProvider>{children}</MotionProvider>
    </div>
  );
}
