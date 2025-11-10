# WinayXP Backend

API Node.js/Express que gestiona la plataforma de gamificación WiñayXP. Maneja autenticación por sesiones y JWT, operaciones para estudiantes, tutores y administradores, y exposición de documentación con Swagger.

## Requisitos

- Node.js 18 o superior
- PostgreSQL accesible y credenciales definidas en `.env`
- Generar las tablas y funciones según lo descrito en `MANUAL_TECNICO_BACKEND.md`

## Configuración rápida

1. Instala dependencias: `npm install`
2. Duplica `.env.example` (o crea `.env`) con las variables requeridas
3. Ejecuta migraciones/semillas según el manual técnico
4. Inicia el servidor en desarrollo: `npm run dev`

## Scripts principales

- `npm run dev`: arranca el servidor con recarga automática (nodemon)
- `npm start`: arranca el servidor en modo producción
- `npm run format` / `npm run format:check`: aplica o verifica formato Prettier

## Documentación

- Swagger UI disponible en `/docs`
- Detalles completos de arquitectura, base de datos y flujos en `MANUAL_TECNICO_BACKEND.md`
