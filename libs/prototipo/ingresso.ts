// Arrivo in dashboard dal benvenuto: il finale lo segna (sessionStorage, sopravvive al cambio di pagina) e la home
// lo legge una volta sola, per far cadere le schede come meteoriti. Ricaricando o tornando alla home dopo, ingresso normale.

const CHIAVE = "ingresso-meteoriti";
let deciso: boolean | null = null;

export function segnaIngressoMeteoriti(): void {
  deciso = true;
  try {
    window.sessionStorage.setItem(CHIAVE, "1");
  } catch {
    // navigazione privata: basta la variabile (la pagina non si ricarica)
  }
}

// Lettura stabile per tutta la visita della home (in sviluppo React monta i componenti due volte).
export function ingressoConMeteoriti(): boolean {
  if (typeof window === "undefined") return false;
  if (deciso === null) {
    try {
      deciso = window.sessionStorage.getItem(CHIAVE) === "1";
      window.sessionStorage.removeItem(CHIAVE);
    } catch {
      deciso = false;
    }
  }
  return deciso;
}

// Ultimo meteorite atterrato: le prossime aperture della home sono normali.
export function meteoritiFatti(): void {
  deciso = false;
  try {
    window.sessionStorage.removeItem(CHIAVE);
  } catch {
    // niente da togliere
  }
}
