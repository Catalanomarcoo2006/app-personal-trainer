// Indirizzi dell'app del cliente. Come l'area trainer è una pagina sola: cambiare sezione aggiorna solo l'indirizzo
// (navigate di trainer/nav.ts, con history.pushState), senza richieste al server.

import { ChartLine, Dumbbell, House, MessageCircle, type LucideIcon } from "lucide-react";

export const BASE_CLIENTE = "/prototipo/cliente";

// Dove si agganciano fogli e caselle che stanno sopra tutto dentro il telefono, fuori dallo scorrimento (Shell.tsx).
export const ID_FOGLI = "fogli-cliente";

export const ROTTE_CLIENTE = {
  home: BASE_CLIENTE,
  allenamento: `${BASE_CLIENTE}/allenamento`,
  progressi: `${BASE_CLIENTE}/progressi`,
  messaggi: `${BASE_CLIENTE}/messaggi`,
  profilo: `${BASE_CLIENTE}/profilo`,
};

export type SezioneCliente = keyof typeof ROTTE_CLIENTE;

// Le 4 voci della barra in basso (decisione di Marco del 27/10); il Profilo si apre dalla foto in alto.
export const VOCI_BARRA: { sezione: SezioneCliente; label: string; icon: LucideIcon }[] = [
  { sezione: "home", label: "Home", icon: House },
  { sezione: "allenamento", label: "Allenamento", icon: Dumbbell },
  { sezione: "progressi", label: "Progressi", icon: ChartLine },
  { sezione: "messaggi", label: "Messaggi", icon: MessageCircle },
];

export function sezioneDa(path: string): SezioneCliente {
  const parte = path.replace(/\/+$/, "").slice(BASE_CLIENTE.length).split("/")[1] ?? "";
  return (Object.keys(ROTTE_CLIENTE) as SezioneCliente[]).find((s) => s === parte) ?? "home";
}
