import React, { useState, useEffect } from "react";
import "./Navbar.css";
import Button from "../../components/button/Button";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onCollapsedChange }) => {
    const navigate = useNavigate();
    const [collapsedDesktop, setCollapsedDesktop] = useState(false);
    const [openMobile, setOpenMobile] = useState(false);
    useEffect(() => {
        if (onCollapsedChange) {
            onCollapsedChange(collapsedDesktop);
        }
    }, [collapsedDesktop, onCollapsedChange]);
    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cedhi/logout`, {
                method: "POST",
                credentials: "include",
            });

            localStorage.clear();
            navigate("/");
        } catch (error) {
            localStorage.clear();
            console.error("Error de red:", error);
            navigate("/");
        }
    };

    const toggleDesktopCollapse = () => {
        setCollapsedDesktop(!collapsedDesktop);
    };

    const toggleMobileMenu = () => {
        setOpenMobile(!openMobile);
    };

    return (
        <>
            {/* Botón hamburguesa solo visible en móviles */}
            <button
                className={`mobile-menu-toggle ${openMobile ? "active" : ""}`}
                onClick={toggleMobileMenu}
                aria-label={openMobile ? "Cerrar menú" : "Abrir menú"}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Navbar responsive */}
            <div
                className={`navbar-container 
                    ${collapsedDesktop ? "collapsed" : ""} 
                    ${openMobile ? "open" : "hidden"}`}
                onDoubleClick={toggleDesktopCollapse}
            >   
             <div className="navbar-inner-scroll">
                <div className="navbar-main">
                    <div className="navbar-header">
                        <img
                            src="/Wiñay.png"
                            alt="Wiñay XP Logo"
                            className="navbar-logo"
                        />
                        <h2></h2>
                    </div>

                    <div className="navbar-buttons">
    <button className="btn white" onClick={() => navigate("/dashboard")}>
        <span>Dashboard</span>
    </button>
    <button className="btn white" onClick={() => navigate("/tutores")}>
        <span>Tutores</span>
    </button>
    <button className="btn white" onClick={() => navigate("/create_tutores")}>
        <span>Crear tutores</span>
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
                    {/* Logo CEDHI */}
                    <div className="navbar-footer-logo">
                        <img
                            src="/CEDHIlogo.png"
                            alt="CEDHI Logo"
                            className="cedhi-logo"
                        />
                    </div>

                    {/* Foto de perfil + logout */}
                    <div className="navbar-user-container">
                        <button className="navbar-photo" onClick={() => alert("Perfil")}>
                            <img
                                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                alt="Foto de perfil"
                            />
                        </button>

                        {!collapsedDesktop && (
                            <div className="navbar-footer-text">
                                <button className="navbar-username" onClick={() => alert("Usuario")}>
                                    Admin
                                </button>
                                <button className="navbar-logout" onClick={handleLogout}>
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
