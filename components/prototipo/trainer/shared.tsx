"use client";

import { Avatar } from "@/components/ui/basics";
import type { Client } from "@/libs/prototipo/dati-finti";

// Avatar di un cliente: la foto se c'è, altrimenti le iniziali.
export function ClientAvatar({ c, size = 24, className = "" }: { c: Pick<Client, "initials" | "photo">; size?: number; className?: string }) {
  return <Avatar initials={c.initials} src={c.photo} size={size} className={className} />;
}
