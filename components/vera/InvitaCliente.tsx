"use client";

import { useState, useTransition } from "react";
import { Copy, Send } from "lucide-react";
import toast from "react-hot-toast";
import { invitaClienteAction } from "@/app/dashboard/actions";
import { playSound } from "@/libs/ui/sound";

// Scheda del cliente, versione vera: il trainer lo invita nell'app (o gli rimanda il link d'accesso).
// Senza Resend l'email non parte: il link compare qui, da copiare e mandare su WhatsApp.
export function InvitaCliente({ clientId }: { clientId: string }) {
  const [inCorso, avvia] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  const invita = () =>
    avvia(async () => {
      playSound("tap");
      try {
        const r = await invitaClienteAction(clientId);
        if (!r.ok) return void toast.error(r.messaggio);
        toast.success(r.messaggio);
        if (r.link) setLink(r.link);
      } catch {
        toast.error("Invito non riuscito, riprova");
      }
    });

  const copia = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    playSound("confirm");
    toast.success("Link copiato");
  };

  return (
    <div className="mt-[10px]">
      <button type="button" onClick={invita} disabled={inCorso} className="btn-trainer flex h-[30px] items-center gap-[6px] rounded-full px-[12px] text-[11.5px] font-bold">
        <Send size={13} strokeWidth={2.4} /> {inCorso ? "Preparo l'invito…" : "Invita nell'app"}
      </button>
      {link && (
        <div className="mt-[8px] flex items-center gap-[6px] rounded-[12px] bg-soft p-[5px]">
          <input readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent px-[6px] text-[10.5px] text-muted outline-none" />
          <button type="button" onClick={copia} className="grid size-[26px] shrink-0 place-items-center rounded-full bg-card" aria-label="Copia il link">
            <Copy size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
