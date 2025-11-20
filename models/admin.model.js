const { db } = require("../database/connection.database.js");
const { NivelModel } = require("./nivel.model.js");

const buildError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const creaPersona = async ({
  dni,
  email,
  password,
  nombre_persona,
  apellido,
  rol,
}) => {
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

const obtenerOCrearCarreraPorNombre = async (nombreCarrera) => {
  if (!nombreCarrera) {
    return null;
  }
  const normalizado = nombreCarrera.trim();
  if (!normalizado) {
    return null;
  }

  const selectQuery = {
    text: `SELECT id_carrera FROM carrera WHERE LOWER(nombre_carrera) = LOWER($1) LIMIT 1`,
    values: [normalizado],
  };

  const resultado = await db.query(selectQuery);
  if (resultado.rows.length > 0) {
    return resultado.rows[0].id_carrera;
  }

  const insertQuery = {
    text: `INSERT INTO carrera (nombre_carrera) VALUES ($1) RETURNING id_carrera`,
    values: [normalizado],
  };

  const insertResult = await db.query(insertQuery);
  return insertResult.rows[0].id_carrera;
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
      rol: "estudiante",
    });

    const id_carrera = await obtenerOCrearCarreraPorNombre(carrera);

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
    console.error("Error al crear estudiante:", error);
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
    const resultadoSemestre = await db.query(
      "SELECT buscar_o_crear_semestre($1) AS id_semestre",
      [semestre],
    );

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
      values: [
        nombre_actividad,
        fecha_inicio,
        fecha_fin,
        lugar,
        creditos,
        idPersona,
        id_semestre,
      ],
    };

    const { rows } = await db.query(query);
    return rows[0];
  } catch (error) {
    console.error("Error al crear la actividad:", error);
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
    throw new Error("id_actividad es requerido");
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
    pushUpdate("nombre_actividad", nombre_actividad);
  }

  if (lugar !== undefined) {
    pushUpdate("lugar", lugar);
  }

  if (creditos !== undefined) {
    pushUpdate("creditos", creditos);
  }

  const normalizarFecha = (valor) => {
    if (valor === undefined) return undefined;
    if (valor === null || valor === "") return null;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return null;
    }
    return fecha.toISOString();
  };

  const fechaInicioNormalizada = normalizarFecha(fecha_inicio);
  if (fecha_inicio !== undefined) {
    pushUpdate("fecha_inicio", fechaInicioNormalizada);
  }

  const fechaFinNormalizada = normalizarFecha(fecha_fin);
  if (fecha_fin !== undefined) {
    pushUpdate("fecha_fin", fechaFinNormalizada);
  }

  if (semestre !== undefined && semestre !== null) {
    if (typeof semestre === "string" && semestre.trim().length > 0) {
      const { rows } = await db.query(
        "SELECT buscar_o_crear_semestre($1) AS id_semestre",
        [semestre.trim()],
      );
      const idSemestre = rows[0]?.id_semestre || null;
      if (idSemestre !== null) {
        pushUpdate("id_semestre", idSemestre);
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
      [id_actividad],
    );
    return refresco.rows[0] || null;
  }

  const updateQuery = {
    text: `
            UPDATE actividad
            SET ${updates.join(", ")}
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
    [actualizado.id_actividad],
  );

  return detalle.rows[0] || actualizado;
};
const dataAlumno = async ({ dni, id_persona }) => {
  try {
    const condiciones = ["p.rol = 'estudiante'", "p.activo = TRUE"];
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
            WHERE ${condiciones.join(" AND ")}`,
      values: valores,
    };

    const resultado = await db.query(query);

    if (resultado.rows.length === 0) {
      return null;
    }

    return resultado.rows[0];
  } catch (error) {
    console.error("Error al consultar persona por DNI:", error);
    throw error;
  }
};

const obtenerActividadPorNombreFecha = async ({ nombre_actividad, fecha }) => {
  if (!nombre_actividad || !fecha) {
    return null;
  }

  const query = {
    text: `
        SELECT 
          id_actividad,
          nombre_actividad,
          fecha_inicio,
          creditos,
          id_semestre
        FROM actividad
        WHERE activo = TRUE
          AND LOWER(TRIM(nombre_actividad)) = LOWER(TRIM($1))
          AND DATE(fecha_inicio) = DATE($2)
        LIMIT 1
      `,
    values: [nombre_actividad, fecha],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0] || null;
  } catch (error) {
    console.error("Error buscando actividad por nombre/fecha:", error);
    throw error;
  }
};

const crearActividadHistorica = async ({
  nombre_actividad,
  fecha_actividad,
  creditos,
  semestre,
  id_creador,
}) => {
  if (!nombre_actividad || !fecha_actividad || !semestre) {
    throw buildError(
      "VALIDATION_ERROR",
      "Datos insuficientes para crear actividad histórica",
    );
  }

  const fecha = new Date(fecha_actividad);
  if (Number.isNaN(fecha.getTime())) {
    throw buildError(
      "VALIDATION_ERROR",
      "fecha_actividad inválida al crear actividad histórica",
    );
  }

  try {
    const resultadoSemestre = await db.query(
      "SELECT buscar_o_crear_semestre($1) AS id_semestre",
      [semestre],
    );

    const id_semestre = resultadoSemestre.rows[0]?.id_semestre;

    const insertResult = await db.query(
      `
        INSERT INTO actividad (
          nombre_actividad,
          fecha_inicio,
          fecha_fin,
          lugar,
          creditos,
          id_creador,
          id_semestre
        )
        VALUES ($1, $2, $2, $3, $4, $5, $6)
        RETURNING id_actividad, creditos
      `,
      [
        nombre_actividad,
        fecha,
        "Carga histórica",
        creditos,
        id_creador,
        id_semestre,
      ],
    );

    return insertResult.rows[0];
  } catch (error) {
    console.error("Error creando actividad histórica:", error);
    throw error;
  }
};

const actualizarEstudiante = async ({
  id_persona,
  dni,
  nombre_persona,
  apellido,
  email,
  carrera,
  semestre,
}) => {
  if (!id_persona) {
    throw buildError("VALIDATION_ERROR", "id_persona es requerido");
  }

  await db.query("BEGIN");

  try {
    const estudianteResult = await db.query(
      `
        SELECT e.id_estudiante, p.id_persona
        FROM estudiante e
        INNER JOIN persona p ON e.id_persona = p.id_persona
        WHERE p.id_persona = $1
          AND p.activo = TRUE
          AND e.activo = TRUE
          AND p.rol = 'estudiante'
        FOR UPDATE
      `,
      [id_persona],
    );

    if (estudianteResult.rows.length === 0) {
      throw buildError("ESTUDIANTE_NO_ENCONTRADO", "Estudiante no encontrado");
    }

    const personaUpdates = [];
    const personaValues = [id_persona];
    let idx = 2;
    const pushPersonaUpdate = (field, value) => {
      personaUpdates.push(`${field} = $${idx}`);
      personaValues.push(value);
      idx += 1;
    };

    if (dni !== undefined) {
      pushPersonaUpdate("dni", dni);
    }
    if (nombre_persona !== undefined) {
      pushPersonaUpdate("nombre_persona", nombre_persona);
    }
    if (apellido !== undefined) {
      pushPersonaUpdate("apellido", apellido);
    }
    if (email !== undefined) {
      const emailDuplicado = await db.query(
        `
          SELECT 1
          FROM persona
          WHERE email = $1 AND id_persona <> $2 AND activo = TRUE
          LIMIT 1
        `,
        [email, id_persona],
      );
      if (emailDuplicado.rows.length > 0) {
        throw buildError("EMAIL_DUPLICADO", "El email ya está registrado");
      }
      pushPersonaUpdate("email", email);
    }

    if (personaUpdates.length > 0) {
      await db.query(
        `
          UPDATE persona
          SET ${personaUpdates.join(", ")}
          WHERE id_persona = $1
        `,
        personaValues,
      );
    }

    const estudianteUpdates = [];
    const estudianteValues = [estudianteResult.rows[0].id_estudiante];
    let estudianteIdx = 2;
    const pushEstUpdate = (field, value) => {
      estudianteUpdates.push(`${field} = $${estudianteIdx}`);
      estudianteValues.push(value);
      estudianteIdx += 1;
    };

    if (carrera !== undefined) {
      const id_carrera = await obtenerOCrearCarreraPorNombre(carrera);
      if (id_carrera) {
        pushEstUpdate("id_carrera", id_carrera);
      }
    }

    if (semestre !== undefined) {
      pushEstUpdate("semestre", semestre);
    }

    if (estudianteUpdates.length > 0) {
      await db.query(
        `
          UPDATE estudiante
          SET ${estudianteUpdates.join(", ")}
          WHERE id_estudiante = $1
        `,
        estudianteValues,
      );
    }

    await db.query("COMMIT");
    const actualizado = await dataAlumno({ id_persona });
    return actualizado;
  } catch (error) {
    await db.query("ROLLBACK");
    if (!error.code) {
      console.error("Error actualizando estudiante:", error.message);
    }
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
    console.error("Error al obtener estudiante por persona:", error.message);
    return null;
  }
};
const DeleteAlumno = async ({ id_persona }) => {
  await db.query("BEGIN");

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

    await db.query("COMMIT");

    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error al desactivar estudiante y sus registros:", error);
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
    console.error("Error al verificar existencia de la actividad:", error);
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
    console.error("Error al obtener actividades:", error);
    return [];
  }
};
const DeleteActividad = async ({ id_actividad }) => {
  await db.query("BEGIN");

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

    await db.query("COMMIT");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error al desactivar la actividad:", error);
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
    console.error("Error obteniendo datos de estudiantes:", error.message);
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
    console.error("Error obteniendo datos de tutores:", error.message);
    return [];
  }
};
const eliminarTutor = async ({ id_persona }) => {
  try {
    await db.query("BEGIN");

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

    await db.query("COMMIT");
    console.log("Tutor eliminado lógicamente.");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error eliminando tutor:", error.message);
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
    console.error("Error obteniendo nombre de semestre:", error.message);
    return null;
  }
};

const listarEstudiantesParaExport = async ({
  idSemestre,
  nombreSemestre,
} = {}) => {
  const filtros = ["p.activo = TRUE"];
  const values = [];

  try {
    const semestreValores = [];

    if (nombreSemestre && typeof nombreSemestre === "string") {
      const literal = nombreSemestre.trim();
      if (literal) {
        semestreValores.push(literal);
      }
    } else if (idSemestre && Number(idSemestre) !== 0) {
      const numericId = Number(idSemestre);
      if (Number.isNaN(numericId)) {
        const literal = String(idSemestre).trim();
        if (literal) {
          semestreValores.push(literal);
        }
      } else {
        semestreValores.push(String(numericId));
        const semestreNombre = await obtenerNombreSemestre(numericId);
        if (semestreNombre) {
          semestreValores.push(semestreNombre);
        }
      }
    }

    if (semestreValores.length > 0) {
      const normalizados = semestreValores
        .map((valor) => valor.trim())
        .filter(Boolean)
        .map((valor) => valor.toLowerCase());

      if (normalizados.length > 0) {
        const placeholders = normalizados.map(
          (_, idx) => `$${values.length + idx + 1}`,
        );
        normalizados.forEach((valor) => values.push(valor));
        filtros.push(`LOWER(e.semestre::text) IN (${placeholders.join(", ")})`);
      }
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
                WHERE ${filtros.join(" AND ")}
                ORDER BY 
                  CASE 
                    WHEN e.semestre IS NULL THEN 1
                    ELSE 0
                  END,
                  e.semestre::text,
                  p.apellido,
                  p.nombre_persona
            `,
      values,
    };

    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error(
      "Error obteniendo estudiantes para exportación:",
      error.message,
    );
    return [];
  }
};

const listarActividadesParaExport = async ({ idSemestre }) => {
  const values = [];
  const filtros = ["a.activo = TRUE"];

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
            WHERE ${filtros.join(" AND ")}
            GROUP BY a.id_actividad, s.semestre, p.nombre_persona, p.apellido
            ORDER BY a.fecha_inicio DESC
        `,
    values,
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error(
      "Error obteniendo actividades para exportación:",
      error.message,
    );
    return [];
  }
};

const listarActividadesPorSemestre = async ({ idSemestre }) => {
  const values = [];
  const filtros = ["a.activo = TRUE"];

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
            WHERE ${filtros.join(" AND ")}
            GROUP BY a.id_actividad, s.semestre
            ORDER BY a.fecha_inicio DESC
        `,
    values,
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error obteniendo actividades por semestre:", error.message);
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
    console.error("Error obteniendo asistencia por actividad:", error.message);
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
    console.error("Error obteniendo registro de asistencia:", error.message);
    return null;
  }
};

const guardarAsistenciaEstudiante = async ({
  id_estudiante,
  id_actividad,
  estado,
  id_autor,
  rol_autor,
}) => {
  if (!id_autor || !rol_autor) {
    throw new Error("DATOS_AUTOR_REQUERIDOS");
  }

  await db.query("BEGIN");

  try {
    const estudianteResult = await db.query(
      `SELECT id_nivel, COALESCE(ultimo_nivel_visto, 0) AS ultimo_nivel_visto
         FROM estudiante
         WHERE id_estudiante = $1
         FOR UPDATE`,
      [id_estudiante],
    );

    if (estudianteResult.rows.length === 0) {
      throw new Error("ESTUDIANTE_NO_ENCONTRADO");
    }

    const {
      id_nivel: idNivelAnterior,
      ultimo_nivel_visto: ultimoNivelVistoRaw,
    } = estudianteResult.rows[0];
    const ultimoNivelVisto = Number(ultimoNivelVistoRaw || 0);

    const actividadResultado = await db.query(
      "SELECT creditos FROM actividad WHERE id_actividad = $1",
      [id_actividad],
    );

    if (actividadResultado.rows.length === 0) {
      throw new Error("ACTIVIDAD_NO_ENCONTRADA");
    }

    const creditosActividad = Number(actividadResultado.rows[0].creditos) || 0;

    const registroActualResult = await db.query(
      `SELECT activo
         FROM asiste
         WHERE id_estudiante = $1 AND id_actividad = $2
         FOR UPDATE`,
      [id_estudiante, id_actividad],
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
    } else if (estado) {
      const insertResult = await db.query(
        `
            INSERT INTO asiste (id_estudiante, id_actividad, fecha_asistencia, activo)
            VALUES ($1, $2, NOW(), TRUE)
            RETURNING id_estudiante, id_actividad, fecha_asistencia, activo
        `,
        [id_estudiante, id_actividad],
      );
      asistenciaRow = insertResult.rows[0] || null;
      deltaCreditos = creditosActividad;
    }

    if (deltaCreditos !== 0) {
      await db.query(
        `UPDATE estudiante
            SET 
              credito_total = GREATEST(COALESCE(credito_total, 0) + $1, 0),
              cobro_credito = GREATEST(COALESCE(cobro_credito, 0) + $1, 0)
          WHERE id_estudiante = $2`,
        [deltaCreditos, id_estudiante],
      );
    }

    const totalesResult = await db.query(
      `SELECT credito_total, cobro_credito
         FROM estudiante
         WHERE id_estudiante = $1`,
      [id_estudiante],
    );

    const totales = totalesResult.rows[0] || {
      credito_total: 0,
      cobro_credito: 0,
    };
    const creditosTotales = Number(totales.credito_total || 0);

    const nivelActual = await NivelModel.obtenerNivelPorCreditos({
      creditos: creditosTotales,
    });
    if (
      nivelActual &&
      nivelActual.id_nivel &&
      nivelActual.id_nivel !== Number(idNivelAnterior || 0)
    ) {
      await db.query(
        "UPDATE estudiante SET id_nivel = $1 WHERE id_estudiante = $2",
        [nivelActual.id_nivel, id_estudiante],
      );
    }

    if (deltaCreditos !== 0) {
      const motivoMovimiento = estado
        ? "Asistencia registrada"
        : "Asistencia revertida";

      await db.query(
        `
          SELECT registrar_movimiento_credito(
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `,
        [
          id_estudiante,
          "asistencia",
          deltaCreditos,
          motivoMovimiento,
          id_actividad,
          id_autor,
          rol_autor,
        ],
      );
    }

    let nivelesPendientes = [];
    if (nivelActual && nivelActual.id_nivel > ultimoNivelVisto) {
      nivelesPendientes = await NivelModel.listarNivelesPendientes({
        desde: ultimoNivelVisto,
        hasta: nivelActual.id_nivel,
      });
    }

    await db.query("COMMIT");

    return {
      asistencia: asistenciaRow,
      totales,
      nivel: nivelActual,
      nivelesPendientes,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error guardando asistencia:", error.message);
    throw error;
  }
};

const obtenerPersonaPorDni = async (dni) => {
  if (!dni) {
    return null;
  }

  const query = {
    text: `
        SELECT id_persona, dni, nombre_persona, apellido, rol, activo
        FROM persona
        WHERE dni = $1
          AND activo = TRUE
        LIMIT 1
      `,
    values: [dni],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0] || null;
  } catch (error) {
    console.error("Error buscando persona por DNI:", error);
    throw error;
  }
};

const obtenerEstudiantePorDni = async (dni) => {
  if (!dni) {
    return null;
  }

  const query = {
    text: `
        SELECT 
          e.id_estudiante,
          e.id_persona,
          e.credito_total,
          e.cobro_credito,
          e.id_nivel
        FROM estudiante e
        INNER JOIN persona p ON e.id_persona = p.id_persona
        WHERE p.dni = $1
          AND p.activo = TRUE
          AND e.activo = TRUE
      `,
    values: [dni],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0] || null;
  } catch (error) {
    console.error("Error buscando estudiante por DNI:", error);
    throw error;
  }
};

const actualizarNivelSiCorresponde = async ({ id_estudiante }) => {
  const totalesResult = await db.query(
    `
      SELECT credito_total
      FROM estudiante
      WHERE id_estudiante = $1
    `,
    [id_estudiante],
  );

  const creditoTotal = Number(totalesResult.rows[0]?.credito_total || 0);
  const nivelActual = await NivelModel.obtenerNivelPorCreditos({
    creditos: creditoTotal,
  });

  if (nivelActual?.id_nivel) {
    await db.query(
      `
        UPDATE estudiante
        SET id_nivel = $1
        WHERE id_estudiante = $2
      `,
      [nivelActual.id_nivel, id_estudiante],
    );
  }
};

const registrarAsistenciaHistorica = async ({
  id_estudiante,
  id_actividad,
  creditos,
  fecha,
  comentario,
  id_autor,
  rol_autor,
}) => {
  if (!id_estudiante || !id_actividad) {
    throw buildError(
      "VALIDATION_ERROR",
      "id_estudiante e id_actividad son requeridos",
    );
  }

  const creditosNumber = Number(creditos) || 0;
  const fechaAsistencia = fecha ? new Date(fecha) : new Date();

  await db.query("BEGIN");

  try {
    const asistenciaResult = await db.query(
      `
        SELECT activo
        FROM asiste
        WHERE id_estudiante = $1
          AND id_actividad = $2
        FOR UPDATE
      `,
      [id_estudiante, id_actividad],
    );

    let aplicarCreditos = false;

    if (asistenciaResult.rows.length === 0) {
      await db.query(
        `
          INSERT INTO asiste (
            id_estudiante,
            id_actividad,
            fecha_asistencia,
            activo
          )
          VALUES ($1, $2, $3, TRUE)
        `,
        [id_estudiante, id_actividad, fechaAsistencia],
      );
      aplicarCreditos = creditosNumber !== 0;
    } else if (asistenciaResult.rows[0].activo === false) {
      await db.query(
        `
          UPDATE asiste
          SET activo = TRUE,
              fecha_asistencia = $3
          WHERE id_estudiante = $1
            AND id_actividad = $2
        `,
        [id_estudiante, id_actividad, fechaAsistencia],
      );
      aplicarCreditos = creditosNumber !== 0;
    } else {
      throw buildError(
        "ASISTENCIA_DUPLICADA",
        "La asistencia ya fue registrada previamente para esta actividad",
      );
    }

    if (aplicarCreditos) {
      await db.query(
        `
          UPDATE estudiante
          SET 
            credito_total = COALESCE(credito_total, 0) + $1,
            cobro_credito = COALESCE(cobro_credito, 0) + $1
          WHERE id_estudiante = $2
        `,
        [creditosNumber, id_estudiante],
      );
      await actualizarNivelSiCorresponde({ id_estudiante });
    }

    if (aplicarCreditos) {
      await db.query(
        `
          SELECT registrar_movimiento_credito(
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `,
        [
          id_estudiante,
          "asistencia",
          creditosNumber,
          comentario || "Carga histórica",
          id_actividad,
          id_autor,
          rol_autor,
        ],
      );
    }

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error registrando asistencia histórica:", error);
    throw error;
  }
};

const registrarBonusHistorico = async ({
  id_estudiante,
  creditos,
  comentario,
  id_autor,
  rol_autor,
  id_actividad = null,
}) => {
  if (!id_estudiante || creditos === undefined) {
    throw buildError(
      "VALIDATION_ERROR",
      "id_estudiante y creditos son requeridos para bonus histórico",
    );
  }

  const creditosNumber = Number(creditos);
  if (!Number.isFinite(creditosNumber) || creditosNumber <= 0) {
    throw buildError(
      "VALIDATION_ERROR",
      "creditos debe ser mayor a 0 para bonus histórico",
    );
  }

  await db.query("BEGIN");

  try {
    await db.query(
      `
        UPDATE estudiante
        SET 
          credito_total = COALESCE(credito_total, 0) + $1,
          cobro_credito = COALESCE(cobro_credito, 0) + $1
        WHERE id_estudiante = $2
      `,
      [creditosNumber, id_estudiante],
    );

    await actualizarNivelSiCorresponde({ id_estudiante });

    await db.query(
      `
        SELECT registrar_movimiento_credito(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
      `,
      [
        id_estudiante,
        "bonus",
        creditosNumber,
        comentario || "Bonus histórico",
        id_actividad,
        id_autor,
        rol_autor,
      ],
    );

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error registrando bonus histórico:", error);
    throw error;
  }
};

const bonificarPuntos = async ({
  id_persona,
  puntos,
  motivo,
  id_actividad,
  id_autor,
  rol_autor,
}) => {
  if (!id_persona || !puntos || !motivo || !id_autor || !rol_autor) {
    throw buildError("VALIDATION_ERROR", "Datos insuficientes para bonificar");
  }

  const puntosNumber = Number(puntos);
  if (!Number.isFinite(puntosNumber) || puntosNumber <= 0) {
    throw buildError("VALIDATION_ERROR", "puntos debe ser un entero mayor a 0");
  }

  if (id_actividad !== undefined && id_actividad !== null) {
    const existe = await actividadExiste({
      id_actividad: Number(id_actividad),
    });
    if (!existe) {
      throw buildError(
        "ACTIVIDAD_NO_ENCONTRADA",
        "La actividad especificada no existe",
      );
    }
  }

  await db.query("BEGIN");

  try {
    const estudianteResult = await db.query(
      `
        SELECT 
          e.id_estudiante,
          COALESCE(e.credito_total, 0) AS credito_total,
          COALESCE(e.cobro_credito, 0) AS cobro_credito
        FROM estudiante e
        INNER JOIN persona p ON e.id_persona = p.id_persona
        WHERE e.id_persona = $1
          AND e.activo = TRUE
          AND p.activo = TRUE
        FOR UPDATE
      `,
      [id_persona],
    );

    if (estudianteResult.rows.length === 0) {
      throw buildError("ESTUDIANTE_NO_ENCONTRADO", "Estudiante no encontrado");
    }

    const estudiante = estudianteResult.rows[0];

    const updateResult = await db.query(
      `
        UPDATE estudiante
        SET
          credito_total = COALESCE(credito_total, 0) + $1,
          cobro_credito = COALESCE(cobro_credito, 0) + $1
        WHERE id_estudiante = $2
        RETURNING credito_total, cobro_credito
      `,
      [puntosNumber, estudiante.id_estudiante],
    );

    await actualizarNivelSiCorresponde({
      id_estudiante: estudiante.id_estudiante,
    });

    const movimientoResult = await db.query(
      `
        SELECT registrar_movimiento_credito(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        ) AS id_movimiento
      `,
      [
        estudiante.id_estudiante,
        "bonus",
        Math.abs(puntosNumber),
        motivo,
        id_actividad || null,
        id_autor,
        rol_autor,
      ],
    );

    await db.query("COMMIT");
    return {
      id_persona,
      id_estudiante: estudiante.id_estudiante,
      credito_total: updateResult.rows[0].credito_total,
      cobro_credito: updateResult.rows[0].cobro_credito,
      id_movimiento: movimientoResult.rows[0]?.id_movimiento || null,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    if (!error.code) {
      console.error("Error bonificando puntos:", error);
    }
    throw error;
  }
};

const cobrarPuntos = async ({
  id_persona,
  puntos,
  motivo,
  idCobrador,
  rolCobrador,
}) => {
  if (!id_persona || !puntos || !motivo || !idCobrador || !rolCobrador) {
    throw buildError("VALIDATION_ERROR", "Datos insuficientes para cobrar");
  }

  await db.query("BEGIN");

  try {
    const estudianteResult = await db.query(
      `
        SELECT 
          e.id_estudiante,
          COALESCE(e.credito_total, 0) AS credito_total,
          COALESCE(e.cobro_credito, 0) AS cobro_credito
        FROM estudiante e
        INNER JOIN persona p ON e.id_persona = p.id_persona
        WHERE e.id_persona = $1
          AND e.activo = TRUE
          AND p.activo = TRUE
        FOR UPDATE
      `,
      [id_persona],
    );

    if (estudianteResult.rows.length === 0) {
      throw buildError("ESTUDIANTE_NO_ENCONTRADO", "Estudiante no encontrado");
    }

    const estudiante = estudianteResult.rows[0];
    if (Number(estudiante.cobro_credito) < puntos) {
      throw buildError(
        "SALDO_INSUFICIENTE",
        "El estudiante no cuenta con saldo suficiente",
      );
    }

    const updateResult = await db.query(
      `
        UPDATE estudiante
        SET
          cobro_credito = GREATEST(COALESCE(cobro_credito, 0) - $1, 0)
        WHERE id_estudiante = $2
        RETURNING id_estudiante, credito_total, cobro_credito
      `,
      [puntos, estudiante.id_estudiante],
    );

    if (updateResult.rows.length === 0) {
      throw buildError("ESTUDIANTE_NO_ENCONTRADO", "Estudiante no encontrado");
    }

    const movimientoResult = await db.query(
      `
        SELECT registrar_movimiento_credito(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        ) AS id_movimiento
      `,
      [
        updateResult.rows[0].id_estudiante,
        "cobro",
        -Math.abs(puntos),
        motivo,
        null,
        idCobrador,
        rolCobrador,
      ],
    );

    await db.query("COMMIT");
    return {
      id_persona,
      id_estudiante: updateResult.rows[0].id_estudiante,
      credito_total: updateResult.rows[0].credito_total,
      cobro_credito: updateResult.rows[0].cobro_credito,
      id_movimiento: movimientoResult.rows[0]?.id_movimiento || null,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    if (!error.code) {
      console.error("Error cobrando puntos:", error.message);
    }
    throw error;
  }
};

const listarHistorialMovimientos = async (filters = {}) => {
  const {
    id_estudiante,
    dni,
    tipo_movimiento,
    fecha_inicio,
    fecha_fin,
    limit = 50,
    offset = 0,
  } = filters;

  const params = [];
  const conditions = [];

  let estudianteId = id_estudiante ? Number(id_estudiante) : undefined;

  if (!estudianteId && dni) {
    const estudiante = await obtenerEstudiantePorDni(dni);
    if (!estudiante) {
      return [];
    }
    estudianteId = estudiante.id_estudiante;
  }

  if (estudianteId) {
    params.push(estudianteId);
    conditions.push(`hmc.id_estudiante = $${params.length}`);
  }

  if (tipo_movimiento) {
    params.push(tipo_movimiento);
    conditions.push(`hmc.tipo_movimiento = $${params.length}`);
  }

  if (fecha_inicio) {
    params.push(fecha_inicio);
    conditions.push(`hmc.created_at >= $${params.length}`);
  }

  if (fecha_fin) {
    params.push(fecha_fin);
    conditions.push(`hmc.created_at <= $${params.length}`);
  }

  const safeLimit = Number(limit) > 0 ? Math.min(Number(limit), 200) : 50;
  const safeOffset = Number(offset) >= 0 ? Number(offset) : 0;

  params.push(safeLimit);
  params.push(safeOffset);

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      hmc.id_movimiento,
      hmc.id_estudiante,
      p_est.dni AS dni_estudiante,
      p_est.nombre_persona || ' ' || p_est.apellido AS estudiante,
      hmc.tipo_movimiento,
      hmc.creditos,
      hmc.motivo,
      act.nombre_actividad,
      p_autor.nombre_persona || ' ' || p_autor.apellido AS autor,
      hmc.rol_autor,
      hmc.created_at
    FROM historial_movimiento_creditos hmc
    INNER JOIN estudiante e ON hmc.id_estudiante = e.id_estudiante
    INNER JOIN persona p_est ON e.id_persona = p_est.id_persona
    INNER JOIN persona p_autor ON hmc.id_autor = p_autor.id_persona
    LEFT JOIN actividad act ON hmc.id_actividad = act.id_actividad
    ${whereClause}
    ORDER BY hmc.created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `;

  const { rows } = await db.query(query, params);
  return rows;
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
    console.error("Error obteniendo semestres:", error.message);
    return [];
  }
};

const AdminModel = {
  creaPersona,
  creaEstudiante,
  creaActividad,
  actualizarActividad,
  dataAlumno,
  actualizarEstudiante,
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
  obtenerActividadPorNombreFecha,
  crearActividadHistorica,
  listarAsistenciaPorActividad,
  obtenerRegistroAsistencia,
  guardarAsistenciaEstudiante,
  registrarAsistenciaHistorica,
  registrarBonusHistorico,
  bonificarPuntos,
  cobrarPuntos,
  obtenerPersonaPorDni,
  obtenerEstudiantePorDni,
  listarHistorialMovimientos,
  listarSemestres,
};

module.exports = { AdminModel };
