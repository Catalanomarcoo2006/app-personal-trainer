// Dove porta lo sguardo la chat di Leo quando propone più azioni insieme: in cima, dove c'è la prima, e poi dietro a quella
// che sta lavorando, dalla prima all'ultima. Con una sola azione (o nessuna) resta il comportamento di sempre: in fondo.

type Messaggio = { id: number; schede?: { key: string; stato: string }[] };

export type Bersaglio = {
  chiave: string; // cambia solo quando cambia l'azione da seguire: così non si "strappa" l'utente che scorre da solo
  cosa: { tipo: "messaggio"; id: number } | { tipo: "scheda"; key: string };
};

export function bersaglioScorrimento(messaggi: Messaggio[]): Bersaglio | null {
  const ultimo = messaggi[messaggi.length - 1];
  const schede = ultimo?.schede;
  if (!ultimo || !schede || schede.length < 2) return null;
  // l'azione da seguire: la prima ancora da fare o in corso; a lavoro finito, l'ultima
  const i = schede.findIndex((s) => s.stato === "in-corso" || s.stato === "da-confermare");
  const attiva = i === -1 ? schede.length - 1 : i;
  const chiave = `${ultimo.id}:${schede[attiva].key}`;
  // la prima: si mostra il messaggio intero, con la frase di Leo sopra la scheda
  return { chiave, cosa: attiva === 0 ? { tipo: "messaggio", id: ultimo.id } : { tipo: "scheda", key: schede[attiva].key } };
}
