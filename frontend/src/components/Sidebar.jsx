import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import logoMark from "../assets/logo_mark.png";
import logoLight from "../assets/logo_light.png";
import { useAuth } from "../context/AuthContext.jsx";
import { navForActor, groupForPath } from "../config/nav.js";

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { actor } = useAuth();
  const { pathname } = useLocation();
  const entries = navForActor(actor);

  // Grupos abiertos (acordeón con múltiples abiertos permitidos), persistido.
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("farmaerp_groups")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("farmaerp_groups", JSON.stringify(openGroups));
  }, [openGroups]);

  // Abre automáticamente el grupo de la ruta activa.
  useEffect(() => {
    const key = groupForPath(actor, pathname);
    if (key) setOpenGroups((g) => (g[key] ? g : { ...g, [key]: true }));
  }, [pathname, actor]);

  const toggleGroup = (key) => setOpenGroups((g) => ({ ...g, [key]: !g[key] }));

  const renderItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      onClick={onCloseMobile}
    >
      <span className="nav-item__icon">
        <Icon name={item.icon} size={19} />
      </span>
      <span className="nav-item__label">{item.label}</span>
      <span className="nav-item__tip">{item.label}</span>
    </NavLink>
  );

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar__brand" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: collapsed ? "28px 6px" : "44px 16px" }}>
        {collapsed ? (
          <img
            src={logoMark}
            alt="Farma Center"
            style={{ height: "38px", width: "auto", objectFit: "contain" }}
          />
        ) : (
          <img
            src={logoLight}
            alt="Farma Center"
            style={{ width: "100%", maxWidth: "168px", height: "auto", objectFit: "contain" }}
          />
        )}
      </div>

      <nav className="sidebar__nav">
        {entries.map((entry) => {
          if (entry.type === "item") return renderItem(entry);

          // ---- Grupo desplegable ----
          // En modo minimizado (solo escritorio) mostramos los items como iconos.
          if (collapsed && !mobileOpen) {
            return (
              <div className="nav-group" key={entry.key}>
                <div className="nav-group__divider" />
                {entry.items.map(renderItem)}
              </div>
            );
          }

          const isOpen = !!openGroups[entry.key];
          const hasActive = entry.items.some((i) => i.to === pathname);
          return (
            <div className="nav-group" key={entry.key}>
              <button
                type="button"
                className={`nav-group__toggle ${isOpen ? "open" : ""} ${hasActive && !isOpen ? "has-active" : ""}`}
                onClick={() => toggleGroup(entry.key)}
                aria-expanded={isOpen}
              >
                <span className="nav-item__icon">
                  <Icon name={entry.icon} size={19} />
                </span>
                <span className="nav-group__name">{entry.label}</span>
                <span className="nav-group__chevron">
                  <Icon name="chevronDown" size={16} />
                </span>
              </button>
              <div className={`nav-sub ${isOpen ? "open" : ""}`}>
                <div className="nav-sub__inner">{entry.items.map(renderItem)}</div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar__foot">
        <button className="sidebar__collapse" onClick={onToggle} title={collapsed ? "Expandir" : "Minimizar"}>
          <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={18} />
          <span>Minimizar</span>
        </button>
      </div>
    </aside>
  );
}
