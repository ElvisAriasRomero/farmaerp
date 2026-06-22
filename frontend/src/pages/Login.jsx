import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import HeroChart from "../components/HeroChart.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { parseApiError } from "../services/api.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      const esStaff = u?.is_superuser || u?.is_staff || u?.tipo === "empleado";
      // El personal entra al panel; los clientes a la tienda (o a donde venían).
      const destino = from || (esStaff ? "/panel" : "/");
      navigate(destino, { replace: true });
    } catch (err) {
      setError(parseApiError(err, "Credenciales incorrectas. Verifica tu correo y contraseña."));
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
          <h2>Bienvenido</h2>
          <p className="sub">Ingresa tus credenciales para continuar.</p>

          <form className="auth__form" onSubmit={submit}>
            {error && <div className="auth__error">{error}</div>}

            <div className="field">
              <label className="field__label">Correo electrónico</label>
              <div className="input-with-icon">
                <span className="input-with-icon__icon"><Icon name="mail" size={17} /></span>
                <input
                  className="input"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label">Contraseña</label>
              <div className="input-with-icon">
                <span className="input-with-icon__icon"><Icon name="lock" size={17} /></span>
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <Icon name={showPass ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
            </div>

            <button className="btn btn--primary btn--block" type="submit" disabled={loading}
              style={{ padding: "12px", fontSize: 14.5, marginTop: 4 }}>
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: 13, color: "var(--text-soft)", textAlign: "center" }}>
            ¿Eres cliente nuevo? <Link to="/registro" style={{ color: "var(--brand-700)", fontWeight: 600 }}>Crea tu cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
