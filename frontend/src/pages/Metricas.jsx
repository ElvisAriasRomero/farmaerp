import { useCallback, useEffect, useState } from "react";
import Icon from "../components/Icon.jsx";
import { Select } from "../components/Field.jsx";
import { analyticsApi, parseApiError } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { currency, number } from "../utils/format.js";

const RANGOS = [
  { value: 30, label: "Últimos 30 días" },
  { value: 90, label: "Últimos 90 días" },
  { value: 365, label: "Último año" },
];

export default function Metricas() {
  const toast = useToast();
  const [dias, setDias] = useState(30);
  const [kpis, setKpis] = useState(null);
  const [top, setTop] = useState([]);
  const [serie, setSerie] = useState([]);
  const [rent, setRent] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [k, t, s, r] = await Promise.all([
        analyticsApi.kpis(dias),
        analyticsApi.topProductos(dias),
        analyticsApi.ventasDiarias(dias),
        analyticsApi.rentabilidad(),
      ]);
      setKpis(k.data);
      setTop(Array.isArray(t.data) ? t.data : []);
      setSerie(Array.isArray(s.data) ? s.data : []);
      setRent(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      toast.error("No se pudo cargar", parseApiError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const KPIS = kpis ? [
    { label: "Ingresos totales", value: currency(kpis.ingresos_totales), color: "#16a34a", icon: "dollar" },
    { label: "Ventas realizadas", value: number(kpis.numero_ventas), color: "#2563eb", icon: "cart" },
    { label: "Ticket promedio", value: currency(kpis.ticket_promedio), color: "#7c3aed", icon: "receipt" },
    { label: "Productos con stock bajo", value: number(kpis.productos_stock_bajo), color: "#f59e0b", icon: "alert" },
  ] : [];

  const topUnidades = top.slice(0, 6).map((p) => ({ name: p.nombre, value: p.cantidad_vendida, sub: `Ingresos ${currency(p.ingresos)} · Ganancia ${currency(p.ganancia || 0)}` }));
  const topMargen = rent.slice(0, 6).map((p) => ({ name: p.nombre, value: Math.round(p.margen_porcentaje), sub: `${currency(p.precio_compra)} → ${currency(p.precio_venta)} · ganas ${currency((p.precio_venta || 0) - (p.precio_compra || 0))} c/u` }));

  return (
    <div className="page page--metrics">
      <div className="page__head">
        <div className="head-actions" style={{ marginLeft: "auto" }}>
          <div style={{ width: 190 }}>
            <Select value={dias} onChange={(e) => setDias(Number(e.target.value))} options={RANGOS} />
          </div>
          <button className="btn btn--soft" onClick={fetchData} disabled={loading}>
            <Icon name="refresh" size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="metric-kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="metric-kpi" style={{ borderTop: `3px solid ${k.color}` }}>
            <span className="metric-kpi__icon" style={{ background: `${k.color}1a`, color: k.color }}>
              <Icon name={k.icon} size={18} />
            </span>
            <div>
              <span className="metric-kpi__label">{k.label}</span>
              <b className="metric-kpi__value">{loading ? "…" : k.value}</b>
            </div>
          </div>
        ))}
      </div>

      {/* Ingresos por día */}
      <div className="metric-panel">
        <h3 className="metric-panel__title"><Icon name="trending" size={16} /> Ingresos por día</h3>
        <ComboChart data={serie.map((d) => ({ label: d.fecha, value: d.ingresos }))} />
      </div>

      {/* Dos paneles: más vendidos y rentabilidad */}
      <div className="metric-grid">
        <div className="metric-panel">
          <h3 className="metric-panel__title"><Icon name="box" size={16} /> Productos más vendidos</h3>
          {topUnidades.length ? <HBars data={topUnidades} suffix=" u." /> :
            <div className="metric-empty">Sin ventas en el período.</div>}
        </div>
        <div className="metric-panel">
          <h3 className="metric-panel__title"><Icon name="chart" size={16} /> Mayor rentabilidad (margen)</h3>
          {topMargen.length ? <HBars data={topMargen} suffix="%" color="#16a34a" /> :
            <div className="metric-empty">Sin datos de rentabilidad.</div>}
        </div>
      </div>
    </div>
  );
}

/** Barras horizontales con nombre, valor y subtítulo. */
function HBars({ data, suffix = "", color = "#2563eb" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div className="hbar" key={i}>
          <div className="hbar__head">
            <span className="hbar__name">{d.name}</span>
            <b className="hbar__val">{d.value}{suffix}</b>
          </div>
          <div className="hbar__track">
            <div className="hbar__fill" style={{ width: `${Math.max((d.value / max) * 100, 2)}%`, background: color }} />
          </div>
          {d.sub && <span className="hbar__sub">{d.sub}</span>}
        </div>
      ))}
    </div>
  );
}

/** Gráfico de línea suave + área (SVG), sin columnas. */
function ComboChart({ data }) {
  if (!data.length) return <div className="metric-empty">Sin datos en el período.</div>;
  const W = 760, H = 210, padL = 50, padR = 16, padT = 18, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const baseY = padT + innerH;
  const X = (i) => padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const Y = (v) => padT + innerH * (1 - v / max);
  const pts = data.map((d, i) => [X(i), Y(d.value)]);

  // Curva suave (Catmull-Rom -> Bézier)
  const smooth = (p) => {
    if (p.length < 2) return p.length ? `M${p[0][0]},${p[0][1]}` : "";
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const line = smooth(pts);
  const area = `${line} L${X(n - 1).toFixed(1)},${baseY.toFixed(1)} L${X(0).toFixed(1)},${baseY.toFixed(1)} Z`;
  const ticks = 3;
  const labelEvery = Math.ceil(n / 6);
  const fmtDay = (iso) => { const p = (iso || "").split("-"); return p.length === 3 ? `${p[2]}/${p[1]}` : iso; };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="area-chart" width="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const yy = padT + (innerH * i) / ticks;
        const val = Math.round(max - (max * i) / ticks);
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#eef2f7" />
            <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="#2563eb" opacity="0.55" />
      ))}
      {data.map((d, i) => (i % labelEvery === 0 || i === n - 1) && (
        <text key={i} x={X(i)} y={H - 9} textAnchor="middle" fontSize="9" fill="#64748b">{fmtDay(d.label)}</text>
      ))}
    </svg>
  );
}
