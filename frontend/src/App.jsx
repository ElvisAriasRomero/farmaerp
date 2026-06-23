import { Routes, Route, Navigate, Link } from "react-router-dom";
import ProtectedRoute, { StaffRoute } from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import StoreLayout from "./components/StoreLayout.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Home from "./pages/store/Home.jsx";
import Carrito from "./pages/store/Carrito.jsx";
import Checkout from "./pages/store/Checkout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Productos from "./pages/Productos.jsx";
import Categorias from "./pages/Categorias.jsx";
import Lotes from "./pages/Lotes.jsx";
import Inventario from "./pages/Inventario.jsx";
import Ventas from "./pages/Ventas.jsx";
import Reservas from "./pages/Reservas.jsx";
import Compras from "./pages/Compras.jsx";
import VentaForm from "./pages/VentaForm.jsx";
import CompraForm from "./pages/CompraForm.jsx";
import Facturas from "./pages/Facturas.jsx";
import Pagos from "./pages/Pagos.jsx";
import Caja from "./pages/Caja.jsx";
import Clientes from "./pages/Clientes.jsx";
import Proveedores from "./pages/Proveedores.jsx";
import Empleados from "./pages/Empleados.jsx";
import Prediccion from "./pages/Prediccion.jsx";
import Metricas from "./pages/Metricas.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Roles from "./pages/Roles.jsx";
import Reportes from "./pages/Reportes.jsx";
import Auditoria from "./pages/Auditoria.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Tienda (pública / clientes) */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      {/* Panel ERP (empleados / administradores) */}
      <Route
        element={
          <StaffRoute>
            <Layout />
          </StaffRoute>
        }
      >
        <Route path="/panel" element={<Dashboard />} />
        <Route path="/panel/productos" element={<Productos />} />
        <Route path="/panel/categorias" element={<Categorias />} />
        <Route path="/panel/lotes" element={<Lotes />} />
        <Route path="/panel/inventario" element={<Inventario />} />
        <Route path="/panel/ventas" element={<VentaForm />} />
        <Route path="/panel/ventas/registros" element={<Ventas />} />
        <Route path="/panel/ventas/nueva" element={<VentaForm />} />
        <Route path="/panel/ventas/:id/editar" element={<VentaForm />} />
        <Route path="/panel/reservas" element={<Reservas />} />
        <Route path="/panel/compras" element={<Compras />} />
        <Route path="/panel/compras/nueva" element={<CompraForm />} />
        <Route path="/panel/compras/:id/editar" element={<CompraForm />} />
        <Route path="/panel/facturas" element={<Facturas />} />
        <Route path="/panel/pagos" element={<Pagos />} />
        <Route path="/panel/caja" element={<Caja />} />
        <Route path="/panel/clientes" element={<Clientes />} />
        <Route path="/panel/proveedores" element={<Proveedores />} />
        <Route path="/panel/empleados" element={<Empleados />} />
        <Route path="/panel/prediccion" element={<Prediccion />} />
        <Route path="/panel/metricas" element={<Metricas />} />
        <Route path="/panel/usuarios" element={<Usuarios />} />
        <Route path="/panel/roles" element={<Roles />} />
        <Route path="/panel/reportes" element={<Reportes />} />
        <Route path="/panel/auditoria" element={<Auditoria />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: "var(--brand-700)", letterSpacing: -2 }}>404</div>
        <h2 style={{ fontSize: 22, color: "var(--slate-800)", marginBottom: 8 }}>Página no encontrada</h2>
        <p style={{ color: "var(--text-soft)", marginBottom: 22 }}>
          La página que buscas no existe o fue movida.
        </p>
        <Link to="/" className="btn btn--primary">Volver al inicio</Link>
      </div>
    </div>
  );
}
