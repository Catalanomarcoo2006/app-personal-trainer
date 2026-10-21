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
import { ROUTES } from "./Chrome";

type ChartProps = { months: { label: string; value: number }[]; accent: string };

const FPS = 30;
const GROW_END = 60; // fine della crescita delle barre; dopo resta solo l'animazione "ambiente"

const compact = (v: number) => `${(v / 1000).toFixed(1).replace(".", ",")}k`;

// Composizione Remotion: barre che crescono a molla, media che si disegna,
// poi un riflesso che scorre sul mese corrente e piccole scintille che salgono.
export function RevenueBars({ months, accent }: ChartProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const top = 40;
  const bottom = 46;
  const padX = 18;
  const labelGutter = 92; // spazio a destra per l'etichetta della media
  const chartH = height - top - bottom;
  const max = Math.max(...months.map((m) => m.value)) * 1.12;
  const slot = (width - padX * 2 - labelGutter) / months.length;
  const barW = slot * 0.5;
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
          <linearGradient id="ott" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffd2b3" />
            <stop offset="45%" stopColor={accent} />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="riflesso" x1="0" x2="1" y1="0" y2="0">
            <stop offset={Math.max(0, sweep - 0.15)} stopColor="white" stopOpacity={0} />
            <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="white" stopOpacity={0.55} />
            <stop offset={Math.min(1, sweep + 0.15)} stopColor="white" stopOpacity={0} />
          </linearGradient>
          <filter id="alone" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={padX} x2={width - padX} y1={top + chartH * t} y2={top + chartH * t} stroke="white" strokeOpacity={0.07} strokeDasharray="4 6" />
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
              {isLast && h > 0 && <rect x={x - 4} y={y + 6} width={barW + 8} height={h} rx={14} fill={accent} opacity={0.45 + 0.15 * Math.sin(ambient / 9)} filter="url(#alone)" />}
              <rect x={x} y={y} width={barW} height={h} rx={barW / 2.6} fill={isLast ? "url(#ott)" : "white"} fillOpacity={isLast ? 1 : 0.13} />
              {isLast && h > 0 && <rect x={x} y={y} width={barW} height={h} rx={barW / 2.6} fill="url(#riflesso)" opacity={ambient > 0 ? 1 : 0} />}
              <text x={x + barW / 2} y={height - bottom + 24} textAnchor="middle" fontSize={20} fontWeight={600} fill="white" fillOpacity={isLast ? 0.95 : 0.45}>
                {m.label}
              </text>
              <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize={isLast ? 22 : 18} fontWeight={700} fill="white" fillOpacity={(isLast ? 1 : 0.5) * labelIn}>
                {compact(m.value * grow)}
              </text>
            </g>
          );
        })}

        <line x1={padX} x2={padX + (width - padX * 2) * avgDraw} y1={avgY} y2={avgY} stroke="#3ddc84" strokeWidth={2} strokeDasharray="6 6" strokeOpacity={0.8} />
        <text x={width - padX} y={avgY - 8} textAnchor="end" fontSize={17} fontWeight={600} fill="#3ddc84" fillOpacity={avgDraw}>
          media
        </text>
        <text x={width - padX} y={avgY + 22} textAnchor="end" fontSize={19} fontWeight={700} fill="#3ddc84" fillOpacity={avgDraw}>
          {compact(avg)}
        </text>

        {ambient > 0 &&
          Array.from({ length: 7 }, (_, k) => {
            const x0 = padX + slot * last + slot * 0.25 + ((k * 37) % Math.round(slot * 0.5));
            const life = ((ambient * 1.1 + k * 23) % 70) / 70;
            const yTop = top + chartH - (months[last].value / max) * chartH;
            return <circle key={k} cx={x0} cy={yTop - 4 - life * 46} r={2.4 - life * 1.4} fill="#ffd2b3" opacity={(1 - life) * 0.9} />;
          })}
      </svg>
    </AbsoluteFill>
  );
}

export function RevenueCard() {
  const reduce = useReducedMotion();
  const inputProps = useMemo<ChartProps>(() => ({ months: revenue.months, accent: "#ff6b2c" }), []);

  // La composizione prende le proporzioni dello spazio disponibile: niente bande vuote sopra e sotto.
  const box = useRef<HTMLDivElement>(null);
  const [compHeight, setCompHeight] = useState(360);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setCompHeight(Math.max(260, Math.round((680 * height) / width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="flex h-full flex-col rounded-[18px] bg-[#131411] px-[16px] pt-[14px] pb-[14px] text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <p className="text-[12px] font-semibold text-white/60">Incassi di {revenue.month.toLowerCase()}</p>
          <span className="flex items-center gap-[4px] rounded-full bg-[#3ddc84]/15 px-[8px] py-[3px] text-[10.5px] font-bold text-[#3ddc84]">
            <TrendingUp size={11} strokeWidth={2.6} /> +{revenue.delta}% vs settembre
          </span>
        </div>
        <button type="button" onClick={() => playSound("tap")} aria-label="Apri incassi" className="grid size-[28px] cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
          <ArrowUpRight size={14} />
        </button>
      </div>

      <p className="mt-[8px] text-[36px] leading-none font-extrabold tracking-[-0.04em]">
        <CountUp value={revenue.collected} format={formatEuro} delay={0.3} duration={1.2} />
      </p>

      <div ref={box} className="relative mt-[6px] min-h-0 flex-1">
        <Player
          component={RevenueBars}
          inputProps={inputProps}
          durationInFrames={FPS * 60 * 30}
          fps={FPS}
          compositionWidth={680}
          compositionHeight={compHeight}
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

      <div className="mt-[8px] grid grid-cols-3 divide-x divide-white/10 rounded-[14px] bg-white/[0.06] py-[9px]">
        <div className="px-[12px] leading-none">
          <p className="flex items-center gap-[5px] text-[10px] text-white/55">
            <span className="size-[6px] rounded-full bg-[#3ddc84]" /> Incassato
          </p>
          <p className="mt-[5px] text-[14px] font-bold">{formatEuro(revenue.collected)}</p>
        </div>
        <Link href={ROUTES.cliente("luca-ferri")} onClick={() => playSound("tap")} className="group px-[12px] leading-none">
          <p className="flex items-center gap-[5px] text-[10px] text-white/55">
            <span className="size-[6px] rounded-full bg-[#fdb621]" /> Da incassare
          </p>
          <p className="mt-[5px] text-[14px] font-bold group-hover:underline">{formatEuro(revenue.outstanding)}</p>
        </Link>
        <div className="px-[12px] leading-none">
          <p className="flex items-center gap-[5px] text-[10px] text-white/55">
            <span className="size-[6px] rounded-full bg-white/40" /> Previsto
          </p>
          <p className="mt-[5px] text-[14px] font-bold">{formatEuro(revenue.forecast)}</p>
        </div>
      </div>
    </section>
  );
}
