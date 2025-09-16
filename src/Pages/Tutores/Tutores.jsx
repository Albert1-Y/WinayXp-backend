import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import Button from "../../components/button/Button";
import TextField from "../../components/TextField/TextField";
import { useNavigate } from 'react-router-dom';
import "./Tutores.css";

const Tutores = () => {
    const navigate = useNavigate();
    const columns = ["ID", "Nombre", "Apellido", "Email", "DNI", "Acciones"];
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [navbarCollapsed, setNavbarCollapsed] = useState(false);

    // Efecto para escuchar los cambios en el estado del navbar
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

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/MostrarTutores`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                console.log("Tutores recibidos:", data);
                setData(data);
                setFilteredData(data);
            })
            .catch(error => {
                console.error("Error al obtener tutores:", error);
            });
    }, []);

    const handleSearch = () => {
        const filtered = data.filter(tutor =>
            tutor.nombre_persona.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(filtered);
    };

    const handleDelete = (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este tutor?")) {
            fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/DeleteTutores?id_persona=${id}`, {
                method: "DELETE",
                credentials: 'include',
            })
                .then(response => {
                    if (response.ok) {
                        setData(prevData => prevData.filter(tutor => tutor.id !== id));
                        setFilteredData(prevData => prevData.filter(tutor => tutor.id !== id));
                        console.log(`Tutor con ID ${id} eliminado`);
                        alert("SE ELIMINO CORRECTAMENTE")
                    } else {
                        alert("!FALLO!")
                    }
                })
                .catch(error => {
                    console.error("Error al eliminar el tutor:", error);
                });
        }
    };

    const customRender = (column, row) => {
        if (column === "Acciones") {
            return (
                <div className="action-buttons">
                    
                    <button className="action-button" onClick={() => handleDelete(row.id_persona)}>
                        <img
                            src="https://media.istockphoto.com/id/928418914/es/vector/bote-de-basura-basurero-icono-de-la-papelera.jpg?s=612x612&w=0&k=20&c=rBQCvIJdlIUOaYlpEK_86WD3i7wsyLIQ6C1tjYxrTTQ="
                            alt="Eliminar"
                        />
                    </button>
                </div>
            );
        }

        const columnKeyMap = {
            "ID": "id_persona",
            "Nombre": "nombre_persona",
            "Apellido": "apellido",
            "Email": "email",
            "DNI": "dni"
        };

        return row[columnKeyMap[column]];
    };

    return (
        <div className={`tutores-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
            <Navbar />
            <div className="tutores-content">
                <div className="tutores-header">
                    <h1 className="tutores-title">Tutores / Administradores</h1>
                    <Button
                        text="Crear Tutor"
                        styleType="black"
                        onClick={() => navigate("/create_tutores")}
                    />
                </div>

                <div className="actividades-search">
                    <div className="search-container">
                            <div className={"date-field"}>
                                
                            </div>
                                
                    </div>
                </div>

                <div className="tutores-table">
                    <table style={{ width: "100%" }}>
                        <thead>
                            <tr className="table-header">
                                {columns.map((col) => (
                                    <th key={col} className="table-cell">{col}</th>
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

export default Tutores;
