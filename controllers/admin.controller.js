const fs = require("fs/promises");
const { AdminModel } = require("../models/admin.model.js");
const { UserModel } = require("../models/user.model.js");
const { ModelAdminTutor } = require("../models/admin.tutor.model.js");
const ExcelJS = require("exceljs");
const bcryptjs = require("bcryptjs");

const register_Admin_tutor = async (req, res) => {
  try {
    const { dni, email, password, nombre_persona, apellido, rol } = req.body;
    //console.log(req.body)

    const user = await UserModel.findOneByEmail(email);
    if (user) {
      return res.status(409).json({ ok: false, msg: "Email already exists" });
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
      msg: "Error server",
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
      msg: "Error server",
    });
  }
};

const registeEstudiante = async (req, res) => {
  try {
    const {
      dni,
      email,
      password,
      nombre_persona,
      apellido,
      rol,
      carrera,
      semestre,
    } = req.body;

    const user = await UserModel.findOneByEmail(email);
    if (user) {
      return res.status(409).json({ ok: false, msg: "Email already exists" });
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
      msg: "Error server",
    });
  }
};

const registerMultipleEstudiantes = async (req, res) => {
  try {
    const estudiantes = req.body; // Suponemos que envías { estudiantes: [ { dni, email, ... }, {...} ] }

    if (!Array.isArray(estudiantes)) {
      return res
        .status(400)
        .json({ ok: false, msg: "Se esperaba una lista de estudiantes" });
    }

    const resultados = [];

    for (const est of estudiantes) {
      const {
        dni,
        email,
        password,
        nombre_persona,
        apellido,
        rol,
        carrera,
        semestre,
      } = est;

      // Verificar si el email ya existe
      const existingUser = await UserModel.findOneByEmail(email);
      if (existingUser) {
        resultados.push({
          email,
          status: "duplicado",
          msg: "Email ya registrado",
        });
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

        resultados.push({
          email,
          status: "registrado",
          ID: newUser.id_estudiante,
        });
      } catch (err) {
        resultados.push({
          email,
          status: "error",
          msg: "Error al crear estudiante",
        });
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
      msg: "Error del servidor",
    });
  }
};

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return value;
  }
  return String(value).trim();
};

const actualizarEstudiante = async (req, res) => {
  try {
    const {
      id_persona,
      dni,
      nombre_persona,
      apellido,
      email,
      carrera,
      semestre,
    } = req.body || {};

    const idPersonaNumber = Number(id_persona);
    if (!idPersonaNumber) {
      return res.status(400).json({ msg: "id_persona es requerido" });
    }

    const payload = {
      id_persona: idPersonaNumber,
    };

    if (dni !== undefined) {
      const cleaned = sanitizeString(dni);
      if (!cleaned) {
        return res.status(400).json({ msg: "dni inválido" });
      }
      payload.dni = cleaned;
    }

    if (nombre_persona !== undefined) {
      const cleaned = sanitizeString(nombre_persona);
      if (!cleaned) {
        return res.status(400).json({ msg: "nombre_persona inválido" });
      }
      payload.nombre_persona = cleaned;
    }

    if (apellido !== undefined) {
      const cleaned = sanitizeString(apellido);
      if (!cleaned) {
        return res.status(400).json({ msg: "apellido inválido" });
      }
      payload.apellido = cleaned;
    }

    if (email !== undefined) {
      const cleaned = sanitizeString(email);
      if (!cleaned || !cleaned.includes("@")) {
        return res.status(400).json({ msg: "email inválido" });
      }
      payload.email = cleaned.toLowerCase();
    }

    if (carrera !== undefined) {
      const cleaned = sanitizeString(carrera);
      if (!cleaned) {
        return res.status(400).json({ msg: "carrera inválida" });
      }
      payload.carrera = cleaned;
    }

    if (semestre !== undefined) {
      const cleaned = sanitizeString(semestre);
      payload.semestre = cleaned || null;
    }

    const estudianteActualizado = await AdminModel.actualizarEstudiante(
      payload,
    );

    return res.status(200).json({
      ok: true,
      msg: "Estudiante actualizado correctamente",
      estudiante: estudianteActualizado,
    });
  } catch (error) {
    if (error.code === "ESTUDIANTE_NO_ENCONTRADO") {
      return res.status(404).json({ msg: "Estudiante no encontrado" });
    }
    if (error.code === "EMAIL_DUPLICADO") {
      return res.status(409).json({ msg: "El email ya está registrado" });
    }
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({ msg: error.message });
    }
    console.error("Error al actualizar estudiante:", error);
    return res.status(500).json({ msg: "Error al actualizar estudiante" });
  }
};

const cobrarPuntos = async (req, res) => {
  try {
    const idPersonaNumber = Number(req.body?.id_persona);
    const puntos = Number(req.body?.puntos);
    const motivo = sanitizeString(req.body?.motivo || "");

    if (!idPersonaNumber || !Number.isInteger(puntos) || puntos <= 0) {
      return res
        .status(400)
        .json({ msg: "id_persona y puntos válidos son requeridos" });
    }

    if (!motivo || motivo.length < 5) {
      return res
        .status(400)
        .json({ msg: "El motivo es requerido y debe tener al menos 5 caracteres" });
    }

    const idCobrador = Number(req.id_persona);
    const rolCobrador = req.rol;

    if (
      !idCobrador ||
      !["tutor", "administrador"].includes(rolCobrador)
    ) {
      return res.status(403).json({ msg: "No autorizado para realizar cobros" });
    }

    const resultado = await AdminModel.cobrarPuntos({
      id_persona: idPersonaNumber,
      puntos,
      motivo,
      idCobrador,
      rolCobrador,
    });

    return res.status(200).json({
      ok: true,
      msg: "Puntos descontados correctamente",
      saldo: {
        credito_total: resultado.credito_total,
        cobro_credito: resultado.cobro_credito,
      },
      movimiento: resultado.id_movimiento,
    });
  } catch (error) {
    if (error.code === "ESTUDIANTE_NO_ENCONTRADO") {
      return res.status(404).json({ msg: "Estudiante no encontrado" });
    }
    if (error.code === "SALDO_INSUFICIENTE") {
      return res.status(400).json({ msg: error.message });
    }
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({ msg: error.message });
    }
    console.error("Error al cobrar puntos:", error);
    return res.status(500).json({ msg: "Error al cobrar puntos" });
  }
};

const bonificarPuntos = async (req, res) => {
  try {
    const idPersonaNumber = Number(req.body?.id_persona);
    const puntos = Number(req.body?.puntos);
    const motivo = sanitizeString(req.body?.motivo || "");
    const idActividadRaw = req.body?.id_actividad;
    const idActividad =
      idActividadRaw === undefined || idActividadRaw === null
        ? undefined
        : Number(idActividadRaw);

    if (!idPersonaNumber || !Number.isFinite(puntos) || puntos <= 0) {
      return res
        .status(400)
        .json({ msg: "id_persona y puntos válidos son requeridos" });
    }

    if (!motivo || motivo.length < 5) {
      return res
        .status(400)
        .json({ msg: "El motivo es requerido y debe tener al menos 5 caracteres" });
    }

    if (
      idActividad !== undefined &&
      (!Number.isInteger(idActividad) || idActividad <= 0)
    ) {
      return res.status(400).json({ msg: "id_actividad inválido" });
    }

    const idAutor = Number(req.id_persona);
    const rolAutor = req.rol;

    if (!idAutor || !["tutor", "administrador"].includes(rolAutor)) {
      return res.status(403).json({ msg: "No autorizado para bonificar puntos" });
    }

    const resultado = await AdminModel.bonificarPuntos({
      id_persona: idPersonaNumber,
      puntos,
      motivo,
      id_actividad: idActividad,
      id_autor: idAutor,
      rol_autor: rolAutor,
    });

    return res.status(200).json({
      ok: true,
      msg: "Puntos bonificados correctamente",
      saldo: {
        credito_total: resultado.credito_total,
        cobro_credito: resultado.cobro_credito,
      },
      movimiento: resultado.id_movimiento,
    });
  } catch (error) {
    if (error.code === "ESTUDIANTE_NO_ENCONTRADO") {
      return res.status(404).json({ msg: "Estudiante no encontrado" });
    }
    if (error.code === "ACTIVIDAD_NO_ENCONTRADA") {
      return res.status(404).json({ msg: "Actividad no encontrada" });
    }
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({ msg: error.message });
    }
    console.error("Error al bonificar puntos:", error);
    return res.status(500).json({ msg: "Error al bonificar puntos" });
  }
};

const listarHistorialMovimientos = async (req, res) => {
  try {
    const filtros = {
      id_estudiante: req.query.id_estudiante
        ? Number(req.query.id_estudiante)
        : undefined,
      dni: sanitizeString(req.query.dni) || undefined,
      tipo_movimiento: sanitizeString(req.query.tipo_movimiento) || undefined,
      fecha_inicio: sanitizeString(req.query.fecha_inicio) || undefined,
      fecha_fin: sanitizeString(req.query.fecha_fin) || undefined,
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    };

    const historial = await AdminModel.listarHistorialMovimientos(filtros);

    return res.status(200).json({
      ok: true,
      data: historial,
      count: historial.length,
    });
  } catch (error) {
    console.error("Error al listar historial:", error);
    return res
      .status(500)
      .json({ msg: "Error al obtener el historial de movimientos" });
  }
};

//proporcianremos los datosd el estudinate, ya sea para uin delete
const DatosEstudiante = async (req, res) => {
  try {
    const dni = req.query.dni;
    const id_persona = req.query.id_persona;

    if (!dni && !id_persona) {
      return res.status(400).json({ msg: "Se requiere dni o id_persona" });
    }

    const estudiante = await AdminModel.dataAlumno({ dni, id_persona });
    //console.log(estudiante)
    if (!estudiante) {
      return res.status(404).json({ msg: "Estudiante no encontrado" });
    }
    return res.status(200).json(estudiante);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error server",
    });
  }
};
//eliminaicon logica con bool
const DeleteEstudiante = async (req, res) => {
  try {
    const id_persona = req.query.id_persona;
    const existe = await UserModel.verificar_idpersona({ id_persona });

    if (!existe) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const delteES = await AdminModel.DeleteAlumno({ id_persona });

    if (delteES) {
      return res.status(200).json({ ok: "Se eimino correctamente" });
    }
    return res.status(500).json({
      msg: "No se peudo procesar",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error server",
    });
  }
};
const verifyGET = async (req, res) => {
  return res.status(200).json({ ok: "listo" });
};
const initMostrarEstudaintes = async (req, res) => {
  try {
    console.log("entre");
    const estudiante = await AdminModel.mostrarEstudiantes();
    console.log(estudiante);
    return res.status(200).json(estudiante);
  } catch {
    return res.status(500).json({
      msg: "Error server",
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
      msg: "Error server",
    });
  }
};
const DeleteTutor = async (req, res) => {
  try {
    const id_persona = req.query.id_persona;
    console.log("si" + id_persona);

    const existe = await UserModel.verificar_idpersona({ id_persona });
    console.log(existe);
    if (!existe) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const delteES = await AdminModel.eliminarTutor({ id_persona });

    if (delteES) {
      return res.status(200).json({ ok: "Se eimino correctamente" });
    }
    return res.status(500).json({
      msg: "No se peudo procesar",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error server",
    });
  }
};

const exportarExcelEstudiantes = async (req, res) => {
  try {
    const estudiantes = await AdminModel.listarEstudiantesParaExport();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wiñay XP";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("Estudiantes");

    worksheet.columns = [
      { header: "DNI", key: "dni", width: 15 },
      { header: "Nombre", key: "nombre_persona", width: 20 },
      { header: "Apellido", key: "apellido", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Carrera", key: "carrera", width: 25 },
      { header: "Semestre", key: "semestre", width: 15 },
      { header: "Nivel", key: "nivel", width: 20 },
      { header: "Créditos Totales", key: "credito_total", width: 18 },
      { header: "Créditos Disponibles", key: "cobro_credito", width: 20 },
    ];

    estudiantes.forEach((est) => {
      worksheet.addRow({
        dni: est.dni,
        nombre_persona: est.nombre_persona,
        apellido: est.apellido,
        email: est.email,
        carrera: est.carrera,
        semestre: est.semestre,
        nivel: est.nivel,
        credito_total: est.credito_total,
        cobro_credito: est.cobro_credito,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="estudiantes_${timestamp}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar estudiantes:", error);
    return res
      .status(500)
      .json({ msg: "Error al generar el archivo de estudiantes" });
  }
};

const exportarExcelActividades = async (req, res) => {
  try {
    const idSemestre = Number(req.query.id_semestre || 0);
    const actividades = await AdminModel.listarActividadesParaExport({
      idSemestre,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wiñay XP";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("Actividades");

    worksheet.columns = [
      { header: "Nombre", key: "nombre_actividad", width: 30 },
      { header: "Fecha Inicio", key: "fecha_inicio", width: 18 },
      { header: "Fecha Fin", key: "fecha_fin", width: 18 },
      { header: "Lugar", key: "lugar", width: 25 },
      { header: "Créditos", key: "creditos", width: 12 },
      { header: "Semestre", key: "semestre", width: 15 },
      { header: "Creador", key: "creador", width: 25 },
      { header: "Total Asistentes", key: "total_asistentes", width: 18 },
    ];

    actividades.forEach((actividad) => {
      worksheet.addRow({
        nombre_actividad: actividad.nombre_actividad,
        fecha_inicio: actividad.fecha_inicio,
        fecha_fin: actividad.fecha_fin,
        lugar: actividad.lugar,
        creditos: actividad.creditos,
        semestre: actividad.semestre,
        creador: actividad.creador,
        total_asistentes: actividad.total_asistentes,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="actividades_${timestamp}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar actividades:", error);
    return res
      .status(500)
      .json({ msg: "Error al generar el archivo de actividades" });
  }
};

const obtenerSemestres = async (req, res) => {
  try {
    const semestres = await AdminModel.listarSemestres();
    return res.status(200).json(semestres);
  } catch (error) {
    console.error("Error al obtener semestres:", error);
    return res
      .status(500)
      .json({ msg: "Error al obtener la lista de semestres" });
  }
};

const descargarPlantillaExcel = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wiñay XP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Plantilla Actividades");

    worksheet.columns = [
      { header: "Nombre Actividad", key: "nombre_actividad", width: 30 },
      { header: "Fecha Inicio (YYYY-MM-DD)", key: "fecha_inicio", width: 22 },
      { header: "Fecha Fin (YYYY-MM-DD)", key: "fecha_fin", width: 22 },
      { header: "Lugar", key: "lugar", width: 25 },
      { header: "Créditos", key: "creditos", width: 12 },
      { header: "Semestre", key: "semestre", width: 15 },
    ];

    worksheet.addRow({
      nombre_actividad: "Taller de ejemplo",
      fecha_inicio: "2024-03-01",
      fecha_fin: "2024-03-01",
      lugar: "Auditorio Central",
      creditos: 5,
      semestre: "2024-I",
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="plantilla_actividades.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al generar plantilla:", error);
    return res.status(500).json({ msg: "Error al generar la plantilla Excel" });
  }
};

const descargarPlantillaHistoricos = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wiñay XP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("CargaHistorica");

    const columns = [
      { header: "nombre_actividad", key: "nombre_actividad", width: 35 },
      { header: "fecha_actividad (YYYY-MM-DD)", key: "fecha_actividad", width: 26 },
      { header: "creditos", key: "creditos", width: 15 },
      { header: "semestre (2024-I)", key: "semestre", width: 20 },
      { header: "dni_estudiante", key: "dni_estudiante", width: 18 },
      { header: "tipo_registro (asistencia|bonus)", key: "tipo_registro", width: 30 },
      { header: "comentario", key: "comentario", width: 35 },
      { header: "dni_autor (opcional)", key: "dni_autor", width: 20 },
    ];

    worksheet.columns = columns;
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    const instructionRow = worksheet.addRow({
      nombre_actividad: "No modificar los encabezados. Cada fila = asistencia historic.",
      fecha_actividad: "Formato obligatorio YYYY-MM-DD",
      creditos: "Entero >= 0",
      semestre: "Ej. 2024-I",
      dni_estudiante: "DNI existente",
      tipo_registro: "Default asistencia",
      comentario: "Opcional (motivo)",
      dni_autor: "Opcional",
    });
    instructionRow.eachCell((cell) => {
      cell.font = { italic: true, color: { argb: "FF6C757D" } };
      cell.alignment = { wrapText: true };
    });

    const sampleRow = worksheet.addRow({
      nombre_actividad: "Charla STEM 2023",
      fecha_actividad: "2023-08-10",
      creditos: 30,
      semestre: "2023-II",
      dni_estudiante: "60472365",
      tipo_registro: "asistencia",
      comentario: "Carga histórica 2023",
      dni_autor: "",
    });
    sampleRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F1FF" },
      };
    });

    const editableRowStart = worksheet.rowCount + 1;
    const editableRows = 300;
    for (let i = 0; i < editableRows; i += 1) {
      const row = worksheet.addRow({});
      columns.forEach((_, index) => {
        const cell = row.getCell(index + 1);
        if (cell.value === undefined) {
          cell.value = "";
        }
        cell.protection = { locked: false };
      });
      row.protection = { locked: false };
    }

    await worksheet.protect("WinayXP2025!", {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="plantilla_carga_historica.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al generar plantilla histórica:", error);
    return res.status(500).json({ msg: "Error al generar la plantilla histórica" });
  }
};

const importarExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "Archivo requerido" });
  }

  const resumen = {
    procesados: 0,
    errores: [],
  };

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({ msg: "Archivo sin hojas válidas" });
    }

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const nombre_actividad = sanitizeString(row.getCell(1).text);
      const fechaInicioRaw = row.getCell(2).value;
      const fechaFinRaw = row.getCell(3).value;
      const lugar = sanitizeString(row.getCell(4).text);
      const creditos = Number(row.getCell(5).value);
      const semestre = sanitizeString(row.getCell(6).text);

      if (
        !nombre_actividad &&
        !fechaInicioRaw &&
        !fechaFinRaw &&
        !lugar &&
        !row.getCell(5).value &&
        !semestre
      ) {
        continue;
      }

      const parseFecha = (valor) => {
        if (!valor) return null;
        if (valor instanceof Date) {
          return valor.toISOString();
        }
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) {
          return null;
        }
        return fecha.toISOString();
      };

      const fecha_inicio = parseFecha(fechaInicioRaw);
      const fecha_fin = parseFecha(fechaFinRaw);

      if (
        !nombre_actividad ||
        !fecha_inicio ||
        !fecha_fin ||
        !lugar ||
        Number.isNaN(creditos) ||
        creditos <= 0 ||
        !semestre
      ) {
        resumen.errores.push({
          fila: rowNumber,
          error: "Datos incompletos o inválidos",
        });
        continue;
      }

      try {
        await AdminModel.creaActividad({
          idPersona: req.id_persona,
          nombre_actividad,
          fecha_inicio,
          fecha_fin,
          lugar,
          creditos,
          semestre,
        });
        resumen.procesados += 1;
      } catch (error) {
        console.error("Error importando fila:", error);
        resumen.errores.push({
          fila: rowNumber,
          error: "No se pudo crear la actividad",
        });
      }
    }

    return res.status(200).json({
      ok: true,
      msg: "Importación finalizada",
      ...resumen,
    });
  } catch (error) {
    console.error("Error al procesar Excel:", error);
    return res.status(500).json({ msg: "Error al procesar el archivo" });
  } finally {
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn("No se pudo eliminar archivo temporal:", err.message);
    }
  }
};

const importarHistoricos = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "Archivo requerido" });
  }

  const HEADER_MAP = [
    "nombre_actividad",
    "fecha_actividad (YYYY-MM-DD)",
    "creditos",
    "semestre (2024-I)",
    "dni_estudiante",
    "tipo_registro (asistencia|bonus)",
    "comentario",
    "dni_autor (opcional)",
  ];

  const resumen = {
    procesados: 0,
    errores: [],
    actividades_creadas: 0,
    movimientos_registrados: 0,
  };

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({ msg: "Archivo sin hojas válidas" });
    }

    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.slice(1).map((cell) => sanitizeString(cell));

    if (headers.length !== HEADER_MAP.length) {
      return res.status(400).json({ msg: "Encabezados inválidos o incompletos" });
    }

    for (let i = 0; i < HEADER_MAP.length; i += 1) {
      if (headers[i] !== HEADER_MAP[i]) {
        return res
          .status(400)
          .json({ msg: `Encabezado inesperado en la columna ${i + 1}: se esperaba '${HEADER_MAP[i]}'` });
      }
    }

    const actividadesCache = new Map();

    const obtenerActividad = async ({ nombre, fecha, creditos, semestre }) => {
      const fechaClave = new Date(fecha).toISOString();
      const cacheKey = `${nombre}|${fechaClave}`;
      if (actividadesCache.has(cacheKey)) {
        return actividadesCache.get(cacheKey);
      }

      const fechaISO = fechaClave;
      const actividadExistente = await AdminModel.obtenerActividadPorNombreFecha({
        nombre_actividad: nombre,
        fecha: fechaISO,
      });

      if (actividadExistente) {
        if (Number(actividadExistente.creditos) !== Number(creditos)) {
          throw buildError(
            "CREDITO_INCONSISTENTE",
            `Los créditos no coinciden para la actividad '${nombre}' con fecha ${fecha}`,
          );
        }
        actividadesCache.set(cacheKey, actividadExistente.id_actividad);
        return actividadExistente.id_actividad;
      }

      const nuevaActividad = await AdminModel.crearActividadHistorica({
        nombre_actividad: nombre,
        fecha_actividad: fechaISO,
        creditos: Number(creditos),
        semestre,
        id_creador: req.id_persona,
      });
      resumen.actividades_creadas += 1;
      actividadesCache.set(cacheKey, nuevaActividad.id_actividad);
      return nuevaActividad.id_actividad;
    };

    const obtenerEstudiantePorDni = async (dni) => {
      const resultado = await AdminModel.obtenerEstudiantePorDni(dni);
      if (!resultado) {
        throw buildError("ESTUDIANTE_NO_ENCONTRADO", `Estudiante con DNI ${dni} no existe o está inactivo`);
      }
      return resultado;
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const nombreActividad = sanitizeString(row.getCell(1).text);
      const fechaActividadRaw = sanitizeString(row.getCell(2).text);
      const creditosRaw = Number(row.getCell(3).value);
      const semestre = sanitizeString(row.getCell(4).text);
      const dniEstudiante = sanitizeString(row.getCell(5).text);
      const tipoRegistro = sanitizeString(row.getCell(6).text) || "asistencia";
      const comentario = sanitizeString(row.getCell(7).text) || "Carga histórica";
      const dniAutor = sanitizeString(row.getCell(8).text);

      const isInstructionRow =
        rowNumber === 2 &&
        (row.getCell(1).text || "").includes("No modificar los encabezados");
      const isSampleRow =
        rowNumber === 3 &&
        sanitizeString(row.getCell(1).text) === "Charla STEM 2023";

      if (isInstructionRow || isSampleRow) {
        continue;
      }

      if (
        !nombreActividad &&
        !fechaActividadRaw &&
        !creditosRaw &&
        !semestre &&
        !dniEstudiante
      ) {
        continue;
      }

      try {
        if (!nombreActividad) {
          throw buildError("VALIDATION_ERROR", "nombre_actividad es obligatorio");
        }
        if (!fechaActividadRaw) {
          throw buildError("VALIDATION_ERROR", "fecha_actividad es obligatoria");
        }
        const fechaActividad = new Date(fechaActividadRaw);
        if (Number.isNaN(fechaActividad.getTime())) {
          throw buildError("VALIDATION_ERROR", "fecha_actividad inválida (usar YYYY-MM-DD)");
        }
        if (!Number.isFinite(creditosRaw) || creditosRaw < 0) {
          throw buildError("VALIDATION_ERROR", "creditos debe ser un entero >= 0");
        }
        if (!semestre) {
          throw buildError("VALIDATION_ERROR", "semestre es obligatorio");
        }
        if (!dniEstudiante) {
          throw buildError("VALIDATION_ERROR", "dni_estudiante es obligatorio");
        }
        if (!["asistencia", "bonus"].includes(tipoRegistro.toLowerCase())) {
          throw buildError(
            "VALIDATION_ERROR",
            "tipo_registro debe ser 'asistencia' o 'bonus'",
          );
        }

        let autorPersona =
          dniAutor && dniAutor !== ""
            ? await AdminModel.obtenerPersonaPorDni(dniAutor)
            : null;

        if (dniAutor && !autorPersona) {
          throw buildError("AUTOR_NO_ENCONTRADO", `No existe persona con DNI ${dniAutor}`);
        }

        if (!autorPersona) {
          autorPersona = { id_persona: req.id_persona, rol: req.rol };
        }

        if (!["tutor", "administrador"].includes(autorPersona.rol)) {
          throw buildError(
            "ROL_INVALIDO",
            "Solo tutores o administradores pueden registrar históricos",
          );
        }

        const estudiante = await obtenerEstudiantePorDni(dniEstudiante);
        if (!estudiante) {
          throw buildError(
            "ESTUDIANTE_NO_ENCONTRADO",
            `Estudiante con DNI ${dniEstudiante} no existe o está inactivo`,
          );
        }
        const fechaISO = fechaActividad.toISOString();

        if (tipoRegistro.toLowerCase() === "asistencia") {
          const idActividad = await obtenerActividad({
            nombre: nombreActividad,
            fecha: fechaActividad,
            creditos: creditosRaw,
            semestre,
          });

          await AdminModel.registrarAsistenciaHistorica({
            id_estudiante: estudiante.id_estudiante,
            id_actividad: idActividad,
            creditos: creditosRaw,
            fecha: fechaISO,
            comentario,
            id_autor: autorPersona.id_persona,
            rol_autor: autorPersona.rol || req.rol,
          });
        } else {
          await AdminModel.registrarBonusHistorico({
            id_estudiante: estudiante.id_estudiante,
            creditos: creditosRaw,
            comentario,
            id_autor: autorPersona.id_persona,
            rol_autor: autorPersona.rol || req.rol,
          });
        }

        resumen.procesados += 1;
        resumen.movimientos_registrados += 1;
      } catch (error) {
        resumen.errores.push({
          fila: rowNumber,
          error: error.message || "Error desconocido",
        });
      }
    }

    return res.status(200).json({
      ok: true,
      msg: "Importación histórica finalizada",
      ...resumen,
    });
  } catch (error) {
    console.error("Error al importar históricos:", error);
    return res.status(500).json({ msg: "Error al procesar el archivo histórico" });
  } finally {
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn("No se pudo eliminar archivo temporal:", err.message);
    }
  }
};

const AdminController = {
  register_Admin_tutor,
  MostrarTutor,
  DeleteTutor,
};
const AdminSharedController = {
  registeEstudiante,
  actualizarEstudiante,
  cobrarPuntos,
  bonificarPuntos,
  listarHistorialMovimientos,
  DatosEstudiante,
  DeleteEstudiante,
  verifyGET,
  initMostrarEstudaintes,
  initAdminTutor,
  registerMultipleEstudiantes,
  exportarExcelEstudiantes,
  exportarExcelActividades,
  obtenerSemestres,
  descargarPlantillaExcel,
  descargarPlantillaHistoricos,
  importarExcel,
  importarHistoricos,
};

module.exports = { AdminController, AdminSharedController };
