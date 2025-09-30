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

const actualizarActividad = async (req, res) => {
  try {
    const {
      id_actividad,
      nombre_actividad,
      lugar,
      creditos,
      semestre,
      fecha_inicio,
      fecha_fin,
    } = req.body || {};

    const idActividad = Number(id_actividad);

    if (!idActividad || Number.isNaN(idActividad)) {
      return res.status(400).json({ msg: 'id_actividad es requerido' });
    }

    const existe = await AdminModel.actividadExiste({ id_actividad: idActividad });
    if (!existe) {
      return res.status(404).json({ msg: 'Actividad no encontrada' });
    }

    let creditosNormalizados;
    if (creditos !== undefined) {
      if (creditos === null || creditos === '') {
        creditosNormalizados = null;
      } else {
        creditosNormalizados = Number(creditos);
        if (Number.isNaN(creditosNormalizados)) {
          return res.status(400).json({ msg: 'Créditos inválidos' });
        }
      }
    }

    const actividadActualizada = await AdminModel.actualizarActividad({
      id_actividad: idActividad,
      nombre_actividad,
      lugar,
      creditos: creditos !== undefined ? creditosNormalizados : undefined,
      semestre,
      fecha_inicio,
      fecha_fin,
    });

    return res.status(200).json({ ok: true, actividad: actividadActualizada });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    return res.status(500).json({ msg: 'Error al actualizar actividad' });
  }
};

const actualizarAsistenciaEstudiante = async (req, res) => {
  try {
    const { id_persona, id_estudiante, id_actividad, estado } = req.body || {};

    if (!id_actividad || Number.isNaN(Number(id_actividad))) {
      return res.status(400).json({ msg: 'id_actividad es requerido' });
    }

    const estadoNormalizado =
      typeof estado === 'boolean' ? estado : estado === 'true' ? true : estado === 'false' ? false : null;

    if (estadoNormalizado === null) {
      return res.status(400).json({ msg: 'estado debe ser booleano' });
    }

    let estudianteId = Number(id_estudiante) || null;

    if (!estudianteId && id_persona) {
      const estudiante = await AdminModel.obtenerEstudiantePorIdPersona({ id_persona });
      if (!estudiante) {
        return res.status(404).json({ msg: 'Estudiante no encontrado' });
      }
      estudianteId = estudiante.id_estudiante;
    }

    if (!estudianteId) {
      return res.status(400).json({ msg: 'Debe proporcionar id_estudiante o id_persona' });
    }

    const idActividad = Number(id_actividad);

    const { asistencia, totales } = await AdminModel.guardarAsistenciaEstudiante({
      id_estudiante: estudianteId,
      id_actividad: idActividad,
      estado: estadoNormalizado,
    });

    if (!asistencia) {
      return res.status(200).json({
        ok: true,
        totales,
        msg: estadoNormalizado
          ? 'No se pudo registrar la asistencia'
          : 'Asistencia desactivada',
      });
    }

    return res.status(200).json({ ok: true, asistencia, totales });
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    if (error.message === 'ACTIVIDAD_NO_ENCONTRADA') {
      return res.status(404).json({ msg: 'Actividad no encontrada' });
    }
    return res.status(500).json({ msg: 'Error al actualizar asistencia' });
  }
};

export const AdminActividadController = {
  crearActividad,
  DeleteActividad,
  MostrarActividad,
  actualizarActividad,
  obtenerActividadesPorSemestre,
  obtenerAsistenciaActividad,
  actualizarAsistenciaEstudiante,
};
