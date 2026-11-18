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
import { avviaRicarica } from "@/libs/vera/ricarica";
import { caricaCliente, caricaTrainer } from "@/libs/vera/carica";
import { FOTO_VUOTA, messaggioDa, type Fotografia } from "@/libs/vera/mappa";
import { BUCKET_MARCHI, indirizzoMarchio, percorsoMarchio } from "@/libs/vera/marchio";
import { impostaLogo } from "@/libs/vera/logo";
import { impostaAccount } from "@/libs/vera/account";
import { oggi } from "@/libs/orologio";
import { eventiVeri } from "@/libs/vera/eventi";
import { avvisoArrivato, messaggioArrivato, sedutaArrivata } from "@/libs/vera/dal-vivo";
import { aggiungiDolore } from "@/libs/prototipo/dati-finti";
import { playSound } from "@/libs/ui/sound";
import type { Tables } from "@/types/db";
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
    impostaLogo(foto.logo ?? null);
    impostaAccount(foto.account ?? null);
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

      // foto e logo su Storage (bucket pubblico "marchi", migrazione 7): prima il file nuovo, poi la riga, poi via il vecchio
      const marchi = db.storage.from(BUCKET_MARCHI);
      const { trainerId } = ruolo;
      const percorsoDi = async (tipo: "foto" | "logo") => {
        const r = await db.from("trainers").select("photo_path, logo_path").eq("id", trainerId).single();
        return (tipo === "foto" ? r.data?.photo_path : r.data?.logo_path) ?? null;
      };
      const scriviRiga = (tipo: "foto" | "logo", percorso: string | null) =>
        db.from("trainers").update(tipo === "foto" ? { photo_path: percorso } : { logo_path: percorso }).eq("id", trainerId);
      eventiVeri.cambiaMarchio = async (tipo, file) => {
        const prima = await percorsoDi(tipo);
        const percorso = percorsoMarchio(trainerId, tipo);
        const su = await marchi.upload(percorso, file, { contentType: tipo === "foto" ? "image/jpeg" : "image/png", cacheControl: "31536000" });
        if (su.error) {
          console.error("Immagine non caricata", su.error.message);
          return null;
        }
        const riga = await scriviRiga(tipo, percorso);
        if (riga.error) {
          console.error("Immagine non salvata", riga.error.message);
          await marchi.remove([percorso]);
          return null;
        }
        if (prima) void marchi.remove([prima]);
        return indirizzoMarchio(percorso) ?? null;
      };
      eventiVeri.cambiaNome = async (nome) => {
        const r = await db.from("trainers").update({ name: nome }).eq("id", trainerId);
        if (r.error) console.error("Nome non salvato", r.error.message);
        return !r.error;
      };
      eventiVeri.togliMarchio = async (tipo) => {
        const prima = await percorsoDi(tipo);
        const riga = await scriviRiga(tipo, null);
        if (riga.error) return false;
        if (prima) void marchi.remove([prima]);
        return true;
      };
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

    // documenti su Storage (bucket privato "documenti", cartelle <trainer>/<cliente>): migrazione 6
    const cartella = ruolo.tipo === "trainer" ? ruolo.trainerId : foto.trainerDelCliente;
    const bucket = db.storage.from("documenti");
    const scarica = (percorso: string) => async () => {
      const r = await bucket.download(percorso);
      if (r.error) throw r.error;
      return r.data;
    };
    eventiVeri.caricaDocumento = async (d) => {
      if (!cartella) return null;
      const percorso = `${cartella}/${d.clientId}/${d.id}.${d.tipo === "pdf" ? "pdf" : "jpg"}`;
      const su = await bucket.upload(percorso, d.file, { contentType: d.tipo === "pdf" ? "application/pdf" : "image/jpeg" });
      if (su.error) {
        console.error("File non caricato", su.error.message);
        return null;
      }
      const riga = await db.from("documents").insert({ id: d.id, client_id: d.clientId, uploaded_by: d.da, storage_path: percorso, name: d.nome, kind: d.tipo });
      if (riga.error) {
        console.error("Documento non salvato", riga.error.message);
        await bucket.remove([percorso]);
        return null;
      }
      return percorso;
    };
    eventiVeri.togliDocumento = async (d) => {
      // prima il file (la regola del cliente guarda la riga), poi la riga
      if (d.percorso) {
        const via = await bucket.remove([d.percorso]);
        if (via.error) return false;
      }
      const riga = await db.from("documents").delete().eq("id", d.id);
      return !riga.error;
    };
    // il file si scarica solo quando si apre
    const documenti = (foto.stato.documenti ?? []).map((d) => (d.percorso ? { ...d, file: scarica(d.percorso) } : d));

    stato.carica({ ...foto.stato, documenti });
    const salvataggio = avviaSalvataggio({
      db,
      ruolo,
      leggi: () => {
        const s = stato.get();
        return { dati: s.dati, sedute: s.sedute, threads: s.threads, plans: s.plans, videos: s.videos };
      },
      ascolta: ascoltaStato,
      errore: (m) => toast.error(m),
    });

    // i dati cambiati dall'altro si rileggono dal database appena si può (eventi dal vivo, e ogni tanto da soli)
    const ricarica = avviaRicarica({
      leggi: async () => {
        const f = ruolo.tipo === "trainer" ? await caricaTrainer(db, ruolo.trainerId) : await caricaCliente(db, base.replace(/^\//, ""));
        if (!f) return null;
        const docs = (f.stato.documenti ?? []).map((d) => (d.percorso ? { ...d, file: scarica(d.percorso) } : d));
        return { ...f, stato: { ...f.stato, documenti: docs } };
      },
      // niente da salvare, e nessuno sta scrivendo (una casella con del testo): non si butta via quello che sta facendo
      libero: () => {
        if (salvataggio.occupato()) return false;
        const a = document.activeElement as (HTMLElement & { value?: string }) | null;
        if (!a) return true;
        const scrive = /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) ? !!a.value?.trim() : a.isContentEditable && !!a.textContent?.trim();
        return !scrive;
      },
      applica: (f) => {
        // uguale a quello che c'è già: niente da fare (anche gli eventi delle nostre stesse scritture finiscono qui)
        const s = stato.get();
        const prima = { dati: s.dati, sedute: s.sedute, threads: s.threads, plans: s.plans, videos: s.videos, documenti: s.documenti };
        const dopo = { dati: f.stato.dati, sedute: f.stato.sedute, threads: f.stato.threads, plans: f.stato.plans, videos: f.stato.videos, documenti: f.stato.documenti };
        if (JSON.stringify(prima) === JSON.stringify(dopo)) return;
        salvataggio.applicaDalDatabase(() => {
          usaDatiVeri(f.veri);
          stato.carica(dopo);
        });
      },
    });

    // dal vivo (Realtime): i messaggi dell'altro (migrazione 7); per il cliente le sedute che il trainer aggiunge,
    // sposta o annulla; per il trainer i dolori e le richieste di spostamento (migrazione 10); il resto (scheda,
    // pacchetti, pagamenti, misure, documenti, video…) si rilegge dal database (migrazione 11)
    const canale = db
      .channel("dal-vivo")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: riga }) => {
        const m = riga as Tables<"messages">;
        const clientId = messaggioArrivato(m, ruolo, stato.get().dati.clienti.map((c) => c.id));
        if (!clientId) return;
        stato.addMessage(clientId, messaggioDa(m, oggi()));
        playSound("open");
      });
    // le altre tabelle: a ogni cambiamento (anche dell'altro) si rilegge. sessions e alerts hanno il loro ascolto sotto.
    const DA_RILEGGERE = ["packages", "payments", "measurements", "workout_plans", "plan_days", "plan_exercises", "workout_logs", "documents", "exercise_videos", "clients"];
    for (const tabella of DA_RILEGGERE) canale.on("postgres_changes", { event: "*", schema: "public", table: tabella }, () => ricarica.richiedi());
    if (ruolo.tipo === "cliente")
      canale.on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, ({ new: riga }) => {
        ricarica.richiedi();
        if (!riga || !("id" in riga)) return;
        const r = sedutaArrivata(stato.get().sedute, riga as Tables<"sessions">, ruolo.clientId);
        if (!r) return;
        if (r.tipo === "metti") stato.putSeduta(r.seduta);
        else stato.removeSeduta(r.id);
        playSound("open");
      });
    else
      canale.on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, ({ eventType, new: riga }) => {
        ricarica.richiedi();
        if (eventType !== "INSERT") return;
        const r = avvisoArrivato(riga as Tables<"alerts">, stato.get().dati.clienti);
        if (!r) return;
        if (r.dolore) aggiungiDolore(r.dolore);
        playSound("open");
        toast(r.avviso, { icon: r.dolore ? "⚠️" : "📅", duration: 6000 });
      });
    // Il canale dal vivo deve conoscere chi è collegato: senza, il server lo tratta da visitatore ("Error 401:
    // Unauthorized") e non manda niente (trovato il 18/11 provando online). Prima si legge la sessione, poi ci si
    // iscrive; a ogni rinnovo della sessione si dà al canale il nuovo permesso.
    let attivo = true;
    void db.auth.getSession().then(async ({ data }) => {
      if (!attivo) return;
      await db.realtime.setAuth(data.session?.access_token ?? null);
      if (!attivo) return;
      canale.subscribe((esito, errore) => {
        if (esito === "SUBSCRIBED") ricarica.richiedi(); // appena collegati si rilegge: si recupera quello che è passato prima
        else if (esito === "CHANNEL_ERROR" || esito === "TIMED_OUT") console.error("Aggiornamenti dal vivo non attivi", errore?.message ?? esito);
      });
    });
    const { data: ascoltoSessione } = db.auth.onAuthStateChange((_evento, sessione) => {
      void db.realtime.setAuth(sessione?.access_token ?? null);
    });

    setPronto(true);
    return () => {
      attivo = false;
      ascoltoSessione.subscription.unsubscribe();
      ricarica.ferma();
      salvataggio.smetti();
      void db.removeChannel(canale);
    };
    // si avvia una volta sola: i dati arrivano dal server con la pagina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return pronto ? <>{children}</> : null;
}
