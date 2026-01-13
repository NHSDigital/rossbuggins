import React, { useMemo } from "react";

const COLORS = ["#f97316", "#fb7185", "#22c55e", "#38bdf8", "#eab308"];

export const FireworksOverlay: React.FC = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 800 }).map((_, i) => {
        const left = Math.random() * 100;
        const top = 20 + Math.random() * 60;
        const delay = Math.random() * 8; // stagger bursts over ~10s
        const duration = 1 + Math.random() * 1.5;
        const size = 4 + Math.random() * 4;
        const color = COLORS[i % COLORS.length];
        return { id: i, left, top, delay, duration, size, color };
      }),
    []
  );

  return (
    <div className="fireworks-overlay">
      {particles.map((p) => (
        <span
          key={p.id}
          className="firework-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
};
