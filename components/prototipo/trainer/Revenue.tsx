"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Player } from "@remotion/player";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { CountUp, formatEuro } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { revenue } from "@/libs/prototipo/dati-finti";
import { ROUTES } from "./nav";

type ChartProps = { months: { label: string; value: number }[] };

const FPS = 30;
const GROW_END = 60; // fine della crescita delle barre; dopo resta solo l'animazione "ambiente"

const compact = (v: number) => `${(v / 1000).toFixed(1).replace(".", ",")}k`;

// I colori vengono dalle variabili CSS della pagina: il grafico cambia da solo con il tema e col colore del marchio.
const ink = (opacity: number) => ({ fill: "var(--color-ink)", fillOpacity: opacity });

// Composizione Remotion: barre che crescono a molla, media che si disegna,
// poi un riflesso che scorre sul mese corrente e piccole scintille che salgono.
export function RevenueBars({ months }: ChartProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const top = 44;
  const bottom = 46;
  const padX = 18;
  const labelGutter = 92;
  const chartH = height - top - bottom;
  const max = Math.max(...months.map((m) => m.value)) * 1.12;
  const slot = (width - padX * 2 - labelGutter) / months.length;
  const barW = Math.min(slot * 0.5, 70);
  const avg = months.reduce((s, m) => s + m.value, 0) / months.length;
  const avgY = top + chartH * (1 - avg / max);
  const last = months.length - 1;

  const avgDraw = interpolate(frame, [30, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ambient = Math.max(0, frame - GROW_END);
  const sweep = ((ambient % 110) / 110) * 1.6 - 0.3;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{ fontFamily: "inherit" }}>
        <defs>
          <linearGradient id="barra-mese" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--trainer)", stopOpacity: 0.55 }} />
            <stop offset="100%" style={{ stopColor: "var(--trainer)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="riflesso" x1="0" x2="1" y1="0" y2="0">
            <stop offset={Math.max(0, sweep - 0.15)} stopColor="white" stopOpacity={0} />
            <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="white" stopOpacity={0.5} />
            <stop offset={Math.min(1, sweep + 0.15)} stopColor="white" stopOpacity={0} />
          </linearGradient>
          <filter id="alone" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={padX} x2={width - padX} y1={top + chartH * t} y2={top + chartH * t} style={{ stroke: "var(--color-ink)", strokeOpacity: 0.07 }} strokeDasharray="4 6" />
        ))}

        {months.map((m, i) => {
          const grow = spring({ frame: frame - 4 - i * 6, fps, config: { damping: 13, stiffness: 120, mass: 0.7 } });
          const h = Math.max(0, (m.value / max) * chartH * grow);
          const x = padX + slot * i + (slot - barW) / 2;
          const y = top + chartH - h;
          const isLast = i === last;
          const labelIn = interpolate(frame, [18 + i * 6, 32 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <g key={m.label}>
              {isLast && h > 0 && (
                <rect x={x - 4} y={y + 10} width={barW + 8} height={h} rx={14} style={{ fill: "var(--trainer)", fillOpacity: 0.28 + 0.1 * Math.sin(ambient / 9) }} filter="url(#alone)" />
              )}
              <rect x={x} y={y} width={barW} height={h} rx={barW / 2.6} style={isLast ? { fill: "url(#barra-mese)" } : ink(0.08)} />
              {isLast && h > 0 && <rect x={x} y={y} width={barW} height={h} rx={barW / 2.6} fill="url(#riflesso)" opacity={ambient > 0 ? 1 : 0} />}
              <text x={x + barW / 2} y={height - bottom + 26} textAnchor="middle" fontSize={20} fontWeight={600} style={ink(isLast ? 0.9 : 0.42)}>
                {m.label}
              </text>
              <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize={isLast ? 22 : 18} fontWeight={700} style={ink((isLast ? 1 : 0.45) * labelIn)}>
                {compact(m.value * grow)}
              </text>
            </g>
          );
        })}

        <line x1={padX} x2={padX + (width - padX * 2) * avgDraw} y1={avgY} y2={avgY} style={{ stroke: "var(--color-ink)", strokeOpacity: 0.3 }} strokeWidth={2} strokeDasharray="6 6" />
        <text x={width - padX} y={avgY - 8} textAnchor="end" fontSize={17} fontWeight={600} style={ink(0.45 * avgDraw)}>
          media
        </text>
        <text x={width - padX} y={avgY + 22} textAnchor="end" fontSize={19} fontWeight={700} style={ink(0.75 * avgDraw)}>
          {compact(avg)}
        </text>

        {ambient > 0 &&
          Array.from({ length: 7 }, (_, k) => {
            const x0 = padX + slot * last + slot * 0.25 + ((k * 37) % Math.round(slot * 0.5));
            const life = ((ambient * 1.1 + k * 23) % 70) / 70;
            const yTop = top + chartH - (months[last].value / max) * chartH;
            return <circle key={k} cx={x0} cy={yTop - 4 - life * 46} r={2.6 - life * 1.4} style={{ fill: "var(--trainer)", fillOpacity: (1 - life) * 0.8 }} />;
          })}
      </svg>
    </AbsoluteFill>
  );
}

// Player Remotion che prende le proporzioni dello spazio disponibile.
export function RevenueChart({ months = revenue.months }: { months?: ChartProps["months"] }) {
  const reduce = useReducedMotion();
  const inputProps = useMemo<ChartProps>(() => ({ months }), [months]);
  const box = useRef<HTMLDivElement>(null);
  // La composizione è disegnata al doppio delle misure reali: nitida e mai deformata.
  const [size, setSize] = useState({ w: 680, h: 360 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width * 2), h: Math.max(240, Math.round(height * 2)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="relative h-full min-h-0 w-full">
      <Player
        component={RevenueBars}
        inputProps={inputProps}
        durationInFrames={FPS * 60 * 30}
        fps={FPS}
        compositionWidth={size.w}
        compositionHeight={size.h}
        autoPlay={!reduce}
        initialFrame={reduce ? GROW_END : 0}
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        // Muto e senza tag audio: niente AudioContext, quindi parte da solo anche prima di un clic.
        initiallyMuted
        numberOfSharedAudioTags={0}
        acknowledgeRemotionLicense
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export function RevenueCard() {
  return (
    <section className="flex h-full flex-col rounded-[18px] bg-card px-[16px] pt-[14px] pb-[14px]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-ink/60">Incassi di {revenue.month.toLowerCase()}</p>
        <Link href={ROUTES.incassi} onClick={() => playSound("tap")} aria-label="Apri incassi" className="grid size-[28px] place-items-center rounded-full border border-line transition-transform hover:-translate-y-[1.5px]">
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="mt-[6px] flex items-end gap-[10px]">
        <p className="text-[36px] leading-none font-extrabold tracking-[-0.04em]">
          <CountUp value={revenue.collected} format={formatEuro} delay={0.3} duration={1.2} />
        </p>
        <span className="mb-[4px] flex items-center gap-[4px] rounded-full bg-ok-soft px-[8px] py-[3px] text-[10.5px] font-bold text-ok">
          <TrendingUp size={11} strokeWidth={2.6} /> +{revenue.delta}% su settembre
        </span>
      </div>

      <div className="mt-[6px] min-h-0 flex-1">
        <RevenueChart />
      </div>

      <div className="mt-[8px] grid grid-cols-3 divide-x divide-line rounded-[14px] bg-soft py-[10px]">
        <div className="px-[12px] leading-none">
          <p className="flex items-center gap-[5px] text-[10px] text-muted">
            <span className="size-[6px] rounded-full bg-ok" /> Incassato
          </p>
          <p className="mt-[5px] text-[14px] font-bold">{formatEuro(revenue.collected)}</p>
        </div>
        <Link href={ROUTES.incassi} onClick={() => playSound("tap")} className="group px-[12px] leading-none">
          <p className="flex items-center gap-[5px] text-[10px] text-muted">
            <span className="size-[6px] rounded-full bg-[#f5a524]" /> Da incassare
          </p>
          <p className="mt-[5px] text-[14px] font-bold group-hover:underline">{formatEuro(revenue.outstanding)}</p>
        </Link>
        <div className="px-[12px] leading-none">
          <p className="flex items-center gap-[5px] text-[10px] text-muted">
            <span className="size-[6px] rounded-full" style={{ background: "var(--trainer)" }} /> Previsto
          </p>
          <p className="mt-[5px] text-[14px] font-bold">{formatEuro(revenue.forecast)}</p>
        </div>
      </div>
    </section>
  );
}
