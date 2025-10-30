import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import path from "path";
import userRouter from "./routes/user.route.js";

import session from "express-session";

import passport from "./middlewares/passport.js";

import { swaggerUiMiddleware, swaggerUiSetup } from "./swagger.js";

import adminRouter from "./routes/admin.route.js";
import estudianteRouter from "./routes/estudainte.toute.js";
const app = express();

app.set("trust proxy", 1); // trust Render/Heroku style reverse proxies for secure cookies

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
    },
  }),
);

const allowedOrigins = (process.env.URL_FRONT || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
//console.log = function () {};
app.use(cookieParser(process.env.COOKIE_RMA_cokie));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
//app.use(express.urlencoded({ extended: true }))
//app.use(express.static('public'))

//app.use('/', publicRouter)
app.use("/api/estudiante", estudianteRouter);
app.use("/api/admin", adminRouter);
app.use("/api", userRouter);
//app.use('/cedhi/tutor', petRouter)

app.use("/docs", swaggerUiMiddleware, swaggerUiSetup);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Servidor andando en " + PORT));
