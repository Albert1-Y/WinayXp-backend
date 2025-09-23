import { db } from '../database/connection.database.js';

const creaPersona = async ({ dni, email, password, nombre_persona, apellido, rol }) => {
  const query = {
    text: `
       
        INSERT INTO persona (dni, email, nombre_persona, apellido, rol)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_persona, dni, email, nombre_persona, rol
        `,
    values: [dni, email, nombre_persona, apellido, rol],
  };

  const { rows } = await db.query(query);
  const persona = rows[0];

  const credencialesQuery = {
    text: `
            INSERT INTO credenciales (id_persona, password)
            VALUES ($1, $2)
            RETURNING id_credencial, id_persona
            `,
    values: [persona.id_persona, password],
  };

  await db.query(credencialesQuery);

  return { id_persona: persona.id_persona };
};

const creaEstudiante = async ({
  dni,
  email,
  password,
  nombre_persona,
  apellido,
  rol,
  carrera,
  semestre,
}) => {
  try {
    const persona = await creaPersona({
      dni,
      email,
      password,
      nombre_persona,
      apellido,
      rol: 'estudiante',
    });

    const buscarCarreraQuery = {
      text: `SELECT id_carrera FROM carrera WHERE nombre_carrera = $1`, // Corregido a nombre_carrera
      values: [carrera],
    };

    const resultadoCarrera = await db.query(buscarCarreraQuery);
    let id_carrera;

    if (resultadoCarrera.rows.length > 0) {
      id_carrera = resultadoCarrera.rows[0].id_carrera;
    } else {
      const insertarCarreraQuery = {
        text: `INSERT INTO carrera (nombre_carrera) VALUES ($1) RETURNING id_carrera`, // Corregido a nombre_carrera
        values: [carrera],
      };

      const insertCarreraResult = await db.query(insertarCarreraQuery);
      id_carrera = insertCarreraResult.rows[0].id_carrera;
    }

    const estudianteQuery = {
      text: `
                INSERT INTO estudiante (id_persona, id_carrera, semestre)
                VALUES ($1, $2, $3)
            `,
      values: [persona.id_persona, id_carrera, semestre],
    };

    await db.query(estudianteQuery);
    return true;
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    return false;
  }
};
const creaActividad = async ({
  idPersona,
  nombre_actividad,
  fecha_inicio,
  fecha_fin,
  lugar,
  creditos,
  semestre,
}) => {
  try {
    const resultadoSemestre = await db.query('SELECT buscar_o_crear_semestre($1) AS id_semestre', [
      semestre,
    ]);

    const id_semestre = resultadoSemestre.rows[0].id_semestre;

    const query = {
      text: `
                INSERT INTO actividad (
                    nombre_actividad,
                    fecha_inicio,
                    fecha_fin,
                    lugar,
                    creditos,
                    id_creador,
                    id_semestre
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING 
                    id_actividad, nombre_actividad, fecha_inicio, 
                    fecha_fin, lugar, creditos, id_creador, id_semestre, activo
            `,
      values: [nombre_actividad, fecha_inicio, fecha_fin, lugar, creditos, idPersona, id_semestre],
    };

    const { rows } = await db.query(query);
    return rows[0];
  } catch (error) {
    console.error('Error al crear la actividad:', error);
    throw error;
  }
};
const dataAlumno = async ({ dni }) => {
  try {
    const resultado = await db.query(
      `SELECT 
                p.id_persona,
                p.dni,
                p.nombre_persona,
                p.apellido,
                p.email,
                c.nombre_carrera AS carrera,  
                e.semestre,
                e.credito_total,
                e.cobro_credito,
                n.nombre_nivel AS nivel
             FROM persona p
             JOIN estudiante e ON p.id_persona = e.id_persona
             JOIN carrera c ON e.id_carrera = c.id_carrera
             LEFT JOIN niveles n ON e.id_nivel = n.id_nivel
             WHERE p.dni = $1 AND p.rol = 'estudiante' AND p.activo = TRUE`,
      [dni]
    );

    if (resultado.rows.length === 0) {
      return null;
    }

    return resultado.rows[0];
  } catch (error) {
    console.error('Error al consultar persona por DNI:', error);
    throw error;
  }
};
const DeleteAlumno = async ({ id_persona }) => {
  await db.query('BEGIN');

  try {
    const deactivateEstudianteQuery = {
      text: `
                UPDATE estudiante
                SET activo = FALSE
                WHERE id_persona = $1
            `,
      values: [id_persona],
    };

    await db.query(deactivateEstudianteQuery);

    const deactivateCredencialesQuery = {
      text: `
                UPDATE credenciales
                SET activo = FALSE
                WHERE id_persona = $1
            `,
      values: [id_persona],
    };

    await db.query(deactivateCredencialesQuery);

    const deactivateAsisteQuery = {
      text: `
                UPDATE asiste
                SET activo = FALSE
                WHERE id_estudiante IN (SELECT id_estudiante FROM estudiante WHERE id_persona = $1)
            `,
      values: [id_persona],
    };

    await db.query(deactivateAsisteQuery);

    const deactivatePersonaQuery = {
      text: `
                UPDATE persona
                SET activo = FALSE
                WHERE id_persona = $1
            `,
      values: [id_persona],
    };

    await db.query(deactivatePersonaQuery);

    const deleteRefreshTokenQuery = {
      text: `
                DELETE FROM refresh_tokens
                WHERE id_persona = $1
            `,
      values: [id_persona],
    };

    await db.query(deleteRefreshTokenQuery);

    await db.query('COMMIT');

    return true;
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al desactivar estudiante y sus registros:', error);
    return false;
  }
};
const actividadExiste = async ({ id_actividad }) => {
  const query = {
    text: `
            SELECT EXISTS (
                SELECT 1 
                FROM actividad 
                WHERE id_actividad = $1 AND activo = TRUE
            ) AS existe
        `,
    values: [id_actividad],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0].existe;
  } catch (error) {
    console.error('Error al verificar existencia de la actividad:', error);
    return false;
  }
};
const mostrarActividad = async ({ fecha_inicio, fecha_fin }) => {
  const query = {
    text: `
            SELECT id_actividad, nombre_actividad, lugar, creditos, semestre, nombre_persona, apellido
            FROM actividad a
            JOIN persona p ON a.id_creador = p.id_persona
            JOIN semestre s ON a.id_semestre = s.id_semestre
            WHERE a.activo = TRUE
              AND DATE(a.fecha_inicio) >= $1::date
              AND DATE(a.fecha_fin) <= $2::date
        `,
    values: [fecha_inicio, fecha_fin],
  };

  try {
    const { rows } = await db.query(query);
    console.log(rows);
    return rows;
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    return [];
  }
};
const DeleteActividad = async ({ id_actividad }) => {
  await db.query('BEGIN');

  try {
    const deactivateAsisteQuery = {
      text: `
                UPDATE asiste
                SET activo = FALSE
                WHERE id_actividad = $1
            `,
      values: [id_actividad],
    };
    await db.query(deactivateAsisteQuery);

    const deactivateActividadQuery = {
      text: `
                UPDATE actividad
                SET activo = FALSE
                WHERE id_actividad = $1
            `,
      values: [id_actividad],
    };
    await db.query(deactivateActividadQuery);

    await db.query('COMMIT');
    return true;
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al desactivar la actividad:', error);
    return false;
  }
};
const mostrarEstudiantes = async () => {
  try {
    const query = {
      text: `
                SELECT 
                    c.nombre_carrera AS carrera,
                    e.semestre,
                    e.credito_total,
                    e.cobro_credito,
                    p.id_persona,
                    p.dni,
                    p.nombre_persona,
                    p.apellido,
                    p.email,
                    p.rol,
                    n.nombre_nivel AS nivel
                FROM estudiante e
                INNER JOIN persona p ON e.id_persona = p.id_persona
                LEFT JOIN carrera c ON e.id_carrera = c.id_carrera
                LEFT JOIN niveles n ON e.id_nivel = n.id_nivel
                WHERE p.activo = TRUE
                ORDER BY p.id_persona
                LIMIT 20
            `,
    };

    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo datos de estudiantes:', error.message);
    return [];
  }
};
const mostrarTutores = async () => {
  try {
    const query = {
      text: `
                SELECT 
                    p.id_persona,
                    p.dni,
                    p.nombre_persona,
                    p.apellido,
                    p.email
                FROM persona p
                WHERE p.activo = TRUE
                  AND p.rol = 'tutor'
            `,
    };

    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo datos de tutores:', error.message);
    return [];
  }
};
const eliminarTutor = async ({ id_persona }) => {
  try {
    await db.query('BEGIN');

    await db.query({
      text: `
                UPDATE persona
                SET activo = FALSE
                WHERE id_persona = $1
                  AND rol = 'tutor'
            `,
      values: [id_persona],
    });

    await db.query({
      text: `
                UPDATE credenciales
                SET activo = FALSE
                WHERE id_persona = $1
            `,
      values: [id_persona],
    });

    await db.query('COMMIT');
    console.log('Tutor eliminado lógicamente.');
    return true;
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error eliminando tutor:', error.message);
    return false;
  }
};
export const AdminModel = {
  creaPersona,
  creaEstudiante,
  creaActividad,
  dataAlumno,
  DeleteAlumno,
  DeleteActividad,
  actividadExiste,
  mostrarActividad,
  mostrarEstudiantes,
  mostrarTutores,
  eliminarTutor,
};
