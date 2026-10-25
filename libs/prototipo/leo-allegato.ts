// Il pezzo di messaggio che porta un file a Leo, e come riconoscerlo. Separato da leo-file.ts perché lo usa
// anche il server (la rotta di Leo), che non deve tirarsi dietro il lettore dei PDF.

const ETICHETTA = "Allegato ";

export const bloccoAllegato = (nome: string, testo: string) => `${ETICHETTA}"${nome}":\n${testo}`;

export const conAllegato = (messaggio: string) => messaggio.includes(`\n${ETICHETTA}"`) || messaggio.startsWith(`${ETICHETTA}"`);
