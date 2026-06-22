import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import logoWeb from "../assets/logo.png";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { initials } from "../utils/format.js";

export default function StoreLayout() {
  const { user, actor, isAuth, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const esCliente = isAuth && actor === "cliente";
  const nombre = user?.email?.split("@")[0] || "Cliente";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="store">
      <header className="store-top">
        <Link to="/" className="store-brand">
          <img src={logoWeb} alt="Farma Center" style={{ height: "38px", objectFit: "contain" }} />
        </Link>

        <nav className="store-nav">
          <NavLink to="/" end className="store-nav__link">Inicio</NavLink>
          <a href="#catalogo" className="store-nav__link">Catálogo</a>
        </nav>

        <div className="store-top__right">
          <Link to="/carrito" className="store-cart-btn" aria-label="Carrito">
            <Icon name="cart" size={20} />
            {count > 0 && <span className="store-cart-btn__badge">{count}</span>}
          </Link>

          {esCliente ? (
            <div ref={ref} className="store-user">
              <button className="store-user__chip" onClick={() => setMenuOpen((v) => !v)}>
                <span className="store-user__avatar">{initials(nombre)}</span>
                <span className="store-user__name">{nombre}</span>
                <Icon name="chevronDown" size={15} />
              </button>
              {menuOpen && (
                <div className="store-user__menu">
                  <div className="store-user__email">{user?.email}</div>
                  <button className="store-user__item" onClick={handleLogout}>
                    <Icon name="logout" size={16} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="store-auth-links">
              <Link to="/login" className="btn btn--ghost btn--sm">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn--primary btn--sm">Crear cuenta</Link>
            </div>
          )}
        </div>
      </header>

      <main className="store-main">
        <Outlet />
      </main>

      <footer className="store-foot">
        © {new Date().getFullYear()} Farma Center · Tu farmacia en línea
      </footer>
    </div>
  );
}
