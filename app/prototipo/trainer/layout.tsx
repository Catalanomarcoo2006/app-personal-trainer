import { ReactNode } from "react";
import { TrainerFrame } from "@/components/prototipo/trainer/Chrome";

// Cornice comune dell'area trainer: resta montata cambiando pagina, così la navigazione è istantanea.
export default function TrainerLayout({ children }: { children: ReactNode }) {
  return <TrainerFrame>{children}</TrainerFrame>;
}
