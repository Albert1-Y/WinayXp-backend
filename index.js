import 'dotenv/config'
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from "cors"; 
import userRouter from './routes/user.route.js'


import adminRouter from './routes/admin.route.js'
import estudianteRouter from './routes/estudainte.toute.js'
const app = express();
app.use(cors({
    origin:  process.env.URL_FRONT
    ,  
    credentials: true  
}));
//console.log = function () {};
app.use(cookieParser( process.env.FIRMA_cokie));
app.use(express.json())
//app.use(express.urlencoded({ extended: true }))
//app.use(express.static('public'))

//app.use('/', publicRouter)
app.use('/cedhi/estudiante',estudianteRouter)
app.use('/cedhi/admin', adminRouter)
app.use('/cedhi/', userRouter)
//app.use('/cedhi/tutor', petRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Servidor andando en ' + PORT))