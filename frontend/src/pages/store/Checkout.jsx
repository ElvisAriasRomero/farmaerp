import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { tiendaApi, parseApiError } from "../../services/api.js";
import { currency } from "../../utils/format.js";

export default function Checkout() {
  const { items, total, count, clear } = useCart();
  const { isAuth, actor, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [metodo, setMetodo] = useState("farmacia"); // "farmacia" | "qr"
  const [conFactura, setConFactura] = useState(false);
  const [nit, setNit] = useState("");
  const [razon, setRazon] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [ok, setOk] = useState(null); // venta confirmada

  const esCliente = isAuth && actor === "cliente";

  const activarFactura = () => {
    setConFactura(true);
    if (!razon) setRazon(user?.nombre || user?.email || "");
  };

  const confirmar = async () => {
    if (!esCliente) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }
    setProcesando(true);
    try {
      const payload = {
        items: items.map((i) => ({ producto: i.id, cantidad: i.cantidad })),
        metodo_pago: metodo,
        con_factura: conFactura,
        nit_ci: nit || "0",
        razon_social: razon || "S/N",
      };
      const { data } = await tiendaApi.checkout(payload);
      clear();
      setOk(data);
    } catch (err) {
      toast.error("No se pudo completar la reserva", parseApiError(err));
    } finally {
      setProcesando(false);
    }
  };

  // ---- Pantalla de confirmación ----
  if (ok) {
    const pagado = ok.estado === "pagada";
    return (
      <div className="store-page">
        <div className="checkout-done">
          <div className="checkout-done__icon"><Icon name="check" size={34} /></div>
          <h1>¡Reserva confirmada!</h1>
          <p className="text-soft">
            Guarda tu código de retiro. Muéstralo en la farmacia para recoger tus productos.
          </p>
          <div className="checkout-code">
            <span>Código de retiro</span>
            <b>Reserva #{ok.id_venta}</b>
          </div>
          <div className="checkout-done__rows">
            <div><span>Estado</span><b>{pagado ? "Pagada" : "Reservada — pagas al retirar"}</b></div>
            <div><span>Método de pago</span><b>{pagado ? "QR (pagado en línea)" : "Efectivo en farmacia"}</b></div>
            {pagado && ok.pago?.referencia && (
              <div><span>Comprobante de pago</span><b>{ok.pago.referencia}</b></div>
            )}
            <div><span>Total</span><b>{currency(ok.total)}</b></div>
          </div>
          {!pagado ? (
            <p className="checkout-note">
              Acércate a la farmacia, indica tu código <b>#{ok.id_venta}</b> y paga en caja para retirar.
            </p>
          ) : (
            <p className="checkout-note">
              Guarda tu comprobante <b>{ok.pago?.referencia}</b>. Preséntalo junto a tu código
              <b> #{ok.id_venta}</b> al retirar en la farmacia.
            </p>
          )}
          <div className="checkout-done__actions">
            <Link to="/" className="btn btn--primary">Ir al inicio</Link>
            <Link to="/" className="btn btn--ghost">Seguir comprando</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="store-page">
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="empty__icon"><Icon name="cart" size={28} /></div>
          <h4>Tu carrito está vacío</h4>
          <p>Agrega productos del catálogo para reservar.</p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: 14 }}>Ir al catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <div className="cart-head">
        <h1>Confirmar reserva</h1>
        <span className="text-soft">{count} artículo{count === 1 ? "" : "s"}</span>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {/* Resumen de productos */}
          <div className="checkout-section">
            <h3>Tu pedido</h3>
            {items.map((i) => (
              <div key={i.id} className="checkout-line">
                <span>{i.nombre} <em className="text-soft">× {i.cantidad}</em></span>
                <b>{currency(i.precio * i.cantidad)}</b>
              </div>
            ))}
          </div>

          {/* Método de pago */}
          <div className="checkout-section">
            <h3>¿Cómo quieres pagar?</h3>
            <div className="pos-toggle">
              <button type="button" className={`pos-toggle__btn ${metodo === "farmacia" ? "active" : ""}`}
                onClick={() => setMetodo("farmacia")}>
                <Icon name="wallet" size={15} /> Pagar en farmacia
              </button>
              <button type="button" className={`pos-toggle__btn ${metodo === "qr" ? "active" : ""}`}
                onClick={() => setMetodo("qr")}>
                <Icon name="card" size={15} /> Pagar ahora (QR)
              </button>
            </div>
            {metodo === "qr" ? (
              <div className="pos-qr" style={{ marginTop: 14 }}>
                <FakeQR />
                <span className="text-soft" style={{ fontSize: 12 }}>Escanea para pagar (simulado)</span>
              </div>
            ) : (
              <p className="text-soft" style={{ marginTop: 10, fontSize: 13 }}>
                Reservaremos tus productos. Pagas en efectivo al retirar en la farmacia.
              </p>
            )}
          </div>

          {/* Factura */}
          <div className="checkout-section">
            <h3>¿Necesitas factura?</h3>
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
        </div>

        <aside className="cart-summary">
          <h3>Resumen</h3>
          <div className="cart-summary__row">
            <span>Subtotal</span><b>{currency(total)}</b>
          </div>
          <div className="cart-summary__row cart-summary__total">
            <span>Total</span><b>{currency(total)}</b>
          </div>

          {!esCliente && (
            <p className="cart-summary__note">
              Debes <Link to="/login" state={{ from: { pathname: "/checkout" } }}>iniciar sesión</Link> como
              cliente para reservar.
            </p>
          )}

          <button className="btn btn--primary btn--block" onClick={confirmar} disabled={procesando}>
            {procesando ? "Procesando…" : esCliente ? "Confirmar reserva" : "Iniciar sesión y reservar"}
          </button>
          <Link to="/carrito" className="btn btn--ghost btn--block" style={{ marginTop: 8 }}>
            Volver al carrito
          </Link>
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
        (x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4);
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * 10} y={y * 10} width="10" height="10" />);
    }
  }
  return (
    <svg viewBox={`0 0 ${n * 10} ${n * 10}`} width="150" height="150" fill="var(--slate-900)">
      <rect x="0" y="0" width={n * 10} height={n * 10} fill="#fff" />
      {cells}
    </svg>
  );
}
