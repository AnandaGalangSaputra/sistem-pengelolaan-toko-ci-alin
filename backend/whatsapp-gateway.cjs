const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let qrCodeBase64 = null;
let connectionStatus = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, QR_CODE, CONNECTED
let connectedNumber = '';
let isClientInitializing = false;

const port = 8082;

async function initWhatsapp() {
    if (isClientInitializing) return;
    isClientInitializing = true;
    connectionStatus = 'CONNECTING';
    qrCodeBase64 = null;

    console.log("Starting WhatsApp client (Baileys)...");

    try {
        const authFolder = path.join(__dirname, '_IGNORE_TOKO_CE_ALIN_SESSION_BAILEYS');
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: pino({ level: 'silent' }),
            defaultQueryTimeoutMs: undefined,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                connectionStatus = 'QR_CODE';
                try {
                    qrCodeBase64 = await QRCode.toDataURL(qr);
                    console.log("New QR Code generated.");
                } catch (err) {
                    console.error("Error generating QR code:", err);
                }
            }

            if (connection === 'open') {
                connectionStatus = 'CONNECTED';
                qrCodeBase64 = null;
                isClientInitializing = false;
                
                const user = sock.user;
                if (user && user.id) {
                    connectedNumber = user.id.split(':')[0].split('@')[0];
                    console.log("WhatsApp successfully connected! Logged in as:", connectedNumber);
                } else {
                    connectedNumber = 'Unknown';
                }
            }

            if (connection === 'close') {
                const errorCode = lastDisconnect?.error?.output?.statusCode;
                console.log("Connection closed. Error code:", errorCode, lastDisconnect?.error?.message);
                
                const shouldReconnect = errorCode !== DisconnectReason.loggedOut;
                
                connectionStatus = 'DISCONNECTED';
                connectedNumber = '';
                qrCodeBase64 = null;
                isClientInitializing = false;
                sock = null;

                if (shouldReconnect) {
                    console.log("Reconnecting in 5 seconds...");
                    setTimeout(() => {
                        initWhatsapp();
                    }, 5000);
                } else {
                    console.log("Logged out from WhatsApp. Cleaning up auth files...");
                    try {
                        if (fs.existsSync(authFolder)) {
                            fs.rmSync(authFolder, { recursive: true, force: true });
                        }
                    } catch (e) {
                        console.error("Failed to delete auth folder:", e);
                    }
                }
            }
        });
    } catch (err) {
        console.error("Error launching client:", err);
        connectionStatus = 'DISCONNECTED';
        isClientInitializing = false;
        sock = null;
    }
}

// Start WhatsApp on startup
initWhatsapp();

app.get('/api/whatsapp/status', (req, res) => {
    if (connectionStatus === 'DISCONNECTED' && !isClientInitializing) {
        initWhatsapp();
    }
    res.json({
        success: true,
        status: connectionStatus,
        number: connectedNumber
    });
});

app.get('/api/whatsapp/qr', (req, res) => {
    res.json({
        success: true,
        qr: qrCodeBase64
    });
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        console.log("Disconnecting WhatsApp...");
        if (sock) {
            try {
                // Memberikan batas waktu (timeout) 3 detik agar tidak menggantung
                await Promise.race([
                    sock.logout(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 3000))
                ]);
            } catch (err) {
                console.error("Error/Timeout during logout:", err.message);
                try {
                    sock.end();
                } catch (e) {}
            }
            sock = null;
        }
        connectionStatus = 'DISCONNECTED';
        connectedNumber = '';
        qrCodeBase64 = null;
        isClientInitializing = false;

        const authFolder = path.join(__dirname, '_IGNORE_TOKO_CE_ALIN_SESSION_BAILEYS');
        if (fs.existsSync(authFolder)) {
            fs.rmSync(authFolder, { recursive: true, force: true });
        }

        res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
        console.error("Error disconnecting:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/whatsapp/broadcast', async (req, res) => {
    const { message, numbers } = req.body;
    if (!sock || connectionStatus !== 'CONNECTED') {
        return res.status(400).json({ success: false, message: 'WhatsApp is not connected' });
    }
    if (!message || !numbers || !Array.isArray(numbers)) {
        return res.status(400).json({ success: false, message: 'Message and numbers array are required' });
    }

    res.json({ success: true, message: 'Broadcast started' });

    // Send broadcast asynchronously
    (async () => {
        for (const num of numbers) {
            try {
                let cleanNum = num.replace(/[^0-9]/g, '');
                if (cleanNum.startsWith('0')) {
                    cleanNum = '62' + cleanNum.slice(1);
                }
                const formattedNum = cleanNum + '@s.whatsapp.net';
                console.log(`Sending message to ${formattedNum}...`);
                
                if (sock) {
                    await sock.sendMessage(formattedNum, { text: message });
                } else {
                    console.error("Cannot send message: Socket is disconnected.");
                }
                
                // Delay 2 seconds
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
                console.error(`Failed to send message to ${num}:`, err);
            }
        }
        console.log("Broadcast finished.");
    })();
});

app.listen(port, () => {
    console.log(`WhatsApp API Gateway Node.js running on port ${port}`);
});
