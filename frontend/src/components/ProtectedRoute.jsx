import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Loader() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="loading-block">
        <div className="spinner" />
        <span>Cargando…</span>
      </div>
    </div>
  );
}

/** Requiere sesión iniciada (cualquier rol). */
export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/** Requiere ser personal de la farmacia (empleado o administrador).
 *  Los clientes son enviados a la tienda. */
export function StaffRoute({ children }) {
  const { isAuth, actor, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;
  if (actor === "cliente") return <Navigate to="/" replace />;
  return children;
}
