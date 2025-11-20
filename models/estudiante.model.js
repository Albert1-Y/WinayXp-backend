const { db } = require("../database/connection.database.js");

//retorna todo los datos del estudainate para ROL estudiante
const DatosEstudianteInit = async ({ id_persona }) => {
  const query = {
    text: `
            SELECT 
                p.dni,
                p.nombre_persona,
                p.apellido,
                p.email,
                p.rol,
                e.semestre,
                e.credito_total,
                e.cobro_credito,
                e.id_nivel,
                COALESCE(e.ultimo_nivel_visto, 0) AS ultimo_nivel_visto,
                c.nombre_carrera,
                n.id_nivel AS nivel_id,
                n.nombre_nivel,
                n.descripcion AS descripcion_nivel,
                n.nombre_imagen,
                n.rango_inicio,
                n.rango_fin
            FROM persona p
            JOIN estudiante e ON p.id_persona = e.id_persona
            LEFT JOIN carrera c ON e.id_carrera = c.id_carrera
            LEFT JOIN niveles n ON e.id_nivel = n.id_nivel
            WHERE p.id_persona = $1 AND p.rol = 'estudiante'
        `,
    values: [id_persona],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0];
  } catch (error) {
    console.error("Error al obtener datos del estudiante:", error);
    throw error;
  }
};

const listarMovimientosHistorico = async ({ id_persona, limit = 50 }) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

  const query = {
    text: `
        SELECT
          hmc.id_movimiento,
          hmc.tipo_movimiento,
          hmc.creditos,
          hmc.motivo,
          hmc.created_at AS fecha_asistencia,
          hmc.id_actividad,
          act.nombre_actividad,
          p_autor.nombre_persona || ' ' || p_autor.apellido AS autor,
          hmc.rol_autor
        FROM historial_movimiento_creditos hmc
        INNER JOIN estudiante e ON hmc.id_estudiante = e.id_estudiante
        INNER JOIN persona p ON e.id_persona = p.id_persona
        LEFT JOIN actividad act ON hmc.id_actividad = act.id_actividad
        LEFT JOIN persona p_autor ON hmc.id_autor = p_autor.id_persona
        WHERE p.id_persona = $1
        ORDER BY hmc.created_at DESC
        LIMIT $2
      `,
    values: [id_persona, safeLimit],
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error al obtener historial del estudiante:", error);
    return [];
  }
};

const marcarNivelVisto = async ({ id_estudiante, id_persona, id_nivel }) => {
  const filtros = [];
  const valores = [];

  if (id_estudiante) {
    valores.push(id_estudiante);
    filtros.push(`id_estudiante = $${valores.length}`);
  } else if (id_persona) {
    valores.push(id_persona);
    filtros.push(`id_persona = $${valores.length}`);
  } else {
    throw new Error("IDENTIFICADOR_ESTUDIANTE_REQUERIDO");
  }

  if (!id_nivel || Number.isNaN(Number(id_nivel))) {
    throw new Error("NIVEL_INVALIDO");
  }

  valores.push(Number(id_nivel));
  const nivelIndex = valores.length;

  if (filtros.length === 0) {
    throw new Error("IDENTIFICADOR_ESTUDIANTE_REQUERIDO");
  }

  const query = {
    text: `
            UPDATE estudiante
            SET ultimo_nivel_visto = GREATEST(COALESCE(ultimo_nivel_visto, 0), $${nivelIndex})
            WHERE ${filtros.join(' AND ')}
            RETURNING ultimo_nivel_visto
        `,
    values: valores,
  };

  try {
    const { rows } = await db.query(query);
    return rows[0]?.ultimo_nivel_visto || null;
  } catch (error) {
    console.error("Error al actualizar último nivel visto:", error.message);
    throw error;
  }
};

const EstudianteModel = {
  DatosEstudianteInit,
  listarMovimientosHistorico,
  marcarNivelVisto,
};

module.exports = { EstudianteModel };
