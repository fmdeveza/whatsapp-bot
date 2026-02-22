import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

import * as dotenv from 'dotenv'; // Or use `import 'dotenv/config'`
dotenv.config();

const safelist = JSON.parse(process.env.SAFELIST || '[]');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys')

    const sock = makeWASocket({
        auth: state,
        // printQRInTerminal: true // deprecated
    })

    sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
        console.log('💡 Escaneie o QR Code abaixo com seu WhatsApp:')
        qrcode.generate(qr, { small: true })
    }

    // if (connection === 'close') {
    //     const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut
    //     console.log('Conexão fechada devido a um erro, reconectando...', shouldReconnect)
    //     if (shouldReconnect) {
    //         connectToWhatsApp()
    //     }
    // } else if (connection === 'open') {
    //     console.log('✅ Conexão aberta com sucesso!')
    // }
    })

    sock.ev.on('messages.upsert', async (m) => {
        console.log('Recebendo evento de mensagem...')
        
        const msg = m.messages[0]

        if (!msg?.message) {
            console.log('Empty message received...')
            return
        }

        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    "Tipo de mensagem não suportado para log"

        const from = msg.key.remoteJid // ID de quem enviou

        if (from && msg.key.fromMe === false && safelist.includes(from)) {
            sock.sendMessage(from, { text: `Você disse: ${text}` })
        } else {
            console.log(`⚠️ Mensagem de [${from}] ignorada`)
        }

        console.log(`📩 Mensagem de [${from}]: ${JSON.stringify(msg, null, 2)}`)
    })

    // 4. Salvar as credenciais sempre que atualizadas
    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()