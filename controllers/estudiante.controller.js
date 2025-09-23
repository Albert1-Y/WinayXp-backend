import { EstudianteModel } from '../models/estudiante.model.js';
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
};
