const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json()); // Para entender los datos del formulario
app.use(express.static('public')); // Para servir nuestro index.html

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// Endpoint para que el frontend pida los turnos
app.get('/api/turnos', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, { action: 'getNextAvailable', count: 500 }); // Pedimos hasta 500 turnos
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ status: 'error', message: 'No se pudieron cargar los turnos.' });
    }
});

// Endpoint para que el frontend reserve un turno
app.post('/api/reservar', async (req, res) => {
    try {
        const { slotId, nombre, apellido, dni, whatsapp } = req.body;
        const userInfo = { nombre, apellido, dni, whatsapp };

        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'bookAppointment',
            slotId: slotId,
            userInfo: userInfo
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ status: 'error', message: 'Error al reservar el turno.' });
    }
});
// Endpoint para cancelar un turno
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de la turnera corriendo en http://localhost:${PORT}`);
});