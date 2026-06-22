import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import HeroChart from "../components/HeroChart.jsx";
import { authApi, parseApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await authApi.registroCliente(form);
      // Auto-login y entrar a la tienda
      await login(form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(parseApiError(err, "No se pudo completar el registro."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__hero">
        <HeroChart />
      </div>

      <div className="auth__form-wrap">
        <div className="auth__card">
          <h2>Crear cuenta de cliente</h2>
          <p className="sub">Completa tus datos para registrarte.</p>

          <form className="auth__form" onSubmit={submit}>
            {error && <div className="auth__error">{error}</div>}

            <div className="field">
              <label className="field__label">Nombre completo</label>
              <input className="input" placeholder="Ej. Juan Pérez" value={form.nombre} onChange={set("nombre")} required autoFocus />
            </div>

            <div className="field">
              <label className="field__label">Correo electrónico</label>
              <input className="input" type="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={set("email")} required />
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field__label">Teléfono</label>
                <input className="input" placeholder="700-00000" value={form.telefono} onChange={set("telefono")} />
              </div>
              <div className="field">
                <label className="field__label">Dirección</label>
                <input className="input" placeholder="Calle / Zona" value={form.direccion} onChange={set("direccion")} />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field__label">Contraseña</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
              </div>
              <div className="field">
                <label className="field__label">Confirmar contraseña</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password_confirm} onChange={set("password_confirm")} required />
              </div>
            </div>

            <button className="btn btn--primary btn--block" type="submit" disabled={loading} style={{ padding: "12px", fontSize: 14.5, marginTop: 4 }}>
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: 13, color: "var(--text-soft)", textAlign: "center" }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: "var(--brand-700)", fontWeight: 600 }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
