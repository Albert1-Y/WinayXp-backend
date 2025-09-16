# Manual Técnico - Sistema de Gamificación CEDHI2 (Frontend)

## 1. Introducción

Este manual técnico documenta la estructura, tecnologías y funcionamiento del Frontend del Sistema de Gamificación CEDHI2, una aplicación web desarrollada con React y Vite que implementa funcionalidades de gamificación para el entorno educativo.

## 2. Especificaciones Técnicas

### 2.1 Tecnologías Utilizadas

- **Framework Principal**: React 19.0.0
- **Herramienta de Construcción**: Vite 6.3.1
- **Enrutamiento**: React Router DOM 7.5.2
- **Visualización de Datos**: Chart.js 4.4.9 y React-ChartJS-2 5.3.0
- **Escaneo de Códigos**: @zxing/browser 0.1.5 y react-barcode-reader 0.0.2
- **Herramientas de Desarrollo**: ESLint 9.22.0
- **Base de Datos**: MySQL

### 2.2 Requisitos del Sistema

- Node.js (versión compatible con React 19)
- NPM o Yarn como gestor de paquetes
- MySQL Server

## 3. Estructura Completa del Proyecto

```
Sistema-de-gamificacion-CEDHI2/
Frontend/
├── public/                # Archivos estáticos y recursos públicos
│   ├── CEDHIlogo.png      # Logo de la organización
│   ├── Listados.png       # Recursos gráficos
│   ├── Wiñay.png          # Recursos gráficos
│   └── ImagenNiveles/     # Imágenes para el sistema de niveles
├── src/
│   ├── assets/            # Recursos gráficos y multimedia
│   ├── components/        # Componentes reutilizables
│   │   ├── AuthHandler/   # Manejo de autenticación global
│   │   ├── button/        # Componente de botón personalizado
│   │   ├── Table/         # Componente de tabla reutilizable
│   │   └── TextField/     # Componente de campo de texto
│   ├── context/           # Contextos de React (AuthContext)
│   ├── Pages/             # Páginas principales de la aplicación
│   │   ├── Actividad/     # Gestión de actividades
│   │   ├── Asistencia/    # Control de asistencia
│   │   ├── Dashboard/     # Panel principal
│   │   ├── Estudiante/    # Gestión de estudiantes
│   │   ├── Login/         # Página de inicio de sesión
│   │   ├── Navbar/        # Componentes de navegación
│   │   └── ...            # Otras páginas específicas
│   ├── utils/             # Utilidades y funciones auxiliares
│   ├── App.jsx            # Componente raíz y configuración de rutas
│   ├── main.jsx           # Punto de entrada de la aplicación
│   └── index.css          # Estilos globales
├── eslint.config.js       # Configuración de ESLint
├── package.json           # Dependencias y scripts
└── vite.config.js         # Configuración de Vite

## 4. Arquitectura de la Aplicación

### 4.1 Gestión de Estado

La aplicación utiliza el API Context de React para gestionar estados globales, principalmente a través de AuthContext para la autenticación de usuarios. Este contexto proporciona:

- Control de roles de usuario (Administrador, Tutor, Estudiante)
- Persistencia de sesión usando localStorage
- Funcionalidad de cierre de sesión

### 4.2 Sistema de Rutas

El enrutamiento se implementa con React Router DOM mediante HashRouter. Las rutas principales incluyen:

- **/** - Página de inicio de sesión
- **/dashboard** - Panel principal
- **/tutores** - Gestión de tutores
- **/estudiante** - Gestión de estudiantes
- **/actividad** - Gestión de actividades
- **/asistencia** - Control de asistencia
- **/perfil** - Gestión de perfiles de usuario
- **/ranking** - Clasificación de estudiantes

### 4.3 Gestión de Autenticación

El sistema implementa un manejo robusto de autenticación que incluye:

- Interceptores de fetch personalizados para manejar errores 401
- Redirección automática al login cuando expira la sesión
- Almacenamiento seguro de tokens en localStorage

## 5. Componentes Principales

### 5.1 AuthHandler

Componente global que intercepta y maneja errores de autenticación en toda la aplicación.

### 5.2 Navbar

Implementado en tres variantes según el rol del usuario:
- **Navbar.jsx** - Navegación general
- **NavbarT.jsx** - Navegación para tutores
- **NavbarE.jsx** - Navegación para estudiantes

### 5.3 Dashboard

Panel principal con estadísticas, información resumida y acceso a las funciones principales del sistema según el rol del usuario.

## 6. Módulos Funcionales

### 6.1 Gestión de Usuarios

Permite crear y administrar perfiles de:
- Administradores
- Tutores
- Estudiantes

### 6.2 Sistema de Actividades

Facilita la creación, edición y seguimiento de actividades educativas con componentes de gamificación.

### 6.3 Control de Asistencia

Incluye funcionalidades para registrar y monitorear la asistencia de estudiantes, con posibilidad de escaneo de códigos.

### 6.4 Gamificación

Implementa elementos de gamificación como:
- Sistema de niveles (visualmente representados)
- Ranking de estudiantes
- Puntos por participación y asistencia

## 7. Estilos y Diseño UI

La interfaz utiliza CSS modular con archivos específicos para cada componente y página:
- Diseño responsivo
- Estructura basada en grid y flexbox
- Componentes de formulario estilizados con feedback visual

## 8. Integración con Backend

### 8.1 API REST
La aplicación se comunica con el backend mediante:
- API REST
- Manejo de tokens JWT

### 8.2 Estructura del Backend

### 9.1 Comandos Frontend
### 9.1 Comandos Principales
- **npm run dev**: Inicia el servidor de desarrollo
- **npm run build**: Construye la aplicación para producción
- **npm run preview**: Previsualiza la versión de producción

### 9.2 Comandos Backend
### 9.2 Configuración de Vite
### 9.3 Configuraciones
La configuración básica de Vite se encuentra en `vite.config.js`, utilizando el plugin de React.
## 10. Consideraciones de Seguridad

- Validación de entradas en formularios
- Manejo seguro de tokens de autenticación
- Protección de rutas según roles de usuario
- Interceptores para sesiones expiradas
- Validación de datos en el Backend
## 11. Solución de Problemas Comunes

### 11.1 Errores de Autenticación
Si se presentan problemas de autenticación, verificar:
- Estado del token JWT
- Configuración de CORS en el backend
- Funcionamiento del AuthHandler

### 11.2 Problemas de Renderizado
Para resolver problemas visuales:
- Verificar compatibilidad CSS
- Validar estructura de componentes
- Revisar console.log para errores

### 11.3 Problemas con la Base de Datos
