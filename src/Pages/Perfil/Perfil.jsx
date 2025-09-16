import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./Perfil.css";
import NavbarE from "../Navbar/NavbarE";

const Perfil = () => {
    const { rol } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actividadesRecientes, setActividadesRecientes] = useState([]);
    const [imagenPerfil, setImagenPerfil] = useState(null);
    const [imagenError, setImagenError] = useState(false);

    // Escuchar el cambio de colapso
    useEffect(() => {
        const handleNavbarToggle = (e) => {
            if (e.detail?.collapsed !== undefined) {
                setCollapsed(e.detail.collapsed);
            }
        };

        window.addEventListener('navbarToggle', handleNavbarToggle);
        const navbar = document.querySelector('.navbar-container');
        if (navbar) {
            setCollapsed(navbar.classList.contains('collapsed'));
        }

        return () => window.removeEventListener('navbarToggle', handleNavbarToggle);
    }, []);

    // Cargar datos del estudiante
    useEffect(() => {
        if (rol === "estudiante") {
            const cargarDatosEstudiante = fetch(`${import.meta.env.VITE_API_URL}/cedhi/estudiante/InitEstudiante`, {
                method: 'GET',
                credentials: 'include',
            });

            const cargarActividades = fetch(`${import.meta.env.VITE_API_URL}/cedhi/estudiante/getActividadesAsistidas`, {
                method: 'GET',
                credentials: 'include',
            }).catch(() => ({ json: () => Promise.resolve([]) }));

            Promise.all([cargarDatosEstudiante, cargarActividades])
                .then(async ([resDatos, resActividades]) => {
                    if (!resDatos.ok) {
                        const err = await resDatos.json();
                        throw new Error(err?.msg || "Error al obtener datos");
                    }
                    const [datosEstudiante, actividades] = await Promise.all([
                        resDatos.json(),
                        resActividades.ok ? resActividades.json() : []
                    ]);
                    setDatos(datosEstudiante);
                    setActividadesRecientes(actividades);
                    if (datosEstudiante.nombre_imagen) {
                        setImagenPerfil(datosEstudiante.nombre_imagen);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [rol]);

    const handleImageError = () => setImagenError(true);

    const getNivelInfo = (puntaje) => {
    const puntajesPorNivel = 1000;
    const nivelNumero = Math.min(Math.floor(puntaje / puntajesPorNivel) + 1, 21);

    // Si ya está en el nivel máximo, el progreso es 100%
    const progresoEnNivel = nivelNumero === 21 
        ? 100 
        : ((puntaje % puntajesPorNivel) / puntajesPorNivel) * 100;

    return {
        nivelNumero,
        progresoEnNivel
    };
};

    const getColor = (puntaje) => {
        return "#10B981";
    };

    const renderNavbar = () => {
        if (rol === "estudiante") return <NavbarE onCollapsedChange={setCollapsed} />;
        return null;
    };

    if (rol !== "estudiante") return null;

    return (
        <>
            {renderNavbar()}
            <div className={`perfil-container ${collapsed ? "navbar-collapsed" : ""}`}>
                <div className="perfil-content">
                    {loading ? (
                        <div className="perfil-loading">
                            <img src="/Wiñay.png" alt="Wiñay XP Logo" className="perfil-logo" />
                            <div className="perfil-spinner"></div>
                            <p>Cargando tu perfil...</p>
                        </div>
                    ) : error ? (
                        <div className="perfil-error-container">
                            <img src="/Wiñay.png" alt="Wiñay XP Logo" className="perfil-logo error-logo" />
                            <div className="perfil-error">{error}</div>
                        </div>
                    ) : (
                        <>
                            <div className="perfil-header-logo">
                                <img src="/Wiñay.png" alt="Wiñay XP Logo" className="perfil-logo" />
                                <h1 className="perfil-title">Panel de Estudiante</h1>
                            </div>

                            <div className="perfil-grid">
                                <div className="perfil-card perfil-info-card">
                                    <div className="perfil-header">
                                        <div className="perfil-avatar-container">
                                            <img
                                                src={
                                                    imagenPerfil && !imagenError
                                                        ? `${import.meta.env.VITE_API_URL}/uploads/${imagenPerfil}`
                                                        : datos.imagen_nivel || "/ImagenNiveles/semilla.png"
                                                }
                                                alt="Avatar"
                                                className="perfil-avatar"
                                                onError={handleImageError}
                                            />
                                            <div className="perfil-nivel-badge">{datos.nombre_nivel || "Sin nivel"}</div>
                                        </div>
                                        <div className="perfil-info-principal">
                                            <h1 className="perfil-nombre">{datos.nombre_persona} {datos.apellido}</h1>
                                            <p className="perfil-carrera">{datos.nombre_carrera}</p>
                                            <div className="perfil-nivel-info">
                                                <span className="nivel-actual">{datos.nombre_nivel || "Sin nivel"}</span>
                                                <div className="barra-nivel-container">
                                                    <div className="nivel-barra">
                                                        <div
                                                            className="nivel-progreso"
                                                            style={{
                                                                width: `${getNivelInfo(datos.credito_total).progresoEnNivel}%`,
                                                                backgroundColor: getColor(datos.credito_total)
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="nivel-porcentaje">{(getNivelInfo(datos.credito_total).progresoEnNivel)}%</div>
                                                </div>
                                                <p className="nivel-actual">Nivel actual: {getNivelInfo(datos.credito_total).nivelNumero}</p>
                                                <p className="nivel-descripcion">{datos.descripcion_nivel || ""}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="perfil-datos">
                                        <div className="datos-columna">
                                            <p><span className="datos-etiqueta">Semestre:</span> {datos.semestre}</p>
                                            <p><span className="datos-etiqueta">DNI:</span> {datos.dni}</p>
                                        </div>
                                        <div className="datos-columna">
                                            <p><span className="datos-etiqueta">Email:</span> {datos.email}</p>
                                            <p><span className="datos-etiqueta">Estado:</span> <span className="estado-activo">{datos.rol}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Estadísticas */}
                                <div className="estadisticas-container">
                                    {[
                                        {
                                            titulo: "Puntos",
                                            valor: datos.credito_total || 0,
                                            icono: "⭐",
                                            color: "#F59E0B"
                                        },
                                        {
                                            titulo: "Puntos Disponibles",
                                            valor: datos.cobro_credito || 0,
                                            icono: "💰",
                                            color: "#10B981"
                                        }
                                    ].map((stat, i) => (
                                        <div className="estadistica-card" key={i}>
                                            <div className="estadistica-icono" style={{ backgroundColor: stat.color }}>{stat.icono}</div>
                                            <div className="estadistica-info">
                                                <h3>{stat.titulo}</h3>
                                                <p className="estadistica-valor">{stat.valor}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actividades */}
                                <div className="perfil-card actividades-card">
                                    <h2 className="seccion-titulo">Actividades en las que participaste</h2>
                                    {actividadesRecientes.length > 0 ? (
                                        <div className="actividades-lista">
                                            <table className="perfil-actividades-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Fecha</th>
                                                        <th>Puntos</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {actividadesRecientes.slice(0, 4).map((a, i) => (
                                                        <tr key={i} className="perfil-actividad-item">
                                                            <td>{a.nombre_actividad || 'Sin nombre'}</td>
                                                            <td>{new Date(a.fecha || Date.now()).toLocaleDateString()}</td>
                                                            <td>
                                                                {a.creditos && (
                                                                    <span className="actividad-puntos">+{a.creditos}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-actividades">
                                            <p>No has participado en actividades recientemente</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Perfil;