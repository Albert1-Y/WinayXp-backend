// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';


export function AuthProvider({ children }) {
  const [rol, setRol] = useState(null);       // 'administrador' | 'tutor' | 'estudiante' | null
  const [user, setUser] = useState(null);     // objeto con info de /me
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    const r = await fetch(`${API}/me`, { credentials: 'include' });
    if (r.ok) {
        const me = await r.json();
        setRol(me.rol);            // y lo que necesites
    } else {
        // 401 = no autenticado; 404 = no está en DB
        setRol(null);
    }
  }

  // AuthHandler.jsx (o AuthContext.jsx donde hagas la carga de sesión)
useEffect(() => {
  const loadSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        credentials: 'include',
      });
      if (!res.ok) {
        // 401/403/404 => sin sesión
        setUser(null);
        setRol(null);
        return;
      }
      const data = await res.json();
      setUser(data);
      setRol(data.rol);
    } catch (e) {
      console.error('Error cargando sesión:', e);
      setUser(null);
      setRol(null);
    }
  };
  loadSession();
}, []);

  const value = { rol, setRol, user, setUser, loading, reloadSession: loadSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// (opcional) helper para consumir el contexto
export const useAuth = () => React.useContext(AuthContext);
