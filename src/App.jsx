import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Tutores from "./Pages/Tutores/Tutores";
import Create_Tutores from "./Pages/Create_Tutores/Create_Tutores";
import Create_Estudiante from "./Pages/Create_Estudiante/Create_Estudiante";
import Estudiante from "./Pages/Estudiante/Estudiante";
import Create_Actividad from "./Pages/Create_Actividad/Create_Actividad";
import Actividad from "./Pages/Actividad/Actividad";
import Asistencia from "./Pages/Asistencia/Asistencia.jsx";
import Perfil from "./Pages/Perfil/Perfil.jsx";
import Tomar_Asistencia from "./Pages/Tomar_Asistencia/Tomar_Asistencia";
import Ranking from "./Pages/RankingEstudiantes/RankingEstudiantes.jsx";
import AuthHandler from "./components/AuthHandler/AuthHandler";
import AuthCallback from "./Pages/Login/AuthCallback";

function App() {
    return (
        <Router>
            {/* Componente que maneja errores 401 globalmente */}
            <AuthHandler />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tutores" element={<Tutores />} />
                <Route path="/create_tutores" element={<Create_Tutores />} />
                <Route path="/create_estudiante" element={<Create_Estudiante />} />
                <Route path="/estudiante" element={<Estudiante />} />
                <Route path="/create_actividad" element={<Create_Actividad />} />
                <Route path="/actividad" element={<Actividad/>} />
                <Route path="/asistencia" element={<Asistencia/>} />
                <Route path="/perfil" element={<Perfil/>} />
                <Route path="/tomar-asistencia" element={<Tomar_Asistencia />} />
                <Route path="/ranking" element={<Ranking />} />
            </Routes>
        </Router>
    );
}

export default App;
