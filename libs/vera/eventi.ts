// Quello che succede nelle pagine e non passa dallo stato salvato (salva.ts): conversazione letta, segnalazione
// di dolore vista, allenamento di oggi fatto. Nella versione vera AvvioVero mette qui le funzioni che scrivono nel
// database; nella demo restano vuote e le pagine le chiamano senza effetto. Così i componenti non importano Supabase.

export const eventiVeri: {
  // il trainer ha aperto la conversazione con il cliente: i suoi messaggi sono letti
  letti?: (clientId: string) => void;
  // il trainer ha aperto la scheda del cliente: le sue segnalazioni di dolore sono viste
  doloriVisti?: (clientId: string) => void;
  // il cliente ha spuntato tutti gli esercizi di oggi (true) o ne ha tolto uno dopo (false)
  allenamento?: (fatto: boolean) => void;
} = {};
