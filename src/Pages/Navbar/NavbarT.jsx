import React, { useState, useEffect } from "react";
import "./Navbar.css";
import Button from "../../components/button/Button";
import { useNavigate } from "react-router-dom";

const NavbarT = ({ onCollapsedChange }) => {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 576;
            setIsMobile(mobile);
            if (!mobile && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (onCollapsedChange) {
            onCollapsedChange(collapsed);
        }
    }, [collapsed, onCollapsedChange]);

    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cedhi/logout`, {
                method: "POST",
                credentials: "include",
            });
            localStorage.clear();
            navigate("/");
        } catch (error) {
            console.error("Error de red:", error);
            localStorage.clear();
            navigate("/");
        }
    };

    const toggleMenu = () => {
        if (isMobile) {
            setMobileMenuOpen(!mobileMenuOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };

    return (
        <>
            {/* Botón hamburguesa */}
            <button
                className={`mobile-menu-toggle ${((isMobile && mobileMenuOpen) || (!isMobile && collapsed)) ? "active" : ""}`}
                onClick={toggleMenu}
                aria-label={isMobile ? (mobileMenuOpen ? "Cerrar menú" : "Abrir menú") : (collapsed ? "Expandir menú" : "Colapsar menú")}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Navbar principal */}
            <div
                className={`navbar-container 
                    ${collapsed ? "collapsed" : ""} 
                    ${isMobile ? (mobileMenuOpen ? "open" : "hidden") : ""}`}
                onDoubleClick={() => !isMobile && setCollapsed(!collapsed)}
            >
                <div className="navbar-inner-scroll">
                <div className="navbar-main">
                    <div className="navbar-header">
                        <img
                            src="/Wiñay.png"
                            alt="Wiñay XP Logo"
                            className="navbar-logo"
                        />
                    </div>
                    <div className="navbar-buttons">
  <button className="btn white" onClick={() => navigate("/dashboard")}>
    <span>Dashboard</span>
  </button>
  <button className="btn white" onClick={() => navigate("/estudiante")}>
    <span>Estudiantes</span>
  </button>
  <button className="btn white" onClick={() => navigate("/create_estudiante")}>
        <span>Crear estudiantes</span>
    </button>
  <button className="btn white" onClick={() => navigate("/actividad")}>
    <span>Actividad</span>
  </button>
  <button className="btn white" onClick={() => navigate("/create_actividad")}>
    <span>Crear actividad</span>
  </button>
  <button className="btn white" onClick={() => navigate("/asistencia")}>
    <span>Tomar asistencia</span>
  </button>
</div>
                </div>

                <div className="navbar-footer">
                    <div className="navbar-footer-logo">
                        <img
                            src="/CEDHIlogo.png"
                            alt="CEDHI Logo"
                            className="cedhi-logo"
                        />
                    </div>

                    <div className="navbar-user-container">
                        <button className="navbar-photo" onClick={() => alert("Perfil")}>
                            <img
                                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                alt="Foto de perfil"
                            />
                        </button>

                        {(!collapsed || mobileMenuOpen) && (
                            <div className="navbar-footer-text">
                                <button className="navbar-username" onClick={() => alert("Usuario")}>
                                    Tutor
                                </button>
                                <button className="navbar-logout" onClick={handleLogout}>
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div></div>
            </div>
        </>
    );
};

export default NavbarT;