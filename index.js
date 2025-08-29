const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode'); // QR en Base64
const express = require('express');
const puppeteer = require('puppeteer'); // 👈 Importante usar puppeteer

// --- Servidor Express para mostrar QR ---
const app = express();
const port = 3000;
let qrImage = null; // QR en Base64

// --- Configuración del cliente WhatsApp ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Contadores y control de mensajes
const usuarioContador = {};
const usuarioOpcionesRespondidas = {};
const MAX_INTENTOS = 2;

// --- Evento QR ---
client.on('qr', async qr => {
    console.log('Escanea este QR con tu WhatsApp (consola opcional):');

    // QR en consola
    qrcode.toString(qr, { type: 'terminal' }, (err, url) => {
        if (err) console.error(err);
        console.log(url);
    });

    // QR en Base64 para navegador
    qrImage = await qrcode.toDataURL(qr);
});

// --- Cliente listo ---
client.on('ready', () => {
    console.log('✅ Cliente listo');
});

// --- Función para mensajes automáticos ---
function obtenerMensaje(opcion) {
    switch (opcion) {
        case '1':
            return `Gestión de redes incluye planificación estratégica, diseño, redacción de contenido y publicación en plataformas como Instagram, Facebook.\n\n¿Podrías contarnos un poco sobre tu marca o emprendimiento?\n\n`;
        case '2':
            return `Realizamos sitios web institucionales, tiendas online modernas, optimizados para celulares, con diseño personalizado.\n\nTe podemos ayudar tanto si tenés una web para renovar como si es tu primera página.\n\n¿Querés una web informativa o algo más interactivo?\n\n`;
        case '3':
            return `Filmamos contenido para marcas: fotos, videos en tu local. También contamos con fotografía de productos (fondo neutro).\n\n¿Qué tipo de contenido estás necesitando? ¿Para redes, web, productos?\n\n`;
        case '4':
            return `Ofrecemos campañas de marketing en Google Ads, Meta Ads (Facebook/Instagram).\n\nNos enfocamos en que tu marca crezca en visibilidad.\n\n`;
        default:
            return null;
    }
}

// --- Evento mensaje ---
client.on('message', message => {
    const chatId = message.from;
    if (!usuarioContador[chatId]) usuarioContador[chatId] = 0;
    if (!usuarioOpcionesRespondidas[chatId]) usuarioOpcionesRespondidas[chatId] = new Set();

    if (usuarioContador[chatId] < MAX_INTENTOS) {
        const texto = message.body.replace(/\s+/g, '');
        const partes = texto.split(/[, -]/).map(op => op.trim());

        partes.forEach(parte => {
            parte.split('').forEach(opcion => {
                if (!usuarioOpcionesRespondidas[chatId].has(opcion)) {
                    const mensaje = obtenerMensaje(opcion);
                    if (mensaje) {
                        message.reply(mensaje);
                        usuarioOpcionesRespondidas[chatId].add(opcion);
                    }
                }
            });
        });

        usuarioContador[chatId]++;
        console.log(`Usuario ${chatId} ha recibido ${usuarioContador[chatId]} mensajes automáticos. Opciones respondidas: ${Array.from(usuarioOpcionesRespondidas[chatId]).join(',')}`);
    } else {
        console.log(`Usuario ${chatId} ha agotado sus ${MAX_INTENTOS} mensajes automáticos.`);
    }
});

// --- Servidor para mostrar QR ---
app.get('/', (req, res) => {
    if (!qrImage) return res.send('QR aún no generado. Esperá un momento...');
    res.send(`<img src="${qrImage}" style="width:300px;height:300px;" />`);
});

app.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`));

// --- Inicializamos cliente WhatsApp ---
client.initialize();
