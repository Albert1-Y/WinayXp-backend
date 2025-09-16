import React, { useState, useEffect, useContext } from "react";
import Navbar from "../Navbar/Navbar";
import NavbarE from "../Navbar/NavbarE";
import NavbarT from "../Navbar/NavbarT";
import Button from "../../components/button/Button";
import TextField from "../../components/TextField/TextField";
import { useNavigate } from 'react-router-dom';
import "./Actividad.css";
import {AuthContext} from "../../context/AuthContext.jsx";

const Actividades = () => {
    const navigate = useNavigate();
    const [editingActividad, setEditingActividad] = useState(null); // Para almacenar la actividad seleccionada
    const [showEditForm, setShowEditForm] = useState(false);        // Mostrar el formulario de edición
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
                return <Navbar/>;
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
    const handleEditClick = (actividad) => {
        // Guardar una copia completa de la actividad para editar
        setEditingActividad({...actividad});
        setShowEditForm(true);
    };

    const handleSaveActividad = () => {
        // Aseguramos que todos los datos necesarios estén presentes
        const actividadActualizada = {
            ...editingActividad,
            // Convertimos creditos a número si es necesario
            creditos: Number(editingActividad.creditos)
        };

        console.log('Enviando datos para actualizar:', actividadActualizada);

        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/ActulizarActividad`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(actividadActualizada),
        })
            .then(async (response) => {
                if (!response.ok) {
                    // Leer el texto de la respuesta para mejor diagnóstico
                    const errorText = await response.text();
                    console.error("Error respuesta del servidor:", errorText);
                    throw new Error(`Error al actualizar: ${response.status} ${errorText}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("Respuesta exitosa:", data);
                alert("Actividad actualizada exitosamente.");
                // Refrescar los datos o actualizarlos localmente
                setData(prev => prev.map(a => a.id_actividad === actividadActualizada.id_actividad ? actividadActualizada : a));
                setShowEditForm(false);
            })
            .catch((error) => {
                console.error("Error al actualizar actividad:", error);
                alert("Hubo un problema al actualizar. Revisa la consola para más detalles.");
            });
    };

    const columns = ["ID", "Nombre Actividad", "Lugar", "Puntos CEDHI", "Periodo", "Nombre Persona", "Apellido", "Acciones"];
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [data, setData] = useState([]);

    
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/MostrarActividad?fecha_inicio=2025-01-01&fecha_fin=2025-12-31`, {
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
        if (!fechaInicio || !fechaFin) {
        alert("Debes ingresar ambas fechas para buscar actividades.");
        return;
    }
        console.log(`Buscar actividades entre ${fechaInicio} y ${fechaFin}`);
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/MostrarActividad?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => response.json())
        .then(data => {
               if (Array.isArray(data)) {
            console.log("Datos filtrados:", data);
            setData(data);
        } else if (data.errores) {
            console.error("Errores del servidor:", data.errores);
            alert("Hubo un error en la búsqueda. Revisa los filtros ingresados.");
            setData([]); 
        } else {
            console.warn("Respuesta inesperada:", data);
            setData([]);
        }
        })
        .catch(error => {
            console.error("Error al obtener actividades:", error);
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
    const customRender = (column, row) => {
        const columnKeyMap = {
            "ID" : "id_actividad",
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
                    <button className="action-button" onClick={() => handleEditClick(row)}>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCQKSXUQPazM3iiWHvTZs0zXzcgFzYXlJfKQ&s" alt="Editar" />
                    </button>
                    <button className="action-button" onClick={() => handleDelete(row.id_actividad)}>
                        <img src="https://media.istockphoto.com/id/928418914/es/vector/bote-de-basura-basurero-icono-de-la-papelera.jpg?s=612x612&w=0&k=20&c=rBQCvIJdlIUOaYlpEK_86WD3i7wsyLIQ6C1tjYxrTTQ=" alt="Eliminar" />
                    </button>
                </div>
            );
        }

        return row[columnKeyMap[column]];
    };

    return (
        <div className={`actividades-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
            {renderNavbar()}
            <div className="actividades-content">
                <div className="actividades-header">
                    <h1 className="actividades-title">Actividades</h1>
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
                            <div className="input-field">
                                <label htmlFor="nombre_actividad">Nombre de la Actividad:</label>
                                <TextField
                                    id="nombre_actividad"
                                    placeholder="Nombre Actividad"
                                    value={editingActividad.nombre_actividad}
                                    onChange={(e) => setEditingActividad({ ...editingActividad, nombre_actividad: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="lugar">Lugar:</label>
                                <TextField
                                    id="lugar"
                                    placeholder="Lugar"
                                    value={editingActividad.lugar}
                                    onChange={(e) => setEditingActividad({ ...editingActividad, lugar: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="creditos">Puntos CEDHI:</label>
                                <TextField
                                    id="creditos"
                                    placeholder="Puntos CEDHI"
                                    type="number"
                                    value={editingActividad.creditos}
                                    onChange={(e) => setEditingActividad({ ...editingActividad, creditos: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="semestre">Semestre:</label>
                                <TextField
                                    id="semestre"
                                    placeholder="Semestre"
                                    value={editingActividad.semestre}
                                    onChange={(e) => setEditingActividad({ ...editingActividad, semestre: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="fecha_inicio">Fecha de Inicio:</label>
                                <TextField
                                    id="fecha_inicio"
                                    type="datetime-local"
                                    placeholder="Fecha de Inicio"
                                    value={editingActividad.fecha_inicio || ''}
                                    onChange={(e) => setEditingActividad({ ...editingActividad, fecha_inicio: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="fecha_fin">Fecha de Fin:</label>
                                <TextField
                                    id="fecha_fin"
                                    type="datetime-local"
                                    placeholder="Fecha de Fin"
                                    value={editingActividad.fecha_fin || ''}
                                    onChange={(e) => setEditingActividad({ ...editingActividad, fecha_fin: e.target.value })}
                                />
                            </div>
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
                                    <td key={col} className="table-cell">{col}</td>
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

export default Actividades;
