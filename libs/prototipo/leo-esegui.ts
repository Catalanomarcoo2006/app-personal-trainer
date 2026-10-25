// Esegue un'azione di Leo già in chiaro (inChiaro) e prepara il suo "Annulla".
// Prima ricontrolla sullo stato attuale: nel frattempo il trainer può aver cambiato qualcosa a mano.
// Asincrona come lo sportello dei dati (libs/dati/sportello.ts): con Supabase le scritture vanno al server.

import { inviaMessaggio, registraPagamento, rinnovaPacchetto, segnaPagato, type Esito as EsitoSportello } from "@/libs/dati/sportello";
import { testoSollecito } from "@/libs/dati/testi";
import { OGGI } from "@/libs/dati/iniziali";
import { luogoPredefinito, personalizza, verificaAzione, type AzioneLeo, type DatiLeo, type Verifica } from "./leo-azioni";
import { stato } from "./stato";

// annulla ricontrolla prima di rimettere: nel frattempo il trainer può aver occupato quell'orario a mano.
export type Esito = { ok: true; annulla?: () => Promise<Verifica> } | { ok: false; motivo: string };

export const datiLeo = (): DatiLeo => ({ sedute: stato.get().sedute, dati: stato.get().dati });
const conSedute = (sedute: DatiLeo["sedute"]): DatiLeo => ({ sedute, dati: stato.get().dati });

// Per l'annulla non conta "già passato": si rimette com'era, anche se era prima di adesso.
const SEMPRE = { data: "0000-00-00", ora: "00:00" };

// Dopo un'operazione dello sportello: se è andata, l'app guarda dove è successa; "Annulla" riporta lì lo sguardo.
function conFocus(esito: EsitoSportello, focus: Parameters<typeof stato.setFocus>[0]): Esito {
  if ("motivo" in esito) return esito;
  stato.setFocus(focus);
  const indietro = esito.annulla;
  return {
    ok: true,
    annulla: indietro
      ? async () => {
          const v = await indietro();
          if (v.ok) stato.setFocus(focus);
          return v;
        }
      : undefined,
  };
}

export async function eseguiAzione(a: AzioneLeo): Promise<Esito> {
  const { sedute } = stato.get();
  const verifica = verificaAzione(a, datiLeo());
  if (!verifica.ok) return verifica;

  switch (a.nome) {
    case "fissa_appuntamento": {
      const { cliente, data, ora, durata, tipo, luogo } = a.dati;
      const nuova = stato.addSeduta({ clientId: cliente, date: data, time: ora, minutes: durata, type: tipo, place: luogo ?? luogoPredefinito(tipo) });
      stato.setFocus({ tipo: "fissa", id: nuova.id });
      return {
        ok: true,
        annulla: async () => {
          stato.removeSeduta(nuova.id);
          stato.setFocus({ tipo: "cancella", id: nuova.id, da: { date: nuova.date, time: nuova.time } });
          return { ok: true };
        },
      };
    }
    case "sposta_appuntamento": {
      const prima = sedute.find((s) => s.id === a.dati.id)!;
      stato.updateSeduta(prima.id, { date: a.dati.data, time: a.dati.ora, minutes: a.dati.durata ?? prima.minutes });
      stato.setFocus({ tipo: "sposta", id: prima.id, da: { date: prima.date, time: prima.time } });
      return {
        ok: true,
        annulla: async () => {
          const v = verificaAzione({ nome: "sposta_appuntamento", dati: { id: prima.id, data: prima.date, ora: prima.time, durata: prima.minutes } }, conSedute(stato.get().sedute), SEMPRE);
          if (!v.ok) return v;
          stato.updateSeduta(prima.id, { date: prima.date, time: prima.time, minutes: prima.minutes });
          stato.setFocus({ tipo: "sposta", id: prima.id, da: { date: a.dati.data, time: a.dati.ora } });
          return v;
        },
      };
    }
    case "cancella_appuntamento": {
      const tolta = sedute.find((s) => s.id === a.dati.id)!;
      stato.removeSeduta(tolta.id);
      stato.setFocus({ tipo: "cancella", id: tolta.id, da: { date: tolta.date, time: tolta.time } });
      return {
        ok: true,
        annulla: async () => {
          const v = verificaAzione(
            { nome: "fissa_appuntamento", dati: { cliente: tolta.clientId, data: tolta.date, ora: tolta.time, durata: tolta.minutes, tipo: tolta.type } },
            conSedute(stato.get().sedute),
            SEMPRE,
          );
          if (!v.ok) return v;
          stato.putSeduta(tolta);
          stato.setFocus({ tipo: "fissa", id: tolta.id });
          return v;
        },
      };
    }
    case "scrivi_messaggio":
      stato.addMessage(a.dati.cliente, { from: "trainer", text: a.dati.testo, time: "Adesso" });
      stato.setFocus({ tipo: "messaggio", clientId: a.dati.cliente, testo: a.dati.testo });
      return { ok: true };
    case "scrivi_a_piu": {
      const nomi = new Map(stato.get().dati.clienti.map((c) => [c.id, c.name]));
      for (const id of a.dati.clienti) {
        const esito = await inviaMessaggio(id, personalizza(a.dati.testo, nomi.get(id) ?? ""));
        if ("motivo" in esito) return esito;
      }
      stato.setFocus({ tipo: "multiplo", clientiIds: a.dati.clienti, testo: a.dati.testo });
      return { ok: true };
    }
    case "segna_pagato": {
      const p = stato.get().dati.pagamenti.find((x) => x.id === a.dati.pagamento);
      return conFocus(await segnaPagato(a.dati.pagamento), { tipo: "pagato", pagamentoId: a.dati.pagamento, clientId: p?.clientId });
    }
    case "registra_pagamento": {
      const esito = await registraPagamento({ clientId: a.dati.cliente, amountCents: a.dati.importo, description: a.dati.descrizione, paidOn: a.dati.data ?? OGGI });
      return conFocus(esito, { tipo: "pagamento", pagamentoId: "id" in esito ? esito.id : undefined, clientId: a.dati.cliente });
    }
    case "rinnova_pacchetto": {
      const esito = await rinnovaPacchetto({ clientId: a.dati.cliente, lezioni: a.dati.lezioni, mesi: a.dati.mesi, amountCents: a.dati.importo });
      return conFocus(esito, { tipo: "rinnovo", pagamentoId: "id" in esito ? esito.id : undefined, clientId: a.dati.cliente });
    }
    case "sollecita": {
      const { pagamenti, clienti } = stato.get().dati;
      const p = pagamenti.find((x) => x.id === a.dati.pagamento);
      const c = p && clienti.find((x) => x.id === p.clientId);
      if (!p || !c) return { ok: false, motivo: "Pagamento non trovato" };
      const testo = a.dati.testo?.trim() || testoSollecito(p, c.name);
      const esito = await inviaMessaggio(c.id, testo);
      if ("motivo" in esito) return esito;
      stato.setFocus({ tipo: "messaggio", clientId: c.id, testo });
      return { ok: true };
    }
  }
}
