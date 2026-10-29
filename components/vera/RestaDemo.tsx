"use client";

import { useEffect, useState, type ReactNode } from "react";
import { modoAttuale } from "@/libs/orologio";

// La demo deve partire con i dati finti: se nello stesso browser si arriva qui dalla versione vera senza ricaricare
// (link interni), si ricarica la pagina e tutto riparte da capo.
export function RestaDemo({ children }: { children: ReactNode }) {
  const [vera] = useState(() => modoAttuale() === "vera");
  useEffect(() => {
    if (vera) window.location.reload();
  }, [vera]);
  return vera ? null : <>{children}</>;
}
