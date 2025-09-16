import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AuthCallback = () => {
  const { setRol } = useContext(AuthContext);
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const code = query.get("code");
    const state = query.get("state");

    const finish = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("No se pudo completar el inicio de sesión");
        const data = await res.json(); // { rol, ... }
        setRol(data.rol);
        navigate("/dashboard");
      } catch (e) {
        console.error(e);
        navigate("/"); // vuelve al login en caso de error
      }
    };

    if (code && state) finish();
    else navigate("/");

  }, [query, navigate, setRol]);

  return <p style={{ padding: 24 }}>Procesando inicio de sesión…</p>;
};

export default AuthCallback;
