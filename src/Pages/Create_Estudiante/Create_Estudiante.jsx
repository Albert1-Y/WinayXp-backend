import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar/Navbar';
import NavbarT from '../Navbar/NavbarT';
import TextField from '../../components/TextField/TextField';
import Button from '../../components/button/Button';
import { useNavigate } from 'react-router-dom';
import './Create_Estudiante.css';
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";

const Create_Estudiante = () => {
  const navigate = useNavigate();
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const { rol } = useContext(AuthContext);
  useEffect(() => {
    const handleNavbarChange = () => {
      const collapsedNavbar = document.querySelector('.navbar-container.collapsed');
      setNavbarCollapsed(!!collapsedNavbar);
    };


    const observer = new MutationObserver(handleNavbarChange);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });


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
  const [formData, setFormData] = useState({
    dni: '',
    nombre_persona: '',
    apellido: '',
    email: '',
    carrera: '',
    semestre: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    dni: '',
    nombre_persona: '',
    apellido: '',
    email: '',
    carrera: '',
    semestre: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación en tiempo real
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'dni':
        if (!value.trim()) {
          error = 'El DNI es obligatorio';
        } else if (!/^\d+$/.test(value)) {
          error = 'El DNI debe contener solo números';
        } else if (value.length !== 8) {
          error = 'El DNI debe tener 8 dígitos';
        }
        break;

      case 'nombre_persona':
        if (!value.trim()) {
          error = 'El nombre es obligatorio';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          error = 'El nombre solo debe contener letras';
        }
        break;

      case 'apellido':
        if (!value.trim()) {
          error = 'El apellido es obligatorio';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          error = 'El apellido solo debe contener letras';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'El correo electrónico es obligatorio';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Formato de correo electrónico inválido';
        }
        break;

      case 'semestre':
        if (!value.trim()) {
          error = 'El semestre es obligatorio';
        } else if (isNaN(value) || parseInt(value) <= 0) {
          error = 'El semestre debe ser un número positivo';
        } else if (parseInt(value) > 14) {
          error = 'El semestre no puede ser mayor a 14';
        }
        break;

      case 'password':
        if (!value.trim()) {
          error = 'La contraseña es obligatoria';
        } else if (value.length < 6) {
          error = 'La contraseña debe tener al menos 6 caracteres';
        }
        break;

      case 'confirmPassword':
        if (!value.trim()) {
          error = 'Confirmar contraseña es obligatorio';
        } else if (value !== formData.password) {
          error = 'Las contraseñas no coinciden';
        }
        break;

      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    // Validar todos los campos antes de enviar
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });

    // Verificar si hay errores
    for (const key in errors) {
      if (errors[key] || !formData[key].trim()) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    // Validar el formulario completo
    if (!validateForm()) {
      alert('Por favor, corrija los errores en el formulario');
      return;
    }

    // Validado: crear el JSON
    const estudianteData = {
      dni: formData.dni,
      nombre_persona: formData.nombre_persona,
      apellido: formData.apellido,
      email: formData.email,
      rol: 'estudiante',
      carrera: formData.carrera || null,
      semestre: parseInt(formData.semestre, 10),
      password: formData.password
    };

    console.log('JSON final listo para enviar:', estudianteData);

    fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/registerE`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(estudianteData),
    })
      .then(response => {
        if (response.ok) {
          alert('Estudiante creado exitosamente');
          navigate('/estudiante'); // Redirigir después del éxito
          return response.json();
        } else {
          return response.json().then(data => {
            throw new Error(data.message || 'Error en la solicitud');
          });
        }
      })
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error('Error al enviar los datos del estudiante:', error);
        alert(`Error: ${error.message || 'Hubo un error al registrar al estudiante'}`);
      });
  };

  return (
    <div className={`create-estudiante-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
      {renderNavbar()}
      <div className="create-estudiante-content">
        <h1 className="create-estudiante-title">Crear Estudiante</h1>
        <h3 className="create-estudiante-subtitle">
          Añade un nuevo estudiante al sistema
        </h3>

        <div className="academic-container">
          <h2 className="info-title">Información Personal</h2>
          <p className="info-subtitle">Ingresa la información básica del estudiante</p>
          <div className="info-grid">
            <div className="input-group">
              <TextField
                placeholder="DNI"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
              />
              {errors.dni && <div className="error-message">{errors.dni}</div>}
            </div>

            <div className="input-group">
              <TextField
                placeholder="Nombre"
                name="nombre_persona"
                value={formData.nombre_persona}
                onChange={handleChange}
              />
              {errors.nombre_persona && <div className="error-message">{errors.nombre_persona}</div>}
            </div>

            <div className="input-group">
              <TextField
                placeholder="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
              />
              {errors.apellido && <div className="error-message">{errors.apellido}</div>}
            </div>

            <div className="input-group">
              <TextField
                placeholder="Correo Electrónico"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
          </div>
        </div>

        <div className="academic-container">
          <h2 className="academic-title">Información Académica</h2>
          <p className="academic-subtitle">Asignación académica del estudiante</p>
          <div className="academic-grid">
            <div className="input-group">
              <TextField
                placeholder="Carrera"
                name="carrera"
                value={formData.carrera}
                onChange={handleChange}
              />
              {errors.carrera && <div className="error-message">{errors.carrera}</div>}
            </div>

            <div className="input-group">
              <TextField
                placeholder="Semestre"
                name="semestre"
                type="number"
                value={formData.semestre}
                onChange={handleChange}
              />
              {errors.semestre && <div className="error-message">{errors.semestre}</div>}
            </div>
          </div>
        </div>

        <div className="academic-container">
          <h2 className="academic-title">Credenciales de Acceso</h2>
          <div className="academic-grid">
            <div className="input-group">
              <TextField
                type="password"
                placeholder="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="input-group">
              <TextField
                type="password"
                placeholder="Confirmar Contraseña"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <Button
            text="Cancelar"
            styleType="white"
            onClick={() => navigate('/estudiante')}
          />
          <Button
            text="Guardar Estudiante"
            styleType="black"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Create_Estudiante;
