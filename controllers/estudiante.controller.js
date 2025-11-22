const { EstudianteModel } = require('../models/estudiante.model.js');
const { UserModel } = require('../models/user.model.js');
const { NivelModel } = require('../models/nivel.model.js');
const ms = require('ms');

const InitEstudiante = async (req, res) => {
  try {
    const id_persona = req.id_persona;
    const data = await EstudianteModel.DatosEstudianteInit({ id_persona });
    console.log(data);

    if (!data) {
      return res.status(404).json({ msg: 'Estudiante no encontrado' });
    }

    const creditosTotales = Number(data.credito_total || 0);
    const nivelActual = await NivelModel.obtenerNivelPorCreditos({
      creditos: creditosTotales,
    });

    const ultimoNivelVisto = Number(data.ultimo_nivel_visto || 0);
    let nivelesPendientes = [];
    if (nivelActual && nivelActual.id_nivel > ultimoNivelVisto) {
      nivelesPendientes = await NivelModel.listarNivelesPendientes({
        desde: ultimoNivelVisto,
        hasta: nivelActual.id_nivel,
      });
    }

    let progresoEnNivel = 0;
    if (nivelActual) {
      const rangoInicio = Number(nivelActual.rango_inicio || 0);
      const rangoFin = Number(nivelActual.rango_fin || rangoInicio);
      if (rangoFin <= rangoInicio) {
        progresoEnNivel = creditosTotales > rangoInicio ? 100 : 0;
      } else {
        progresoEnNivel = Math.min(
          100,
          Math.max(0, ((creditosTotales - rangoInicio) / (rangoFin - rangoInicio)) * 100)
        );
      }
    }

    return res.status(200).json({
      ...data,
      nivel: nivelActual
        ? {
            ...nivelActual,
            progreso: Number(progresoEnNivel.toFixed(2)),
          }
        : null,
      niveles_pendientes: nivelesPendientes,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
const getActividadesAsistidas = async (req, res) => {
  try {
    const id_persona = req.id_persona;
    const limit = Number(req.query.limit) || 50;
    const actividades = await EstudianteModel.listarMovimientosHistorico({
      id_persona,
      limit,
    });
    return res.status(200).json(actividades);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: 'Error al obtener historial de movimientos' });
  }
};

const confirmarNivelesVistos = async (req, res) => {
  try {
    const id_persona = req.id_persona;
    const { id_nivel } = req.body || {};

    if (!id_nivel || Number.isNaN(Number(id_nivel))) {
      return res.status(400).json({ msg: 'id_nivel inválido' });
    }

    const ultimo = await EstudianteModel.marcarNivelVisto({
      id_persona,
      id_nivel: Number(id_nivel),
    });

    return res.status(200).json({ ok: true, ultimo_nivel_visto: ultimo });
  } catch (error) {
    console.error('Error al confirmar niveles vistos:', error);
    return res.status(500).json({ msg: 'Error al confirmar niveles vistos' });
  }
};

const listarNiveles = async (req, res) => {
  try {
    const id_persona = req.id_persona;
    const data = await EstudianteModel.DatosEstudianteInit({ id_persona });
    if (!data) {
      return res.status(404).json({ msg: 'Estudiante no encontrado' });
    }

    const niveles = await NivelModel.listarTodosLosNiveles();
    const nivelActualBase = data.id_nivel
      ? niveles.find((nivel) => nivel.id_nivel === data.id_nivel) || null
      : null;

    let progresoEnNivel = 0;
    if (nivelActualBase) {
      const rangoInicio = Number(nivelActualBase.rango_inicio || 0);
      const rangoFin = Number(nivelActualBase.rango_fin || rangoInicio);
      const creditosTotales = Number(data.credito_total || 0);
      if (rangoFin <= rangoInicio) {
        progresoEnNivel = creditosTotales > rangoInicio ? 100 : 0;
      } else {
        progresoEnNivel = Math.min(
          100,
          Math.max(0, ((creditosTotales - rangoInicio) / (rangoFin - rangoInicio)) * 100)
        );
      }
    }

    return res.status(200).json({
      ok: true,
      niveles,
      nivel_actual: nivelActualBase
        ? {
            ...nivelActualBase,
            progreso: Number(progresoEnNivel.toFixed(2)),
          }
        : null,
    });
  } catch (error) {
    console.error('Error al listar niveles:', error);
    return res.status(500).json({ msg: 'Error al obtener niveles' });
  }
};

const EstudianteController = {
  InitEstudiante,
  getActividadesAsistidas,
  confirmarNivelesVistos,
  listarNiveles,
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
};

module.exports = { EstudianteController };
