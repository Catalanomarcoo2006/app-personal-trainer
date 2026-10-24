// Esegue sullo store un'azione di Leo già in chiaro (inChiaro) e prepara il suo "Annulla".
// Prima ricontrolla sullo stato attuale: nel frattempo il trainer può aver cambiato il calendario a mano.

import { luogoPredefinito, verificaAzione, type AzioneLeo, type Verifica } from "./leo-azioni";
import { stato } from "./stato";

// annulla ricontrolla prima di rimettere: nel frattempo il trainer può aver occupato quell'orario a mano.
export type Esito = { ok: true; annulla?: () => Verifica } | { ok: false; motivo: string };

// Per l'annulla non conta "già passato": si rimette com'era, anche se era prima di adesso.
const SEMPRE = { data: "0000-00-00", ora: "00:00" };

export function eseguiAzione(a: AzioneLeo): Esito {
  const { sedute } = stato.get();
  const verifica = verificaAzione(a, sedute);
  if (!verifica.ok) return verifica;

  switch (a.nome) {
    case "fissa_appuntamento": {
      const { cliente, data, ora, durata, tipo, luogo } = a.dati;
      const nuova = stato.addSeduta({ clientId: cliente, date: data, time: ora, minutes: durata, type: tipo, place: luogo ?? luogoPredefinito(tipo) });
      stato.setFocus({ tipo: "fissa", id: nuova.id });
      return {
        ok: true,
        annulla: () => {
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
        annulla: () => {
          const v = verificaAzione({ nome: "sposta_appuntamento", dati: { id: prima.id, data: prima.date, ora: prima.time, durata: prima.minutes } }, stato.get().sedute, SEMPRE);
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
        annulla: () => {
          const v = verificaAzione(
            { nome: "fissa_appuntamento", dati: { cliente: tolta.clientId, data: tolta.date, ora: tolta.time, durata: tolta.minutes, tipo: tolta.type } },
            stato.get().sedute,
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
  }
}
