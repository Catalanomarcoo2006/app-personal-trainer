// Misure delle immagini di Leo con la pallina (public/prototipo/coach/esce.webp e con-pallina.webp),
// ricavate da IMMAGINI APP/LEO ENTRA NELLA PALLINA.mp4 girato al contrario e senza sfondo.
// Le posizioni della pallina sono frazioni di larghezza e altezza: servono a mettere la pallina colorata
// esattamente sopra quella bianca dell'animazione.

export const LEO = {
  larghezza: 360,
  altezza: 599,
  // primo fotogramma: la pallina da sola, prima che esca Leo
  pallinaInizio: { x: 0.502, y: 0.4332, r: 0.15 },
  // ultimo fotogramma (= con-pallina.webp): la pallina sopra la mano aperta
  pallina: { x: 0.1972, y: 0.2396, r: 0.114 },
};

// 72 fotogrammi a 20 al secondo
export const DURATA_ESCE_MS = 3600;
