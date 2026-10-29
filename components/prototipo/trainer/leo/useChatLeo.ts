import { inDemo } from "@/libs/orologio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playSound, type SoundKind } from "@/libs/ui/sound";
import { clientById } from "@/libs/prototipo/dati-finti";
import { eSoldi } from "@/libs/prototipo/leo-azioni-soldi";
import { daConfermare, inChiaro, notaPerLeo, primaDopo, riassunto, verificaAzione, type AzioneLeo } from "@/libs/prototipo/leo-azioni";
import { estraiAzione, type Sezione } from "@/libs/prototipo/leo-contesto";
import { datiLeo, eseguiAzione } from "@/libs/prototipo/leo-esegui";
import { lettoreNdjson } from "@/libs/prototipo/leo-flusso";
import { creaFila } from "@/libs/prototipo/leo-fila";
import { aspettoAttuale, corpoRichiesta } from "@/libs/prototipo/leo-richiesta";
import { bloccoAllegato } from "@/libs/prototipo/leo-file";
import { clientiAttuali } from "@/libs/dati/selettori";
import { cancellazioniInsieme, durataScrittura, sezioneDi, TEMPI, tempoAzione, testoDaScrivere } from "@/libs/prototipo/leo-viaggio";
import { stato, type FocusLeo } from "@/libs/prototipo/stato";
import { type SchedaAzione } from "../LeoAzioni";
import { conModifica, daConfermareTutte, titoloModificato, type Modifica } from "@/libs/prototipo/leo-modifica";
import { dipendeDaNuovo, ordinaNuoviPrima, risolviDipendenza, sulNuovoCliente, type NuovoCliente } from "@/libs/prototipo/leo-dipendenze";
import { navigateFade, ROUTES } from "../nav";
import { answer, type Answer } from "./risposte";

// ——— Viaggio di Leo ———

export const attesa = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
export const ridotto = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const SUONI: Record<AzioneLeo["nome"], SoundKind> = { fissa_appuntamento: "complete", sposta_appuntamento: "open", cancella_appuntamento: "close", scrivi_messaggio: "confirm",
  scrivi_a_piu: "confirm",
  segna_pagato: "complete",
  registra_pagamento: "complete",
  rinnova_pacchetto: "confirm",
  sollecita: "confirm",
  aggiorna_misure: "complete",
  aggiorna_obiettivo: "confirm",
  aggiungi_nota: "confirm",
  nuovo_cliente: "complete",
  cambia_aspetto: "confirm",
  imposta_notifiche: "tap",
};

export const SOLDI_DAL_COMPUTER = "Pagamenti e pacchetti si gestiscono dal computer";

// ——— La chat (resta mentre si cambia pagina) ———

// nonCapite: azioni proposte dall'AI che non si riescono a leggere (la chat lo dice invece di tacere)
// allegato: il nome del file mandato insieme al messaggio del trainer
export type Msg = { id: number; from: "trainer" | "coach"; text: string; action?: Answer["action"]; schede?: SchedaAzione[]; nonCapite?: number; allegato?: string };
export type Allegato = { nome: string; testo: string };
export type Chat = {
  messages: Msg[];
  typing: boolean;
  thinking: boolean;
  ask: (q: string, allegato?: Allegato) => void;
  conferma: (msgId: number, key: string, modifica?: Modifica) => void;
  confermaTutte: (msgId: number) => void;
  segnaModifica: (key: string, modifica: Modifica) => void;
  rifiuta: (msgId: number, key: string) => void;
  annulla: (msgId: number, key: string) => void;
  torna: (msgId: number) => void;
  partenza: (msgId: number) => string | undefined;
  compatta: boolean; // durante il viaggio di Leo la chat si fa piccola e l'app va dove succede l'azione
};
// msgId e testo: per riscrivere la nota sugli esiti delle azioni nel turno di Leo (notaPerLeo)
export type Turn = { role: "user" | "assistant"; content: string; msgId?: number; testo?: string };

export const sectionLinks: Record<Exclude<Sezione, "cliente">, NonNullable<Answer["action"]>> = {
  oggi: { label: "Apri Oggi", href: ROUTES.oggi },
  clienti: { label: "Vedi i clienti", href: ROUTES.clienti },
  messaggi: { label: "Apri Messaggi", href: ROUTES.messaggi },
  schede: { label: "Apri Schede", href: ROUTES.schede },
  calendario: { label: "Apri Calendario", href: ROUTES.calendario },
  incassi: { label: "Apri Incassi", href: ROUTES.incassi },
  impostazioni: { label: "Apri Impostazioni", href: ROUTES.impostazioni },
};

// Il tasto proposto dall'AI ([[vai:…]]) diventa un link alla sezione o al profilo del cliente.
export function actionFor(vai: ReturnType<typeof estraiAzione>["vai"]): Answer["action"] {
  if (!vai) return undefined;
  if (vai.sezione !== "cliente") return sectionLinks[vai.sezione];
  const c = vai.clienteId ? clientById(vai.clienteId) : undefined;
  return c ? { label: `Apri il profilo di ${c.name.split(" ")[0]}`, href: ROUTES.cliente(c.id) } : undefined;
}

// Le risposte arrivano dall'AI (app/prototipo/api/leo) come eventi NDJSON: il testo si scrive man mano che arriva,
// le azioni diventano schede sotto la frase e partono in ordine (quelle da confermare fermano la fila).
// Senza chiave o se l'AI non risponde, Leo usa le risposte calcolate dai dati: la demo non si blocca mai.
// senzaSoldi: dal telefono pagamenti e pacchetti non si toccano (Marco, 29/10): le schede lo dicono e non partono.
export function useCoachChat({ senzaSoldi = false } = {}): Chat {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const history = useRef<Turn[]>([]);
  const request = useRef<AbortController | null>(null);
  const schede = useRef(new Map<number, SchedaAzione[]>());
  const [compatta, setCompatta] = useState(false);
  const partenze = useRef(new Map<number, string>());
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      request.current?.abort();
    },
    [],
  );

  // Aggiorna le schede di un messaggio: nella chat e nella nota per i turni successivi di Leo.
  const salvaSchede = useCallback((msgId: number, lista: SchedaAzione[]) => {
    schede.current.set(msgId, lista);
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, schede: lista } : x)));
    history.current = history.current.map((t) => (t.msgId === msgId ? { ...t, content: [t.testo, notaPerLeo(lista)].filter(Boolean).join(" ") } : t));
  }, []);

  // Una sola fila per tutti i viaggi: le azioni (e gli annulla) non si accavallano mai. Se un viaggio si rompe,
  // le schede rimaste a metà dicono che qualcosa è andato storto e la chat torna grande.
  const fila = useMemo(
    () =>
      creaFila((e) => {
        console.error("Leo: viaggio interrotto", e);
        for (const [msgId, lista] of schede.current)
          if (lista.some((s) => s.stato === "in-corso")) salvaSchede(msgId, lista.map((s) => (s.stato === "in-corso" ? { ...s, stato: "errore", motivo: "Qualcosa è andato storto, riprova" } : s)));
        setCompatta(false);
      }),
    [salvaSchede],
  );

  const cambia = useCallback(
    (msgId: number, key: string, patch: Partial<SchedaAzione>) => {
      salvaSchede(
        msgId,
        (schede.current.get(msgId) ?? []).map((s) => (s.key === key ? { ...s, ...patch } : s)),
      );
    },
    [salvaSchede],
  );

  // Porta il trainer dove succede l'azione: chat piccola, sezione giusta, poi l'azione si vede accadere.
  const viaggia = useCallback(async (msgId: number, azione: AzioneLeo) => {
    if (!partenze.current.has(msgId)) partenze.current.set(msgId, window.location.pathname + window.location.search);
    setCompatta(true);
    await attesa(TEMPI.compatta);
    const dove = sezioneDi(azione, datiLeo());
    if (dove) await navigateFade(dove);
    await attesa(TEMPI.arrivo);
  }, []);

  // Esegue in ordine le azioni in fila ("in-corso"), ognuna con il suo viaggio; si ferma alla prima che aspetta
  // la conferma. Un'azione che non passa i controlli non parte: la scheda dice il motivo, il trainer resta dov'è.
  const procedi = useCallback(
    (msgId: number) => {
      void fila.aggiungi(async () => {
        let viaggiato = false;
        for (;;) {
          const s = (schede.current.get(msgId) ?? []).find((x) => x.stato === "in-corso" || x.stato === "da-confermare");
          if (!s || s.stato === "da-confermare") break;
          // un'azione sul cliente che Leo ha appena creato: ora il cliente c'è, si cerca il suo id vero
          if (s.dipendeDa) {
            const dip = (schede.current.get(msgId) ?? []).find((x) => x.key === s.dipendeDa);
            const r = risolviDipendenza(s.azione, dip, clientiAttuali());
            if ("motivo" in r) cambia(msgId, s.key, { stato: "rifiutato", motivo: r.motivo, dipendeDa: undefined });
            else cambia(msgId, s.key, { azione: r.azione, titolo: riassunto(r.azione, datiLeo()), primaDopo: primaDopo(r.azione, datiLeo()), dipendeDa: undefined });
            continue;
          }
          // più cancellazioni di fila nella stessa settimana: un solo viaggio e il vetro si rompe su tutte insieme
          const lista = schede.current.get(msgId) ?? [];
          const insieme = cancellazioniInsieme(lista, lista.indexOf(s), stato.get().sedute);
          if (insieme.length > 1) {
            const valide = insieme.filter((g) => {
              const v = verificaAzione(g.azione, datiLeo());
              if ("motivo" in v) cambia(msgId, g.key, { stato: "rifiutato", motivo: v.motivo });
              return !("motivo" in v);
            });
            if (!valide.length) continue;
            await viaggia(msgId, valide[0].azione);
            viaggiato = true;
            const tolte: NonNullable<FocusLeo["gruppo"]> = [];
            for (const g of valide) {
              const esito = await eseguiAzione(g.azione);
              if ("motivo" in esito) {
                cambia(msgId, g.key, { stato: "rifiutato", motivo: esito.motivo });
                continue;
              }
              const f = stato.get().focus;
              if (f?.id && f.da) tolte.push({ id: f.id, ...f.da });
              cambia(msgId, g.key, { stato: "fatto", annulla: esito.annulla, fattaAlle: Date.now() });
            }
            if (tolte.length) {
              stato.setFocus({ tipo: "cancella", id: tolte[0].id, da: { date: tolte[0].date, time: tolte[0].time }, gruppo: tolte });
              playSound(SUONI.cancella_appuntamento);
              await attesa(tempoAzione("cancella_appuntamento", ridotto()));
            }
            continue;
          }
          const verifica = verificaAzione(s.azione, datiLeo());
          if ("motivo" in verifica) {
            cambia(msgId, s.key, { stato: "rifiutato", motivo: verifica.motivo });
            continue;
          }
          await viaggia(msgId, s.azione);
          viaggiato = true;
          // messaggi e solleciti: il testo si scrive da solo nella barra della chat, poi parte
          const scrive = testoDaScrivere(s.azione, datiLeo());
          if (scrive) {
            stato.setFocus({ tipo: "messaggio", clientId: scrive.clientId, testo: scrive.testo, daScrivere: true });
            await attesa(durataScrittura(scrive.testo, ridotto()) + 250);
          }
          const esito = await eseguiAzione(s.azione);
          if ("motivo" in esito) {
            cambia(msgId, s.key, { stato: "rifiutato", motivo: esito.motivo });
            continue;
          }
          playSound(SUONI[s.azione.nome]);
          cambia(msgId, s.key, { stato: "fatto", annulla: esito.annulla, fattaAlle: Date.now() });
          await attesa(tempoAzione(s.azione.nome, ridotto()));
        }
        if (viaggiato) {
          await attesa(TEMPI.ritorno);
          setCompatta(false);
        }
      });
    },
    [cambia, viaggia, fila],
  );

  const conferma = useCallback(
    (msgId: number, key: string, modifica?: Modifica) => {
      const s = schede.current.get(msgId)?.find((x) => x.key === key);
      if (!s || s.stato !== "da-confermare") return;
      playSound("tap");
      cambia(msgId, key, { stato: "in-corso", azione: conModifica(s.azione, modifica), ...(modifica && !s.dipendeDa ? { titolo: titoloModificato(s.azione, modifica, datiLeo()) } : {}) });
      procedi(msgId);
    },
    [cambia, procedi],
  );

  // Quello che il trainer cambia in una scheda (testo, spunte, email) mentre aspetta: "Conferma tutte" lo usa.
  const modifiche = useRef(new Map<string, Modifica>());
  const segnaModifica = useCallback((key: string, m: Modifica) => {
    modifiche.current.set(key, m);
  }, []);

  // Tutte le schede ancora da confermare partono insieme, in ordine, con il loro viaggio e le loro modifiche.
  const confermaTutte = useCallback(
    (msgId: number) => {
      const lista = schede.current.get(msgId) ?? [];
      if (!lista.some((x) => x.stato === "da-confermare")) return;
      playSound("tap");
      salvaSchede(msgId, daConfermareTutte(lista, modifiche.current, datiLeo()));
      procedi(msgId);
    },
    [salvaSchede, procedi],
  );

  const rifiuta = useCallback(
    (msgId: number, key: string) => {
      playSound("tap");
      cambia(msgId, key, { stato: "annullato" });
      procedi(msgId);
    },
    [cambia, procedi],
  );

  const annulla = useCallback(
    (msgId: number, key: string) => {
      const s = schede.current.get(msgId)?.find((x) => x.key === key);
      if (!s || s.stato !== "fatto" || !s.annulla) return;
      playSound("tap");
      // "in-corso" mentre si torna indietro: blocca il doppio tocco
      cambia(msgId, key, { stato: "in-corso", motivo: undefined });
      void fila.aggiungi(async () => {
        await viaggia(msgId, s.azione);
        const fatto = await s.annulla!();
        if ("motivo" in fatto) {
          cambia(msgId, key, { stato: "fatto", motivo: `Non posso annullare: ${fatto.motivo}` });
        } else {
          playSound(s.azione.nome === "fissa_appuntamento" ? "close" : "open");
          cambia(msgId, key, { stato: "annullato", annulla: undefined });
        }
        await attesa(tempoAzione(s.azione.nome, ridotto()) + TEMPI.ritorno);
        setCompatta(false);
      });
    },
    [cambia, viaggia, fila],
  );

  const torna = useCallback((msgId: number) => {
    const dove = partenze.current.get(msgId);
    if (!dove) return;
    playSound("tap");
    void navigateFade(dove);
  }, []);
  const partenza = useCallback((msgId: number) => partenze.current.get(msgId), []);

  const ask = useCallback(
    async (question: string, allegato?: Allegato) => {
      const text = question.trim() || (allegato ? "Leggi il file e aggiorna i dati" : "");
      if (!text || busy.current) return;
      busy.current = true;
      playSound("tap");
      setMessages((m) => [...m, { id: nextId.current++, from: "trainer", text, allegato: allegato?.nome }]);
      // nella cronologia resta solo il nome del file: il testo intero va a Leo una volta sola, in questa domanda
      history.current = [...history.current, { role: "user", content: allegato ? `${text}\n(file allegato "${allegato.nome}")` : text }];
      const conFile = (turni: Turn[]) =>
        allegato ? turni.map((t, i) => (i === turni.length - 1 && t.role === "user" ? { ...t, content: `${text}\n\n${bloccoAllegato(allegato.nome, allegato.testo)}` } : t)) : turni;
      setTyping(true);
      const id = nextId.current++;
      const thinkTimer = window.setTimeout(() => setThinking(true), 1200);

      const finish = (shown: string) => {
        history.current = [...history.current, { role: "assistant", content: shown, msgId: id, testo: shown }];
        busy.current = false;
        playSound("confirm");
      };
      const show = (shown: string, action?: Answer["action"]) =>
        setMessages((m) => (m.some((x) => x.id === id) ? m.map((x) => (x.id === id ? { ...x, text: shown, action } : x)) : [...m, { id, from: "coach", text: shown, action }]));
      const stopAttesa = () => {
        window.clearTimeout(thinkTimer);
        setTyping(false);
        setThinking(false);
      };

      const ctrl = new AbortController();
      request.current = ctrl;
      let raw = "";
      const azioni: AzioneLeo[] = [];
      let nonCapite = 0;
      try {
        // versione vera: niente dati veri verso l'AI (risponde answer(), con il messaggio di attesa)
        if (!inDemo()) throw new Error("versione vera: AI non ancora collegata");
        const res = await fetch("/prototipo/api/leo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpoRichiesta(conFile(history.current.slice(-10)).map(({ role, content }) => ({ role, content })), aspettoAttuale())),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(`${res.status} ${((await res.json().catch(() => ({}))) as { errore?: string }).errore ?? ""}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const lettore = lettoreNdjson((e) => {
          if (e.tipo === "testo") {
            raw += e.v;
            stopAttesa();
            show(estraiAzione(raw).text);
          } else if (e.tipo === "azione") {
            azioni.push({ nome: e.nome, dati: e.dati } as AzioneLeo);
          } else if (e.tipo === "azione-scartata") {
            nonCapite++;
          } else console.warn("Leo: risposta interrotta dal server", e.v);
        });
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          lettore.scrivi(decoder.decode(value, { stream: true }));
        }
        lettore.chiudi();
        if (!raw.trim() && !azioni.length && !nonCapite) throw new Error("risposta vuota");
        stopAttesa();
        const { text: final, vai } = estraiAzione(raw);
        // a volte l'AI propone le azioni senza scrivere niente: una frase di riserva, le schede dicono il resto
        const testo = final || (azioni.length ? "Ecco cosa preparo:" : "Non ho capito bene cosa fare: puoi riprovare con altre parole?");
        // con un'azione il tasto per aprire la sezione non serve: ci pensa l'azione
        show(testo, azioni.length ? undefined : actionFor(vai));
        finish(testo);
        if (nonCapite) setMessages((m) => m.map((x) => (x.id === id ? { ...x, nonCapite } : x)));
        if (azioni.length) {
          const dati = datiLeo();
          // il nuovo cliente passa per primo: le azioni che lo citano ("e fissagli una seduta") aspettano che esista
          const ordinate = ordinaNuoviPrima(azioni);
          const nuovi = ordinate.flatMap((a, i): NuovoCliente[] => (a.nome === "nuovo_cliente" ? [{ key: `${id}-${i}`, nome: a.dati.nome }] : []));
          salvaSchede(
            id,
            ordinate.map((a, i): SchedaAzione => {
              const chiara = inChiaro(a, clientiAttuali());
              const key = `${id}-${i}`;
              const nuovo = !chiara ? dipendeDaNuovo(a, nuovi) : undefined;
              if (nuovo) {
                const { azione, titolo } = sulNuovoCliente(a, nuovo, dati);
                return { key, azione, titolo, stato: daConfermare(azione, !!allegato) ? "da-confermare" : "in-corso", dipendeDa: nuovo.key };
              }
              if (!chiara) return { key, azione: a, titolo: "Azione su un cliente che non conosco", stato: "errore", motivo: "Cliente non trovato" };
              if (senzaSoldi && eSoldi(chiara.nome)) return { key, azione: chiara, titolo: riassunto(chiara, dati), stato: "rifiutato", motivo: SOLDI_DAL_COMPUTER };
              // il sollecito si legge e si può cambiare prima dell'invio: se Leo non l'ha scritto, quello standard
              if (chiara.nome === "sollecita" && !chiara.dati.testo) {
                const testo = testoDaScrivere(chiara, dati)?.testo;
                if (testo) return { key, azione: { ...chiara, dati: { ...chiara.dati, testo } }, titolo: riassunto(chiara, dati), stato: "da-confermare" };
              }
              // con un file allegato anche misure, obiettivo e note si confermano: si controllano i valori letti
              return { key, azione: chiara, titolo: riassunto(chiara, dati), primaDopo: primaDopo(chiara, dati), stato: daConfermare(chiara, !!allegato) ? "da-confermare" : "in-corso" };
            }),
          );
          procedi(id);
        }
      } catch (e) {
        stopAttesa();
        if (ctrl.signal.aborted) return;
        if (raw.trim()) {
          // interrotta a metà: resta quello che è arrivato
          finish(estraiAzione(raw).text);
          return;
        }
        console.warn("Leo: AI non raggiungibile, uso le risposte di riserva.", e instanceof Error ? e.message : e);
        const a = answer(text);
        const words = a.text.split(" ");
        words.forEach((_, i) =>
          timers.current.push(
            window.setTimeout(() => {
              const last = i === words.length - 1;
              show(words.slice(0, i + 1).join(" "), last ? a.action : undefined);
              if (last) finish(a.text);
            }, i * 28),
          ),
        );
      }
    },
    [procedi, salvaSchede, senzaSoldi],
  );

  return { messages, typing, thinking, ask, conferma, confermaTutte, segnaModifica, rifiuta, annulla, torna, partenza, compatta };
}
