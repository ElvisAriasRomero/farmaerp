import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { Select } from "./Field.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { endpoints, ventasApi, parseApiError } from "../services/api.js";
import { currency } from "../utils/format.js";

const emptyLine = () => ({ producto: "", presentacion: "unidad", cantidad: 1, precio_unitario: "" });

/** Página POS para registrar una nueva venta con pago y factura opcional. */
export default function VentaPOS({ productos, clientes, empleados }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [cliente, setCliente] = useState("");
  const [empleado, setEmpleado] = useState("");
  const [lines, setLines] = useState([emptyLine()]);

  const [conFactura, setConFactura] = useState(false);
  const [nit, setNit] = useState("");
  const [razon, setRazon] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [recibido, setRecibido] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setLine = (idx, key, value) => {
    setLines((ls) => {
      let arr = ls.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, [key]: value };
        if (key === "producto" || key === "presentacion") {
          const opt = productos.find((o) => String(o.value) === String(next.producto));
          if (opt && opt.price != null) {
            const factor = next.presentacion === "paquete" ? (opt.factor || 1) : 1;
            next.precio_unitario = Number((opt.price * factor).toFixed(2));
          }
        }
        return next;
      });
      // Si el producto elegido ya está en otra línea (misma presentación),
      // se juntan en una sola sumando la cantidad (evita duplicados).
      if (key === "producto" && value) {
        const cur = arr[idx];
        const dup = arr.findIndex(
          (l, i) => i !== idx && l.producto === cur.producto && l.presentacion === cur.presentacion
        );
        if (dup !== -1) {
          arr = arr
            .map((l, i) =>
              i === dup
                ? { ...l, cantidad: (Number(l.cantidad) || 0) + (Number(cur.cantidad) || 1) }
                : l
            )
            .filter((_, i) => i !== idx);
          toast.info?.("Producto combinado", "Ese producto ya estaba; se sumó la cantidad.");
        }
      }
      return arr.length ? arr : [emptyLine()];
    });
  };
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (idx) =>
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));

  const total = lines.reduce(
    (s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0),
    0
  );

  const onClienteChange = (val) => {
    setCliente(val);
    const opt = clientes.find((o) => String(o.value) === String(val));
    if (opt && conFactura && !razon) setRazon(opt.label);
  };

  const activarFactura = () => {
    setConFactura(true);
    if (!razon) {
      const opt = clientes.find((o) => String(o.value) === String(cliente));
      if (opt) setRazon(opt.label);
    }
  };

  const confirmar = async () => {
    setError("");
    if (!empleado) {
      setError("Selecciona el vendedor que realiza la venta.");
      return;
    }
    const validLines = lines.filter((l) => l.producto && Number(l.cantidad) > 0);
    if (!validLines.length) {
      setError("Agrega al menos un producto con cantidad válida.");
      return;
    }
    // Validación de stock antes de enviar (mensaje amigable)
    for (const l of validLines) {
      const prod = productos.find((o) => String(o.value) === String(l.producto));
      const factor = l.presentacion === "paquete" ? (prod?.factor || 1) : 1;
      const requerido = Number(l.cantidad) * factor;
      const disponible = prod?.stock ?? 0;
      if (requerido > disponible) {
        setError(`No hay stock suficiente de "${prod?.label}". Disponible: ${disponible} unidades, necesitas: ${requerido}.`);
        return;
      }
    }
    setSaving(true);
    try {
      // 1) crear la venta (descuenta stock)
      const detalles = validLines.map((l) => ({
        producto: Number(l.producto),
        presentacion: l.presentacion || "unidad",
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario) || 0,
      }));
      const { data: venta } = await endpoints.ventas.create({
        cliente: cliente ? Number(cliente) : null,
        empleado: empleado ? Number(empleado) : null,
        estado: "pendiente",
        con_factura: conFactura,
        detalles,
      });
      // 2) confirmar: registra el pago y emite factura si corresponde
      await ventasApi.confirmar(venta.id_venta, {
        metodo_pago: metodo,
        monto: total,
        con_factura: conFactura,
        nit_ci: nit || "0",
        razon_social: razon || "S/N",
      });
      toast.success(
        "Venta confirmada",
        conFactura ? "Pago registrado y factura emitida." : "Pago registrado correctamente."
      );
      navigate("/panel/ventas/registros");
    } catch (err) {
      setError(parseApiError(err));
      toast.error("No se pudo completar la venta", parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page--tight page--pos">
      <div className="page__head page__head--slim">
        <div className="head-actions">
          <button className="btn btn--vista" onClick={() => navigate("/panel/ventas/registros")} disabled={saving}>
            <Icon name="clipboard" size={15} /> Ver ventas registradas
          </button>
        </div>
      </div>

      {error && <div className="auth__error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="pos-grid">
        {/* Columna izquierda: cabecera + productos */}
        <div>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field">
                <label className="field__label">Cliente</label>
                <Select value={cliente} onChange={(e) => onClienteChange(e.target.value)}
                  placeholder="Consumidor final" options={clientes} />
              </div>
              <div className="field">
                <label className="field__label">Vendedor <span style={{ color: "var(--danger-600)" }}>*</span></label>
                <Select value={empleado} onChange={(e) => setEmpleado(e.target.value)}
                  placeholder="Seleccionar vendedor…" options={empleados} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 style={{ fontSize: 14.5, fontWeight: 650, color: "var(--slate-800)" }}>Productos</h4>
              <button type="button" className="btn btn--soft btn--sm" onClick={addLine}>
                <Icon name="plus" size={14} /> Agregar línea
              </button>
            </div>
            <div className="doc-lines">
              <div className="doc-line doc-line--head doc-line--pres">
                <span>Producto</span><span>Presentación</span><span>Cantidad</span><span>Precio (Bs)</span>
                <span className="text-right">Subtotal</span><span />
              </div>
              {lines.map((l, idx) => (
                <div className="doc-line doc-line--pres" key={idx}>
                  <Select value={l.producto} onChange={(e) => setLine(idx, "producto", e.target.value)}
                    placeholder="Seleccionar producto…" options={productos} />
                  <Select value={l.presentacion} onChange={(e) => setLine(idx, "presentacion", e.target.value)}
                    options={[{ value: "unidad", label: "Unidad" }, { value: "paquete", label: "Paquete" }]} />
                  <input className="input" type="number" min="1" value={l.cantidad}
                    onChange={(e) => setLine(idx, "cantidad", e.target.value)} />
                  <input className="input" type="number" min="0" step="0.01" value={l.precio_unitario}
                    onChange={(e) => setLine(idx, "precio_unitario", e.target.value)} placeholder="0.00" />
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
          </div>
        </div>

        {/* Columna derecha: facturación + pago */}
        <aside className="pos-side">
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h4 className="pos-side__title">Facturación</h4>
            <div className="pos-toggle">
              <button type="button" className={`pos-toggle__btn ${!conFactura ? "active" : ""}`}
                onClick={() => setConFactura(false)}>Sin factura</button>
              <button type="button" className={`pos-toggle__btn ${conFactura ? "active" : ""}`}
                onClick={activarFactura}>Con factura</button>
            </div>
            {conFactura && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="field">
                  <label className="field__label">NIT / CI</label>
                  <input className="input" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="0" />
                </div>
                <div className="field">
                  <label className="field__label">Razón social / Nombre</label>
                  <input className="input" value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="S/N" />
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h4 className="pos-side__title">Pago</h4>
            <div className="pos-toggle">
              <button type="button" className={`pos-toggle__btn ${metodo === "efectivo" ? "active" : ""}`}
                onClick={() => setMetodo("efectivo")}>
                <Icon name="wallet" size={15} /> Efectivo
              </button>
              <button type="button" className={`pos-toggle__btn ${metodo === "qr" ? "active" : ""}`}
                onClick={() => setMetodo("qr")}>
                <Icon name="card" size={15} /> QR
              </button>
            </div>

            {metodo === "qr" && (
              <div className="pos-qr">
                <FakeQR />
                <span className="text-soft" style={{ fontSize: 12 }}>Escanea para pagar (simulado)</span>
              </div>
            )}

            {metodo === "efectivo" && (
              <div className="pos-cash">
                <label className="field__label">Efectivo recibido (Bs)</label>
                <input className="input" type="number" min="0" step="0.01" value={recibido}
                  onChange={(e) => setRecibido(e.target.value)} placeholder="0.00" />
                {recibido !== "" && (
                  Number(recibido) >= total ? (
                    <div className="pos-cash__change">
                      {Number(recibido) === total ? "Pago justo" : <>Cambio: <b>{currency(Number(recibido) - total)}</b></>}
                    </div>
                  ) : (
                    <div className="pos-cash__change pos-cash__change--falta">
                      Falta: {currency(total - Number(recibido))}
                    </div>
                  )
                )}
              </div>
            )}

            <div className="pos-amount">
              <span>Monto a cobrar</span>
              <b>{currency(total)}</b>
            </div>

            <button className="btn btn--primary btn--block" onClick={confirmar}
              disabled={saving || (metodo === "efectivo" && recibido !== "" && Number(recibido) < total)}>
              {saving ? "Procesando…" : "Confirmar venta"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** QR simulado (patrón determinista, no es un código real). */
function FakeQR() {
  const n = 11;
  const cells = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const on =
        (x * 7 + y * 13 + x * y) % 3 === 0 ||
        (x < 3 && y < 3) ||
        (x > n - 4 && y < 3) ||
        (x < 3 && y > n - 4);
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * 10} y={y * 10} width="10" height="10" />);
    }
  }
  return (
    <svg viewBox={`0 0 ${n * 10} ${n * 10}`} width="104" height="104" fill="var(--slate-900)">
      <rect x="0" y="0" width={n * 10} height={n * 10} fill="#fff" />
      {cells}
    </svg>
  );
}
