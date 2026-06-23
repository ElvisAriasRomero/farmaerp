// Estructura del menú lateral del PANEL (rutas bajo /panel).
// type: "item"  -> enlace directo (sin desplegar)
// type: "group" -> grupo desplegable (acordeón) con sub-items
// `roles` controla la visibilidad por actor.
const ALL = ["administrador", "empleado", "cliente"];
const STAFF = ["administrador", "empleado"];
const ADMIN = ["administrador"];

export const NAV = [
  { type: "item", to: "/panel", icon: "dashboard", label: "Dashboard", roles: STAFF, end: true },

  // Accesos directos del día a día (los más usados)
  { type: "item", to: "/panel/ventas", icon: "cart", label: "Ventas", roles: STAFF },
  { type: "item", to: "/panel/compras", icon: "truck", label: "Compras", roles: STAFF },
  { type: "item", to: "/panel/inventario", icon: "box", label: "Inventario", roles: STAFF },

  {
    type: "group",
    key: "catalogo",
    label: "Catálogo",
    icon: "package",
    items: [
      { to: "/panel/productos", icon: "pill", label: "Productos", roles: STAFF },
      { to: "/panel/categorias", icon: "layers", label: "Categorías", roles: STAFF },
      { to: "/panel/lotes", icon: "box", label: "Lotes", roles: STAFF },
    ],
  },
  {
    type: "group",
    key: "operaciones",
    label: "Operaciones",
    icon: "cart",
    items: [
      { to: "/panel/reservas", icon: "clipboard", label: "Reservas", roles: STAFF },
      { to: "/panel/facturas", icon: "receipt", label: "Facturación", roles: STAFF },
      { to: "/panel/pagos", icon: "card", label: "Pagos", roles: STAFF },
    ],
  },
  {
    type: "group",
    key: "directorio",
    label: "Directorio",
    icon: "users",
    items: [
      { to: "/panel/clientes", icon: "user", label: "Clientes", roles: STAFF },
      { to: "/panel/proveedores", icon: "store", label: "Proveedores", roles: STAFF },
      { to: "/panel/empleados", icon: "badge", label: "Empleados", roles: ADMIN },
    ],
  },
  {
    type: "group",
    key: "inteligencia",
    label: "Inteligencia",
    icon: "brain",
    items: [
      { to: "/panel/prediccion", icon: "brain", label: "Predicción", roles: STAFF },
      { to: "/panel/metricas", icon: "chart", label: "Métricas", roles: STAFF },
    ],
  },
  {
    type: "group",
    key: "administracion",
    label: "Administración",
    icon: "settings",
    items: [
      { to: "/panel/usuarios", icon: "users", label: "Usuarios", roles: ADMIN },
      { to: "/panel/roles", icon: "shield", label: "Roles", roles: ADMIN },
    ],
  },

  // Enlaces directos (sin desplegar)
  { type: "item", to: "/panel/caja", icon: "wallet", label: "Caja", roles: STAFF },
  { type: "item", to: "/panel/reportes", icon: "clipboard", label: "Reportes", roles: STAFF },
  { type: "item", to: "/panel/auditoria", icon: "lock", label: "Auditoría", roles: ADMIN },
];

// Filtra por rol y descarta grupos sin items visibles.
export function navForActor(actor) {
  const out = [];
  for (const entry of NAV) {
    if (entry.type === "item") {
      if (entry.roles.includes(actor)) out.push(entry);
    } else {
      const items = entry.items.filter((i) => i.roles.includes(actor));
      if (items.length) out.push({ ...entry, items });
    }
  }
  return out;
}

// Devuelve la key del grupo que contiene una ruta dada (o null).
export function groupForPath(actor, pathname) {
  for (const entry of navForActor(actor)) {
    if (entry.type === "group" && entry.items.some((i) => i.to === pathname)) {
      return entry.key;
    }
  }
  return null;
}
