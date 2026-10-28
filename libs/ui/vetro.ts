// Geometria del "vetro che si rompe" (seduta cancellata da Leo nel calendario): dal punto d'impatto partono crepe
// dritte fino ai bordi e un anello di crepe a metà strada; tra due crepe vicine c'è una scheggia interna (triangolo
// verso l'impatto) e una esterna (verso il bordo). Coordinate in percentuale della seduta (0–100), così valgono per
// qualunque misura. Tutto fisso: le schegge cadono sempre allo stesso modo, niente numeri a caso.

export type Punto = { x: number; y: number };
export type Scheggia = {
  clip: string; // clip-path: polygon(...)
  centro: Punto; // baricentro, per la direzione in cui vola
  interna: boolean; // vicino all'impatto: parte per prima
  x: number; // spostamento finale in px
  caduta: number; // quanto scende in px (gravità)
  r: number; // rotazione finale in gradi
  ritardo: number; // s, rispetto all'inizio della rottura
};

export const IMPATTO: Punto = { x: 64, y: 38 };

// Dove le crepe toccano il bordo, in senso orario dall'angolo in alto a sinistra: due punti consecutivi stanno
// sempre sullo stesso lato, così ogni scheggia esterna ha un lato dritto sul bordo.
const BORDO: Punto[] = [
  { x: 0, y: 0 },
  { x: 30, y: 0 },
  { x: 74, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 62 },
  { x: 100, y: 100 },
  { x: 80, y: 100 },
  { x: 38, y: 100 },
  { x: 0, y: 100 },
  { x: 0, y: 48 },
];
// Dove l'anello taglia ogni crepa (frazione tra impatto e bordo): diversa per ognuna, come nel vetro vero.
const ANELLO = [0.42, 0.36, 0.5, 0.4, 0.46, 0.34, 0.44, 0.38, 0.48, 0.4];
// Rotazioni e cadute "a mano", una per spicchio: sembrano casuali ma sono sempre le stesse.
const GIRO = [-34, 22, -18, 40, -26, 30, -42, 16, -22, 36];
const CADUTA = [30, 38, 26, 34, 42, 28, 36, 40, 32, 24];

const tra = (a: Punto, b: Punto, t: number): Punto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const poligono = (punti: Punto[]) => `polygon(${punti.map((p) => `${+p.x.toFixed(2)}% ${+p.y.toFixed(2)}%`).join(", ")})`;
const baricentro = (punti: Punto[]): Punto => ({
  x: punti.reduce((s, p) => s + p.x, 0) / punti.length,
  y: punti.reduce((s, p) => s + p.y, 0) / punti.length,
});

export const puntiAnello = (): Punto[] => BORDO.map((b, k) => tra(IMPATTO, b, ANELLO[k]));

// Le crepe da disegnare: le linee dall'impatto al bordo e l'anello, come "d" di un path SVG (viewBox 0 0 100 100).
export function crepe(): { raggi: string[]; anello: string } {
  const anello = puntiAnello();
  const f = (p: Punto) => `${+p.x.toFixed(2)} ${+p.y.toFixed(2)}`;
  return {
    raggi: BORDO.map((b) => `M${f(IMPATTO)} L${f(b)}`),
    anello: `M${anello.map(f).join(" L")} Z`,
  };
}

export function schegge(): Scheggia[] {
  const anello = puntiAnello();
  const n = BORDO.length;
  return BORDO.flatMap((b, k) => {
    const k2 = (k + 1) % n;
    const pezzi: [Punto[], boolean][] = [
      [[IMPATTO, anello[k], anello[k2]], true],
      [[anello[k], b, BORDO[k2], anello[k2]], false],
    ];
    return pezzi.map(([punti, interna]) => {
      const c = baricentro(punti);
      // via dall'impatto: più lontano per le esterne, la seduta è più larga che alta
      const spinta = interna ? 0.22 : 0.34;
      return {
        clip: poligono(punti),
        centro: c,
        interna,
        x: (c.x - IMPATTO.x) * spinta,
        caduta: CADUTA[k] + (interna ? 8 : 0) + Math.max(0, c.y - IMPATTO.y) * 0.15,
        r: GIRO[k] * (interna ? 1.3 : 1),
        ritardo: (interna ? 0 : 0.05) + k * 0.018,
      };
    });
  });
}
