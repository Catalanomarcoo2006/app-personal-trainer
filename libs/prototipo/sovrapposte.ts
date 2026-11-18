// Più allievi nella stessa ora (un trainer può seguirne più d'uno insieme): le sedute che iniziano nella stessa ora
// si mostrano come un solo blocco nella griglia del calendario, così non se ne perde nessuna. Fissarle non ha limiti:
// qui si decide solo come si vedono. Funzione pura, la provano i test.

type ConOra = { time: string };

const ora = (t: string) => Math.floor(Number(t.split(":")[0]));

// Raggruppa per ora di inizio (17:00 e 17:30 stanno insieme, 18:00 no). Mantiene l'ordine di arrivo: con sedute già
// ordinate per orario, anche i gruppi e le sedute dentro ogni gruppo restano in ordine.
export function raggruppaPerOra<T extends ConOra>(sedute: T[]): T[][] {
  const gruppi = new Map<number, T[]>();
  for (const s of sedute) {
    const h = ora(s.time);
    const g = gruppi.get(h);
    if (g) g.push(s);
    else gruppi.set(h, [s]);
  }
  return [...gruppi.values()];
}

// Chi c'è già nella stessa ora di un orario scelto (per l'avviso nel modulo; senza escludere nessuno: è solo un'informazione).
export function giaAllOra<T extends ConOra>(sedute: T[], time: string, escludi?: T): T[] {
  return sedute.filter((s) => s !== escludi && ora(s.time) === ora(time));
}
