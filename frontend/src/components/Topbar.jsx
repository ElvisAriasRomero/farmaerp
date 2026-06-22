import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { initials } from "../utils/format.js";

export default function Topbar({ title, subtitle, onOpenMobile }) {
  const { user, actor, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = user?.email?.split("@")[0] || "Usuario";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <button className="topbar__icon-btn topbar__menu-btn" onClick={onOpenMobile} aria-label="Menú">
        <Icon name="menu" size={20} />
      </button>
      <div className="topbar__title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>

      <div className="topbar__spacer" />

      <button className="topbar__icon-btn topbar__icon-btn--bell" aria-label="Notificaciones">
        <Icon name="bell" size={19} />
        <span className="topbar__dot" />
      </button>

      <div ref={ref} style={{ position: "relative" }}>
        <button className="user-chip" onClick={() => setOpenMenu((v) => !v)}>
          <span className="avatar">{initials(name)}</span>
          <span className="user-chip__meta">
            <b>{name}</b>
            <span>{actor}</span>
          </span>
          <Icon name="chevronDown" size={15} style={{ color: "var(--slate-400)" }} />
        </button>

        {openMenu && (
          <div className="dropdown">
            <div style={{ padding: "8px 11px 10px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--slate-800)" }}>
                {user?.email}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", textTransform: "capitalize" }}>
                {actor}
              </div>
            </div>
            <div className="dropdown__sep" />
            <button className="dropdown__item danger" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
