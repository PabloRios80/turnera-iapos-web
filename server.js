const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// Endpoint para que el frontend pida los turnos disponibles
app.get('/api/turnos', async (req, res) => {
    try {
        // Leemos la ciudad que viene en la URL (ej: /api/turnos?city=rosario)
        // Si no viene nada, asumimos 'santafe' por defecto
        const city = req.query.city || 'santafe';

        console.log(`Solicitando turnos para: ${city}`); // Log para depurar

        const response = await axios.post(APPS_SCRIPT_URL, { 
            action: 'getNextAvailable',
            city: city // Enviamos la ciudad al Apps Script
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ status: 'error', message: 'No se pudieron cargar los turnos.' });
    }
});

// Endpoint para que el frontend reserve un turno
app.post('/api/reservar', async (req, res) => {
    try {
        // Ahora recibimos también la 'city' desde el cuerpo del formulario
        const { slotId, nombre, apellido, dni, email, whatsapp, city } = req.body;
        
        // Validamos que llegue la ciudad, si no, default a santafe
        const ciudadDestino = city || 'santafe';

        const userInfo = { nombre, apellido, dni, email, whatsapp };

        console.log(`Reservando turno en ${ciudadDestino} para DNI ${dni}`); // Log para depurar

        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'bookAppointment',
            slotId: slotId,
            userInfo: userInfo,
            city: ciudadDestino // Enviamos la ciudad al Apps Script
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ status: 'error', message: 'Error al reservar el turno.' });
    }
});

// --- EL RESTO DE ENDPOINTS SIGUEN IGUAL (Admin, Login, etc) ---
// No necesitan cambios de ciudad por ahora a menos que quieras admin separado

app.get('/api/admin/turnos', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, { action: 'getAllAppointments' });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ status: 'error', message: 'No se pudieron cargar los turnos agendados.' });
    }
});

app.get('/api/usuario/:dni', async (req, res) => {
    try {
        const { dni } = req.params;
        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'getUserDataByDNI',
            dni: dni
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching user data by DNI:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo buscar el afiliado.' });
    }
});

app.post('/api/cancelar', async (req, res) => {
    try {
        const { eventId } = req.body;
        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'cancelAppointment',
            eventId: eventId
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ status: 'error', message: 'Error al cancelar el turno.' });
    }
});

app.post('/api/profesionales/registro', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'registerProfessional',
            professionalData: req.body
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error registering professional:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo procesar la solicitud de registro.' });
    }
});

app.post('/api/profesionales/login', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'loginProfessional',
            credentials: req.body
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error en el servidor.' });
    }
});

app.post('/api/profesionales/derivar', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'createReferral',
            referralData: req.body
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'No se pudo guardar la derivación.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de la turnera corriendo en http://localhost:${PORT}`);
});