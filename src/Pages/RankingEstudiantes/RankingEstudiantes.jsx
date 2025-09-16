import React, { useEffect, useState } from "react";
import NavbarE from "../Navbar/NavbarE";
import Table from "../../components/Table/Table";
import "../Estudiante/Estudiante.css";

const RankingEstudiantes = () => {
    const [rankingData, setRankingData] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const columns = ["Pos", "Nombre", "Apellido", "Carrera", "Puntos"];

    useEffect(() => {
        // Usar el nuevo endpoint TopEstudiantesCarrera
        fetch(`${import.meta.env.VITE_API_URL}/cedhi/estudiante/TopEstudinatesCarrera`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                // Asumimos que los datos ya vienen ordenados del backend
                setRankingData(data);
            })
            .catch(error => {
                console.error("Error al obtener el ranking:", error);
            });
    }, []);

    useEffect(() => {
        const handleNavbarToggle = (e) => {
            if (e.detail && e.detail.collapsed !== undefined) {
                setCollapsed(e.detail.collapsed);
            }
        };
        window.addEventListener('navbarToggle', handleNavbarToggle);
        // Estado inicial
        const navbarElement = document.querySelector('.navbar-container');
        if (navbarElement) {
            setCollapsed(navbarElement.classList.contains('collapsed'));
        }
        return () => window.removeEventListener('navbarToggle', handleNavbarToggle);
    }, []);

    const customRender = (column, row, index) => {
        switch (column) {
            case "Pos":
                return (
                    <span style={{ fontWeight: 'bold', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#333' }}>
                        {index + 1}
                    </span>
                );
            case "Nombre":
                return row.nombre_persona || row.nombre;
            case "Apellido":
                return row.apellido;
            case "Carrera":
                return row.nombre_carrera || row.carrera;
            case "Puntos":
                return (
                    <span style={{ fontWeight: 'bold', color: row.credito_total >= 90 ? '#10B981' : row.credito_total >= 75 ? '#FBBF24' : '#EF4444' }}>
                        {row.credito_total}
                    </span>
                );
            default:
                return row[column];
        }
    };

    return (
        <div className={`estudiantes-container ${collapsed ? 'navbar-collapsed' : ''}`}>
            <NavbarE />
            <div className="estudiantes-content">
                <div className="estudiantes-header">
                    <h1 className="estudiantes-title">Ranking de Estudiantes</h1>
                </div>
                <div className="estudiantes-table" style={{background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '2rem', marginTop: '1rem', overflowX: 'auto'}}>
                    <Table columns={columns} data={rankingData} customRender={customRender} />
                </div>
            </div>
        </div>
    );
};

export default RankingEstudiantes;
