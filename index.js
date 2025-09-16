import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';

// Routers
import userRouter from './routes/user.route.js';
import adminRouter from './routes/admin.route.js';
import estudianteRouter from './routes/estudainte.toute.js';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();

// Middlewares base
app.use(cors({
  origin: process.env.URL_FRONT,
  credentials: true,
}));
app.use(cookieParser(process.env.FIRMA_cokie));
app.use(express.json());

// Montaje de rutas
app.use('/cedhi/estudiante', estudianteRouter);
app.use('/cedhi/admin', adminRouter);
app.use('/cedhi', userRouter);

// ---- Swagger / OpenAPI ----
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CEDHI API',
      version: '1.0.0',
      description: 'Documentación de endpoints (Node + Express)',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local' },
      // { url: 'https://tu-dominio', description: 'Producción' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'auth_token' },
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  },
  // 👉 lee anotaciones en este archivo y en todos los routers:
  apis: ['./index.js', './routes/*.js'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('📖 Swagger UI listo en: http://localhost:3000/docs');

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Servidor andando en puerto ' + PORT));
