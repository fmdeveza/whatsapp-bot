import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

import * as dotenv from 'dotenv';
dotenv.config();

const SAFELIST = JSON.parse(process.env.SAFELIST || '[]');

async function main() {
    console.log('Starting...')
    await connectToWhatsApp()
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys')

    const sock = makeWASocket({
        auth: state,
        // printQRInTerminal: true // deprecated
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('💡 Scan the QR Code below with your WhatsApp:')
            qrcode.generate(qr, { small: true })
        }

        // if (connection === 'close') {
        //     const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut
        //     console.log('Connection closed due to an error, reconnecting...', shouldReconnect)
        //     if (shouldReconnect) {
        //         connectToWhatsApp()
        //     }
        // } else if (connection === 'open') {
        //     console.log('✅ Connection opened successfully!')
        // }

    })

    sock.ev.on('messages.upsert', async (m) => {
        console.log('Receiving message event...')
        
        const msg = m.messages[0]

        if (!msg?.message) {
            console.log('Empty message received...')
            return
        }

        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    "Message type not supported for logging"

        const from = msg.key.remoteJid // ID de quem enviou

        if (from && msg.key.fromMe === false && SAFELIST.includes(from)) {
            sock.sendMessage(from, { text: `Você disse: ${text}` })
        } else {
            console.log(`⚠️ Message from [${from}] ignored`)
        }

        console.debug(`DEBUG [${from}]: ${JSON.stringify(msg, null, 2)}`)
    })

    // 4. Salvar as credenciais sempre que atualizadas
    sock.ev.on('creds.update', saveCreds)
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
