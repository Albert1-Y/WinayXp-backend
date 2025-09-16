import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../Navbar/Navbar";
import NavbarE from "../Navbar/NavbarE";
import NavbarT from "../Navbar/NavbarT";
import "./Dashboard.css";
import Perfil from "../Perfil/Perfil.jsx";

const Dashboard = () => {
    const { rol } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const [semestresCargados, setSemestresCargados] = useState(false);

    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(false);
    const [semestreSeleccionado, setSemestreSeleccionado] = useState(0)
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
// Referencia para el input de archivo
    const fileInputRef = React.useRef(null);

// Efecto para detectar el estado del navbar colapsado


// Estados para datos dinámicos
    const [semestres, setSemestres] = useState([]);
    const [actividadesPorSemestre, setActividadesPorSemestre] = useState([]);
    const [asistentesPorActividad, setAsistentesPorActividad] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        estudiantes: { total: 0, incremento: 0 },
        tutores: { total: 0, incremento: 0 },
        asistencia: { porcentaje: 0, incremento: 0 },
        actividades: { completadas: 0, pendientes: 0 }
    });

// Datos de participantes por carrera
    const participantesPorCarrera = [
        { nombre: "Ingeniería", cantidad: 28 },
        { nombre: "Medicina", cantidad: 15 },
        { nombre: "Derecho", cantidad: 12 },
        { nombre: "Economía", cantidad: 8 },
        { nombre: "Psicología", cantidad: 10 }
    ];

// Función para cargar semestres
    useEffect(() => {
    const obtenerSemestres = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/Semestres`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        setSemestres(data);

        if (data.length > 0) {
            setSemestreSeleccionado(data[0].id_semestre);
            setSemestresCargados(true); 
        }
    };

    obtenerSemestres();
}, []);

// Función para cargar actividades por semestre
    const cargarActividadesPorSemestre = async (idSemestre) => {
        try {
            console.log(idSemestre);
            setLoading(true);
            let url;

            if (idSemestre === "todos") {
                // Esto dependerá de cómo esté implementado tu backend
                // Si admite una petición sin parámetro para traer todas las actividades
                url = `${import.meta.env.VITE_API_URL}/cedhi/admin/ActividadesPorSesmestre`;
            } else {
                url = `${import.meta.env.VITE_API_URL}/cedhi/admin/ActividadesPorSesmestre?id_semestre=${idSemestre}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error al cargar actividades del semestre ${idSemestre}`);
            }

            const data = await response.json();
            console.log(data);
            // Transformar los datos al formato que espera tu componente
            const actividades = data.map(act => ({
                id: act.id_actividad,
                tipo: "Taller", // Esto podría venir del backend
                nombre: act.nombre_actividad,
                fecha: new Date(act.fecha_inicio).toLocaleDateString(),
                estado: "Completada",
                autor: "Sistema",
                semestre: idSemestre === "todos" ? "Varios" : idSemestre,
                participantes: [], // Se llenará cuando se seleccione una actividad
                asistencia_total: Number(act.asistencia_total)
            }));

            setActividadesPorSemestre(actividades);

            // Actualizar estadísticas basadas en las nuevas actividades
            actualizarEstadisticas(actividades);

            setLoading(false);
        } catch (error) {
            console.error(`Error al cargar actividades del semestre ${idSemestre}:`, error);
            setLoading(false);
        }
    };

// Función para cargar asistentes de una actividad
    const cargarAsistentesPorActividad = async (idActividad) => {
        if (!idActividad) return;

        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/AsistenciaActividad?id_actividad=${idActividad}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error al cargar asistentes de la actividad ${idActividad}`);
            }

            const data = await response.json();

            // Transformar los datos de asistentes al formato esperado
            const asistentes = data.map(asistente => ({
                dni: asistente.dni || "Sin DNI",
                nombre: `${asistente.nombre_persona || "Sin nombre"} ${asistente.apellido || ""}`.trim(),
                carrera: asistente.carrera || "No especificada",
                semestre: asistente.semestre || "N/A",
                fecha_asistencia: asistente.fecha_asistencia || null
            }));

            setAsistentesPorActividad(asistentes);

            // Actualizar la actividad seleccionada con sus participantes
            setActividadSeleccionada({
                ...actividadSeleccionada,
                participantes: asistentes
            });

            setLoading(false);
        } catch (error) {
            console.error(`Error al cargar asistentes de la actividad ${idActividad}:`, error);
            setLoading(false);
        }
    };
    const handleDownloadActividades = async () => {
        try {
            setLoading(true);
            // Usar el id del semestre seleccionado como parámetro de consulta
            const url = `${import.meta.env.VITE_API_URL}/cedhi/admin/exportarExcelActividades?id_semestre=${semestreSeleccionado}`;

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'

            });

            if (!response.ok) {
                throw new Error('Error al descargar el archivo Excel de actividades');
            }

            // Obtener el blob de la respuesta
            const blob = await response.blob();

            // Crear un objeto URL para el blob
            const fileURL = window.URL.createObjectURL(blob);

            // Crear un enlace temporal para la descarga
            const fileLink = document.createElement('a');
            fileLink.href = fileURL;

            // Obtener el nombre de archivo de los headers o usar uno predeterminado
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'actividades.xlsx';

            if (contentDisposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            fileLink.setAttribute('download', filename);
            document.body.appendChild(fileLink);
            fileLink.click();
            document.body.removeChild(fileLink);

            // Liberar el objeto URL
            window.URL.revokeObjectURL(fileURL);
            setLoading(false);
        } catch (error) {
            console.error("Error al descargar actividades:", error);
            alert("Error al descargar el archivo Excel de actividades");
            setLoading(false);
        }
    };

// Función para descargar alumnos en Excel
    const handleDownloadAlumnos = async () => {
        try {
            setLoading(true);
            // Usar el id del semestre seleccionado como parámetro de consulta
            const url = `${import.meta.env.VITE_API_URL}/cedhi/admin/exportarExcelEstudiantes?id_semestre=${semestreSeleccionado}`;

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al descargar el archivo Excel de estudiantes');
            }

            // Obtener el blob de la respuesta
            const blob = await response.blob();

            // Crear un objeto URL para el blob
            const fileURL = window.URL.createObjectURL(blob);

            // Crear un enlace temporal para la descarga
            const fileLink = document.createElement('a');
            fileLink.href = fileURL;

            // Obtener el nombre de archivo de los headers
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'estudiantes.xlsx';

            if (contentDisposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            fileLink.setAttribute('download', filename);
            document.body.appendChild(fileLink);
            fileLink.click();
            document.body.removeChild(fileLink);

            // Liberar el objeto URL
            window.URL.revokeObjectURL(fileURL);
            setLoading(false);
        } catch (error) {
            console.error("Error al descargar estudiantes:", error);
            alert("Error al descargar el archivo Excel de estudiantes");
            setLoading(false);
        }
    };

// Función para manejar la subida de un archivo Excel
    const handleUploadExcel = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

// Función para descargar plantilla de Excel
    const handleDownloadPlantilla = async () => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_URL}/cedhi/admin/descargar-plantilla`;

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error al descargar la plantilla Excel');
            }

            // Obtener el blob de la respuesta
            const blob = await response.blob();

            // Crear un objeto URL para el blob
            const fileURL = window.URL.createObjectURL(blob);

            // Crear un enlace temporal para la descarga
            const fileLink = document.createElement('a');
            fileLink.href = fileURL;

            // Obtener el nombre de archivo de los headers o usar uno predeterminado
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'plantilla_actividades.xlsx';

            if (contentDisposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            fileLink.setAttribute('download', filename);
            document.body.appendChild(fileLink);
            fileLink.click();
            document.body.removeChild(fileLink);

            // Liberar el objeto URL
            window.URL.revokeObjectURL(fileURL);
            setLoading(false);
        } catch (error) {
            console.error("Error al descargar la plantilla:", error);
            alert("Error al descargar la plantilla Excel");
            setLoading(false);
        }
    };

// Función para procesar el archivo seleccionado
    const handleFileChange = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id_semestre', semestreSeleccionado);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/excel`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir el archivo Excel');
            }

            const data = await response.json();
            alert(data.mensaje || 'Archivo Excel procesado correctamente');

            // Recargar datos después de la importación exitosa
            cargarActividadesPorSemestre(semestreSeleccionado);
        } catch (error) {
            console.error("Error al subir Excel:", error);
            alert("Error al procesar el archivo Excel");
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

// Función para actualizar estadísticas basadas en las actividades cargadas
    const actualizarEstadisticas = (actividades) => {
        if (!actividades || actividades.length === 0) {
            return;
        }

        // Calcular actividades completadas y pendientes
        const fechaActual = new Date();
        const completadas = actividades.filter(act => new Date(act.fecha) < fechaActual).length;
        const pendientes = actividades.length - completadas;

        // Calcular total de estudiantes (suma de asistentes en todas las actividades)
        const totalEstudiantes = actividades.reduce((total, act) =>
            total + (parseInt(act.asistencia_total) || 0), 0);

        // Calcular porcentaje de asistencia (total de asistentes / capacidad esperada)
        const capacidadTotal = actividades.length * 30;
        const porcentajeAsistencia = capacidadTotal > 0
            ? Math.round((totalEstudiantes / capacidadTotal) * 100)
            : 0;

        setEstadisticas({
            estudiantes: { total: totalEstudiantes, incremento: 5 }, // El incremento podría ser dinámico
            tutores: { total: 12, incremento: 2 }, // Esto podría venir del backend
            asistencia: { porcentaje: porcentajeAsistencia, incremento: 2 },
            actividades: { completadas, pendientes }
        });
    };

// Efecto para cargar semestres al iniciar


    useEffect(() => {
    if (semestresCargados && semestreSeleccionado !== null) {
        cargarActividadesPorSemestre(semestreSeleccionado);
    }
}, [semestresCargados, semestreSeleccionado]);

    useEffect(() => {
        if (actividadSeleccionada?.id) {
            cargarAsistentesPorActividad(actividadSeleccionada.id);
        }
    }, [actividadSeleccionada?.id]);

    const handleChangeSemestre = (e) => {
    const nuevo = Number(e.target.value);

    if (nuevo === semestreSeleccionado) {
        
        cargarActividadesPorSemestre(nuevo);
        setActividadSeleccionada(null);
        setAsistentesPorActividad([]);
    } else {
        setSemestreSeleccionado(nuevo); // dispara el useEffect
    }
};

    const handleSelectActividad = (actividad) => {
        setActividadSeleccionada(actividad);
    };

    const getParticipantesPorCarrera = () => {
        if (!actividadSeleccionada) return [];

        const carrerasMap = {};

        actividadSeleccionada.participantes.forEach(participante => {
            if (!carrerasMap[participante.carrera]) {
                carrerasMap[participante.carrera] = {
                    nombre: participante.carrera,
                    cantidad: 0,
                    color: getCarreraColor(participante.carrera)
                };
            }
            carrerasMap[participante.carrera].cantidad++;
        });

        return Object.values(carrerasMap);
    };

    const getCarreraColor = (carreraNombre) => {
        const coloresCarrera = {
            "Ingeniería": "hsl(200, 70%, 60%)",
            "Medicina": "hsl(350, 70%, 60%)",
            "Derecho": "hsl(120, 70%, 60%)",
            "Economía": "hsl(40, 70%, 60%)",
            "Psicología": "hsl(280, 70%, 60%)",
        };

        return coloresCarrera[carreraNombre] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    };

    const getActividadColor = (index) => {
        const coloresPastel = [
            "#FF6384", // Rosa
            "#36A2EB", // Azul
            "#FFCE56", // Amarillo
            "#4BC0C0", // Verde azulado
            "#9966FF", // Púrpura
            "#FF9F40", // Naranja
            "#8AC54A", // Verde lima
            "#EA526F", // Rosa oscuro
            "#00A6B4", // Azul verdoso
            "#6D78AD"  // Azul grisáceo
        ];
        return coloresPastel[index % coloresPastel.length];
    };

    const calcularEstadisticasActividades = () => {
        if (!actividadesPorSemestre || actividadesPorSemestre.length === 0) return [];

        return actividadesPorSemestre.map((actividad, index) => ({
            id: actividad.id,
            nombre: actividad.nombre,
            tipo: actividad.tipo,
            cantidadParticipantes: actividad.asistencia_total,
            color: getActividadColor(index),
            semestre: actividad.semestre
        }));
    };

    const calcularTotalParticipantes = () => {
        return actividadesPorSemestre.reduce(
            (total, actividad) => total + actividad.asistencia_total,
            0
        );
    };

    const generarSectoresCirculares = () => {
        const estadisticas = calcularEstadisticasActividades();
        if (estadisticas.length === 0) return null;

        const totalParticipantes = calcularTotalParticipantes();
        let anguloAcumulado = 0;

        let conicGradient = '';
        estadisticas.forEach((act, index) => {
            const porcentaje = (act.cantidadParticipantes / totalParticipantes) * 100;
            const anguloInicio = anguloAcumulado;
            anguloAcumulado += 3.6 * porcentaje; // 3.6 grados por cada 1%

            if (index === 0) {
                conicGradient = `${act.color} 0deg ${anguloAcumulado}deg`;
            } else {
                conicGradient += `, ${act.color} ${anguloInicio}deg ${anguloAcumulado}deg`;
            }
        });

        return conicGradient;
    };

    const renderNavbar = () => {
        console.log("rpoool")
        console.log(rol)
        switch (rol) {
            case "administrador":
                return <Navbar onCollapsedChange={setCollapsed} />;
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

    const icons = {
        estudiantes: "👨‍🎓",
        tutores: "👨‍🏫",
        asistencia: "📋",
        actividad: "📝",
        completadas: "✅",
        pendientes: "⏳"
    };


    const getIncrementoColor = (incremento) => incremento >= 0 ? "dashboard-incremento-positivo" : "dashboard-incremento-negativo";

    if (rol === "estudiante") {
        return (
            <div className="dashboard-container">
                {renderNavbar()}
                <Perfil/>
            </div>
        );
    } else {
        return (
            <div className="dashboard-container">
                {renderNavbar()}
                <div className={`dashboard-content ${collapsed ? 'navbar-collapsed' : ''}`}>
                    <div className="dashboard-header">
                        <h1 className="dashboard-title">Wiñay XP</h1>
                        <div className="dashboard-fecha">
                            <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="dashboard-tabs">
                        <button
                            className={`dashboard-tab ${activeTab === "general" ? "active" : ""}`}
                            onClick={() => setActiveTab("general")}
                        >
                            General
                        </button>
                        <button
                            className="dashboard-tab dashboard-download-btn"
                            onClick={() => handleDownloadActividades()}
                        >
                            Descargar Actividades
                        </button>
                        <button
                            className="dashboard-tab dashboard-download-btn"
                            onClick={() => handleDownloadAlumnos()}
                        >
                            Descargar Alumnos
                        </button>
                        <button
                            className="dashboard-tab dashboard-download-btn"
                            onClick={() => handleUploadExcel()}
                        >
                            Subir Plantilla Excel
                        </button>
                        <button
                            className="dashboard-tab dashboard-download-btn"
                            onClick={() => handleDownloadPlantilla()}
                        >
                            Descargar Plantilla Excel
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept=".xlsx,.xls"
                        />
                    </div>

                    <div className="dashboard-main">
                        {loading ? (
                            <div className="dashboard-loading">
                                <div className="dashboard-spinner"></div>
                                <p>Cargando datos...</p>
                            </div>
                        ) : (
                            <>
                                <div className="dashboard-secondary-row">
                                    <div className="dashboard-actividades-recientes">
                                        <div className="dashboard-card-header">
                                            <h3>Actividades Recientes</h3>
                                            <div className="dashboard-filters">
                                                <label htmlFor="filtroSemestre">Periodo:</label>
                                                <select
                                                    id="filtroSemestre"
                                                    value={semestreSeleccionado}
                                                    onChange={handleChangeSemestre}
                                                    className="dashboard-select"
                                                >
                                                    {semestres.map((semestre) => (
                                                        <option key={semestre.id_semestre} value={semestre.id_semestre}>
                                                            {semestre.semestre === "todos" ? "Todos" : `Periodo ${semestre.semestre}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="dashboard-card-body">
                                            <div className="tabla-con-scroll">
                                                {actividadesPorSemestre.length > 0 ? (
                                                    <table className="actividades-table">
                                                        <thead>
                                                        <tr>
                                                            <th>Tipo</th>
                                                            <th>Nombre</th>
                                                            <th>Fecha</th>
                                                            <th>Autor</th>
                                                            <th>Participantes</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {actividadesPorSemestre.map(actividad => (
                                                            <tr
                                                                key={actividad.id}
                                                                className={actividadSeleccionada?.id === actividad.id ? "actividad-seleccionada" : ""}
                                                                onClick={() => handleSelectActividad(actividad)}
                                                            >
                                                                <td>
                                                                    <span className={`tipo-badge tipo-${actividad.tipo.toLowerCase()}`}>
                                                                        {actividad.tipo}
                                                                    </span>
                                                                </td>
                                                                <td>{actividad.nombre}</td>
                                                                <td>{actividad.fecha}</td>


                                                                <td>{actividad.autor}</td>
                                                                <td>{actividad.asistencia_total}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="no-actividades">
                                                        <p>No hay actividades para el semestre seleccionado</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dashboard-columna-izquierda">
                                        {/* Actividades recientes */}
                                        <div className="dashboard-actividades-recientes">
                                            {/* contenido de Actividades */}
                                        </div>

                                        {/* Estudiantes asistentes */}
                                        <div className="dashboard-actividades-recientes">
                                            <div className="dashboard-card-header">
                                                <h3>Estudiantes Asistentes</h3>
                                                {actividadSeleccionada && (
                                                    <p style={{ marginTop: "0.25rem", color: "#555" }}>
                                                        Actividad: <strong>{actividadSeleccionada.nombre}</strong>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="dashboard-card-body">
                                                {actividadSeleccionada && asistentesPorActividad.length > 0 ? (
                                                    <div className="tabla-con-scroll">
                                                        <table className="actividades-table">
                                                            <thead>
                                                            <tr>
                                                                <th>Nombre</th>
                                                                <th>DNI</th>
                                                                <th>Carrera</th>
                                                                <th>semestre</th>
                                                                <th>Fecha de Asistencia</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {asistentesPorActividad.map((asistente, index) => (
                                                                <tr key={index}>
                                                                    <td>{asistente.nombre}</td>
                                                                    <td>{asistente.dni}</td>
                                                                    <td>{asistente.carrera}</td>
                                                                    <td>{asistente.semestre}</td>
                                                                    <td>{new Date(asistente.fecha_asistencia).toLocaleString('es-PE')}</td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="no-actividades">
                                                        <p>
                                                            {actividadSeleccionada
                                                                ? "No hay asistentes registrados para esta actividad."
                                                                : "Selecciona una actividad para ver los asistentes."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>





                                    {/* Gráfico circular simplificado de participantes por actividad */}
                                    <div className="dashboard-grafico-container">
                                        <div className="dashboard-card-header">
                                            <h3>
                                                Distribución de Participantes

                                            </h3>
                                            <span className="actividad-detalles">
                                            {calcularTotalParticipantes()} estudiantes en total
                                        </span>
                                        </div>
                                        <div className="dashboard-card-body">
                                            {actividadesPorSemestre.length === 0 ? (
                                                <div className="no-actividad-seleccionada">
                                                    <div className="mensaje-seleccion">
                                                        <span className="icono-seleccion">📊</span>
                                                        <p>No hay actividades para mostrar en este semestre</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grafico-container-centrado">
                                                    {/* Gráfico circular mejorado */}
                                                    <div className="grafico-circular-container">
                                                        <div
                                                            className="grafico-circular"
                                                            style={{
                                                                background: `conic-gradient(${generarSectoresCirculares()})`
                                                            }}
                                                        >
                                                            <div className="circulo-centro">
                                                                <span className="circulo-total">{calcularTotalParticipantes()}</span>
                                                                <span className="circulo-label">Total</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Mini leyenda simplificada */}
                                                    <div className="grafico-mini-leyenda">
                                                        {calcularEstadisticasActividades().map((actividad, index) => (
                                                            <div className="mini-leyenda-item" key={actividad.id}>
                                                            <span
                                                                className="mini-leyenda-color"
                                                                style={{ backgroundColor: actividad.color }}
                                                            ></span>
                                                                <span className="mini-leyenda-nombre">{actividad.nombre}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>



                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }
};

// Función para descargar actividades en Excel

export default Dashboard;

