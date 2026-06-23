import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import { Select } from "./Field.jsx";
import ProductQuickCreate from "./ProductQuickCreate.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { endpoints, parseApiError } from "../services/api.js";
import { currency } from "../utils/format.js";

const emptyLine = () => ({ producto: "", unidades_por_paquete: 1, cantidad: 1, precio_unitario: "", margen: 30, precio_venta: "", fecha_vencimiento: "" });

const ventaSugerida = (costo, upp, margen) => {
  const c = Number(costo);
  const f = Math.max(Number(upp) || 1, 1);
  const m = Number(margen) || 0;
  if (!(c > 0)) return "";
  return ((c / f) * (1 + m / 100)).toFixed(2);
};

/** Página de nueva compra (modelo 2b). Define costo, venta y unidades por paquete. */
export default function CompraPOS({ productos, proveedores, empleados }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const desdeSugerencia = location.state?.fromSugerencia || null;

  const today = new Date().toISOString().slice(0, 10);
  const [proveedor, setProveedor] = useState("");
  const [empleado, setEmpleado] = useState("");
  const [fechaPedido, setFechaPedido] = useState(today);
  const [fechaRecepcion, setFechaRecepcion] = useState("");

  const [lines, setLines] = useState(() =>
    desdeSugerencia
      ? [{ ...emptyLine(), producto: String(desdeSugerencia.producto), cantidad: desdeSugerencia.cantidad }]
      : [emptyLine()]
  );
  const [extraProducts, setExtraProducts] = useState([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const options = [...productos, ...extraProducts];

  const setLine = (idx, key, value) => {
    setLines((ls) =>
      ls.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, [key]: value };
        // recalcula la venta sugerida cuando cambia costo, unidades o margen
        if (key === "precio_unitario" || key === "unidades_por_paquete" || key === "margen") {
          next.precio_venta = ventaSugerida(next.precio_unitario, next.unidades_por_paquete, next.margen);
        }
        return next;
      })
    );
  };
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (idx) => setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));

  const onProductCreated = (p) => {
    setExtraProducts((arr) => [...arr, { value: p.id_producto, label: p.nombre }]);
    setQuickOpen(false);
    setLines((ls) => {
      const i = ls.findIndex((l) => !l.producto);
      if (i === -1) return [...ls, { ...emptyLine(), producto: String(p.id_producto) }];
      return ls.map((l, idx) => (idx === i ? { ...l, producto: String(p.id_producto) } : l));
    });
  };

  const total = lines.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0);

  const registrar = async () => {
    setError("");
    if (!proveedor) { setError("Selecciona un proveedor."); return; }
    const valid = lines.filter((l) => l.producto && Number(l.cantidad) > 0 && Number(l.precio_unitario) >= 0);
    if (!valid.length) { setError("Agrega al menos un producto con cantidad y costo."); return; }
    setSaving(true);
    try {
      const detalles = valid.map((l) => ({
        producto: Number(l.producto),
        unidades_por_paquete: Math.max(Number(l.unidades_por_paquete) || 1, 1),
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario) || 0,
        precio_venta: l.precio_venta === "" ? null : Number(l.precio_venta),
        fecha_vencimiento: l.fecha_vencimiento || null,
      }));
      await endpoints.compras.create({
        proveedor: Number(proveedor),
        empleado: empleado ? Number(empleado) : null,
        fecha_pedido: fechaPedido,
        fecha_recepcion: fechaRecepcion || null,
        estado: "pendiente",
        detalles,
      });
      if (desdeSugerencia?.id_sugerencia) {
        try {
          await endpoints.sugerencias.patch(desdeSugerencia.id_sugerencia, { estado: "atendida" });
        } catch { /* la compra ya se creó; no bloquear por esto */ }
      }
      toast.success("Compra registrada", "Recepciónala para sumar el stock y fijar precios.");
      navigate("/panel/compras");
    } catch (err) {
      setError(parseApiError(err));
      toast.error("No se pudo registrar", parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page--tight">
      <div className="page__head page__head--slim">
        <div className="head-actions">
          <button className="btn btn--ghost" onClick={() => navigate("/panel/compras")} disabled={saving}>
            <Icon name="chevronLeft" size={15} /> Volver
          </button>
        </div>
      </div>

      {error && <div className="auth__error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="form-grid">
          <div className="field">
            <label className="field__label">Proveedor <span className="req">*</span></label>
            <Select value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Seleccionar…" options={proveedores} />
          </div>
          <div className="field">
            <label className="field__label">Responsable</label>
            <Select value={empleado} onChange={(e) => setEmpleado(e.target.value)} placeholder="—" options={empleados} />
          </div>
          <div className="field">
            <label className="field__label">Fecha de pedido <span className="req">*</span></label>
            <input className="input" type="date" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Fecha de recepción</label>
            <input className="input" type="date" value={fechaRecepcion} onChange={(e) => setFechaRecepcion(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h4 style={{ fontSize: 14.5, fontWeight: 650, color: "var(--slate-800)" }}>Detalle de productos</h4>
          <div className="u-flex u-items-center u-gap-8">
            <button type="button" className="btn btn--soft btn--sm" onClick={() => setQuickOpen(true)}>
              <Icon name="plus" size={14} /> Nuevo producto
            </button>
            <button type="button" className="btn btn--soft btn--sm" onClick={addLine}>
              <Icon name="plus" size={14} /> Agregar línea
            </button>
          </div>
        </div>

        <div className="doc-lines">
          <div className="doc-line doc-line--compra doc-line--head">
            <span>Producto</span>
            <span>Unid. x paquete</span>
            <span>Cantidad</span>
            <span>Costo x paquete</span>
            <span>Ganancia %</span>
            <span>Venta x unidad</span>
            <span>Vence (lote)</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>
          {lines.map((l, idx) => (
            <div className="doc-line doc-line--compra" key={idx}>
              <Select value={l.producto} onChange={(e) => setLine(idx, "producto", e.target.value)}
                placeholder="Seleccionar producto…" options={options} />
              <input className="input" type="number" min="1" value={l.unidades_por_paquete}
                onChange={(e) => setLine(idx, "unidades_por_paquete", e.target.value)} />
              <input className="input" type="number" min="1" value={l.cantidad}
                onChange={(e) => setLine(idx, "cantidad", e.target.value)} />
              <input className="input" type="number" min="0" step="0.01" value={l.precio_unitario}
                onChange={(e) => setLine(idx, "precio_unitario", e.target.value)} placeholder="0.00" />
              <input className="input" type="number" min="0" value={l.margen}
                onChange={(e) => setLine(idx, "margen", e.target.value)} />
              <input className="input" type="number" min="0" step="0.01" value={l.precio_venta}
                onChange={(e) => setLine(idx, "precio_venta", e.target.value)} placeholder="0.00" />
              <input className="input" type="date" value={l.fecha_vencimiento}
                onChange={(e) => setLine(idx, "fecha_vencimiento", e.target.value)} title="Fecha de vencimiento del lote" />
              <span className="doc-line__sub">
                {currency((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0))}
              </span>
              <button type="button" className="row-action danger" onClick={() => removeLine(idx)} title="Quitar">
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="doc-total"><span>Total del documento</span><b>{currency(total)}</b></div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button type="button" className="btn btn--ghost" onClick={() => navigate("/panel/compras")} disabled={saving}>Cancelar</button>
          <button type="button" className="btn btn--primary" onClick={registrar} disabled={saving}>
            {saving ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </div>

      <ProductQuickCreate open={quickOpen} onClose={() => setQuickOpen(false)} onCreated={onProductCreated} />
    </div>
  );
}
