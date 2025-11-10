# Manual Tecnico Backend - Winay XP

## Resumen

- API REST construida sobre Node.js 18+ y Express 4.
- Base de datos PostgreSQL gestionada mediante consultas SQL directas desde modelos.
- Autenticacion hibrida: credenciales propias (JWT + cookies firmadas) y Google OAuth 2.0.
- Gestion de sesiones con `express-session` y cookies firmadas para token de acceso y refresh token.
- Documentacion automatizada con Swagger disponible en `/docs`.

## Requisitos previos

- Node.js v18 o superior y npm 9+.
- Servidor PostgreSQL accesible via URL (Render u otro proveedor); habilitar SSL si se usa Render.
- Variables de entorno configuradas (ver seccion siguiente).
- (Opcional) Redis u otro Session Store persistente para `express-session` en ambientes productivos.

## Instalacion rapida

1. Clonar el repositorio.
2. Ejecutar `npm install` en `WinayXp-backend`.
3. Crear `.env` tomando como referencia la tabla de configuracion.
4. Levantar la base de datos y aplicar la estructura de tablas esperada por los modelos.
5. Ejecutar `npm run dev` para entorno local (nodemon) o `npm start` para ejecucion simple.

## Estructura del proyecto

| Directorio / Archivo              | Descripcion                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `index.js`                        | Punto de entrada. Configura Express, sesiones, CORS, Swagger, rutas y servidor HTTP.                              |
| `controllers/`                    | Capa de controladores. Contiene logica de negocio para usuarios, administradores, tutores y estudiantes.          |
| `routes/`                         | Definicion de rutas Express segmentadas por dominio (`user`, `admin`, `estudiante`). Incluye anotaciones Swagger. |
| `middlewares/`                    | Middlewares personalizados para validacion, JWT, Passport y otras tareas cruzadas.                                |
| `models/`                         | Acceso a datos. Ejecuta consultas parametrizadas sobre PostgreSQL.                                                |
| `database/connection.database.js` | Configura el pool de PostgreSQL (pg.Pool) usando la variable `DATABASE_URL`.                                      |
| `Utils/creartoken.js`             | Utilidad para emitir JWT y fijar cookies firmadas.                                                                |
| `swagger.js`                      | Configuracion de Swagger (OpenAPI 3.0) y exposicion en `/docs`.                                                   |
| `.env`                            | Variables sensibles (no debe versionarse).                                                                        |

## Dependencias clave

- `express`, `cors`, `cookie-parser`, `express-session`: servidor HTTP, CORS y gestion de cookies/sesion.
- `pg`: conexion a PostgreSQL via pool.
- `jsonwebtoken`, `ms`: generacion y duracion de tokens JWT.
- `passport`, `passport-google-oauth20`: autenticacion social con Google.
- `express-validator`: validacion de payloads (actualmente usado en login).
- `exceljs`: exportacion de datos a archivos XLSX.
- `swagger-jsdoc`, `swagger-ui-express`: documentacion interactiva.

## Configuracion por entorno (.env)

| Variable                 | Descripcion                                                                                                     | Ejemplo                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`           | Cadena completa de conexion PostgreSQL (incluye usuario, password, host, puerto y base).                        | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET`             | Clave simetrica para firmar JWT (acceso y refresh). Debe ser fuerte.                                            | `cadena-super-secreta`                                |
| `JWT_EXPIRES_IN`         | Duracion del token de acceso (usa formatos aceptados por `ms`).                                                 | `12m`                                                 |
| `REFRESH_JWT_EXPIRES_IN` | Duracion del refresh token.                                                                                     | `50m`                                                 |
| `COOKIE_MAXAGE`          | Duracion de la cookie `auth_token`.                                                                             | `12m`                                                 |
| `COOKIE_RefreshMAXAGE`   | Duracion de la cookie `Rtoken`.                                                                                 | `50m`                                                 |
| `SESSION_SECRET`         | Clave para firmar la cookie de `express-session` (`connect.sid`). Define un valor distinto en cada entorno.     | `cadena-unica-backend`                                |
| `COOKIE_SECURE`          | Controla el flag `Secure` de las cookies propias (auth_token y Rtoken). Usa `true` en produccion HTTPS.         | `true`                                                |
| `COOKIE_SAMESITE`        | Politica SameSite (`strict`, `lax` o `none`). Si usas `none`, `COOKIE_SECURE` debe quedar en `true`.            | `none`                                                |
| `COOKIE_RMA_cokie`       | Clave utilizada por `cookie-parser` para firmar cookies firmadas. Debe mantenerse sincronizada con el frontend. | `clave-cookie`                                        |
| `URL_FRONT`              | URL publica del frontend para redirecciones (login y Google OAuth).                                             | `https://frontend.winayxp.com`                        |
| `GOOGLE_CLIENT_ID`       | Client ID de la app OAuth 2.0 (Google).                                                                         | `xxx.apps.googleusercontent.com`                      |
| `GOOGLE_CLIENT_SECRET`   | Client Secret de la app OAuth 2.0 (Google).                                                                     | `xxxxxxxxxxxxxxxx`                                    |
| `GOOGLE_CALLBACK_URL`    | URL de callback expuesta por este backend (`/api/auth/google/callback`).                                        | `https://api.winayxp.com/api/auth/google/callback`    |
| `NODE_ENV`               | `production` para activar cookies `Secure`/`None` automaticamente en `index.js`.                                | `production`                                          |

> Mantener `.env` fuera del control de versiones. Rotar `SESSION_SECRET`, `COOKIE_RMA_cokie` y `JWT_SECRET` al menos una vez por despliegue mayor.

## Scripts npm

| Script                 | Descripcion                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Ejecuta el servidor con `nodemon` y recarga en caliente. |
| `npm start`            | Ejecuta `node index.js` sin recarga.                     |
| `npm run format`       | Aplica Prettier a todo el proyecto.                      |
| `npm run format:check` | Verifica formato (solo lectura).                         |

## Arquitectura de la aplicacion

### Inicializacion (`index.js`)

1. Carga variables de entorno con `dotenv/config`.
2. Habilita `trust proxy` para escenarios con reverse proxy (Render, Heroku).
3. Configura `express-session` usando `SESSION_SECRET` y flags calculados desde `NODE_ENV`.
4. Registra CORS dinamico: origenes permitidos provienen de `URL_FRONT` (lista separada por comas).
5. Activa parsing JSON, `cookie-parser` con firma y `express.static` en `/uploads`.
6. Registra los routers (`/api`, `/api/admin`, `/api/estudiante`) y Swagger en `/docs`.
7. Inicia el servidor en `PORT` (por defecto 3000).

### Middlewares globales

- `express-session`: Mantiene estado de sesion. En produccion usar un store persistente (Redis, Postgres, etc.).
- `cors`: Permite solicitudes cruzadas controlando origenes y credenciales.
- `cookie-parser`: Firma cookies usando `COOKIE_RMA_cokie`.
- `express.json`: Parseo de cuerpos JSON.

### Middlewares personalizados

- `middlewares/jwt.middlware.js`
  - `verifyToken`: Valida el JWT de acceso almacenado en `auth_token` (signed cookie). Si expira, intenta regenerar usando el refresh token guardado en base.
  - `verifyAdmin`, `verifyTutor`, `verifyAdminTutor`, `verifyEstudiante`: Control de roles a partir de `req.rol`.
- `middlewares/validator_entrada.middlware.js`
  - `validarLogin`: Valida formato de email y presencia de password antes de delegar a `UserController.login`.
- `middlewares/passport.js`
  - Configura estrategia Google OAuth 2.0 (`passport-google-oauth20`). Crea usuarios estudiante inactivos si no existen.

## Autenticacion y gestion de tokens

1. **Login tradicional** (`POST /api/login`)
   - Valida credenciales con `bcryptjs` frente a `credenciales` en la base.
   - Genera JWT de acceso y refresh (`JWT_SECRET`).
   - Guarda refresh token en `refresh_tokens` y devuelve solo el `id` en cookie firmada `Rtoken`.
   - Fija cookie `auth_token` con el JWT de acceso. Ambas cookies respetan configuracion `secure`, `sameSite` y `httpOnly`.
2. **Renovacion automatica**
   - `verifyToken` renueva el token de acceso cuando expira, verificando el refresh token en base y reescribiendo las cookies.
3. **Logout** (`POST /api/logout`)
   - Borra el refresh token asociado en base, limpia cookies y finaliza sesion.
4. **Google OAuth**
   - `GET /api/auth/google` inicia el flujo OAuth.
   - `GET /api/auth/google/callback` crea o actualiza el usuario, genera cookies y redirige al frontend (`URL_FRONT`).
5. **Sesion Express**
   - Usa `connect.sid` firmado por `SESSION_SECRET`. Actualmente emplea MemoryStore (no persistente).

## Endpoints principales

### Rutas Auth y Usuario (`/api`)

| Metodo | Path                        | Proteccion               | Descripcion                                                                                                 |
| ------ | --------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/login`                | Publico (valida payload) | Autenticacion por email/password. Emite cookies `auth_token` y `Rtoken`.                                    |
| `GET`  | `/api/login`                | Publico                  | Devuelve top 10 de ranking general de estudiantes.                                                          |
| `POST` | `/api/logout`               | Requiere cookie firmada  | Revoca refresh token y cierra sesion.                                                                       |
| `GET`  | `/api/auth/google`          | Publico                  | Redirecciona a Google OAuth con scopes `profile` y `email`.                                                 |
| `GET`  | `/api/auth/google/callback` | Publico                  | Maneja callback OAuth. Crea usuario estudiante si no existe y emite cookies.                                |
| `POST` | `/api/user/completar-datos` | Publico                  | Completa o crea datos basicos de un usuario (nombre, apellido, DNI). Marca `activo=false` hasta aprobacion. |

### Rutas Estudiante (`/api/estudiante`)

| Metodo | Path                                      | Proteccion                         | Descripcion                                                                      |
| ------ | ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `GET`  | `/api/estudiante/InitEstudiante`          | `verifyToken` + `verifyEstudiante` | Devuelve datos del estudiante autenticado, creditos, nivel y niveles pendientes. |
| `GET`  | `/api/estudiante/TopEstudiantesCarrera`   | Publico                            | Ranking filtrado por carrera (param `carrera`) o general si no se indica.        |
| `GET`  | `/api/estudiante/getActividadesAsistidas` | `verifyToken` + `verifyEstudiante` | Lista actividades asistidas (fecha, creditos, semestre).                         |
| `PUT`  | `/api/estudiante/confirmarNivel`          | `verifyToken` + `verifyEstudiante` | Marca el ultimo nivel cuya animacion fue vista por el estudiante.                |

### Rutas Admin y Tutor (`/api/admin`)

| Metodo   | Path                                  | Proteccion                         | Descripcion                                                                        |
| -------- | ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `GET`    | `/api/admin/init`                     | `verifyToken` + `verifyAdminTutor` | Datos iniciales del panel (perfil de tutor/admin).                                 |
| `POST`   | `/api/admin/registerAT`               | `verifyToken` + `verifyAdmin`      | Alta de administradores o tutores (crea persona y credenciales).                   |
| `POST`   | `/api/admin/registerE`                | `verifyToken` + `verifyAdminTutor` | Alta individual de estudiante (crea persona, credenciales y datos academicos).     |
| `POST`   | `/api/admin/registerME`               | **Sin middleware**                 | Alta masiva de estudiantes (recibe array). Revisar y proteger antes de produccion. |
| `POST`   | `/api/admin/crearActividad`           | `verifyToken` + `verifyAdminTutor` | Crea actividades (nombre, fechas, lugar, creditos, semestre).                      |
| `GET`    | `/api/admin/DatosEstudiante`          | `verifyToken` + `verifyAdminTutor` | Consulta datos de estudiante por `dni` o `id_persona`.                             |
| `DELETE` | `/api/admin/EliminarEstudiante`       | `verifyToken` + `verifyAdminTutor` | Baja logica de estudiante.                                                         |
| `DELETE` | `/api/admin/EliminarActividad`        | `verifyToken` + `verifyAdminTutor` | Baja logica de actividad.                                                          |
| `GET`    | `/api/admin/MostrarActividad`         | `verifyToken` + `verifyAdminTutor` | Lista actividades (filtros opcionales por fechas).                                 |
| `PUT`    | `/api/admin/ActualizarActividad`      | `verifyToken` + `verifyAdminTutor` | Actualiza datos de una actividad.                                                  |
| `GET`    | `/api/admin/ActividadesPorSemestre`   | `verifyToken` + `verifyAdminTutor` | Lista actividades filtrando por semestre (`id_semestre` o `todos`).                |
| `GET`    | `/api/admin/AsistenciaActividad`      | `verifyToken` + `verifyAdminTutor` | Lista asistencia de una actividad (`id_actividad`).                                |
| `PUT`    | `/api/admin/AsistenciaEstudiante`     | `verifyToken` + `verifyAdminTutor` | Registra o revoca asistencia y recalcula creditos/nivel.                           |
| `GET`    | `/api/admin/verifyAT`                 | `verifyToken` + `verifyAdminTutor` | Verificacion rapida de permisos tutor/admin (`{ ok: true }`).                      |
| `GET`    | `/api/admin/verifyA`                  | `verifyToken` + `verifyAdmin`      | Verificacion rapida de permisos admin.                                             |
| `GET`    | `/api/admin/IntMostrarEstudiantes`    | `verifyToken` + `verifyAdminTutor` | Lista completa de estudiantes.                                                     |
| `GET`    | `/api/admin/Semestres`                | `verifyToken` + `verifyAdminTutor` | Lista de semestres configurados.                                                   |
| `GET`    | `/api/admin/exportarExcelEstudiantes` | `verifyToken` + `verifyAdminTutor` | Genera XLSX con informacion de estudiantes.                                        |
| `GET`    | `/api/admin/exportarExcelActividades` | `verifyToken` + `verifyAdminTutor` | Genera XLSX con informacion de actividades.                                        |
| `GET`    | `/api/admin/descargar-plantilla`      | `verifyToken` + `verifyAdminTutor` | Descarga plantilla Excel para carga masiva de actividades.                         |
| `GET`    | `/api/admin/MostrarTutores`           | `verifyToken` + `verifyAdmin`      | Lista tutores habilitados.                                                         |
| `DELETE` | `/api/admin/DeleteTutores`            | `verifyToken` + `verifyAdmin`      | Baja logica de tutor.                                                              |

### Notas de seguridad

- Revisar y proteger `POST /api/admin/registerME` agregando `verifyToken` + `verifyAdminTutor` (requiere actualizacion de codigo).
- Reducir/eliminar `console.log` con datos sensibles (`middlewares/jwt.middlware.js`, `middlewares/passport.js`, `controllers/*`).
- Configurar un Session Store persistente antes de subir a produccion.

## Modelos y capa de datos

- `models/user.model.js`
  - Busca personas por email, guarda/lee refresh tokens, construye ranking general y por carrera.
  - Crea y actualiza registros en tabla `persona`.
- `models/admin.model.js`
  - Gestion completa de administradores, tutores y estudiantes (creacion, actualizacion, bajas logicas).
  - Gestiona actividades (crear, listar, actualizar, eliminar) y asistencia.
  - Exporta datos agregados para reportes y niveles alcanzados.
- `models/admin.tutor.model.js`
  - Obtiene informacion combinada de administradores/tutores para inicializacion de paneles.
- `models/estudiante.model.js`
  - Consulta resumen de estudiante, creditos y actividades asistidas.
  - Marca niveles vistos por estudiante.
- `models/nivel.model.js`
  - Determina el nivel segun creditos acumulados y lista niveles pendientes.

Todas las consultas usan parametrizacion con `pg.Pool` (`database/connection.database.js`). La conexion se verifica en tiempo de arranque con `SELECT NOW()`.

## Utilidades

- `Utils/creartoken.js`
  - Funcion `crearTokenCookie(res, payload)`: genera JWT, calcula `maxAge` usando `ms` y fija la cookie `auth_token` con opciones seguras (`httpOnly`, `signed`, `secure`, `sameSite`).

## Historial de movimientos de créditos

### Endpoints expuestos

- `PUT /api/admin/CobrarPuntos`
  - Requiere roles `tutor` o `administrador`, autenticados vía cookies (`verifyToken + verifyAdminTutor`).
  - Cuerpo JSON obligatorio:
    ```json
    {
      "id_persona": 42,
      "puntos": 50,
      "motivo": "Compra de kit de bienvenida"
    }
    ```
  - Respuesta exitosa:
    ```json
    {
      "ok": true,
      "msg": "Puntos descontados correctamente",
      "saldo": {
        "credito_total": 120,
        "cobro_credito": 70
      },
      "movimiento": 815
    }
    ```
  - Errores esperados: `400` (validación o saldo insuficiente), `403` (rol no autorizado), `404` (estudiante inexistente/inactivo).

- `GET /api/admin/HistorialMovimientos`
  - Parámetros opcionales:
    - `id_estudiante`: entero.
    - `dni`: texto; si se envía, el backend resuelve el estudiante y filtra sus movimientos. Si el DNI no existe, retorna `data: []` sin error.
    - `tipo_movimiento`: `asistencia | bonus | cobro | ajuste`.
    - `fecha_inicio`, `fecha_fin`: cadenas ISO8601 (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ssZ`).
    - `limit` (default 50, máximo 200) y `offset` para paginación.
  - Ejemplo de respuesta:
    ```json
    {
      "ok": true,
      "data": [
        {
          "id_movimiento": 815,
          "id_estudiante": 12,
          "estudiante": "María Pérez",
          "tipo_movimiento": "cobro",
          "creditos": -50,
          "motivo": "Compra de kit de bienvenida",
          "nombre_actividad": null,
          "autor": "Luis Gómez",
          "rol_autor": "tutor",
          "created_at": "2025-01-05T14:12:33.851Z"
        }
      ],
      "count": 1
    }
    ```

### QA/manual testing sugerido

1. **Cobro exitoso**: enviar payload válido y verificar que `credito_total`/`cobro_credito` decrecen; confirmar nuevo registro en `/HistorialMovimientos`.
2. **Saldo insuficiente**: intentar descontar más puntos de los disponibles, esperar `400` con mensaje `El estudiante no cuenta con saldo suficiente` y ausencia de movimiento.
3. **Motivo inválido**: motivo vacío o menor a 5 caracteres debe devolver `400`.
4. **Autorización**: realizar la petición con token de estudiante para comprobar respuesta `403`.
5. **Historial filtrado**:
   - Filtrar por `id_estudiante` y `tipo_movimiento=cobro`.
   - Aplicar rangos `fecha_inicio`/`fecha_fin`.
   - Usar `limit` reducido y `offset` para confirmar paginación.
6. **Orden cronológico**: registrar un cobro y luego un bonus/asistencia; listar sin filtros y verificar orden descendente por `created_at`.

### Notas para frontend

1. **Formulario de cobro**:
   - Añadir campo obligatorio “Motivo del cobro” (mínimo 5 caracteres, trim al enviar).
   - Consumir `PUT /api/admin/CobrarPuntos` con `{ id_persona, puntos, motivo }`.
   - Mostrar `msg` de éxito y actualizar saldos con `saldo.credito_total` y `saldo.cobro_credito`.
   - Usar `movimiento` (ID) para enlazar con el historial o mostrar referencia.

2. **Pantalla de historial**:
   - Crear tabla paginada que consuma `GET /api/admin/HistorialMovimientos`.
   - Incluir filtros UI para estudiante, tipo de movimiento y rango de fechas (mapear a query params).
   - Mostrar columnas: fecha, estudiante, tipo (con etiquetas), créditos (negativos en rojo), motivo, autor/rol e identificación de actividad.
   - Implementar paginación con `limit/offset` y estados de carga/error.

3. **Validaciones de cliente**:
   - Prevenir envíos con `puntos <= 0` o motivos cortos para evitar errores 400.
   - Cuando el backend responde `SALDO_INSUFICIENTE`, mantener el formulario editable y resaltar el saldo actual mostrado por la API.

4. **Experiencia de usuario**:
   - Desde el detalle del estudiante, agregar acceso directo al historial con `id_estudiante` prefiltrado.
- Guardar filtros en la URL (query string) para permitir compartir vistas específicas del historial.

## Carga histórica de actividades/asistencias

Para reconstruir créditos de eventos pasados sin exponer IDs internos, los tutores/administradores deben descargar la plantilla protegida (`GET /api/admin/descargar-plantilla-historicos`) y subirla completa. Cada fila representa una asistencia o un bono histórico:

| Columna | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `nombre_actividad` | Texto | Sí | Nombre exacto de la actividad. Se usa como identificador natural. Si no existe, se creará con este nombre. |
| `fecha_actividad` | Fecha (`YYYY-MM-DD`) | Sí | Fecha real del evento; también se usa para registrar la asistencia y validar duplicados (nombre + fecha). |
| `creditos` | Entero ≥ 0 | Sí | Créditos de la actividad. Si la actividad ya existe con otro valor, la fila se marca como error. |
| `semestre` | Texto (`2024-I`, `2024-II`, etc.) | Sí | Se asigna al crear actividades nuevas o para estadísticas. |
| `dni_estudiante` | Texto (8–12) | Sí | Identifica al estudiante. El backend resuelve `id_persona/id_estudiante` a partir del DNI; si no existe, la fila se rechaza. |
| `nombre_estudiante` | Texto | Opcional | Informativo, para validar manualmente. No se usa como clave. |
| `tipo_registro` | Texto (`asistencia`/`bonus`) | Opcional (default `asistencia`) | `asistencia`: inserta/activa fila en `asiste` y suma créditos. `bonus`: solo suma créditos y registra el movimiento. |
| `comentario` | Texto | Opcional | Se guarda como motivo en `historial_movimiento_creditos` (ej. “Carga histórica 2023”). |
| `dni_autor` | Texto | Opcional | DNI del tutor/admin responsable. Si se omite, se usa el usuario autenticado que sube el archivo. |

### Flujo del importador (por implementar)

1. Leer el Excel, normalizar strings y validar encabezados exactos.
2. Por cada fila:
   - Buscar actividad por `nombre_actividad` + `fecha_actividad`. Si no existe, crearla (asignando `creditos`, `semestre`, `fecha_inicio/fin = fecha_actividad`, `id_creador = usuario actual`).
   - Resolver al estudiante activo vía `dni_estudiante`. Si no existe, registrar la fila en el reporte de errores.
   - Si `tipo_registro = asistencia` (default):
     - Insertar o activar registro en `asiste` (`id_estudiante`, `id_actividad`, `fecha_asistencia = fecha_actividad`).
     - Incrementar `credito_total` y `cobro_credito` del estudiante dentro de una transacción.
     - Recalcular nivel (`id_nivel`) si corresponde.
     - Registrar movimiento en `historial_movimiento_creditos` con `tipo_movimiento = 'asistencia'`, `creditos = creditos`, `motivo = comentario` y `id_actividad` seteado.
   - Si `tipo_registro = bonus`:
     - Omitir `asiste`, pero sumar créditos igual y registrar movimiento `tipo = 'bonus'` (sin `id_actividad`).
3. Al finalizar, devolver al usuario un resumen `{ procesadas, errores: [...], actividades_creadas, movimientos_registrados }`.

### Reglas / validaciones

- El encabezado debe coincidir exactamente con los nombres definidos; no se aceptan celdas combinadas ni fórmulas.
- Una combinación `nombre_actividad + fecha_actividad` solo puede crear o actualizar una actividad; si el Excel trae valores contradictorios de créditos, marcar la fila como error.
- Un estudiante no puede tener dos asistencias activas para la misma actividad; duplicados se ignoran con advertencia.
- Todos los montos deben ser enteros; si se ingresan decimales o negativos, la fila se rechaza.
- El archivo debe estar en formato `.xlsx`; cada carga se procesa dentro de una transacción por actividad para asegurar consistencia.

> Nota: Si más adelante se agrega una columna `codigo_actividad` en la tabla, este formato se puede extender para usarla como identificador estable sin depender del nombre.

## Documentacion y pruebas manuales

- Swagger UI disponible en `http://<host>:<port>/docs`.
- `swagger.js` recoge anotaciones JSDoc en `routes/*.js`.
- Para pruebas locales de cookies, usar navegadores que permitan cookies SameSite `lax` (o ajustar `.env`).

## Flujo de desarrollo local

1. Duplicar `.env` con valores seguros para desarrollo (`COOKIE_SECURE=false`, `COOKIE_SAMESITE=lax`, `NODE_ENV=development`).
2. Correr `npm install` y `npm run dev`.
3. Backend escucha por defecto en `http://localhost:3000`.
4. Swagger sirve como referencia rapida de payloads.
5. Ejecutar `npm run format` antes de crear un commit.

## Guia de despliegue

1. Establecer `NODE_ENV=production`.
2. Definir `SESSION_SECRET`, `JWT_SECRET`, `COOKIE_RMA_cokie` y demas secretos en el proveedor (Render, Railway, etc.).
3. Configurar `COOKIE_SECURE=true` y `COOKIE_SAMESITE=none` si el frontend vive en dominio diferente y opera sobre HTTPS.
4. Definir `URL_FRONT` con la URL publica del frontend (usar https).
5. Proveer un Session Store persistente: por ejemplo Redis (via `connect-redis`) o Postgres (via `connect-pg-simple`). Cambiar la configuracion de `express-session` en `index.js`.
6. Ajustar y proteger endpoints sensibles (`registerME`, logs con datos) antes de exponer a internet.
7. Verificar conectividad de la base (`DATABASE_URL`) y el schema requerido por los modelos.
8. Utilizar `npm start` o un process manager (PM2, Docker) para ejecutar el servicio.

## Buenas practicas y pendientes

- Reemplazar el MemoryStore por un store persistente antes de produccion.
- Limpiar logs sensibles y reemplazarlos por una libreria de logging (p. ej. `pino`).
- Agregar validaciones adicionales en endpoints masivos (`registerME`, cargas Excel).
- Incorporar pruebas automatizadas (no existen tests en el repositorio).
- Documentar y versionar el schema SQL (scripts de migracion).
- Configurar pipeline de formato (`npm run format`) y linting en CI/CD.

## Soporte y mantenimiento

- Consultar `swagger.js` y las anotaciones en `routes/` para mantener la documentacion sincronizada.
- Verificar rotacion periodica de claves (`SESSION_SECRET`, `JWT_SECRET`, `COOKIE_RMA_cokie`).
- Supervisar tablas `refresh_tokens` para evitar crecimiento ilimitado (agregar procesos de limpieza si es necesario).
- Asegurar backups periodicos de la base PostgreSQL.
- `POST /api/admin/BonificarPuntos`
  - Requiere roles `tutor` o `administrador`.
  - Cuerpo JSON:
    ```json
    {
      "id_persona": 42,
      "puntos": 25,
      "motivo": "Reconocimiento por liderazgo",
      "id_actividad": 18
    }
    ```
    `id_actividad` es opcional y sirve para enlazar la bonificación con una actividad existente.
  - Respuesta:
    ```json
    {
      "ok": true,
      "msg": "Puntos bonificados correctamente",
      "saldo": {
        "credito_total": 145,
        "cobro_credito": 95
      },
      "movimiento": 912
    }
    ```
  - Errores: `400` (validación), `403` (rol no autorizado), `404` (estudiante o actividad inexistente).
