const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const app = express();
app.use(express.json());
app.use(express.static("public"));

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
// Obtener turnos disponibles
app.get("/api/turnos", async (req, res) => {
  try {
    const city = req.query.city || "santafe";
    const subcity = req.query.subcity || ""; // <-- ESTO ES CLAVE

    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "getNextAvailableSlots",
      city: city,
      subcity: subcity, // <-- SE LO PASAMOS AL APPS SCRIPT
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error" });
  }
});
// Endpoint para que el frontend reserve un turno
app.post("/api/reservar", async (req, res) => {
  try {
    // Ahora recibimos también la 'city' desde el cuerpo del formulario
    const { slotId, nombre, apellido, dni, email, whatsapp, city } = req.body;

    // Validamos que llegue la ciudad, si no, default a santafe
    const ciudadDestino = city || "santafe";

    const userInfo = { nombre, apellido, dni, email, whatsapp };

    console.log(`Reservando turno en ${ciudadDestino} para DNI ${dni}`); // Log para depurar

    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "bookAppointment",
      slotId: slotId,
      userInfo: userInfo,
      city: ciudadDestino, // Enviamos la ciudad al Apps Script
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error booking appointment:", error);
    res
      .status(500)
      .json({ status: "error", message: "Error al reservar el turno." });
  }
});

// --- EL RESTO DE ENDPOINTS SIGUEN IGUAL (Admin, Login, etc) ---
// No necesitan cambios de ciudad por ahora a menos que quieras admin separado

app.get("/api/admin/turnos", async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "getAllAppointments",
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    res.status(500).json({
      status: "error",
      message: "No se pudieron cargar los turnos agendados.",
    });
  }
});

app.get("/api/usuario/:dni", async (req, res) => {
  try {
    const { dni } = req.params;
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "getUserDataByDNI",
      dni: dni,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching user data by DNI:", error);
    res
      .status(500)
      .json({ status: "error", message: "No se pudo buscar el afiliado." });
  }
});

app.post("/api/cancelar", async (req, res) => {
  try {
    const { eventId } = req.body;
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "cancelAppointment",
      eventId: eventId,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res
      .status(500)
      .json({ status: "error", message: "Error al cancelar el turno." });
  }
});

app.post("/api/profesionales/registro", async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "registerProfessional",
      professionalData: req.body,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error registering professional:", error);
    res.status(500).json({
      status: "error",
      message: "No se pudo procesar la solicitud de registro.",
    });
  }
});

app.post("/api/profesionales/login", async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "loginProfessional",
      credentials: req.body,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error en el servidor." });
  }
});

app.post("/api/profesionales/derivar", async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "createReferral",
      referralData: req.body,
    });
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "No se pudo guardar la derivación." });
  }
});
// Endpoint para mover turno a la agenda de Fuerzas de Seguridad
app.post("/api/admin/mover-fuerzas", async (req, res) => {
  try {
    const { idTurno, city } = req.body;
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: "moveToFuerzas",
      idTurno: idTurno,
      city: city,
    });
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Error al mover el turno." });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de la turnera corriendo en http://localhost:${PORT}`);
});
async function calcularSlotsDisponibles(id_sede_dp, diasAdelante = 60) {
  const { data: horarios } = await supabase
    .from("horarios_turnera_sede")
    .select("*")
    .eq("id_sede_dp", id_sede_dp)
    .eq("activo", true);
  if (!horarios || !horarios.length) return [];

  const { data: bloqueados } = await supabase
    .from("dias_bloqueados_sede")
    .select("fecha")
    .eq("id_sede_dp", id_sede_dp);
  const fechasBloqueadas = new Set((bloqueados || []).map((b) => b.fecha));

  const hoy = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + diasAdelante);

  const { data: reservados } = await supabase
    .from("turnos")
    .select("fecha_inicio")
    .eq("id_sede_dp", id_sede_dp)
    .eq("estado", "Confirmado")
    .gte("fecha_inicio", hoy.toISOString())
    .lte("fecha_inicio", limite.toISOString());
  const ocupados = new Set(
    (reservados || []).map((r) => new Date(r.fecha_inicio).toISOString()),
  );

  const slots = [];
  for (let i = 0; i < diasAdelante; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + i);
    const fechaStr = fecha.toISOString().split("T")[0];
    if (fechasBloqueadas.has(fechaStr)) continue;

    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay(); // 1=lunes...7=domingo
    const bloques = horarios.filter((h) => h.dia_semana === diaSemana);

    for (const bloque of bloques) {
      const [hI, mI] = bloque.hora_inicio.split(":").map(Number);
      const [hF, mF] = bloque.hora_fin.split(":").map(Number);
      let cursor = new Date(
        `${fechaStr}T${String(hI).padStart(2, "0")}:${String(mI).padStart(2, "0")}:00-03:00`,
      );
      const fin = new Date(
        `${fechaStr}T${String(hF).padStart(2, "0")}:${String(mF).padStart(2, "0")}:00-03:00`,
      );

      while (cursor < fin) {
        if (cursor > new Date()) {
          const key = cursor.toISOString();
          if (!ocupados.has(key)) slots.push({ id: key, time: key });
        }
        cursor = new Date(cursor.getTime() + bloque.duracion_minutos * 60000);
      }
    }
  }
  return slots.slice(0, 300);
}
app.get("/api/turnos-sede/disponibles", async (req, res) => {
  const id_sede_dp = parseInt(req.query.id_sede_dp);
  if (!id_sede_dp)
    return res
      .status(400)
      .json({ status: "error", message: "Falta id_sede_dp." });
  try {
    const slots = await calcularSlotsDisponibles(id_sede_dp);
    res.json({ status: "success", slots });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.get("/api/sede-info/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sedes_dp")
      .select("id, nombre, ciudad, direccion, telefono, instrucciones")
      .eq("id", req.params.id)
      .single();
    if (error || !data)
      return res
        .status(404)
        .json({ status: "error", message: "Sede no encontrada." });
    res.json({ status: "success", sede: data });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.post("/api/turnos-sede/reservar", async (req, res) => {
  const { id_sede_dp, slotId, nombre, apellido, dni, email, whatsapp } =
    req.body;
  if (!id_sede_dp || !slotId || !dni) {
    return res.status(400).json({ status: "error", message: "Faltan datos." });
  }
  try {
    // Revalidar que el slot siga libre justo antes de reservar
    const slotsActuales = await calcularSlotsDisponibles(id_sede_dp);
    const sigueLibre = slotsActuales.some((s) => s.id === slotId);
    if (!sigueLibre) {
      return res.json({
        status: "error",
        message: "El turno ya no está disponible.",
      });
    }

    const fechaInicio = new Date(slotId);
    const { data: horarios } = await supabase
      .from("horarios_turnera_sede")
      .select("duracion_minutos")
      .eq("id_sede_dp", id_sede_dp)
      .limit(1)
      .single();
    const duracion = horarios?.duracion_minutos || 10;
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);

    const { error } = await supabase.from("turnos").insert({
      id_turno: Date.now(), // identificador simple, único por timestamp de creación
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      estado: "Confirmado",
      nombre,
      apellido,
      dni,
      email,
      telefono: whatsapp,
      id_sede_dp,
      ciudad: null, // ya no hace falta, queda id_sede_dp como fuente de verdad
      tipo_turno: "DP",
    });
    if (error) throw error;

    res.json({ status: "success", message: "Turno confirmado con éxito." });
  } catch (e) {
    res
      .status(500)
      .json({ status: "error", message: "Error al reservar el turno." });
  }
});
