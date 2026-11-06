"use client";

// Avvio della versione vera, nel browser: orologio di adesso, indirizzi veri (/dashboard, /<slug>), dati letti dal
// database al posto di quelli della demo, e salvataggio di ogni cambiamento. Le pagine del prototipo si disegnano
// solo dopo (i figli aspettano), così non vedono mai i dati finti.

import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { impostaModo } from "@/libs/orologio";
import { usaDatiVeri } from "@/libs/prototipo/dati-finti";
import { ascoltaStato, stato } from "@/libs/prototipo/stato";
import { createClient } from "@/libs/supabase/client";
import { avviaSalvataggio, type Ruolo } from "@/libs/vera/salva";
import { FOTO_VUOTA, type Fotografia } from "@/libs/vera/mappa";
import { eventiVeri } from "@/libs/vera/eventi";
import { impostaSpunteVere } from "@/components/prototipo/cliente/spunte";
import { impostaBase } from "@/components/prototipo/trainer/nav";
import { fumettiVeri } from "@/components/prototipo/trainer/leo/Fumetti";
import { impostaBaseCliente } from "@/components/prototipo/cliente/nav";
import { impostaClienteIo } from "@/components/prototipo/cliente/scheda";
import { impostaFotoCliente } from "@/components/prototipo/cliente/Shell";
import { impostaRegistrazioneVera } from "@/components/prototipo/cliente/Registrazione";
import { impostaColoreVero } from "@/components/ui/appearance";

export function AvvioVero({ foto, ruolo, base, children }: { foto: Fotografia; ruolo: Ruolo; base: string; children: ReactNode }) {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const db = createClient();
    impostaModo("vera");
    usaDatiVeri(foto.veri);
    // il colore del marchio: dal database; il trainer lo cambia dalle Impostazioni (o con Leo) e si salva
    impostaColoreVero(foto.veri.trainer.color, (colore) => {
      if (ruolo.tipo !== "trainer") return;
      void db
        .from("trainers")
        .update({ color: colore })
        .eq("id", ruolo.trainerId)
        .then(({ error }) => error && toast.error("Il colore non è stato salvato"));
    });
    fumettiVeri();
    // gli errori qui non fermano nessuno: si vedono nella console e la prossima volta si riprova
    const segnala = (cosa: string) => ({ error }: { error: { message: string } | null }) => {
      if (error) console.error(`${cosa} non salvato`, error.message);
    };
    if (ruolo.tipo === "trainer") {
      impostaBase(base);
      eventiVeri.letti = (clientId) =>
        void db.from("messages").update({ read_at: new Date().toISOString() }).eq("client_id", clientId).eq("sender", "client").is("read_at", null).then(segnala("Messaggi letti"));
      eventiVeri.doloriVisti = (clientId) =>
        void db.from("alerts").update({ read: true }).eq("client_id", clientId).eq("kind", "pain").eq("read", false).then(segnala("Segnalazione vista"));
    } else {
      // l'allenamento di oggi: una riga al giorno, con il giorno italiano del server (set_workout_done)
      impostaSpunteVere(!!foto.allenatoOggi, (fatto) => {
        void db.rpc("set_workout_done", { p_done: fatto }).then(({ error }) => {
          if (error) toast.error(fatto ? "L'allenamento non è stato salvato: riprova" : "L'allenamento non è stato tolto: riprova");
        });
      });
      impostaBaseCliente(base);
      impostaClienteIo(ruolo.clientId);
      impostaFotoCliente(FOTO_VUOTA);
      impostaRegistrazioneVera(!!foto.registrato, () => {
        void db.rpc("complete_registration", { p_consent: true }).then(({ error }) => {
          if (error) toast.error("Il consenso non è stato salvato: riprova");
        });
      });
    }
    stato.carica(foto.stato);
    const smetti = avviaSalvataggio({
      db,
      ruolo,
      leggi: () => {
        const s = stato.get();
        return { dati: s.dati, sedute: s.sedute, threads: s.threads, plans: s.plans };
      },
      ascolta: ascoltaStato,
      errore: (m) => toast.error(m),
    });
    setPronto(true);
    return smetti;
    // si avvia una volta sola: i dati arrivano dal server con la pagina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return pronto ? <>{children}</> : null;
}
