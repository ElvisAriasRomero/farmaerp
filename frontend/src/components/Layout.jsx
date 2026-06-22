import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const TITLES = {
  "/panel": ["Dashboard", "Resumen general de la farmacia"],
  "/panel/productos": ["Productos", "Catálogo de medicamentos e insumos"],
  "/panel/categorias": ["Categorías", "Clasificación del catálogo"],
  "/panel/inventario": ["Inventario", "Control de existencias y stock"],
  "/panel/ventas": ["Ventas", "Registro y seguimiento de ventas"],
  "/panel/compras": ["Compras", "Pedidos a proveedores"],
  "/panel/facturas": ["Facturación", "Comprobantes emitidos"],
  "/panel/pagos": ["Pagos", "Cobros y métodos de pago"],
  "/panel/caja": ["Caja", "Apertura y cierre de caja"],
  "/panel/clientes": ["Clientes", "Directorio de clientes"],
  "/panel/proveedores": ["Proveedores", "Directorio de proveedores"],
  "/panel/empleados": ["Empleados", "Gestión del personal"],
  "/panel/prediccion": ["Predicción de demanda", "Análisis predictivo de productos"],
  "/panel/metricas": ["Métricas de ventas", "Indicadores por producto"],
  "/panel/usuarios": ["Usuarios", "Cuentas del sistema"],
  "/panel/roles": ["Roles", "Roles y permisos"],
  "/panel/reportes": ["Reportes", "Reportes generados"],
  "/panel/auditoria": ["Auditoría", "Bitácora de operaciones"],
};

function resolveTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname === "/panel/ventas/nueva")
    return ["Nueva venta", "Registra productos, pago y factura"];
  if (/^\/panel\/ventas\/\d+\/editar$/.test(pathname))
    return ["Editar venta", "Modifica la cabecera y el estado"];
  if (pathname === "/panel/compras/nueva")
    return ["Nueva compra", "Completa la cabecera y agrega los productos"];
  if (/^\/panel\/compras\/\d+\/editar$/.test(pathname))
    return ["Editar compra", "Modifica la cabecera y el estado"];
  return ["FarmaERP", ""];
}

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("farmaerp_sidebar") === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("farmaerp_sidebar", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const [title, subtitle] = resolveTitle(location.pathname);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
      <div className={`main ${collapsed ? "collapsed" : ""}`}>
        <Topbar title={title} subtitle={subtitle} onOpenMobile={() => setMobileOpen(true)} />
        <Outlet />
      </div>
    </div>
  );
}
