import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar/Navbar';
import TextField from '../../components/TextField/TextField';
import Button from '../../components/button/Button';
import { useNavigate } from 'react-router-dom';
import './Create_Tutores.css';

const CreateTutores = () => {
  const navigate = useNavigate();
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);

  const [formData, setFormData] = useState({
    dni: '',
    nombre_persona: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'tutor'
  });

  const [errors, setErrors] = useState({
    dni: '',
    nombre_persona: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación en tiempo real
    validateField(name, value);
  };

  const handleRoleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      rol: e.target.value.toLowerCase()
    }));
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
      if (key !== 'rol') { // No validamos el rol ya que siempre tiene un valor por defecto
        validateField(key, formData[key]);
      }
    });

    // Verificar si hay errores
    for (const key in errors) {
      if (errors[key] || !formData[key].trim()) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validar el formulario completo
    if (!validateForm()) {
      alert('Por favor, corrija los errores en el formulario');
      return;
    }

    const tutorData = {
      dni: formData.dni,
      nombre_persona: formData.nombre_persona,
      apellido: formData.apellido,
      email: formData.email,
      rol: formData.rol,
      password: formData.password,
    };

    try {
      fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/registerAT`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(tutorData),
      })
        .then(response => {
          if (response.ok) {
            alert('Creado exitosamente');
            navigate('/tutores'); // Redirigir después del éxito
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
          console.error('Error al enviar los datos :', error);
          alert(`Error: ${error.message || 'Hubo un error al registrar'}`);
        });
      
    } catch (error) {
      console.error('Error al crear tutor:', error);
      alert('Error de conexión');
    }
  };

  return (
      <div className={`create-tutores-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
        <Navbar />
        <div className="create-tutores-content">
          <h1 className="create-tutores-title">Crear personal administrativo</h1>
          <h3 className="create-tutores-subtitle">
            Añade un nuevo personal al sistema
          </h3>

          <div className="info-container">
            <h2 className="info-title">Información Personal</h2>
            <p className="info-subtitle">
              Ingresa la información básica del personal
            </p>

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
                    placeholder="Apellidos"
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
            <h2 className="academic-title">Tipo de Rol</h2>
            <p className="academic-subtitle">Selecciona el rol que tendrá el usuario en el sistema</p>

            <div className="gender-group">
              <label>
                <input
                    type="radio"
                    name="rol"
                    value="Administrador"
                    checked={formData.rol === 'administrador'}
                    onChange={handleRoleChange}
                /> Administrador
              </label>
              <label>
                <input
                    type="radio"
                    name="rol"
                    value="Tutor"
                    checked={formData.rol === 'tutor'}
                    onChange={handleRoleChange}
                /> Tutor
              </label>
            </div>
          </div>

          <div className="academic-container">
            <h2 className="academic-title">Credenciales de Acceso</h2>
            <div className="academic-grid">
              <div className="input-group">
                <TextField
                    placeholder="Contraseña"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>

              <div className="input-group">
                <TextField
                    placeholder="Confirmar Contraseña"
                    type="password"
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
                onClick={() => navigate('/tutores')}
            />
            <Button
                text="Guardar Personal"
                styleType="black"
                onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
  );
};

export default CreateTutores;
