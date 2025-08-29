const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer'); // 👈 Importante usar puppeteer

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

const usuarioContador = {};
const usuarioOpcionesRespondidas = {};
const MAX_INTENTOS = 2;

client.on('qr', qr => {
    console.log('Escanea este QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Cliente listo');
});

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

client.initialize();
