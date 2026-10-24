// Una sola fila per i viaggi di Leo: i lavori partono uno alla volta, in ordine. Se uno si rompe
// (un'animazione, un suono) lo si segnala e la fila va avanti: la chat non resta mai bloccata.

export function creaFila(onErrore: (e: unknown) => void): { aggiungi(lavoro: () => Promise<void>): Promise<void> } {
  let coda: Promise<void> = Promise.resolve();
  return {
    aggiungi(lavoro) {
      coda = coda.then(lavoro).catch(onErrore);
      return coda;
    },
  };
}
