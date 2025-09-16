import React, { useRef, useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Navbar from "../Navbar/Navbar";
import NavbarT from '../Navbar/NavbarT';
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/button/Button";
import TextField from "../../components/TextField/TextField";
import "./Tomar_asistencia.css";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";

const Tomar_asistencia = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const actividad = state?.actividad;
    const [ultimoDniEscaneado, setUltimoDniEscaneado] = useState("");
    const [estudiantes, setEstudiantes] = useState([]);
    const [asistencias, setAsistencias] = useState({});
    const [manualMode, setManualMode] = useState(false);
    const [dniManual, setDniManual] = useState("");
    const [scannerActive, setScannerActive] = useState(false);
    const [loadingCamera, setLoadingCamera] = useState(false);
    const [navbarCollapsed, setNavbarCollapsed] = useState(false);
    const videoRef = useRef(null);
    const codeReader = useRef(null);
    const [decodingControls, setDecodingControls] = useState(null);
    const isProcessing = useRef(false);
    const { rol } = useContext(AuthContext);
    const columns = ["Nombre", "Apellido","DNI", "Asistencia"];
const [lastScannedTime, setLastScannedTime] = useState(0);
const [scanCooldown, setScanCooldown] = useState(false);
    // Efecto para detectar el estado del navbar colapsado
    useEffect(() => {
        const handleNavbarChange = () => {
            // Verificamos si existe un elemento con la clase .navbar-container.collapsed
            const collapsedNavbar = document.querySelector('.navbar-container.collapsed');
            setNavbarCollapsed(!!collapsedNavbar);
        };

        // Observamos cambios en el DOM para detectar cuando el navbar cambia
        const observer = new MutationObserver(handleNavbarChange);
        observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

        // Verificación inicial
        handleNavbarChange();

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!actividad?.id_actividad) return;

        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/AsistenciaActividad?id_actividad=${actividad.id_actividad}`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const mapped = data.map(e => ({
                        dni: e.dni,
                        nombre: e.nombre_persona || e.nombre,
                        apellido: e.apellido,
                        id_persona: e.id_persona
                    }));
                    setEstudiantes(mapped);

                    const asistenciasMap = {};
                    mapped.forEach(e => {
                        asistenciasMap[e.dni] = true;
                    });
                    setAsistencias(asistenciasMap);
                }
            })
            .catch(err => {
                console.error("❌ Error al obtener asistentes previos:", err);
            });
    }, [actividad]);
     const renderNavbar = () => {
    switch (rol) {
        case "administrador":
            return <Navbar/>;
        case "estudiante":
            return <NavbarE />;
        case "tutor":
            return <NavbarT />;
        default:
            alert("Tu sesión ha expirado");
            localStorage.clear();
            navigate("/");
            return null;
    }
};
    const registrarAsistenciaPorDNI = (dni, estado = true) => {
    const dniRecortado = dni.length === 13 ? dni.slice(-8) : dni;

    return fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/DatosEstudiante?dni=${dniRecortado}`, {
        method: 'GET',
        credentials: 'include',
    })
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                console.error("❌ Error DatosEstudiante:", response.status, text);
                alert("Estudiante no encontrado.");
                throw new Error("Estudiante no encontrado");
            }
            return response.json();
        })
        .then(data => {
            console.log("✅ Estudiante encontrado:", data);

            if (!data?.id_persona) {
                alert("Estudiante inválido.");
                throw new Error("Estudiante inválido");
            }

            const url = `${import.meta.env.VITE_API_URL}/cedhi/admin/AsistenciaEstudainte`;
            const payload = {
                id_persona: data.id_persona,
                id_actividad: actividad.id_actividad,
                estado: estado
            };

            console.log("📤 Enviando a:", url);
            console.log("📦 Payload:", payload);

            return fetch(url, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(async res => {
                    const text = await res.text();
                    console.log("📥 Respuesta RAW:", text);

                    try {
                        const json = JSON.parse(text);
                        if (json.ok) {
                            const tempId = data.dni;

                            setEstudiantes(prev => {
                                const yaExiste = prev.some(e => e.dni === data.dni);
                                if (!yaExiste) {
                                    return [...prev, {
                                        dni: data.dni,
                                        id_persona: data.id_persona,
                                        nombre: data.nombre_persona,
                                        apellido: data.apellido
                                    }];
                                }
                                return prev;
                            });

                            setAsistencias(prev => ({
                                ...prev,
                                [tempId]: estado
                            }));

                            alert(`✅ Asistencia ${estado ? "registrada" : "cancelada"} para ${data.nombre_persona} ${data.apellido}`);
                            return Promise.resolve();
                        } else {
                            alert("❌ Error en la respuesta JSON: " + JSON.stringify(json));
                            throw new Error("Error en respuesta JSON");
                        }
                    } catch (e) {
                        alert("❌ Respuesta no fue JSON. Revisa consola.");
                        throw e;
                    }
                });
        })
        .catch(error => {
            console.error("❌ Error general:", error);
            alert("Error inesperado al registrar asistencia. Revisa consola.");
            throw error;
        });
};

    const toggleAsistencia = (dni) => {
        const estudiante = estudiantes.find(e => e.dni === dni);
        const nuevoEstado = !asistencias[dni];

        if (!estudiante || !estudiante.id_persona) {
            alert("Falta id_persona o dni en los datos del estudiante.");
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/cedhi/admin/AsistenciaEstudainte`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_persona: estudiante.id_persona,
                id_actividad: actividad.id_actividad,
                estado: nuevoEstado
            })
        })
            .then(res => res.json())
            .then(result => {
                if (result.ok) {
                    setAsistencias(prev => ({
                        ...prev,
                        [dni]: nuevoEstado
                    }));
                } else {
                    alert("No se pudo cambiar el estado de asistencia.");
                }
            })
            .catch(err => {
                console.error("Error:", err);
                alert("Error al actualizar asistencia.");
            });
    };

    const handleManualSubmit = () => {
        if (!dniManual.trim()) {
            alert("Ingresa un DNI.");
            return;
        }
        registrarAsistenciaPorDNI(dniManual);
        setDniManual("");
    };
//dcannn 


 const startScanner = async () => {
  setScannerActive(true);
  setLoadingCamera(true);
  isProcessing.current = false;
  setScanCooldown(false);
  setLastScannedTime(0);

  try {
    console.log("🔄 Solicitando acceso a la cámara...");

    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("✅ Cámara obtenida");

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    // Intentar aplicar zoom óptico (si está disponible)
    if (capabilities.zoom) {
      const maxZoom = capabilities.zoom.max;
      const zoomValor = Math.min(maxZoom, 2); // Zoom x2 como máximo

      await track.applyConstraints({
        advanced: [{ zoom: zoomValor }]
      });
      console.log("🔍 Zoom óptico aplicado:", zoomValor);
    } else {
      console.warn("⚠️ Zoom óptico no disponible, se aplicará zoom digital por CSS");
    }

    if (!videoRef.current) {
      alert("Error al inicializar cámara");
      stream.getTracks().forEach(t => t.stop());
      setScannerActive(false);
      setLoadingCamera(false);
      return;
    }

    videoRef.current.srcObject = stream;
    videoRef.current.setAttribute("playsinline", true);
    await videoRef.current.play();

    // Preparar el lector de códigos
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.warn("⚠️ No se pudo resetear lector:", e);
      }
    }

    codeReader.current = new BrowserMultiFormatReader();

    const timeoutId = setTimeout(() => {
      console.warn("⏱️ Timeout de inicio");
      setLoadingCamera(false);
      alert("La cámara tardó demasiado en iniciar.");
      stopScanner();
    }, 8000);

    const controls = await codeReader.current.decodeFromConstraints(
      { video: { facingMode: "environment" } },
      videoRef.current,
      (result, err) => {
        clearTimeout(timeoutId);
        setLoadingCamera(false);

        const now = Date.now();
        if (result && !isProcessing.current) {
          const codigo = result.getText().trim();

          if (now - lastScannedTime < 1500) return;
          if (codigo === ultimoDniEscaneado && now - lastScannedTime < 3000) return;

          isProcessing.current = true;
          setLastScannedTime(now);
          setUltimoDniEscaneado(codigo);

          if (/^\d{8}$/.test(codigo) || /^\d{13}$/.test(codigo)) {
            registrarAsistenciaPorDNI(codigo).finally(() => {
              setTimeout(() => (isProcessing.current = false), 1000);
            });
          } else {
            setTimeout(() => (isProcessing.current = false), 500);
          }
        }

        if (err && !err.name?.toLowerCase().includes("notfound")) {
          console.error("❌ Error de lectura:", err);
        }
      }
    );

    setDecodingControls(controls);
  } catch (err) {
    console.error("❌ Error al iniciar cámara:", err);
    alert("No se pudo acceder a la cámara: " + err.message);
    setScannerActive(false);
    setLoadingCamera(false);
  }
};
  const stopScanner = async () => {
  console.log("🛑 Deteniendo escáner...");
  
  setScannerActive(false);
  setLoadingCamera(false);
  
  // 1. Detener los controles de decodificación primero
  if (decodingControls) {
    try {
      decodingControls.stop();
      console.log("✅ Controles de decodificación detenidos");
    } catch (e) {
      console.warn("Error al detener controles:", e);
    }
    setDecodingControls(null);
  }

  // 2. Detener el stream de video
  if (videoRef.current?.srcObject) {
    const tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach(track => {
      track.stop();
      console.log(`✅ Track ${track.kind} detenido`);
    });
    videoRef.current.srcObject = null;
  }

  // 3. Limpiar el lector de códigos
  if (codeReader.current) {
    try {
      // Detener cualquier decodificación en curso
      if (codeReader.current.stopContinuousDecode) {
        codeReader.current.stopContinuousDecode();
      }
      if (codeReader.current.reset) {
        codeReader.current.reset();
      }
    } catch (e) {
      console.warn("Error al limpiar lector:", e);
    }
    codeReader.current = null;
  }

  console.log("✅ Escáner completamente detenido");
  window.location.reload();
};

useEffect(() => {
    // Resetear estados al montar el componente
    isProcessing.current = false;
    setLastScannedTime(0);
    setUltimoDniEscaneado("");
    
    // ... resto del useEffect
}, []);

    const customRender = (col, row) => {
        switch (col) {
            case "Nombre":
                return row.nombre;
            case "Apellido":
                return row.apellido;
            case "DNI":
                return row.dni;
            case "Asistencia":
                return (
                    <input
                        type="checkbox"
                        checked={asistencias[row.dni] || false}
                        onChange={() => toggleAsistencia(row.dni)}
                    />
                );
            default:
                return null;
        }
    };

    if (!actividad) return <p>No se seleccionó ninguna actividad</p>;

    return (
        <>
         {renderNavbar()}

        <div className={`asistencia-detalle-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
            
            <div className="info-container">
                <h2>Asistencia - {actividad.nombre_actividad}</h2>
                <p><strong>Lugar:</strong> {actividad.lugar}</p>
                <p><strong>Créditos:</strong> {actividad.creditos}</p>
                <p><strong>Semestre:</strong> {actividad.semestre}</p>

                <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', alignItems: 'center' }}>
                    <Button text="Manual" onClick={() => setManualMode(!manualMode)} />
                    <Button text={scannerActive ? "Detener Escáner" : "Código de Barras"} onClick={scannerActive ? stopScanner : startScanner} />
                    <Button text="Volver" styleType="white" onClick={() => navigate(-1)} />
                </div>

                {manualMode && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <TextField
                            placeholder="Ingresar DNI"
                            value={dniManual}
                            onChange={(e) => setDniManual(e.target.value)}
                        />
                        <Button text="Registrar" onClick={handleManualSubmit} />
                    </div>
                )}

                {scannerActive && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            maxWidth: '100vw',
                            maxHeight: '100vh',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                            boxSizing: 'border-box'
                        }}>
                            {/* Botón ✕ rojo plano */}
                            <button
                                onClick={stopScanner}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ff4d4f',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    zIndex: 10000
                                }}
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>

                            {/* Recuadro guía */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '80%',
                                height: 70,
                                border: '3px dashed #1976d2',
                                borderRadius: 12,
                                zIndex: 2,
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.08)'
                            }}>
        <span style={{
            color: '#1976d2',
            fontWeight: 'bold',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px 12px',
            borderRadius: 8,
            fontSize: '0.9rem',
            textAlign: 'center'
        }}>
          Escanea el código de barras aquí
        </span>
                            </div>

                            {/* Cámara */}
                                              <video
  ref={videoRef}
  style={{
    width: '70%',
    height: 'auto',
    maxHeight: '60vh',
    borderRadius: 8,
    background: '#000',
    transform: 'scale(1.2)', // Zoom digital
    objectFit: 'cover',
    boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
  }}
/>

                            {/* Cargando... */}
                            {loadingCamera && (
                                <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    height: 100,
    border: '3px dashed #1976d2',
    borderRadius: 12,
    zIndex: 2,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)',
    animation: 'pulseBorder 2s infinite'
}}>
                                    Cargando cámara...
                                </div>
                            )}

                            {/* Estado */}
                            <p style={{
                                marginTop: '0.5rem',
                                color: ultimoDniEscaneado ? 'green' : '#1976d2',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                fontSize: '1rem'
                            }}>
                                {ultimoDniEscaneado
                                    ? `✅ Código detectado: ${ultimoDniEscaneado}`
                                    : (!loadingCamera && "📷 Esperando captura...")}
                            </p>
                        </div>
                    </div>
                )}
                <h3>Estudiantes Registrados</h3>
                <div className="tabla-asistencia">
                    <table style={{ width: "100%" }}>
                        <thead>
                        <tr className="table-header">
                            {columns.map(col => (
                                <th key={col} className="table-cell">{col}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {estudiantes.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>No hay estudiantes registrados.</td>
                            </tr>
                        ) : (
                            estudiantes.map((row, idx) => (
                                <tr key={idx} className="table-row">
                                    {columns.map(col => (
                                        <td key={col} className="table-cell">
                                            {customRender(col, row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div></>
    );
};

export default Tomar_asistencia;