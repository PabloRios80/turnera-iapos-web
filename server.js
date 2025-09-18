const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;


// Endpoint para que el frontend pida los turnos
app.get('/api/turnos', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, { action: 'getNextAvailable' });
        
        // --- INICIO DEL CÓDIGO DE DIAGNÓSTICO ---
        console.log("\n=======================================================");
        console.log("INFORME DE ESTADO RECIBIDO DESDE GOOGLE APPS SCRIPT:");
        // Imprimimos el informe de depuración que nos envía el script
        if (response.data.debug_log) {
            console.log(response.data.debug_log);
        }
        console.log("=======================================================\n");
        // --- FIN DEL CÓDIGO DE DIAGNÓSTICO ---
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ status: 'error', message: 'No se pudieron cargar los turnos.' });
    }
});


// Endpoint para buscar datos de un afiliado por DNI
app.get('/api/admin/usuario/:dni', async (req, res) => {
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

// Endpoint para que el frontend reserve un turno
app.post('/api/reservar', async (req, res) => {
    
    // --- INICIO DEL CÓDIGO DE DIAGNÓSTICO ---
    console.log("=============================================");
    console.log("NUEVA RESERVA RECIBIDA EN EL SERVIDOR");
    console.log("Datos recibidos del formulario (req.body):");
    console.log(req.body); // Micrófono #1: ¿Qué llegó del navegador?
    // --- FIN DEL CÓDIGO DE DIAGNÓSTICO ---

    try {
        const { slotId, nombre, apellido, dni, email, whatsapp } = req.body;
        const userInfo = { nombre, apellido, dni, email, whatsapp };

        // --- INICIO DEL CÓDIGO DE DIAGNÓSTICO ---
        console.log("\nDatos que se enviarán a Google (userInfo):");
        console.log(userInfo); // Micrófono #2: ¿Qué estamos a punto de enviar?
        console.log("=============================================");
        // --- FIN DEL CÓDIGO DE DIAGNÓSTICO ---

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

// Endpoint para que el panel de administración pida todos los turnos
app.get('/api/admin/turnos', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, { action: 'getAllAppointments' });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ status: 'error', message: 'No se pudieron cargar los turnos.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de la turnera corriendo en http://localhost:${PORT}`);
});