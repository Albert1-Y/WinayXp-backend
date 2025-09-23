import { AdminModel } from '../models/admin.model.js';
import { UserModel } from '../models/user.model.js';
import { ModelAdminTutor } from '../models/admin.tutor.model.js';
import bcryptjs from 'bcryptjs';

const register_Admin_tutor = async (req, res) => {
  try {
    const { dni, email, password, nombre_persona, apellido, rol } = req.body;
    //console.log(req.body)

    const user = await UserModel.findOneByEmail(email);
    if (user) {
      return res.status(409).json({ ok: false, msg: 'Email already exists' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = await AdminModel.creaPersona({
      dni,
      email,
      password: hashedPassword,
      nombre_persona,
      apellido,
      rol,
    });

    return res.status(201).json({
      ok: true,
      msg: {
        ID: newUser.id_persona,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error server',
    });
  }
};

const initAdminTutor = async (req, res) => {
  try {
    const email = req.email;
    const rol = req.rol;
    const id_persona = req.id_persona;
    const user = await ModelAdminTutor.datotAdminTutor({ id_persona });

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error server',
    });
  }
};

const registeEstudiante = async (req, res) => {
  try {
    const { dni, email, password, nombre_persona, apellido, rol, carrera, semestre } = req.body;

    const user = await UserModel.findOneByEmail(email);
    if (user) {
      return res.status(409).json({ ok: false, msg: 'Email already exists' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = await AdminModel.creaEstudiante({
      dni,
      email,
      password: hashedPassword,
      nombre_persona,
      apellido,
      rol,
      carrera,
      semestre,
    });

    console.log(newUser);

    return res.status(201).json({
      ok: true,
      msg: {
        ID: newUser.id_estudiante,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error server',
    });
  }
};

const registerMultipleEstudiantes = async (req, res) => {
  try {
    const estudiantes = req.body; // Suponemos que envías { estudiantes: [ { dni, email, ... }, {...} ] }

    if (!Array.isArray(estudiantes)) {
      return res.status(400).json({ ok: false, msg: 'Se esperaba una lista de estudiantes' });
    }

    const resultados = [];

    for (const est of estudiantes) {
      const { dni, email, password, nombre_persona, apellido, rol, carrera, semestre } = est;

      // Verificar si el email ya existe
      const existingUser = await UserModel.findOneByEmail(email);
      if (existingUser) {
        resultados.push({ email, status: 'duplicado', msg: 'Email ya registrado' });
        continue;
      }

      // Hashear la contraseña
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      // Crear nuevo estudiante
      try {
        const newUser = await AdminModel.creaEstudiante({
          dni,
          email,
          password: hashedPassword,
          nombre_persona,
          apellido,
          rol,
          carrera,
          semestre,
        });

        resultados.push({ email, status: 'registrado', ID: newUser.id_estudiante });
      } catch (err) {
        resultados.push({ email, status: 'error', msg: 'Error al crear estudiante' });
      }
    }

    return res.status(201).json({
      ok: true,
      resultados,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor',
    });
  }
};
//proporcianremos los datosd el estudinate, ya sea para uin delete
const DatosEstudiante = async (req, res) => {
  try {
    const dni = req.query.dni;

    const estudiante = await AdminModel.dataAlumno({ dni: dni });
    //console.log(estudiante)
    if (!estudiante) {
      return res.status(404).json({ msg: 'Estudiante no encontrado' });
    }
    return res.status(200).json(estudiante);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
//eliminaicon logica con bool
const DeleteEstudiante = async (req, res) => {
  try {
    const id_persona = req.query.id_persona;
    const existe = await UserModel.verificar_idpersona({ id_persona });

    if (!existe) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const delteES = await AdminModel.DeleteAlumno({ id_persona });

    if (delteES) {
      return res.status(200).json({ ok: 'Se eimino correctamente' });
    }
    return res.status(500).json({
      msg: 'No se peudo procesar',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
const verifyGET = async (req, res) => {
  return res.status(200).json({ ok: 'listo' });
};
const initMostrarEstudaintes = async (req, res) => {
  try {
    console.log('entre');
    const estudiante = await AdminModel.mostrarEstudiantes();
    console.log(estudiante);
    return res.status(200).json(estudiante);
  } catch {
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
const MostrarTutor = async (req, res) => {
  try {
    //console.log("entre")
    const tutor = await AdminModel.mostrarTutores();
    console.log(tutor);
    return res.status(200).json(tutor);
  } catch {
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
const DeleteTutor = async (req, res) => {
  try {
    const id_persona = req.query.id_persona;
    console.log('si' + id_persona);

    const existe = await UserModel.verificar_idpersona({ id_persona });
    console.log(existe);
    if (!existe) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const delteES = await AdminModel.eliminarTutor({ id_persona });

    if (delteES) {
      return res.status(200).json({ ok: 'Se eimino correctamente' });
    }
    return res.status(500).json({
      msg: 'No se peudo procesar',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
export const AdminController = {
  register_Admin_tutor,
  MostrarTutor,
  DeleteTutor,
};
export const AdminSharedController = {
  registeEstudiante,
  DatosEstudiante,
  DeleteEstudiante,
  verifyGET,
  initMostrarEstudaintes,
  initAdminTutor,
  registerMultipleEstudiantes,
};
