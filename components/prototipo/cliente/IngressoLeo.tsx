"use client";

// L'animazione d'apertura delle app da telefono (cliente e trainer), dal logo (Marco, 30/10; logo in
// public/brand/logo-leo-anello.svg): al centro compare la testa di Leo nel suo cerchio; intorno l'anello arancione,
// che all'inizio non c'è, si disegna fino a chiudere il cerchio; poi la testa vola, rimpicciolendo, fino alla faccia di
// Leo in basso a destra (telefono/TastoLeo.tsx, che fino ad allora resta nascosta) e l'app si scopre.
// Una volta per apertura dell'app (cambiando sezione non riparte). Un tocco la salta. Con "riduci movimento": il logo
// fermo per un attimo, poi una dissolvenza.

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";

export const ID_FACCIA_LEO = "faccia-leo"; // dove atterra la testa (la faccia di Leo in basso a destra)

// ——— Fatta o no: la faccia di Leo compare solo quando la testa è arrivata ———

let fatto = false;
const chi = new Set<() => void>();
const iscrivi = (f: () => void) => {
  chi.add(f);
  return () => {
    chi.delete(f);
  };
};
function segnaFatto() {
  if (fatto) return;
  fatto = true;
  chi.forEach((f) => f());
}
export const useIngressoFatto = () =>
  useSyncExternalStore(
    iscrivi,
    () => fatto,
    () => false,
  );

// ——— Misure (come nel logo: anello r 352, testa r 276 su 1024) ———

const TESTA = 168;
const R = Math.round((TESTA / 2) * (352 / 276)); // 107
const SPESSORE = 17;
const LATO = 2 * (R + SPESSORE + 8);
const GIRO = 2 * Math.PI * R;
const VOLO = { duration: 0.75, ease: [0.65, 0, 0.35, 1] } as const;

export function IngressoLeo() {
  const [via] = useState(() => !fatto); // già vista in questa apertura: niente
  const [finita, setFinita] = useState(false);
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (!via) return;
    let fermo = false;
    const chiudi = () => {
      segnaFatto();
      setFinita(true);
    };
    (async () => {
      const el = scope.current;
      if (!el) return;
      const testa = el.querySelector<HTMLElement>("[data-testa]")!;
      const anello = el.querySelectorAll<SVGCircleElement>("[data-arco]");
      const fondo = el.querySelector<HTMLElement>("[data-fondo]")!;
      const cerchio = el.querySelector<HTMLElement>("[data-cerchio]")!;
      if (reduce) {
        anello.forEach((a) => {
          a.style.strokeDashoffset = "0";
          a.style.opacity = "1";
        });
        await new Promise((r) => setTimeout(r, 700));
        if (fermo) return;
        segnaFatto();
        await animate(el, { opacity: 0 }, { duration: 0.35 });
        return setFinita(true);
      }
      // 1. la testa compare
      await animate(testa, { opacity: [0, 1], scale: [0.72, 1] }, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
      if (fermo) return;
      // 2. l'anello si disegna fino a chiudersi
      // (fino ad allora è nascosto: con la punta tonda, a lunghezza zero si vedrebbe un puntino)
      await Promise.all([...anello].map((a) => animate(a, { opacity: [0, 1], strokeDashoffset: [GIRO, 0] }, { duration: 1.1, ease: [0.45, 0, 0.25, 1], opacity: { duration: 0.12 } })));
      if (fermo) return;
      // 3. un piccolo battito quando si chiude
      await animate(testa, { scale: [1, 1.07, 1] }, { duration: 0.32, ease: "easeOut" });
      if (fermo) return;
      // 4. la testa vola alla faccia di Leo; l'anello e il fondo se ne vanno
      const dove = document.getElementById(ID_FACCIA_LEO)?.getBoundingClientRect();
      const qui = testa.getBoundingClientRect();
      void animate(cerchio, { opacity: 0, scale: 0.7 }, { duration: 0.35, ease: "easeIn" });
      void animate(fondo, { opacity: 0 }, { duration: 0.6, delay: 0.1, ease: "easeOut" });
      if (dove && dove.width) {
        const x = dove.left + dove.width / 2 - (qui.left + qui.width / 2);
        const y = dove.top + dove.height / 2 - (qui.top + qui.height / 2);
        // x esce subito, y scende dopo: la testa fa una curva invece di una linea dritta
        await Promise.all([
          animate(testa, { x }, { ...VOLO, ease: [0.3, 0.7, 0.4, 1] }),
          animate(testa, { y }, { ...VOLO, ease: [0.6, 0, 0.7, 0.9] }),
          animate(testa, { scale: dove.width / TESTA }, VOLO),
        ]);
        if (fermo) return;
        segnaFatto(); // sotto, la faccia vera è già al suo posto
        await animate(testa, { opacity: 0 }, { duration: 0.18 });
      } else {
        await animate(testa, { opacity: 0, scale: 0.6 }, { duration: 0.4 });
      }
      if (!fermo) chiudi();
    })();
    return () => {
      fermo = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [via]);

  if (!via || finita) return null;

  return (
    <div
      ref={scope}
      role="presentation"
      onClick={() => {
        segnaFatto();
        setFinita(true);
      }}
      className="absolute inset-0 z-[70] grid cursor-pointer place-items-center"
    >
      {/* il fondo del logo: salvia con un velo del colore del trainer */}
      <div data-fondo className="absolute inset-0 bg-salvia" style={{ backgroundImage: "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--trainer) 14%, transparent), transparent 60%)" }} />
      <div className="relative grid place-items-center" style={{ width: LATO, height: LATO }}>
        <div data-cerchio className="absolute inset-0">
          <svg viewBox={`0 0 ${LATO} ${LATO}`} className="size-full -rotate-90 overflow-visible">
            <defs>
              <linearGradient id="ingresso-arancio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff915a" />
                <stop offset="1" stopColor="#ff5a1a" />
              </linearGradient>
            </defs>
            {/* il binario chiaro, poi l'alone e il filo arancione che si disegnano */}
            <circle cx={LATO / 2} cy={LATO / 2} r={R} fill="none" stroke="white" strokeOpacity={0.55} strokeWidth={SPESSORE} />
            <circle data-arco cx={LATO / 2} cy={LATO / 2} r={R} fill="none" stroke="#ff5a1a" strokeOpacity={0.22} strokeWidth={SPESSORE + 14} strokeLinecap="round" strokeDasharray={GIRO} strokeDashoffset={GIRO} opacity={0} />
            <circle data-arco cx={LATO / 2} cy={LATO / 2} r={R} fill="none" stroke="url(#ingresso-arancio)" strokeWidth={SPESSORE} strokeLinecap="round" strokeDasharray={GIRO} strokeDashoffset={GIRO} opacity={0} />
          </svg>
        </div>
        {/* la testa: il cerchio chiaro del logo con Leo, il bordo di vetro */}
        <motion.div
          data-testa
          initial={{ opacity: 0 }}
          className="relative overflow-hidden rounded-full shadow-[0_14px_24px_-8px_rgba(30,58,42,0.35)]"
          style={{ width: TESTA, height: TESTA, background: "radial-gradient(circle at 40% 30%, #fffaf5, #f3e4d8)", border: "4px solid rgba(255,255,255,0.75)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prototipo/coach/leo-logo.webp" alt="" draggable={false} className="size-full object-cover select-none" />
        </motion.div>
      </div>
    </div>
  );
}
