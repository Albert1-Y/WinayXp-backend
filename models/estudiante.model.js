import { db } from '../database/connection.database.js';

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
                c.nombre_carrera,
                n.nombre_nivel,
                n.nombre_imagen
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
    console.error('Error al obtener datos del estudiante:', error);
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
    console.error('Error al obtener actividades asistidas:', error);
    return [];
  }
};

export const EstudianteModel = {
  DatosEstudianteInit,
  listarActividadesAsistidas,
};
