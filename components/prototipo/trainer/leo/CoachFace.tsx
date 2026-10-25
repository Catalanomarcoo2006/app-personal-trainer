"use client";


// ——— Il viso, per il tasto delle altre pagine: i capelli escono dal cerchio ———

export function CoachFace({ size }: { size: number }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={{ background: "color-mix(in srgb, var(--trainer) 22%, var(--color-card))" }} />
      <span
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{ height: size * 1.3, clipPath: `inset(0 0 0 0 round ${size * 0.3}px ${size * 0.3}px ${size / 2}px ${size / 2}px)` }}
      >
        <img
          src="/prototipo/coach/viso.webp"
          alt=""
          draggable={false}
          className="leo-luce-viso absolute left-1/2 max-w-none -translate-x-1/2 select-none"
          style={{ width: size * 1.26, bottom: -size * 0.13 }}
        />
      </span>
    </span>
  );
}
