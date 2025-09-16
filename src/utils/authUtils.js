// Utilidad para manejo de errores de autenticación
import { useNavigate } from 'react-router-dom';

// Función para manejar errores 401
export const handleAuthError = () => {
  // Limpiar localStorage
  localStorage.clear();

  // Redireccionar al login
  window.location.href = '/#/'; // Usamos window.location para un redirect completo
};

// Interceptor de fetch personalizado
export const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Si el servidor responde con 401, maneja el error de autenticación
    if (response.status === 401) {
      handleAuthError();
      return Promise.reject(new Error('No autorizado'));
    }

    return response;
  } catch (error) {
    // Capturar otros errores de red
    console.error('Error de red:', error);
    throw error;
  }
};
