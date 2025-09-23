import { db } from '../database/connection.database.js';

const datotAdminTutor = async ({ id_persona }) => {
  const query = {
    text: `
             SELECT id_persona, dni, nombre_persona, apellido, email, rol
            FROM persona
            WHERE id_persona = $1 AND activo = TRUE
        `,
    values: [id_persona],
  };

  try {
    const { rows } = await db.query(query);
    if (rows.length > 0) {
      return rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener persona:', error);
    return null;
  }
};
export const ModelAdminTutor = {
  datotAdminTutor,
};
