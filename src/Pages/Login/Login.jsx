import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Login.css";
import Table from "../../components/Table/Table";

const Login = () => {
  const navigate = useNavigate();
  const { rol } = useContext(AuthContext);
  const [rankingData, setRankingData] = React.useState([]);
  const [error, setError] = React.useState("");

  // Redirigir si ya hay sesión
  useEffect(() => {
    if (rol === "administrador" || rol === "tutor" || rol === "estudiante") {
      navigate("/dashboard");
    }
  }, [rol, navigate]);

  // Ranking
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/cedhi/login`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => b.credito_total - a.credito_total);
        setRankingData(sorted);
      })
      .catch((err) => console.error("Error al obtener el ranking:", err));
  }, []);

  const columns = ["Pos", "Nombre", "Apellido", "Carrera", "Puntos CEDHI"];
  const customRender = (column, row, index) => {
    switch (column) {
      case "Pos":
        return index + 1;
      case "Nombre":
        return row.nombre;
      case "Apellido":
        return row.apellido;
      case "Carrera":
        return row.carrera;
      case "Puntos CEDHI":
        return row.credito_total;
      default:
        return row[column];
    }
  };

  // 🔑 Google Login (con hint opcional de dominio)
  const domains = (import.meta.env.VITE_ALLOWED_DOMAINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleGoogleLogin = (domain) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const qs = domain ? `?hd=${encodeURIComponent(domain)}` : "";
    window.location.href = `${apiUrl}/auth/google/start${qs}`;
  };

  // Leer errores de la URL (?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const MSGS = {
        missing_params: "Faltan parámetros del proveedor.",
        invalid_state: "La sesión de login expiró. Intenta de nuevo.",
        exchange_failed: "No se pudo completar el intercambio de código.",
        invalid_id_token: "Token inválido. Intenta nuevamente.",
        email_not_verified: "Tu correo de Google no está verificado.",
        not_whitelisted: "Tu correo no está autorizado por la institución.",
        no_persona: "No se pudo crear tu cuenta. Contacta a soporte.",
        db_error: "Error de base de datos. Intenta más tarde.",
        callback_error: "Ocurrió un error al iniciar sesión. Intenta de nuevo.",
      };
      setError(MSGS[err] || "Error desconocido al iniciar sesión.");

      // Limpia el parámetro de la barra de direcciones (no recarga)
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url);
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-grid">
        {/* Caja 1: Login */}
        <div className="login-box">
          <div className="logo-container">
            <img src="/CEDHIlogo.png" alt="CEDHI Logo" className="login-logo" />
          </div>
          <h2>Iniciar Sesión</h2>

          {/* 🔴 Banner de error visible */}
          {error && (
            <div
              style={{
                background: "#fde8e8",
                border: "1px solid #f5c2c7",
                color: "#7f1d1d",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
              role="alert"
              aria-live="assertive"
            >
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "#7f1d1d",
                }}
                aria-label="Cerrar mensaje de error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Botones de Google */}
          {domains.length > 0 ? (
            domains.map((d) => (
              <button
                key={d}
                className="login-button"
                onClick={() => handleGoogleLogin(d)}
                style={{ marginBottom: 8 }}
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google logo"
                  style={{ width: 20, marginRight: 8 }}
                />
                Iniciar sesión con Google (@{d})
              </button>
            ))
          ) : (
            <button className="login-button" onClick={() => handleGoogleLogin()}>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google logo"
                style={{ width: 20, marginRight: 8 }}
              />
              Iniciar sesión con Google
            </button>
          )}
        </div>

        {/* Caja 2: Ranking */}
        <div className="login-box">
          <div className="logo-container">
            <img src="/Wiñay.png" alt="Wiñay Logo" className="login-logo" />
          </div>
          <h2>Ranking de Estudiantes</h2>
          <Table
            columns={columns}
            data={rankingData.slice(0, 10)}
            customRender={customRender}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
