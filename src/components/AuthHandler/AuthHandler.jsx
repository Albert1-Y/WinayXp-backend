import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

// Este componente interceptará errores 401 globalmente
const AuthHandler = () => {
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        // Función para interceptar las respuestas fetch
        const originalFetch = window.fetch;
        window.fetch = async function(url, options = {}) {
            try {
                const response = await originalFetch(url, options);

                // Si la respuesta es 401, ejecutamos el logout
                if (response.status === 401) {
                    console.log('Error 401: Sesión expirada o no autorizada');
                    logout();
                    return Promise.reject(new Error('No autorizado'));
                }

                return response;
            } catch (error) {
                console.error('Error en fetch:', error);
                throw error;
            }
        };

        // Función de limpieza para restaurar el fetch original cuando el componente se desmonte
        return () => {
            window.fetch = originalFetch;
        };
    }, [logout]);

    // Este componente no renderiza nada
    return null;
};

export default AuthHandler;
