import { AdminModel } from '../models/admin.model.js';
import bcryptjs from 'bcryptjs';

const crearActividad = async (req, res) => {
  try {
    const idPersona = req.id_persona;
    const { nombre_actividad, fecha_inicio, fecha_fin, lugar, creditos, semestre } = req.body;
    console.log(idPersona);
    console.log(req.body);

    //init validator datos

    //fin validatordatos
    const newActividad = await AdminModel.creaActividad({
      idPersona,
      nombre_actividad,
      fecha_inicio,
      fecha_fin,
      lugar,
      creditos,
      semestre,
    });

    return res.status(201).json({
      msg: 'Actividad creada correctamente',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error server',
    });
  }
};

const DeleteActividad = async (req, res) => {
  try {
    const id_actividad = req.query.id_actividad;
    const existe = await AdminModel.actividadExiste({ id_actividad });

    if (!existe) {
      return res.status(404).json({ error: 'No existe la actividad' });
    }
    const delteES = await AdminModel.DeleteActividad({ id_actividad });

    if (delteES) {
      return res.status(200).json({ ok: 'Se eimino correctamente' });
    }
    return res.status(500).json({
      msg: 'No se peudo procesar',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};

const MostrarActividad = async (req, res) => {
  try {
    const fecha_inicio = req.query.fecha_inicio;
    const fecha_fin = req.query.fecha_fin;
    console.log(fecha_inicio);
    console.log(fecha_fin);
    const existe = await AdminModel.mostrarActividad({ fecha_inicio, fecha_fin });

    return res.status(200).json(existe);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};

const obtenerActividadesPorSemestre = async (req, res) => {
  try {
    const rawIdSemestre = req.query.id_semestre;
    const idSemestreCandidate = rawIdSemestre && rawIdSemestre !== 'todos' ? Number(rawIdSemestre) : null;
    const idSemestre = Number.isNaN(idSemestreCandidate) ? null : idSemestreCandidate;

    const actividades = await AdminModel.listarActividadesPorSemestre({ idSemestre });
    return res.status(200).json(actividades);
  } catch (error) {
    console.error('Error al obtener actividades por semestre:', error);
    return res.status(500).json({
      msg: 'Error al obtener actividades por semestre',
    });
  }
};

const obtenerAsistenciaActividad = async (req, res) => {
  try {
    const rawIdActividad = req.query.id_actividad;
    const idActividad = rawIdActividad ? Number(rawIdActividad) : null;

    if (!idActividad || Number.isNaN(idActividad)) {
      return res.status(400).json({ msg: 'id_actividad inválido' });
    }

    const asistentes = await AdminModel.listarAsistenciaPorActividad({ idActividad });
    return res.status(200).json(asistentes);
  } catch (error) {
    console.error('Error al obtener asistencia de la actividad:', error);
    return res.status(500).json({
      msg: 'Error al obtener asistencia de la actividad',
    });
  }
};

export const AdminActividadController = {
  crearActividad,
  DeleteActividad,
  MostrarActividad,
  obtenerActividadesPorSemestre,
  obtenerAsistenciaActividad,
};
