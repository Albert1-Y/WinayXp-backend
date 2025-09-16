import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import NavbarE from "../Navbar/NavbarE";
import NavbarT from "../Navbar/NavbarT";
import Button from "../../components/button/Button";
import TextField from "../../components/TextField/TextField";
import "./Asistencia.css";
import { AuthContext } from "../../context/AuthContext";
const Asistencia = () => {
    const [editingActividad, setEditingActividad] = useState(null); // Para almacenar la actividad seleccionada
    const [showEditForm, setShowEditForm] = useState(false);
    const navigate = useNavigate();
    const { rol } = useContext(AuthContext);
    const [navbarCollapsed, setNavbarCollapsed] = useState(false);

    // Efecto para detectar el estado del navbar colapsado
    useEffect(() => {
        const handleNavbarChange = () => {
            // Verificamos si existe un elemento con la clase .navbar-container.collapsed
            const collapsedNavbar = document.querySelector('.navbar-container.collapsed');
            setNavbarCollapsed(!!collapsedNavbar);
        };

        // Observamos cambios en el DOM para detectar cuando el navbar cambia
        const observer = new MutationObserver(handleNavbarChange);
        observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

        // Verificación inicial
        handleNavbarChange();

        return () => {
            observer.disconnect();
        };
    }, []);

    const renderNavbar = () => {
        switch (rol) {
            case "administrador":
                return <Navbar />;
            case "estudiante":
                return <NavbarE />;
            case "tutor":
                return <NavbarT />;
            default:
                alert("Tu sesión ha expirado");
                localStorage.clear();
                navigate("/");
                return null;
        }
    };
    const columns = ["ID Actividad", "Nombre Actividad", "Lugar", "Puntos CEDHI", "Periodo", "Nombre Persona", "Apellido", "Acciones"];
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [data, setData] = useState([]);
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fecha = `${anio}-${mes}-${dia}`;


    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/MostrarActividad?fecha_inicio=${fecha}&fecha_fin=${fecha}`, {
            method: 'GET',
            credentials: 'include',  // Incluye las cookies en la solicitud
        })
            .then(response => response.json())
            .then(data => {
                console.log("Datos iniciales:", data);
                setData(data);
            })
            .catch(error => {
                console.error("Error al obtener actividades:", error);
            });
    }, []);
    const handleSearch = () => {
        // Validación de fechas
        if (!fechaInicio || !fechaFin) {
            alert("Por favor, ingrese ambas fechas para realizar la búsqueda");
            return;
        }

        // Validar que la fecha final no sea anterior a la fecha inicial
        if (new Date(fechaFin) < new Date(fechaInicio)) {
            alert("La fecha final no puede ser anterior a la fecha inicial");
            return;
        }

        console.log(`Buscar actividades entre ${fechaInicio} y ${fechaFin}`);

        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/MostrarActividad?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log("Datos filtrados:", data);
                setData(data);

                // Mensaje informativo si no hay resultados
                if (data.length === 0) {
                    alert('No se encontraron actividades para el rango de fechas seleccionado');
                }
            })
            .catch(error => {
                console.error("Error al obtener actividades:", error);
                alert("Ocurrió un error al buscar las actividades. Por favor intente nuevamente.");
            });
    };
    const handleDelete = (id) => {

        alert("¡Estás a punto de eliminar esta actividad!");


        if (window.confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
            fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/EliminarActividad?id_actividad=${id}`, {
                method: "DELETE",
                credentials: 'include',
            })
                .then(response => {
                    if (response.ok) {

                        setData(prevData => prevData.filter(item => item.id_actividad !== id));
                        console.log(`Actividad con ID ${id} eliminada`);
                    } else {
                        console.error("Error al eliminar la actividad");
                    }
                })
                .catch(error => {
                    console.error("Error al eliminar la actividad:", error);
                });
        }
    };
    const handleSaveActividad = () => {
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/ActualizarActividad`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(editingActividad),
        })
            .then((response) => {
                if (!response.ok) throw new Error("Error al actualizar");
                return response.json();
            })
            .then(() => {
                alert("Actividad actualizada exitosamente.");
                // Refrescar los datos o actualizarlos localmente
                setData(prev => prev.map(a => a.id_actividad === editingActividad.id_actividad ? editingActividad : a));
                setShowEditForm(false);
            })
            .catch((error) => {
                console.error("Error al actualizar actividad:", error);
                alert("Hubo un problema al actualizar.");
            });
    };
    const handleEditClick = (actividad) => {
        setEditingActividad(actividad);
        setShowEditForm(true);
    };
    const customRender = (column, row) => {
        const columnKeyMap = {
            "ID Actividad": "id_actividad",
            "Nombre Actividad": "nombre_actividad",
            "Lugar": "lugar",
            "Puntos CEDHI": "creditos",
            "Periodo": "semestre",
            "Nombre Persona": "nombre_persona",
            "Apellido": "apellido"
        };

        if (column === "Acciones") {
            return (
               <div className="action-buttons">
                   <button className="action-button" onClick={() => navigate("/tomar-asistencia", { state: { actividad: row } })}>
                        <img src="/Listados.png" alt="Lista" />
                   </button>
                </div>
            );
        }

        return row[columnKeyMap[column]];
    };

    return (
        <div className={`actividades-container asistencia-page ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
            {renderNavbar()}
            <div className="actividades-content">
                <div className="actividades-header">
                    <h1 className="actividades-title">Actividades en curso</h1>
                    <Button text="Crear Actividad" styleType="black" onClick={() => navigate("/create_actividad")} />
                </div>
                <div className="actividades-search">
                    <div className="search-container">
                        <div className="date-field">
                            <label>Fecha Inicio</label>
                            <TextField
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div className="date-field">
                            <label>Fecha Fin</label>
                            <TextField
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                        <Button text="Buscar" styleType="black" onClick={handleSearch} />
                    </div>
                </div>
                {showEditForm && (
                    <div className="info-container">
                        <h2>Editar Actividad</h2>
                        <div className={"info-grid"}>
                            <TextField
                                placeholder="Nombre Actividad"
                                value={editingActividad.nombre_actividad}
                                onChange={(e) => setEditingActividad({ ...editingActividad, nombre_actividad: e.target.value })}
                            />
                            <TextField
                                placeholder="Lugar"
                                value={editingActividad.lugar}
                                onChange={(e) => setEditingActividad({ ...editingActividad, lugar: e.target.value })}
                            />
                            <TextField
                                placeholder="Puntos CEDHI"
                                type="number"
                                value={editingActividad.creditos}
                                onChange={(e) => setEditingActividad({ ...editingActividad, creditos: e.target.value })}
                            />
                            <TextField
                                placeholder="Semestre"
                                value={editingActividad.semestre}
                                onChange={(e) => setEditingActividad({ ...editingActividad, semestre: e.target.value })}
                            />
                            <Button
                                text="Guardar Cambios"
                                styleType="black"
                                onClick={handleSaveActividad}
                            />
                            <Button
                                text="Cancelar"
                                styleType="danger"
                                onClick={() => setShowEditForm(false)}
                            />
                        </div>
                    </div>
                )}
                <div className="actividades-table">
                    <table style={{ width: "100%" }}>
                        <thead>
                        <tr className="table-header">
                            {columns.map((col) => (
                                <th key={col} className="table-cell">{col}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="table-row">
                                {columns.map((col) => (
                                    <td key={col} className="table-cell">
                                        {customRender(col, row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default Asistencia;
