const { db } = require("../database/connection.database.js");

const obtenerNivelPorCreditos = async ({ creditos }) => {
  const query = {
    text: `
            SELECT
                id_nivel,
                nombre_nivel,
                rango_inicio,
                rango_fin,
                nombre_imagen,
                descripcion
            FROM niveles
            WHERE rango_inicio <= $1
              AND (rango_fin IS NULL OR rango_fin >= $1)
            ORDER BY rango_inicio DESC
            LIMIT 1
        `,
    values: [creditos],
  };

  try {
    const { rows } = await db.query(query);
    return rows[0] || null;
  } catch (error) {
    console.error("Error obteniendo nivel por créditos:", error.message);
    return null;
  }
};

const listarNivelesPendientes = async ({ desde = 0, hasta }) => {
  if (!hasta || hasta <= desde) {
    return [];
  }

  const query = {
    text: `
            SELECT
                id_nivel,
                nombre_nivel,
                rango_inicio,
                rango_fin,
                nombre_imagen,
                descripcion
            FROM niveles
            WHERE id_nivel > $1 AND id_nivel <= $2
            ORDER BY id_nivel
        `,
    values: [desde, hasta],
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error obteniendo niveles pendientes:", error.message);
    return [];
  }
};

const listarTodosLosNiveles = async () => {
  const query = {
    text: `
        SELECT
          id_nivel,
          nombre_nivel,
          rango_inicio,
          rango_fin,
          nombre_imagen,
          descripcion
        FROM niveles
        ORDER BY rango_inicio
      `,
  };

  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error listando niveles:", error.message);
    return [];
  }
};

const NivelModel = {
  obtenerNivelPorCreditos,
  listarNivelesPendientes,
  listarTodosLosNiveles,
};

module.exports = { NivelModel };
