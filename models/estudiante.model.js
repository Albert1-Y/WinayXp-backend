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

const listarActividadesAsistidas = async ({ id_persona }) => {
  const query = {
    text: `
            SELECT
                a.id_actividad,
                a.nombre_actividad,
                a.fecha_inicio,
                a.fecha_fin,
                a.lugar,
                a.creditos,
                COALESCE(s.semestre, 'Sin periodo') AS semestre,
                asis.fecha_asistencia
            FROM asiste asis
            INNER JOIN estudiante e ON asis.id_estudiante = e.id_estudiante
            INNER JOIN actividad a ON asis.id_actividad = a.id_actividad
            LEFT JOIN semestre s ON a.id_semestre = s.id_semestre
            WHERE e.id_persona = $1
              AND a.activo = TRUE
              AND (asis.activo IS NULL OR asis.activo = TRUE)
            ORDER BY a.fecha_inicio DESC
        `,
    values: [id_persona],
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error al obtener actividades asistidas:", error);
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
            WHERE ${filtros.join(" AND ")}
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
  listarActividadesAsistidas,
  marcarNivelVisto,
};

module.exports = { EstudianteModel };
