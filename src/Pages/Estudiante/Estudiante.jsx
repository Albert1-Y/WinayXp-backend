import React, { useEffect, useState, useContext } from "react";
import Navbar from "../Navbar/Navbar";
import NavbarE from "../Navbar/NavbarE";
import NavbarT from "../Navbar/NavbarT";
import Button from "../../components/button/Button";
import TextField from "../../components/TextField/TextField";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import './Estudiante.css';

const Estudiante = () => {
    const { rol } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [navbarCollapsed, setNavbarCollapsed] = useState(false)
    const [showCobrarForm, setShowCobrarForm] = useState(false);
    const [puntosACobrar, setPuntosACobrar] = useState(1);
    const [estudianteACobrar, setEstudianteACobrar] = useState(null);

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
    const handleCobrarPuntos = (id_persona) => {
        let estudiante = filteredData.find(est => est.id_persona === id_persona);

        if (!estudiante) {
            estudiante = data.find(est => est.id_persona === id_persona);
        }
        if (!estudiante) {
            alert("No se encontró el estudiante");
            return;
        }

        // Guardar el estudiante seleccionado y mostrar el formulario
        setEstudianteACobrar(estudiante);
        setPuntosACobrar(1); // Valor inicial
        setShowCobrarForm(true);
    };
    const procesarCobroPuntos = () => {
        // Validaciones básicas
        if (!estudianteACobrar) {
            alert("No se ha seleccionado un estudiante");
            return;
        }

        const puntosNumerico = parseInt(puntosACobrar);
        if (estudianteACobrar.cobro_credito === 0 || estudianteACobrar.cobro_credito === '0') {
            alert("El estudiante no tiene puntos disponibles para cobrar");
            return;
        }
        if (isNaN(puntosNumerico) || puntosNumerico <= 0) {
            alert("Debes ingresar un valor válido mayor a 0");
            return;
        }

        if (puntosNumerico > estudianteACobrar.cobro_credito) {
            alert(`El estudiante solo tiene ${estudianteACobrar.cobro_credito} puntos disponibles`);
            return;
        }

        // Preparar datos para enviar
        const datosACobrar = {
            id_persona: estudianteACobrar.id_persona,
            puntos: puntosNumerico}
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/CobrarPuntos`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(datosACobrar),
        })
            .then((res) => {
                if (res.ok) {
                    alert("Puntos cobrados correctamente.");
                    setShowCobrarForm(false);
                    setEstudianteACobrar(null);
                    setPuntosACobrar(1);
                    window.location.reload();
                } else {
                    alert("Error al cobrar puntos.");
                }
            })
            .catch((err) => {
                console.error("Error en el cobro:", err);
                alert("Error al cobrar puntos.");
            });
    }
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

    const navigate = useNavigate();
    const columns = ["ID","Nombre","DNI", "Email", "Semestre", "Puntos CEDHI", "Acciones"];

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/IntMostrarEstudiantes`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                console.log("Datos iniciales:", data);
                setData(data);
                setFilteredData(data);
            })
            .catch(error => {
                console.error("Error al obtener actividades:", error);
            });
    }, []);


    const handleSearchByDni = () => {
        if (!searchTerm.trim()) {
            alert("Ingresa un DNI para buscar.");
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/DatosEstudiante?dni=${searchTerm}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                console.log("Resultado de búsqueda:", data);
                setFilteredData([data]);

            })
            .catch(error => {
                console.error("Error al buscar estudiante:", error);
            });
    };
    const handleDelete = (id_persona) => {
        if (!window.confirm("¿Seguro que deseas eliminar este estudiante?")) return;

        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/EliminarEstudiante?id_persona=${id_persona}`, {
            method: 'DELETE',
            credentials: 'include',
        })
            .then(response => {
                if (response.ok) {

                    setData(prev => prev.filter(estudiante => estudiante.id_persona !== id_persona));
                    setFilteredData(prev => prev.filter(estudiante => estudiante.id_persona !== id_persona));
                    alert("Estudiante eliminado exitosamente.");
                } else {
                    alert("Error al eliminar estudiante.");
                }
            })
            .catch(error => {
                console.error("Error en la eliminación:", error);
                alert("Error al eliminar estudiante.");
            });
    };
    const getColor = (Puntos_CEDHI) => {
        if (Puntos_CEDHI >= 90) return "#10B981";   // verde
        if (Puntos_CEDHI >= 75) return "#FBBF24";   // amarillo
        return "#EF4444";                      // rojo
    };

    const customRender = (col, row) => {
        switch (col) {
            case "Nombre":
                return `${row.nombre_persona} ${row.apellido}`;
            case "DNI":
                return row.dni;
            case "Email":
                return row.email;
            case "Semestre":
                return row.semestre || "-";
            case "ID":
                return row.id_persona ;
            case "Puntos CEDHI":
                return (
                    <span style={{ color: getColor(row.credito_total ?? 0) }}>
            {row.credito_total ?? 0}
          </span>
                );
            case "Acciones":
                return (
                    <div className="action-buttons">
                        <button className="action-button" onClick={() => {
                            setSelectedStudent(row);
                            setIsEditing(true);
                        }}>
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCQKSXUQPazM3iiWHvTZs0zXzcgFzYXlJfKQ&s"
                                alt="Editar"
                            />
                        </button>
                        <button
                            className="action-button"
                            onClick={() => handleDelete(row.id_persona)}
                        >
                            <img
                                src="https://media.istockphoto.com/id/928418914/es/vector/bote-de-basura-basurero-icono-de-la-papelera.jpg?s=612x612&w=0&k=20&c=rBQCvIJdlIUOaYlpEK_86WD3i7wsyLIQ6C1tjYxrTTQ="
                                alt="Eliminar"
                            />
                        </button>
                        <button
                            className="action-button"
                            onClick={() => handleCobrarPuntos(row.id_persona)}
                        >
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2489/2489756.png"
                                alt="Cobrar Puntos"
                                title="Cobrar Puntos"
                            />
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`estudiantes-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
            {renderNavbar()}
            <div className="estudiantes-content">
                {/* Header */}
                <div className="estudiantes-header">
                    <h1 className="estudiantes-title">Estudiantes</h1>
                    <Button
                        text="Crear Estudiante"
                        styleType="black"
                        onClick={() => navigate("/create_estudiante")}
                    />
                </div>

                {/* Búsqueda + filtros */}
                <div className="actividades-search">
                    <div className="search-container">
                        <div className={"date-field"}>
                            <TextField
                                placeholder="Buscar por DNI"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            text="Buscar"
                            styleType="black"
                            onClick={handleSearchByDni}
                        />
                    </div>
                </div>
                {isEditing && selectedStudent && (
                    <div className="edit-estudiante-container">
                        <h1 className="create-estudiante-title">Editar Estudiante</h1>
                        <h3 className="create-estudiante-subtitle">
                            Modifica los datos del estudiante seleccionado
                        </h3>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();

                                fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/ActulizarEstudiante`, {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                    body: JSON.stringify(selectedStudent),
                                })
                                    .then((res) => {
                                        if (res.ok) {
                                            alert("Estudiante actualizado correctamente.");
                                            setIsEditing(false);
                                            window.location.reload();
                                        } else {
                                            alert("Error al actualizar.");
                                        }
                                    })
                                    .catch((err) => {
                                        console.error("Error en la actualización:", err);
                                        alert("Error en la actualización.");
                                    });
                            }}
                        >
                            <div className="info-container">
                                <h2 className="info-title">Información Personal</h2>
                                <p className="info-subtitle">Actualiza los datos personales del estudiante</p>
                                <div className="info-grid">
                                    <div className="input-field">
                                        <label htmlFor="dni">DNI:</label>
                                        <TextField
                                            id="dni"
                                            placeholder="DNI"
                                            value={selectedStudent.dni}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, dni: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="nombre">Nombre:</label>
                                        <TextField
                                            id="nombre"
                                            placeholder="Nombre"
                                            value={selectedStudent.nombre_persona}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, nombre_persona: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="Apellido">Apellido:</label>
                                        <TextField
                                            placeholder="Apellido"
                                            value={selectedStudent.apellido}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, apellido: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="Correo Electrónico">Correo Electrónico:</label>
                                        <TextField
                                            placeholder="Correo Electrónico"
                                            type="email"
                                            value={selectedStudent.email}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, email: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="Contraseña">Contraseña:</label>
                                        <TextField
                                            placeholder="Contraseña"
                                            type="password"
                                            value={selectedStudent.password || ""}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, password: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="info-container">
                                <h2 className="info-title">Detalles Académicos</h2>
                                <p className="info-subtitle">Actualiza la información académica del estudiante</p>
                                <div className="info-grid">
                                    <div className="input-field">
                                        <label htmlFor="semestre">Semestre:</label>
                                        <TextField
                                            id="semestre"
                                            placeholder="Semestre"
                                            value={selectedStudent.semestre}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, semestre: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="credito">Crédito Total:</label>
                                        <TextField
                                            id="credito"
                                            placeholder="Crédito Total"
                                            type="number"
                                            value={selectedStudent.credito_total}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, credito_total: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="cobro">Cobro Crédito:</label>
                                        <TextField
                                            id="cobro"
                                            placeholder="Cobro Crédito"
                                            type="number"
                                            value={selectedStudent.cobro_credito}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, cobro_credito: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="carrera">Carrera:</label>
                                        <TextField
                                            id="carrera"
                                            placeholder="Carrera"
                                            value={selectedStudent.carrera}
                                            onChange={(e) =>
                                                setSelectedStudent({ ...selectedStudent, carrera: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                                <button type="submit" className="btn-primary">Guardar Cambios</button>
                                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {showCobrarForm && estudianteACobrar && (
                    <div className="cobrar-puntos-container">
                        <h2>Cobrar Puntos</h2>
                        <div className="cobrar-info">
                            <p>
                                Estudiante: <strong>{estudianteACobrar.nombre_persona} {estudianteACobrar.apellido}</strong>
                            </p>
                            <p>
                                Puntos disponibles: <strong>{estudianteACobrar.cobro_credito}</strong>
                            </p>
                        </div>

                        <div className="cobrar-form">
                            <TextField
                                type="number"
                                placeholder="Puntos a cobrar"
                                value={puntosACobrar}
                                onChange={(e) => setPuntosACobrar(e.target.value)}
                                min="1"
                                max={estudianteACobrar.cobro_credito}
                            />

                            <div className="cobrar-buttons">
                                <Button
                                    text="Confirmar Cobro"
                                    styleType="black"
                                    onClick={procesarCobroPuntos}
                                />
                                <Button
                                    text="Cancelar"
                                    styleType="danger"
                                    onClick={() => setShowCobrarForm(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {/* Tabla */}
                <div className="estudiantes-table">
                    <table style={{ width: "100%" }}>
                        <thead>
                        <tr className="table-header">
                            {columns.map((col) => (
                                <th key={col} className="table-cell">
                                    {col}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filteredData.map((row, idx) => (
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

export default Estudiante;
