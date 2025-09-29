import { EstudianteModel } from '../models/estudiante.model.js';
import { UserModel } from '../models/user.model.js';
import ms from 'ms';

const InitEstudiante = async (req, res) => {
  try {
    const id_persona = req.id_persona;
    const data = await EstudianteModel.DatosEstudianteInit({ id_persona });
    console.log(data);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
export const EstudianteController = {
  InitEstudiante,
  TopEstudiantesCarrera: async (req, res) => {
    try {
      const carrera = req.query.carrera;
      if (!carrera) {
        const data = await UserModel.rankingtop();
        return res.status(200).json(data);
      }
      const data = await UserModel.rankingtopByCarrera(carrera);
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: 'Error server' });
    }
  },
  getActividadesAsistidas: async (req, res) => {
    try {
      const id_persona = req.id_persona;
      const actividades = await EstudianteModel.listarActividadesAsistidas({ id_persona });
      return res.status(200).json(actividades);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: 'Error al obtener actividades asistidas' });
    }
  },
};
