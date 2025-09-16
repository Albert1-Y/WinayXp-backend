import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';

// Routers principales
import userRouter from './routes/user.route.js';
import adminRouter from './routes/admin.route.js';
import estudianteRouter from './routes/estudiante.route.js';
import authRoutes from './routes/authRoutes.js';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();

// === Middlewares base ===
app.use(cors({
  origin: process.env.URL_FRONT || process.env.APP_ORIGIN,
  credentials: true,
}));
app.use(cookieParser(process.env.FIRMA_cokie));
app.use(express.json());

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: ORIGIN,
  credentials: true,
}));
app.set('trust proxy', 1); // si estás detrás de docker/proxy

// === Montaje de rutas ===
app.use('/cedhi/estudiante', estudianteRouter);
app.use('/cedhi/admin', adminRouter);
app.use('/cedhi', userRouter);
app.use('/', authRoutes); // 👈 login con Google, /me, /logout

// === Swagger / OpenAPI ===
// index.js (donde creas swaggerSpec)
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'CEDHI API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3000', description: 'Local' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'app_session' },
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        UserBasic: {
          type: 'object',
          properties: {
            id_persona: { type: 'integer', example: 123 },
            email: { type: 'string', format: 'email', example: 'alumno@institucion.edu' },
            rol: { type: 'string', example: 'estudiante' },
            estado: { type: 'string', example: 'activo' }
          },
          required: ['id_persona', 'email', 'rol', 'estado']
        },
        AuthResult: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            user: { $ref: '#/components/schemas/UserBasic' }
          },
          required: ['ok', 'user']
        }
      }
    }
  },
  apis: ['./index.js', './routes/*.js'],
});


app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('📖 Swagger UI listo en: http://localhost:3000/docs');

// === Servidor ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Servidor andando en puerto ' + PORT));
