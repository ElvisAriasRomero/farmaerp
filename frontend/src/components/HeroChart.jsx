// Gráfico de crecimiento animado (estilo ancho y plano) para login/registro.
const PTS = [
  [20, 138], [62, 106], [104, 120], [146, 78], [188, 100],
  [230, 58], [272, 82], [314, 40], [356, 64], [398, 24], [430, 10],
];
const BASELINE = 150;
const BAR_GAP = 20;

export default function HeroChart() {
  const polyline = PTS.map((p) => p.join(",")).join(" ");
  const last = PTS.length - 1;
  return (
    <div className="hero-chart">
      <svg viewBox="0 0 450 165" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* líneas de referencia tenues */}
        {[55, 90, 125].map((y) => (
          <line key={y} x1="14" x2="436" y1={y} y2={y} className="hero-chart__grid" />
        ))}
        {/* barras: tope por debajo de la bolita (la última más alta) */}
        {PTS.map((p, i) => {
          const top = p[1]; // la barra llega justo a la bolita
          return (
            <rect
              key={`b${i}`}
              x={p[0] - 11}
              width="22"
              y={top}
              height={BASELINE - top}
              className="hero-chart__bar"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            />
          );
        })}
        {/* línea de tendencia */}
        <polyline points={polyline} className="hero-chart__line" />
        {/* puntos */}
        {PTS.map((p, i) => (
          <circle
            key={`d${i}`}
            cx={p[0]}
            cy={p[1]}
            r="4.5"
            className="hero-chart__dot"
            style={{ animationDelay: `${0.4 + i * 0.1}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
