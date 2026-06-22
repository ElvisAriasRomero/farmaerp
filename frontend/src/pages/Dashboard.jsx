import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import Icon from "../components/Icon.jsx";
import { analyticsApi, parseApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { currency, number, dateShort } from "../utils/format.js";

const RANGES = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
];

const METODO_LABEL = { efectivo: "Efectivo", qr: "QR", tarjeta: "Tarjeta" };
const METODO_COLOR = { efectivo: "#16a34a", qr: "#2563eb", tarjeta: "#7c3aed" };

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [dias, setDias] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    analyticsApi
      .dashboard(dias)
      .then((res) => active && setData(res.data))
      .catch((err) => toast.error("No se pudo cargar el dashboard", parseApiError(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  const k = data?.kpis || {};
  const serie = (data?.ventas_por_dia || []).map((d) => ({
    ...d, label: dateShort(d.fecha).replace(/ de \d+/, ""),
  }));
  const metodos = data?.ventas_por_metodo || [];
  const alertas = data?.alertas_stock_bajo || [];
  const caja = data?.caja_actual || {};
  const reservas = data?.reservas_pendientes || [];
  const reservasTotal = data?.reservas_pendientes_total || 0;
  const name = user?.nombre || user?.email?.split("@")[0] || "";

  const stats = [
    {
      label: "Ingresos del período", value: currency(k.ingresos_totales || 0),
      icon: "dollar", accent: "var(--brand-600)", soft: "var(--brand-50)",
      indicator: { text: `Promedio por venta: ${currency(k.ticket_promedio || 0)}`, color: "slate" },
    },
    {
      label: "Ventas realizadas", value: number(k.numero_ventas || 0),
      icon: "cart", accent: "var(--success-600)", soft: "var(--success-50)",
      indicator: { text: `${number(k.total_productos || 0)} productos en catálogo`, color: "slate" },
    },
    {
      label: "Caja del día",
      value: caja.estado === "abierta" ? currency(caja.saldo || 0) : "Cerrada",
      icon: "wallet", accent: "var(--info-600)", soft: "var(--info-50)", to: "/panel/caja",
      indicator: caja.estado === "abierta"
        ? { text: "Caja abierta", color: "green" }
        : { text: "Caja cerrada", color: "slate" },
    },
    {
      label: "Reservas por entregar",
      value: number(reservasTotal),
      icon: "clipboard", accent: "var(--warning-600)", soft: "var(--warning-50)", to: "/panel/reservas",
      indicator: reservasTotal > 0
        ? { text: "Requieren atención", color: "amber" }
        : { text: "Al día", color: "green" },
    },
  ];

  return (
    <div className="page">
      <div className="page__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 14.5 }}>Indicadores</h2>
          <p style={{ fontSize: 11.5 }}>Últimos {dias} días</p>
        </div>
        <div className="u-flex u-gap-8">
          {RANGES.map((r) => (
            <button key={r.value} className={`btn btn--sm ${dias === r.value ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setDias(r.value)}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* KPIs operativos */}
      <div className="stat-grid">
        {stats.map((s) => {
          const card = (
            <div className="stat-card" style={{ "--accent": s.accent, "--accent-soft": s.soft }}>
              <div className="stat-card__top">
                <span className="stat-card__label">{s.label}</span>
                <span className="stat-card__icon"><Icon name={s.icon} size={22} /></span>
              </div>
              <div className="stat-card__value">
                {loading ? <span className="skeleton" style={{ display: "inline-block", width: 90, height: 26 }} /> : s.value}
              </div>
              {s.indicator && !loading && (
                <span className={`badge badge--${s.indicator.color} stat-card__ind`}>{s.indicator.text}</span>
              )}
            </div>
          );
          return s.to ? <Link key={s.label} to={s.to} style={{ display: "block" }}>{card}</Link> : <div key={s.label}>{card}</div>;
        })}
      </div>

      {/* Ingresos + método de pago */}
      <div className="grid-2">
        <div className="card">
          <div className="card__head">
            <h3>Evolución de ingresos</h3>
            <span className="badge badge--blue badge--plain">{dias} días</span>
          </div>
          <div className="card__body">
            {loading ? <div className="loading-block"><div className="spinner" /></div>
              : serie.length === 0 ? <EmptyChart text="Sin ventas registradas en el período." />
              : (
                <>
                  <div className="chart-legend">
                    <span><i style={{ background: "#7c3aed" }} /> Ingresos</span>
                    <span><i style={{ background: "#f59e0b" }} /> Ganancia</span>
                  </div>
                  <div className="chart-box" style={{ height: 268 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={serie} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gGanancia" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={20} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={64}
                          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                        <Tooltip content={<IngresosTooltip />} />
                        <Area type="monotone" dataKey="ingresos" stroke="#7c3aed" strokeWidth={2.2} fill="url(#gIngresos)" />
                        <Area type="monotone" dataKey="ganancia" stroke="#f59e0b" strokeWidth={2} fill="url(#gGanancia)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3>Ventas por método de pago</h3>
            <Link to="/panel/pagos" className="badge badge--blue badge--plain" style={{ cursor: "pointer" }}>Ver pagos</Link>
          </div>
          <div className="card__body metodo-body">
            {loading ? <div className="loading-block"><div className="spinner" /></div>
              : metodos.length === 0 ? <EmptyChart text="Sin pagos en el período." />
              : (
                <div className="metodo-wrap">
                  <div className="metodo-donut">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metodos} dataKey="total" nameKey="metodo" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
                          {metodos.map((m) => <Cell key={m.metodo} fill={METODO_COLOR[m.metodo] || "#94a3b8"} />)}
                        </Pie>
                        <Tooltip content={<MetodoTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="metodo-legend">
                    {metodos.map((m) => (
                      <div className="metodo-item" key={m.metodo}>
                        <span className="metodo-dot" style={{ background: METODO_COLOR[m.metodo] || "#94a3b8" }} />
                        <span className="metodo-name">{METODO_LABEL[m.metodo] || m.metodo}</span>
                        <b className="metodo-val">{currency(m.total)}</b>
                        <span className="metodo-cnt">{number(m.cantidad)} pago(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Reservas + alertas de stock */}
      <div className="grid-2">
        <div className="card">
          <div className="card__head">
            <h3>Reservas por entregar</h3>
            <Link to="/panel/reservas" className="badge badge--cyan badge--plain" style={{ cursor: "pointer" }}>Ver todas</Link>
          </div>
          <div className="card__body" style={{ paddingTop: 6 }}>
            {loading ? <div className="loading-block"><div className="spinner" /></div>
              : reservas.length === 0 ? (
                <div className="empty" style={{ padding: "30px 10px" }}>
                  <div className="empty__icon" style={{ background: "var(--success-50)", color: "var(--success-600)" }}><Icon name="check" size={24} /></div>
                  <h4>Sin pendientes</h4>
                  <p>No hay reservas esperando retiro.</p>
                </div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {reservas.map((r) => (
                    <Link to="/panel/reservas" key={r.id_venta} className="alert-row" style={{ textDecoration: "none" }}>
                      <div className="alert-row__icon" style={{ background: "var(--info-50)", color: "var(--info-600)" }}>
                        <Icon name="clipboard" size={17} />
                      </div>
                      <div className="alert-row__body">
                        <b>Reserva #{r.id_venta}</b>
                        <span>{r.cliente}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{currency(r.total)}</div>
                        <span className={`badge badge--${r.estado === "pagada" ? "green" : "amber"}`} style={{ textTransform: "capitalize" }}>{r.estado}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3>Alertas de stock</h3>
            <Link to="/panel/inventario" className="badge badge--amber badge--plain" style={{ cursor: "pointer" }}>Ver todo</Link>
          </div>
          <div className="card__body" style={{ paddingTop: 6 }}>
            {loading ? <div className="loading-block"><div className="spinner" /></div>
              : alertas.length === 0 ? (
                <div className="empty" style={{ padding: "30px 10px" }}>
                  <div className="empty__icon" style={{ background: "var(--success-50)", color: "var(--success-600)" }}><Icon name="check" size={24} /></div>
                  <h4>Todo en orden</h4>
                  <p>No hay productos por debajo del stock mínimo.</p>
                </div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {alertas.slice(0, 8).map((a) => (
                    <div className="alert-row" key={a.id_producto}>
                      <div className="alert-row__icon"><Icon name="alert" size={18} /></div>
                      <div className="alert-row__body">
                        <b>{a.nombre}</b>
                        <span>Stock {a.stock_actual} · mínimo {a.stock_minimo}</span>
                      </div>
                      <span className="badge badge--red">Faltan {a.faltante}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="empty" style={{ padding: "40px 10px" }}>
      <div className="empty__icon"><Icon name="chart" size={26} /></div>
      <p>{text}</p>
    </div>
  );
}

function IngresosTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="chart-tip__title">{label}</div>
      <div style={{ color: "#7c3aed" }}>Ingresos: {currency(p.ingresos)}</div>
      <div style={{ color: "#f59e0b" }}>Ganancia: {currency(p.ganancia)}</div>
      <div className="text-soft">{number(p.ventas)} venta(s)</div>
    </div>
  );
}

function MetodoTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="chart-tip__title">{METODO_LABEL[p.metodo] || p.metodo}</div>
      <div style={{ color: "var(--brand-700)" }}>{currency(p.total)}</div>
      <div className="text-soft">{number(p.cantidad)} pago(s)</div>
    </div>
  );
}
