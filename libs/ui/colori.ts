// I colori che il trainer può scegliere per il proprio marchio, con i loro nomi (stesso ordine).
// Senza React: li usano l'app, il benvenuto e Leo (anche sul server, per capire "metti il blu").

export const ACCENTS = ["#ff6b2c", "#e5484d", "#d6409f", "#6a5ae0", "#2f7dac", "#0f9d8a", "#2f9a68", "#da9f4a"];
export const NOMI_COLORI = ["Arancione", "Rosso", "Fucsia", "Viola", "Blu", "Verde acqua", "Verde", "Ocra"];

// Altri modi di chiamarli, verso l'indice in ACCENTS.
const SINONIMI: Record<string, number> = {
  arancio: 0,
  arancione: 0,
  rosso: 1,
  fucsia: 2,
  rosa: 2,
  magenta: 2,
  viola: 3,
  lilla: 3,
  blu: 4,
  azzurro: 4,
  "verde acqua": 5,
  turchese: 5,
  verde: 6,
  ocra: 7,
  oro: 7,
  giallo: 7,
  senape: 7,
};

// "blu" → "#2f7dac", "#123456" → "#123456"; null se non è un colore che conosco.
export function coloreDa(v: string): string | null {
  const s = v.trim().toLowerCase().replace(/\s+/g, " ");
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  const i = SINONIMI[s];
  return i === undefined ? null : ACCENTS[i];
}

export const nomeColore = (hex: string) => NOMI_COLORI[ACCENTS.indexOf(hex.toLowerCase())] ?? hex;
