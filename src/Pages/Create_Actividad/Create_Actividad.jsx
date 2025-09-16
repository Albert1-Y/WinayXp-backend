import React, {useContext, useState, useEffect} from 'react';
import Navbar from '../Navbar/Navbar';
import NavbarT from "../Navbar/NavbarT";
import TextField from '../../components/TextField/TextField';
import Button from '../../components/button/Button';
import { useNavigate } from 'react-router-dom';
import './Create_Actividad.css';
import {AuthContext} from "../../context/AuthContext.jsx";
import NavbarE from "../Navbar/NavbarE.jsx";

const Create_Actividad = () => {
  const { rol } = useContext(AuthContext);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    creditos: '',
    año: '',
    semestre: ''
  });

  // Estado para los errores de validación
  const [errors, setErrors] = useState({
    nombre_actividad: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    creditos: '',
    año: '',
    semestre: '',
    fechas: ''  // Para errores relacionados con la comparación de fechas
  });

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
      case "tutor":
        return <NavbarT />;
      default:
        alert("Tu sesión ha expirado");
        localStorage.clear();
        navigate("/");
        return null;
    }
  };

  // Función para validar un campo específico
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'nombre_actividad':
        if (!value.trim()) {
          error = 'El nombre de la actividad es obligatorio';
        } else if (value.length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres';
        } else if (value.length > 100) {
          error = 'El nombre no puede exceder los 100 caracteres';
        }
        break;

      case 'fecha_inicio':
        if (!value) {
          error = 'La fecha de inicio es obligatoria';
        } else {
          // Validar que la fecha de inicio sea actual o futura
          const now = new Date();
          const selectedDate = new Date(value);

          // Reset time part for today's date for comparison
          now.setHours(0, 0, 0, 0);

          if (selectedDate < now) {
            error = 'La fecha de inicio no puede ser en el pasado';
          }

          // Si existe fecha fin, comparar
          if (formData.fecha_fin && new Date(formData.fecha_fin) <= selectedDate) {
            setErrors(prev => ({
              ...prev,
              fechas: 'La fecha de inicio debe ser anterior a la fecha de fin'
            }));
          } else {
            setErrors(prev => ({
              ...prev,
              fechas: ''
            }));
          }
        }
        break;

      case 'fecha_fin':
        if (!value) {
          error = 'La fecha de fin es obligatoria';
        } else if (formData.fecha_inicio && new Date(value) <= new Date(formData.fecha_inicio)) {
          error = 'La fecha de fin debe ser posterior a la fecha de inicio';
          setErrors(prev => ({
            ...prev,
            fechas: 'La fecha de inicio debe ser anterior a la fecha de fin'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            fechas: ''
          }));
        }
        break;

      case 'lugar':
        if (!value.trim()) {
          error = 'El lugar es obligatorio';
        } else if (value.length < 3) {
          error = 'El nombre del lugar debe tener al menos 3 caracteres';
        }
        break;

      case 'creditos':
        if (!value) {
          error = 'Los Puntos CEDHI son obligatorios';
        } else if (isNaN(value) || parseInt(value) <= 0) {
          error = 'Los Puntos CEDHI deben ser un número positivo';
        } else if (parseInt(value) > 100) {
          error = 'Los Puntos CEDHI no pueden exceder de 100';
        }
        break;

      case 'año':
        if (!value) {
          error = 'El año es obligatorio';
        } else if (!/^\d{4}$/.test(value)) {
          error = 'El año debe tener 4 dígitos';
        } else {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (year < currentYear) {
            error = 'El año no puede ser anterior al año actual';
          } else if (year > currentYear + 5) {
            error = 'El año no puede ser mayor a 5 años en el futuro';
          }
        }
        break;

      case 'semestre':
        if (!value) {
          error = 'Debe seleccionar un semestre';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validación en tiempo real
    const error = validateField(name, newValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Función para validar todo el formulario
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validar cada campo
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) {
        isValid = false;
      }
    });

    // Validación adicional para fechas
    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
        newErrors.fechas = 'La fecha de fin debe ser posterior a la fecha de inicio';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    // Validar todo el formulario antes de enviar
    if (!validateForm()) {
      alert('Por favor, corrija los errores en el formulario');
      return;
    }

    // Combina el año y semestre en el formato 2025-II
    const semestreFinal = `${formData.año}-${formData.semestre}`;
    
    const actividadData = {
      nombre_actividad: formData.nombre_actividad,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      lugar: formData.lugar,
      creditos: parseInt(formData.creditos),
      semestre: semestreFinal,
    };
  
    console.log('Datos de actividad:', actividadData);
  
    // Realiza el POST para guardar la actividad
    fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/CrearActividad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(actividadData),
      credentials: "include"
    })
    .then(response => {
      if (response.ok) { 
        alert('Actividad creada exitosamente');
        navigate('/actividad'); // Redirigir después del éxito
        return response.json();
      } else {
        return response.json().then(data => {
          throw new Error(data.message || 'Hubo un error en la creación de la actividad');
        });
      }
    })
    .then(data => {
      console.log('Respuesta del servidor:', data);
    })
    .catch(error => {
      console.error('Error al guardar la actividad:', error);
      alert(`Error: ${error.message || 'Hubo un error en la solicitud, por favor intente más tarde'}`);
    });
  };

  const semestres = ["I", "II"];

  return (
    <div className={`create-actividad-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
      {renderNavbar()}
      <div className="create-actividad-content">
        <h1 className="create-actividad-title">Crear Actividad</h1>
        <h3 className="create-actividad-subtitle">Añadir una nueva actividad</h3>

        <div className="academic-container">
          <h2 className="info-title">Detalles de la Actividad</h2>
          <p className="info-subtitle">Ingresa los detalles de la actividad</p>

          {/* Error general para fechas */}
          {errors.fechas && (
            <div className="error-message error-general">{errors.fechas}</div>
          )}

          <div className="info-grid">
            <div className="field-container">
              <label>Nombre de la Actividad</label>
              <TextField 
                placeholder="Nombre de la Actividad"
                name="nombre_actividad"
                value={formData.nombre_actividad}
                onChange={handleChange}
              />
              {errors.nombre_actividad && (
                <div className="error-message">{errors.nombre_actividad}</div>
              )}
            </div>

            <div className="field-container">
              <label>Fecha de Inicio</label>
              <TextField
                type="datetime-local"
                placeholder="Fecha de Inicio"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
              />
              {errors.fecha_inicio && (
                <div className="error-message">{errors.fecha_inicio}</div>
              )}
            </div>

            <div className="field-container">
              <label>Fecha de Fin</label>
              <TextField
                type="datetime-local"
                placeholder="Fecha de Fin"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
              />
              {errors.fecha_fin && (
                <div className="error-message">{errors.fecha_fin}</div>
              )}
            </div>

            <div className="field-container">
              <label>Lugar</label>
              <TextField
                placeholder="Lugar"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
              />
              {errors.lugar && (
                <div className="error-message">{errors.lugar}</div>
              )}
            </div>

            <div className="field-container">
              <label>Puntos CEDHI</label>
              <TextField
                type="number"
                placeholder="Puntos CEDHI"
                name="creditos"
                value={formData.creditos}
                onChange={handleChange}
                min="0"
              />
              {errors.creditos && (
                <div className="error-message">{errors.creditos}</div>
              )}
            </div>

            {/* Año: Selección del Año */}
            <div className="field-container">
              <label>Año</label>
              <input
                type="number"
                placeholder="Año (ej: 2025)"
                name="año"
                value={formData.año}
                onChange={handleChange}
                className="año-input"
              />
              {errors.año && (
                <div className="error-message">{errors.año}</div>
              )}
            </div>

            {/* Semestre: Selección de Semestre (I o II) */}
            <div className="field-container">
              <label>Periodo</label>
              <select
                name="semestre"
                value={formData.semestre}
                onChange={handleChange}
                className="select-semestre"
              >
                <option value="">Seleccionar Periodo</option>
                {semestres.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
              {errors.semestre && (
                <div className="error-message">{errors.semestre}</div>
              )}
            </div>
          </div>
        </div>

        {/* Mostrar el semestre combinado */}
        <div className="selected-semestre">
          <p>
            <strong>Periodo seleccionado: </strong>
            {formData.año && formData.semestre ? `${formData.año}-${formData.semestre}` : 'No seleccionado'}
          </p>
        </div>

        <div className="action-buttons">
          <Button
            text="Cancelar"
            styleType="white"
            onClick={() => navigate('/actividad')}
          />
          <Button
            text="Guardar Actividad"
            styleType="black"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Create_Actividad;
