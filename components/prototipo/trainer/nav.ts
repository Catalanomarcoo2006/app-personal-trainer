// Indirizzi dell'area trainer e navigazione istantanea.
// Tutta l'area è una pagina sola: cambiare sezione aggiorna solo l'indirizzo (history.pushState, che Next
// collega a usePathname e useSearchParams), senza richieste al server.

export const BASE = "/prototipo/trainer";

export const ROUTES = {
  oggi: BASE,
  clienti: `${BASE}/clienti`,
  cliente: (id: string) => `${BASE}/clienti/${id}`,
  messaggi: `${BASE}/messaggi`,
  schede: `${BASE}/schede`,
  calendario: `${BASE}/calendario`,
  incassi: `${BASE}/incassi`,
  impostazioni: `${BASE}/impostazioni`,
};

export function navigate(href: string) {
  const url = new URL(href, window.location.href);
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  window.history.pushState(null, "", url.pathname + url.search);
}
