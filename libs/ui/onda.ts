// Geometria dell'"onda" del cambio tema (riferimento: docs/riferimenti/macchia-tema-scuro.mp4): nasce come una
// goccia nel punto toccato, poi si allunga in un fronte a S che attraversa lo schermo in diagonale fino all'angolo
// più lontano. La forma è una lente tra un fronte (davanti) e un retro (dietro il punto toccato), nel sistema
// u = verso l'angolo lontano, v = di traverso. Ogni forma ha gli stessi comandi: il browser le anima una nell'altra.

type Punto = { x: number; y: number };
type Curva = { inizio: Punto; tratti: [Punto, Punto, Punto][] }; // tratti cubici: controllo 1, controllo 2, arrivo

const FRONTE = 8; // tratti del fronte
const RETRO = 4; // tratti del retro
const FORME = 16; // forme da animare in fila

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const liscio = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

// Catmull-Rom: curva morbida che passa per tutti i punti, in tratti cubici
function morbida(punti: Punto[]): Curva {
  const tratti: [Punto, Punto, Punto][] = [];
  for (let i = 0; i < punti.length - 1; i++) {
    const p0 = punti[Math.max(0, i - 1)];
    const p1 = punti[i];
    const p2 = punti[i + 1];
    const p3 = punti[Math.min(punti.length - 1, i + 2)];
    tratti.push([
      { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2,
    ]);
  }
  return { inizio: punti[0], tratti };
}

// Fronte e retro della forma al tempo t (0 → 1), in coordinate dello schermo
function curve(w: number, h: number, o: Punto, t: number): [Curva, Curva] {
  const angoli = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ];
  const lontano = angoli.reduce((a, b) => (Math.hypot(b.x - o.x, b.y - o.y) > Math.hypot(a.x - o.x, a.y - o.y) ? b : a));
  const lung = Math.hypot(lontano.x - o.x, lontano.y - o.y) || 1;
  const d = { x: (lontano.x - o.x) / lung, y: (lontano.y - o.y) / lung };
  const p = { x: -d.y, y: d.x };
  const u = angoli.map((a) => (a.x - o.x) * d.x + (a.y - o.y) * d.y);
  const v = angoli.map((a) => Math.abs((a.x - o.x) * p.x + (a.y - o.y) * p.y));
  const diag = Math.hypot(w, h);
  const margine = diag * 0.08;

  const goccia = liscio(t / 0.25); // la goccia si gonfia
  const corsa = liscio((t - 0.12) / 0.88); // il fronte attraversa lo schermo
  const apertura = liscio((t - 0.08) / 0.5); // la lente si allarga di traverso
  const r = Math.max(2, Math.min(w, h) * 0.1 * goccia);
  const largo = r + (Math.max(...v) + margine - r) * apertura;
  const onda = 0.25 * r * (1 - corsa) + diag * 0.12 * Math.sin(Math.PI * corsa); // ampiezza della S
  const lingua = 1.25 * r + diag * 0.15 * Math.sin(Math.PI * corsa); // il centro del fronte va avanti
  const avanti = (Math.max(...u) + margine) * corsa;
  const indietro = (Math.max(0, -Math.min(...u)) + margine) * corsa;

  const schermo = (uu: number, vv: number): Punto => ({ x: o.x + uu * d.x + vv * p.x, y: o.y + uu * d.y + vv * p.y });
  const fronte: Punto[] = [];
  for (let i = 0; i <= FRONTE; i++) {
    const vv = -largo + (2 * largo * i) / FRONTE;
    const k = vv / largo;
    fronte.push(schermo(avanti + lingua * (1 - k * k) + onda * Math.sin(Math.PI * k + 0.6), vv));
  }
  const retro: Punto[] = [];
  for (let i = 0; i <= RETRO; i++) {
    const vv = largo - (2 * largo * i) / RETRO;
    const k = vv / largo;
    retro.push(schermo(-indietro - 0.8 * r * (1 - k * k), vv));
  }
  return [morbida(fronte), morbida(retro)];
}

const n = (x: number) => String(Math.round(x * 10) / 10);
const pt = (q: Punto) => `${n(q.x)} ${n(q.y)}`;

// Le forme da passare a clip-path, dalla goccia allo schermo coperto
export function formeOnda(w: number, h: number, origine: Punto): string[] {
  const forme: string[] = [];
  for (let i = 0; i < FORME; i++) {
    const [fronte, retro] = curve(w, h, origine, i / (FORME - 1));
    const tratti = (c: Curva) => c.tratti.map(([a, b, e]) => `C ${pt(a)} ${pt(b)} ${pt(e)}`).join(" ");
    forme.push(`path('M ${pt(fronte.inizio)} ${tratti(fronte)} L ${pt(retro.inizio)} ${tratti(retro)} Z')`);
  }
  return forme;
}

// Il contorno al tempo t come elenco di punti (per i test)
export function contornoOnda(w: number, h: number, origine: Punto, t: number): Punto[] {
  const punti: Punto[] = [];
  for (const c of curve(w, h, origine, t)) {
    let da = c.inizio;
    punti.push(da);
    for (const [a, b, e] of c.tratti) {
      for (let s = 1; s <= 8; s++) {
        const q = s / 8;
        const m = 1 - q;
        punti.push({
          x: m * m * m * da.x + 3 * m * m * q * a.x + 3 * m * q * q * b.x + q * q * q * e.x,
          y: m * m * m * da.y + 3 * m * m * q * a.y + 3 * m * q * q * b.y + q * q * q * e.y,
        });
      }
      da = e;
    }
  }
  return punti;
}
