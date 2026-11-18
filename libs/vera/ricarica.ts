// Rilettura dei dati dal database mentre l'app è aperta (versione vera): quello che cambia l'altro (il trainer
// aggiorna la scheda, il cliente pesa o si allena, un pagamento…) compare senza ricaricare la pagina.
// Si chiede con richiedi() (a ogni evento dal vivo, e ogni tanto da sola, per sicurezza: se la connessione dal vivo
// cade i dati arrivano lo stesso). Si rilegge solo quando è il momento giusto (libero()): niente da salvare e nessuno
// che sta scrivendo, altrimenti si perderebbe quello che sta facendo. Funzione senza Supabase: la provano i test.

export type Ricarica = { richiedi: () => void; ferma: () => void };

export function avviaRicarica<T>(o: {
  leggi: () => Promise<T | null>;
  applica: (dati: T) => void;
  libero: () => boolean;
  controllo?: number; // ogni quanto si prova a rileggere se qualcuno l'ha chiesto (ms)
  periodico?: number; // ogni quanto lo si chiede da soli (ms)
  visibile?: () => boolean;
}): Ricarica {
  const visibile = o.visibile ?? (() => typeof document === "undefined" || document.visibilityState !== "hidden");
  let voglio = false;
  let inCorso = false;
  let fermo = false;

  const prova = async () => {
    if (fermo || !voglio || inCorso || !o.libero()) return;
    voglio = false;
    inCorso = true;
    try {
      const dati = await o.leggi();
      if (!dati || fermo) return;
      // nel frattempo qualcuno ha cominciato a scrivere: questa lettura è già vecchia, si rifà
      if (o.libero()) o.applica(dati);
      else voglio = true;
    } catch (e) {
      console.error("Aggiornamento dei dati non riuscito", e instanceof Error ? e.message : e);
    } finally {
      inCorso = false;
    }
  };

  const richiedi = () => {
    voglio = true;
  };
  const giro = setInterval(() => void prova(), o.controllo ?? 800);
  const sicurezza = setInterval(() => visibile() && richiedi(), o.periodico ?? 45_000);
  // tornando sulla pagina (o tornando la rete) si rilegge subito
  const alRitorno = () => visibile() && richiedi();
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", alRitorno);
  if (typeof window !== "undefined") window.addEventListener("online", alRitorno);

  return {
    richiedi,
    ferma: () => {
      fermo = true;
      clearInterval(giro);
      clearInterval(sicurezza);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", alRitorno);
      if (typeof window !== "undefined") window.removeEventListener("online", alRitorno);
    },
  };
}
