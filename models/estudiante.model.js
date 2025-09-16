import { db } from '../database/connection.database.js'

//retorna todo los datos del estudainate para ROL estudiante
const DatosEstudianteInit = async ({id_persona}) => {
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
        values: [id_persona]
    };

    try {
        const { rows } = await db.query(query);
        return rows[0]; 
    } catch (error) {
        console.error('Error al obtener datos del estudiante:', error);
        throw error;
    }
};

export const EstudianteModel = {
    DatosEstudianteInit
}