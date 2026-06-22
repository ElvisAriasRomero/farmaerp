import { Link, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { currency } from "../../utils/format.js";

export default function Carrito() {
  const { items, setQty, remove, total, count } = useCart();
  const { isAuth, actor } = useAuth();
  const navigate = useNavigate();

  const esCliente = isAuth && actor === "cliente";

  const irAPagar = () => {
    if (!esCliente) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }
    navigate("/checkout");
  };

  if (!items.length) {
    return (
      <div className="store-page">
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="empty__icon"><Icon name="cart" size={28} /></div>
          <h4>Tu carrito está vacío</h4>
          <p>Agrega productos del catálogo para comenzar tu compra.</p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: 14 }}>
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <div className="cart-head">
        <h1>Mi carrito</h1>
        <span className="text-soft">{count} artículo{count === 1 ? "" : "s"}</span>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((i) => (
            <div key={i.id} className="cart-item">
              <div className="cart-item__img">
                {i.foto ? (
                  <img src={i.foto} alt={i.nombre} onError={(e) => (e.target.style.display = "none")} />
                ) : (
                  <Icon name="pill" size={26} />
                )}
              </div>
              <div className="cart-item__info">
                <h3>{i.nombre}</h3>
                <span className="text-soft">{currency(i.precio)} c/u</span>
              </div>
              <div className="cart-qty">
                <button onClick={() => setQty(i.id, i.cantidad - 1)} aria-label="Restar">−</button>
                <span>{i.cantidad}</span>
                <button onClick={() => setQty(i.id, i.cantidad + 1)} aria-label="Sumar">+</button>
              </div>
              <div className="cart-item__subtotal">{currency(i.precio * i.cantidad)}</div>
              <button className="cart-item__remove" onClick={() => remove(i.id)} aria-label="Quitar">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h3>Resumen</h3>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <b>{currency(total)}</b>
          </div>
          <div className="cart-summary__row cart-summary__total">
            <span>Total</span>
            <b>{currency(total)}</b>
          </div>

          {!esCliente && (
            <p className="cart-summary__note">
              Debes <Link to="/login" state={{ from: { pathname: "/carrito" } }}>iniciar sesión</Link> como
              cliente para confirmar tu compra.
            </p>
          )}

          <button
            className="btn btn--primary btn--block"
            onClick={irAPagar}
          >
            {esCliente ? "Continuar al pago" : "Iniciar sesión y reservar"}
          </button>
          <Link to="/" className="btn btn--ghost btn--block" style={{ marginTop: 8 }}>
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
