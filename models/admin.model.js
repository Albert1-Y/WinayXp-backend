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
const actualizarActividad = async ({
  id_actividad,
  nombre_actividad,
  lugar,
  creditos,
  semestre,
  fecha_inicio,
  fecha_fin,
}) => {
  if (!id_actividad) {
    throw new Error('id_actividad es requerido');
  }

  const updates = [];
  const values = [id_actividad];
  let paramIndex = 2;

  const pushUpdate = (clause, value) => {
    updates.push(`${clause} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  };

  if (nombre_actividad !== undefined) {
    pushUpdate('nombre_actividad', nombre_actividad);
  }

  if (lugar !== undefined) {
    pushUpdate('lugar', lugar);
  }

  if (creditos !== undefined) {
    pushUpdate('creditos', creditos);
  }

  const normalizarFecha = (valor) => {
    if (valor === undefined) return undefined;
    if (valor === null || valor === '') return null;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return null;
    }
    return fecha.toISOString();
  };

  const fechaInicioNormalizada = normalizarFecha(fecha_inicio);
  if (fecha_inicio !== undefined) {
    pushUpdate('fecha_inicio', fechaInicioNormalizada);
  }

  const fechaFinNormalizada = normalizarFecha(fecha_fin);
  if (fecha_fin !== undefined) {
    pushUpdate('fecha_fin', fechaFinNormalizada);
  }

  if (semestre !== undefined && semestre !== null) {
    if (typeof semestre === 'string' && semestre.trim().length > 0) {
      const { rows } = await db.query('SELECT buscar_o_crear_semestre($1) AS id_semestre', [semestre.trim()]);
      const idSemestre = rows[0]?.id_semestre || null;
      if (idSemestre !== null) {
        pushUpdate('id_semestre', idSemestre);
      }
    }
  }

  if (updates.length === 0) {
    const refresco = await db.query(
      `SELECT 
          a.id_actividad,
          a.nombre_actividad,
          a.lugar,
          a.creditos,
          a.fecha_inicio,
          a.fecha_fin,
          a.id_semestre,
          COALESCE(s.semestre::text, 'Sin periodo') AS semestre
        FROM actividad a
        LEFT JOIN semestre s ON a.id_semestre = s.id_semestre
        WHERE a.id_actividad = $1`,
      [id_actividad]
    );
    return refresco.rows[0] || null;
  }

  const updateQuery = {
    text: `
            UPDATE actividad
            SET ${updates.join(', ')}
            WHERE id_actividad = $1
            RETURNING 
              id_actividad, nombre_actividad, lugar, creditos, fecha_inicio, fecha_fin, id_semestre
        `,
    values,
  };

  const { rows } = await db.query(updateQuery);
  if (rows.length === 0) {
    return null;
  }

  const actualizado = rows[0];
  const detalle = await db.query(
    `SELECT 
        a.id_actividad,
        a.nombre_actividad,
        a.lugar,
        a.creditos,
        a.fecha_inicio,
        a.fecha_fin,
        a.id_semestre,
        COALESCE(s.semestre::text, 'Sin periodo') AS semestre
      FROM actividad a
      LEFT JOIN semestre s ON a.id_semestre = s.id_semestre
      WHERE a.id_actividad = $1`,
    [actualizado.id_actividad]
  );

  return detalle.rows[0] || actualizado;
};
const dataAlumno = async ({ dni, id_persona }) => {
  try {
    const condiciones = ['p.rol = \'estudiante\'', 'p.activo = TRUE'];
    const valores = [];

    if (dni) {
      valores.push(dni);
      condiciones.push(`p.dni = $${valores.length}`);
    }

    if (id_persona) {
      valores.push(id_persona);
      condiciones.push(`p.id_persona = $${valores.length}`);
    }

    if (valores.length === 0) {
      return null;
    }

    const query = {
      text: `
            SELECT 
                p.id_persona,
                p.dni,
                p.nombre_persona,
                p.apellido,
                p.email,
                c.nombre_carrera AS carrera,  
                e.id_estudiante,
                e.semestre,
                e.credito_total,
                e.cobro_credito,
                n.nombre_nivel AS nivel
            FROM persona p
            JOIN estudiante e ON p.id_persona = e.id_persona
            JOIN carrera c ON e.id_carrera = c.id_carrera
            LEFT JOIN niveles n ON e.id_nivel = n.id_nivel
            WHERE ${condiciones.join(' AND ')}`,
      values: valores,
    };

    const resultado = await db.query(query);

    if (resultado.rows.length === 0) {
      return null;
    }

    return resultado.rows[0];
  } catch (error) {
    console.error('Error al consultar persona por DNI:', error);
    throw error;
  }
};

const obtenerEstudiantePorIdPersona = async ({ id_persona }) => {
  const query = {
    text: `
            SELECT 
                e.id_estudiante,
                e.id_persona,
                e.semestre,
                e.credito_total,
                e.cobro_credito
            FROM estudiante e
            WHERE e.id_persona = $1
              AND e.activo = TRUE
        `,
    values: [id_persona],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0] || null;
  } catch (error) {
    console.error('Error al obtener estudiante por persona:', error.message);
    return null;
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

const obtenerNombreSemestre = async (id_semestre) => {
  if (!id_semestre || Number(id_semestre) === 0) {
    return null;
  }

  const query = {
    text: `SELECT semestre FROM semestre WHERE id_semestre = $1`,
    values: [id_semestre],
  };

  try {
    const { rows } = await db.query(query);
    return rows.length > 0 ? rows[0].semestre : null;
  } catch (error) {
    console.error('Error obteniendo nombre de semestre:', error.message);
    return null;
  }
};

const listarEstudiantesParaExport = async ({ idSemestre }) => {
  const filtros = ['p.activo = TRUE'];
  const values = [];

  try {
    const semestreNombre = await obtenerNombreSemestre(idSemestre);
    if (semestreNombre) {
      values.push(semestreNombre);
      filtros.push(`e.semestre = $${values.length}`);
    }

    const query = {
      text: `
                SELECT
                    p.dni,
                    p.nombre_persona,
                    p.apellido,
                    p.email,
                    COALESCE(c.nombre_carrera, 'Sin carrera') AS carrera,
                    COALESCE(e.semestre::text, 'Sin semestre') AS semestre,
                    COALESCE(n.nombre_nivel, 'Sin nivel') AS nivel,
                    COALESCE(e.credito_total, 0) AS credito_total,
                    COALESCE(e.cobro_credito, 0) AS cobro_credito
                FROM estudiante e
                INNER JOIN persona p ON e.id_persona = p.id_persona
                LEFT JOIN carrera c ON e.id_carrera = c.id_carrera
                LEFT JOIN niveles n ON e.id_nivel = n.id_nivel
                WHERE ${filtros.join(' AND ')}
                ORDER BY p.apellido, p.nombre_persona
            `,
      values,
    };

    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo estudiantes para exportación:', error.message);
    return [];
  }
};

const listarActividadesParaExport = async ({ idSemestre }) => {
  const values = [];
  const filtros = ['a.activo = TRUE'];

  if (idSemestre && Number(idSemestre) !== 0) {
    values.push(Number(idSemestre));
    filtros.push(`a.id_semestre = $${values.length}`);
  }

  const query = {
    text: `
            SELECT
                a.id_actividad,
                a.nombre_actividad,
                a.fecha_inicio,
                a.fecha_fin,
                a.lugar,
                a.creditos,
                COALESCE(s.semestre::text, 'Sin periodo') AS semestre,
                CONCAT_WS(' ', p.nombre_persona, p.apellido) AS creador,
                COALESCE(COUNT(DISTINCT CASE WHEN asis.activo IS NOT FALSE THEN asis.id_estudiante END), 0) AS total_asistentes
            FROM actividad a
            LEFT JOIN semestre s ON a.id_semestre = s.id_semestre
            LEFT JOIN persona p ON a.id_creador = p.id_persona
            LEFT JOIN asiste asis ON asis.id_actividad = a.id_actividad
            WHERE ${filtros.join(' AND ')}
            GROUP BY a.id_actividad, s.semestre, p.nombre_persona, p.apellido
            ORDER BY a.fecha_inicio DESC
        `,
    values,
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo actividades para exportación:', error.message);
    return [];
  }
};

const listarActividadesPorSemestre = async ({ idSemestre }) => {
  const values = [];
  const filtros = ['a.activo = TRUE'];

  if (idSemestre && Number(idSemestre) > 0) {
    values.push(Number(idSemestre));
    filtros.push(`a.id_semestre = $${values.length}`);
  }

  const query = {
    text: `
            SELECT
                a.id_actividad,
                a.nombre_actividad,
                a.fecha_inicio,
                a.fecha_fin,
                a.lugar,
                a.creditos,
                a.id_semestre,
                COALESCE(s.semestre::text, 'Sin periodo') AS semestre,
                COALESCE(COUNT(DISTINCT CASE WHEN asis.activo IS NOT FALSE THEN asis.id_estudiante END), 0) AS asistencia_total
            FROM actividad a
            LEFT JOIN semestre s ON a.id_semestre = s.id_semestre
            LEFT JOIN asiste asis ON asis.id_actividad = a.id_actividad
            WHERE ${filtros.join(' AND ')}
            GROUP BY a.id_actividad, s.semestre
            ORDER BY a.fecha_inicio DESC
        `,
    values,
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo actividades por semestre:', error.message);
    return [];
  }
};

const listarAsistenciaPorActividad = async ({ idActividad }) => {
  if (!idActividad) {
    return [];
  }

  const query = {
    text: `
            SELECT
                p.id_persona,
                p.dni,
                p.nombre_persona,
                p.apellido,
                COALESCE(c.nombre_carrera, 'Sin carrera') AS carrera,
                COALESCE(e.semestre::text, 'Sin semestre') AS semestre,
                e.id_estudiante,
                asis.fecha_asistencia,
                COALESCE(asis.activo, FALSE) AS activo
            FROM asiste asis
            INNER JOIN estudiante e ON asis.id_estudiante = e.id_estudiante
            INNER JOIN persona p ON e.id_persona = p.id_persona
            LEFT JOIN carrera c ON e.id_carrera = c.id_carrera
            WHERE asis.id_actividad = $1
            ORDER BY p.apellido, p.nombre_persona
        `,
    values: [idActividad],
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo asistencia por actividad:', error.message);
    return [];
  }
};

const obtenerRegistroAsistencia = async ({ id_estudiante, id_actividad }) => {
  const query = {
    text: `
            SELECT id_estudiante, id_actividad, fecha_asistencia, activo
            FROM asiste
            WHERE id_estudiante = $1 AND id_actividad = $2
            LIMIT 1
        `,
    values: [id_estudiante, id_actividad],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0] || null;
  } catch (error) {
    console.error('Error obteniendo registro de asistencia:', error.message);
    return null;
  }
};

const guardarAsistenciaEstudiante = async ({ id_estudiante, id_actividad, estado }) => {
  await db.query('BEGIN');

  try {
    const actividadResultado = await db.query(
      'SELECT creditos FROM actividad WHERE id_actividad = $1',
      [id_actividad]
    );

    if (actividadResultado.rows.length === 0) {
      throw new Error('ACTIVIDAD_NO_ENCONTRADA');
    }

    const creditosActividad = Number(actividadResultado.rows[0].creditos) || 0;

    const registroActualResult = await db.query(
      `SELECT activo
         FROM asiste
         WHERE id_estudiante = $1 AND id_actividad = $2
         FOR UPDATE`,
      [id_estudiante, id_actividad]
    );

    const registroActual = registroActualResult.rows[0] || null;

    let deltaCreditos = 0;
    let asistenciaRow = null;

    const updateQuery = {
      text: `
              UPDATE asiste
              SET activo = $3,
                  fecha_asistencia = CASE WHEN $3 THEN NOW() ELSE NULL END
              WHERE id_estudiante = $1 AND id_actividad = $2
              RETURNING id_estudiante, id_actividad, fecha_asistencia, activo
          `,
      values: [id_estudiante, id_actividad, estado],
    };

    if (registroActual) {
      const estadoPrevio = Boolean(registroActual.activo);

      const updateResult = await db.query(updateQuery);
      asistenciaRow = updateResult.rows[0] || null;

      if (estadoPrevio !== estado) {
        deltaCreditos = estado ? creditosActividad : -creditosActividad;
      }
    } else {
      if (estado) {
        const insertResult = await db.query(
          `
              INSERT INTO asiste (id_estudiante, id_actividad, fecha_asistencia, activo)
              VALUES ($1, $2, NOW(), TRUE)
              RETURNING id_estudiante, id_actividad, fecha_asistencia, activo
          `,
          [id_estudiante, id_actividad]
        );
        asistenciaRow = insertResult.rows[0] || null;
        deltaCreditos = creditosActividad;
      } else {
        // No había registro y se solicita desactivar: no se hace nada.
        asistenciaRow = null;
      }
    }

    if (deltaCreditos !== 0) {
      await db.query(
        `UPDATE estudiante
            SET 
              credito_total = GREATEST(COALESCE(credito_total, 0) + $1, 0),
              cobro_credito = GREATEST(COALESCE(cobro_credito, 0) + $1, 0)
          WHERE id_estudiante = $2`,
        [deltaCreditos, id_estudiante]
      );
    }

    const totalesResult = await db.query(
      `SELECT credito_total, cobro_credito
         FROM estudiante
         WHERE id_estudiante = $1`,
      [id_estudiante]
    );

    await db.query('COMMIT');

    return {
      asistencia: asistenciaRow,
      totales: totalesResult.rows[0] || null,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error guardando asistencia:', error.message);
    throw error;
  }
};

const listarSemestres = async () => {
  const query = {
    text: `
            SELECT
                id_semestre,
                semestre
            FROM semestre
            ORDER BY id_semestre DESC
        `,
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error obteniendo semestres:', error.message);
    return [];
  }
};

export const AdminModel = {
  creaPersona,
  creaEstudiante,
  creaActividad,
  actualizarActividad,
  dataAlumno,
  obtenerEstudiantePorIdPersona,
  DeleteAlumno,
  DeleteActividad,
  actividadExiste,
  mostrarActividad,
  mostrarEstudiantes,
  mostrarTutores,
  eliminarTutor,
  listarEstudiantesParaExport,
  listarActividadesParaExport,
  listarActividadesPorSemestre,
  listarAsistenciaPorActividad,
  obtenerRegistroAsistencia,
  guardarAsistenciaEstudiante,
  listarSemestres,
};
