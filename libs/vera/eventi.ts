// Quello che succede nelle pagine e non passa dallo stato salvato (salva.ts): conversazione letta, segnalazione
// di dolore vista, documenti caricati e tolti, foto e logo del trainer (l'allenamento di oggi passa da impostaSpunteVere). Nella versione
// vera AvvioVero mette qui le funzioni che scrivono nel database; nella demo restano vuote e le pagine le chiamano
// senza effetto. Così i componenti non importano Supabase.

export const eventiVeri: {
  // il trainer ha aperto la conversazione con il cliente: i suoi messaggi sono letti
  letti?: (clientId: string) => void;
  // il trainer ha aperto la scheda del cliente: le sue segnalazioni di dolore sono viste
  doloriVisti?: (clientId: string) => void;
  // un documento nuovo (cliente o trainer): file su Storage e riga in documents; torna il percorso, o null se non è andata
  caricaDocumento?: (d: { id: string; clientId: string; nome: string; tipo: "pdf" | "foto"; da: "nutrizionista" | "trainer" | "cliente"; file: Blob }) => Promise<string | null>;
  // togliere un documento: prima il file, poi la riga; false se non è andata
  togliDocumento?: (d: { id: string; percorso?: string }) => Promise<boolean>;
  // foto o logo del trainer nuovi: file su Storage (bucket "marchi") e percorso nella sua riga; torna l'indirizzo, o null
  cambiaMarchio?: (tipo: "foto" | "logo", file: Blob) => Promise<string | null>;
  // togliere foto o logo: false se non è andata
  togliMarchio?: (tipo: "foto" | "logo") => Promise<boolean>;
} = {};
