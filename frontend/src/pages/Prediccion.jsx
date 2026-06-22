import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { Select } from "../components/Field.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SugerenciasModal from "../components/SugerenciasModal.jsx";
import { endpoints, prediccionApi, parseApiError } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { PERIODO } from "../config/choices.js";

const periodoLabel = (v) => (PERIODO.find((p) => p.value === v)?.label || v).toLowerCase();

const RECO = {
  comprar:       { cls: "warn", icon: "truck",  title: "Recomendación: reabastecer" },
  sobrestock:    { cls: "over", icon: "alert",  title: "Atención: posible sobre-stock" },
  suficiente:    { cls: "ok",   icon: "check",  title: "Stock suficiente" },
  sin_demanda:   { cls: "mute", icon: "info",   title: "Sin demanda prevista" },
  sin_inventario:{ cls: "mute", icon: "info",   title: "Sin inventario" },
};

export default function Prediccion() {
  const toast = useToast();
  const { actor } = useAuth();
  const staff = ["administrador", "empleado"].includes(actor);
  const esAdmin = actor === "administrador";

  const productos = useOptions(endpoints.productos, (p) => ({ value: p.id_producto, label: p.nombre }));

  const [producto, setProducto] = useState("");
  const [periodo, setPeriodo] = useState("semanal");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entrenando, setEntrenando] = useState(false);
  const [modal, setModal] = useState(false);

  const consultar = async () => {
    if (!producto) { toast.error("Selecciona un producto", "Elige un producto para consultar su predicción."); return; }
    setLoading(true);
    setRes(null);
    try {
      const { data } = await prediccionApi.predecirProducto(producto, periodo);
      setRes(data);
    } catch (err) {
      toast.error("No se pudo consultar", parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const entrenar = async () => {
    setEntrenando(true);
    try {
      await prediccionApi.entrenar();
      toast.success("Modelos entrenados", "Las próximas consultas usarán los modelos actualizados.");
    } catch (err) {
      toast.error("No se pudo entrenar", parseApiError(err));
    } finally {
      setEntrenando(false);
    }
  };

  const prodNombre = productos.find((p) => String(p.value) === String(producto))?.label || "";
  const confianza = res ? Math.round(Number(res.confianza) || 0) : 0;
  const reco = res?.recomendacion ? (RECO[res.recomendacion.accion] || RECO.mute) : null;
  const cob = res?.cobertura_dias;
  const agot = res && cob != null && isFinite(cob)
    ? new Date(Date.now() + cob * 86400000).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="page page--pred">
      <div className="page__head">
        <div className="info-banner">
          <Icon name="info" size={16} />
          <span>
            Consulta la <b>demanda prevista</b> de un producto, cuánto se venderá en distintos plazos
            y una <b>recomendación de compra</b> que evita el sobre-stock. Es informativo (en vivo, no se guarda).
          </span>
        </div>
        <div className="head-actions" style={{ marginLeft: "auto" }}>
          {staff && (
            <button className="btn btn--amber" onClick={() => setModal(true)}>
              <Icon name="layers" size={15} /> Sugerencias generales
            </button>
          )}
          {esAdmin && (
            <button className="btn btn--purple" onClick={entrenar} disabled={entrenando}>
              <Icon name="brain" size={15} /> {entrenando ? "Entrenando…" : "Entrenar modelos"}
            </button>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="pred-controls">
          <div className="field" style={{ flex: 2, minWidth: 220 }}>
            <label className="field__label">Producto</label>
            <Select value={producto} onChange={(e) => setProducto(e.target.value)}
              placeholder="Seleccionar producto…" options={productos} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <label className="field__label">Periodo</label>
            <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} options={PERIODO} />
          </div>
          <button className="btn btn--primary" onClick={consultar} disabled={loading} style={{ alignSelf: "flex-end" }}>
            <Icon name="trending" size={16} /> {loading ? "Consultando…" : "Consultar"}
          </button>
        </div>
      </div>

      {!res && !loading && (
        <div className="empty" style={{ marginTop: 30 }}>
          <div className="empty__icon"><Icon name="brain" size={28} /></div>
          <h4>Sin consulta todavía</h4>
          <p>Elige un producto y un periodo, luego pulsa “Consultar”.</p>
        </div>
      )}

      {res && (
        <>
          {/* Resumen del periodo */}
          <div className="pred-cards">
            <div className="pred-card pred-card--main" style={{ borderTop: "3px solid #2563eb" }}>
              <span className="pred-card__label">Demanda prevista · {periodoLabel(periodo)}</span>
              <b className="pred-card__value">{res.demanda_predicha} u.</b>
              <span className="pred-card__hint">{prodNombre}</span>
            </div>
            <div className="pred-card" style={{ borderTop: "3px solid #16a34a" }}>
              <span className="pred-card__label">Confianza</span>
              <span className={`badge badge--${confianza >= 75 ? "green" : confianza >= 50 ? "amber" : "red"}`} style={{ fontSize: 16 }}>{confianza}%</span>
            </div>
            <div className="pred-card" style={{ borderTop: "3px solid #7c3aed" }}>
              <span className="pred-card__label">Método</span>
              <StatusBadge value={res.metodo} />
            </div>
            <div className="pred-card" style={{ borderTop: "3px solid #0d9488" }}>
              <span className="pred-card__label">Stock actual / mínimo</span>
              <b className="pred-card__value" style={{ fontSize: 20 }}>
                {res.stock_actual == null ? "—" : `${res.stock_actual} / ${res.stock_minimo ?? "—"}`}
              </b>
            </div>
          </div>

          {res.metodo !== "prophet" && (
            <div className="pred-metodo-note">
              <Icon name="info" size={14} />
              <span>
                {res.metodo === "sin_datos"
                  ? "Este producto aún no tiene ventas suficientes para predecir su demanda."
                  : <>Se usó el <b>promedio móvil</b> porque este producto no tiene un modelo Prophet entrenado o su historial es corto. {esAdmin && "Pulsa “Entrenar modelos” para mejorar la precisión."}</>}
              </span>
            </div>
          )}

          {/* Pronóstico de ventas por plazos */}
          {res.pronostico && (
            <div className="pred-panel">
              <h3 className="pred-panel__title"><Icon name="chart" size={16} /> Cuánto se venderá</h3>
              <div className="pred-forecast-wrap">
                <MiniBars data={[
                  { label: "1 día", value: res.pronostico.diario || 0 },
                  { label: "1 semana", value: res.pronostico.semanal || 0 },
                  { label: "1 mes", value: res.pronostico.mensual || 0 },
                ]} />
                <div className="pred-stats">
                  <div className="pred-stat">
                    <span>Venta diaria promedio</span>
                    <b>{res.pronostico.diario || 0} u/día</b>
                  </div>
                  <div className="pred-stat pred-stat--accent">
                    <span>Cobertura de stock</span>
                    <b>{cob == null ? "—" : `~${Math.round(cob)} días`}</b>
                  </div>
                  <div className="pred-stat">
                    <span>Agotamiento estimado</span>
                    <b>{agot}</b>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recomendación */}
          {reco && (
            <div className={`pred-reco pred-reco--${reco.cls}`}>
              <Icon name={reco.icon} size={22} />
              <div>
                <b className="pred-reco__title">{reco.title}</b>
                <span className="pred-reco__msg">{res.recomendacion.mensaje}</span>
              </div>
            </div>
          )}
        </>
      )}

      <SugerenciasModal open={modal} onClose={() => setModal(false)} staff={staff} admin={esAdmin} />
    </div>
  );
}


/** Mini gráfico de barras verticales (SVG, sin librerías). */
function MiniBars({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 360, H = 220, padLeft = 40, padRight = 14, padTop = 30, padBottom = 30;
  const baseY = H - padBottom;
  const n = data.length, bw = 56;
  const gap = (W - padLeft - padRight - n * bw) / (n + 1);
  const ticks = 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mini-bars" width="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padTop + ((baseY - padTop) * i) / ticks;
        const val = Math.round(max - (max * i) / ticks);
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="#eef2f7" strokeWidth="1" />
            <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      <line x1={padLeft} y1={baseY} x2={W - padRight} y2={baseY} stroke="#cbd5e1" strokeWidth="1" />
      {data.map((d, i) => {
        const x = padLeft + gap + i * (bw + gap);
        const h = Math.max(2, (d.value / max) * (baseY - padTop));
        const y = baseY - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill="url(#barGrad)" />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">{d.value}</text>
            <text x={x + bw / 2} y={baseY + 16} textAnchor="middle" fontSize="11" fill="#64748b">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
