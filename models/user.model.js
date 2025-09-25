import { db } from '../database/connection.database.js';

const saverRefreshToken = async (id_persona, token) => {
  const query = {
    text: `
            INSERT INTO refresh_tokens (id_persona, token)
            VALUES ($1, $2)
            RETURNING id
        `,
    values: [id_persona, token],
  };

  try {
    const { rows } = await db.query(query);
    console.log('Refresh token guardado correctamente.');
    console.log('Resultado del insert:', rows);
    return rows[0].id;
  } catch (error) {
    console.error('Error al guardar el refresh token:', error);
    throw error;
  }
};

const findOneByEmail = async (email) => {
  const query = {
    text: `
      SELECT 
        p.id_persona,
        p.dni,
        p.nombre_persona,
        p.apellido,
        p.email,
        p.rol,
        p.activo,
        c.password
      FROM persona p
      LEFT JOIN credenciales c ON c.id_persona = p.id_persona AND c.activo = TRUE
      WHERE p.email = $1
    `,
    values: [email],
  };
  const { rows } = await db.query(query);
  return rows[0] || null;
};

const verifyRtoken = async (id_ROOTKEN) => {
  const query = {
    text: `SELECT token FROM refresh_tokens WHERE id = $1`,
    values: [id_ROOTKEN],
  };

  const { rows } = await db.query(query);
  return rows[0];
};

const verificar_idpersona = async ({ id_persona }) => {
  const query = {
    text: `SELECT EXISTS(SELECT 1 FROM persona WHERE id_persona = $1 AND activo = TRUE)`,
    values: [id_persona],
  };

  const { rows } = await db.query(query);
  console.log(rows[0].exists);
  return rows[0].exists;
};

const rankingtop = async () => {
  try {
    const query = {
      text: `
                SELECT 
                    p.nombre_persona AS nombre,
                    p.apellido,
                    c.nombre_carrera AS carrera, 
                    e.credito_total,
                    n.nombre_nivel 
                FROM estudiante e
                JOIN persona p ON e.id_persona = p.id_persona
                JOIN carrera c ON e.id_carrera = c.id_carrera 
                LEFT JOIN niveles n ON e.id_nivel = n.id_nivel  
                WHERE e.activo = TRUE 
                ORDER BY e.credito_total DESC
                LIMIT 10;
            `,
    };

    const { rows } = await db.query(query);
    console.log({ rows });
    return rows;
  } catch (error) {
    console.error('Error al obtener el ranking:', error.message);
    return [];
  }
};

const rankingtopByCarrera = async (nombreCarrera) => {
  try {
    const query = {
      text: `
                SELECT 
                    p.nombre_persona AS nombre,
                    p.apellido,
                    c.nombre_carrera AS carrera, 
                    e.credito_total,
                    n.nombre_nivel 
                FROM estudiante e
                JOIN persona p ON e.id_persona = p.id_persona
                JOIN carrera c ON e.id_carrera = c.id_carrera 
                LEFT JOIN niveles n ON e.id_nivel = n.id_nivel  
                WHERE e.activo = TRUE 
                  AND c.nombre_carrera = $1
                ORDER BY e.credito_total DESC
                LIMIT 10;
            `,
      values: [nombreCarrera],
    };

    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error al obtener el ranking por carrera:', error.message);
    return [];
  }
};
const eliminarRtoken = async (id) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error al eliminar el refresh token:', error);
    throw error;
  }
};

const createPersona = async ({
  nombre_persona,
  email,
  rol,
  dni = '[sin DNI]',
  apellido,
  activo = false,
}) => {
  const trimmedName = nombre_persona?.trim();
  const finalNombre = trimmedName || nombre_persona || '[sin nombre]';
  let apellidoPersona = apellido?.trim();

  if (!apellidoPersona && trimmedName) {
    const partes = trimmedName.split(' ');
    if (partes.length > 1) {
      apellidoPersona = partes[partes.length - 1];
    }
  }

  if (!apellidoPersona) {
    apellidoPersona = '[sin apellido]';
  }

  const dniValue = typeof dni === 'string' ? dni.trim() : dni;

  const query = {
    text: `
            INSERT INTO persona (dni, nombre_persona, apellido, email, rol, activo)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `,
    values: [dniValue || '[sin DNI]', finalNombre, apellidoPersona, email, rol, activo],
  };

  return (await db.query(query)).rows[0];
};

const updatePersonaDatos = async ({ id_persona, dni, nombre_persona, apellido }) => {
  const query = {
    text: `
            UPDATE persona
            SET dni = $1, nombre_persona = $2, apellido = $3
            WHERE id_persona = $4
        `,
    values: [dni, nombre_persona, apellido, id_persona],
  };
  await db.query(query);
};

export const UserModel = {
  verifyRtoken,
  findOneByEmail,
  saverRefreshToken,
  verificar_idpersona,
  rankingtop,
  rankingtopByCarrera,
  eliminarRtoken,
  createPersona,
  updatePersonaDatos,
};
