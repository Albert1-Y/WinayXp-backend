import { db } from '../database/connection.database.js'


const saverRefreshToken = async (id_persona,token) => {
    const query = {
        text: `
            INSERT INTO refresh_tokens (id_persona, token)
            VALUES ($1, $2)
            RETURNING id
        `,
        values: [id_persona, token]
    };

    try {
        const { rows } = await db.query(query);
        console.log('Refresh token guardado correctamente.');
        console.log("Resultado del insert:",rows);
        return rows[0].id; 
    } catch (error) {
        console.error('Error al guardar el refresh token:', error);
        throw error;
    }
}
const findOneByEmail = async (email) => {
    const query = {
        text: `
            SELECT 
                
                p.id_persona,
                p.email,p.email,
                p.nombre_persona,
                p.apellido,
                p.rol,
                c.password
            FROM persona p
            JOIN credenciales c ON p.id_persona = c.id_persona
            WHERE p.email = $1 AND p.activo = TRUE AND c.activo = TRUE
        `,
        values: [email]
    };
    const { rows } = await db.query(query)
    return rows[0]
}

const verifyRtoken = async (id_ROOTKEN) => {
    const query = {
        text: `SELECT token FROM refresh_tokens WHERE id = $1`,
        values: [id_ROOTKEN]
    };

    const { rows } = await db.query(query);
    return rows[0]
}

const verificar_idpersona = async ({id_persona}) => {
    const query = {
        text: `SELECT EXISTS(SELECT 1 FROM persona WHERE id_persona = $1 AND activo = TRUE)`,
        values: [id_persona]
    };
    
        const { rows } = await db.query(query);
        console.log(rows[0].exists)
        return rows[0].exists  
    }
    

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
                `
            };
    
            const { rows } = await db.query(query);
            console.log({ rows });  
            return rows;  
        } catch (error) {
            console.error('Error al obtener el ranking:', error.message);
            return [];  
        }
    };
    const eliminarRtoken = async (id) => {
        try {
            await db.query('DELETE FROM refresh_tokens WHERE id = $1', [id]);
        } catch (error) {
            console.error("Error al eliminar el refresh token:", error);
            throw error;
        }
    };
export const UserModel = {
    verifyRtoken,
    findOneByEmail,
    saverRefreshToken,verificar_idpersona
    ,rankingtop,eliminarRtoken
}