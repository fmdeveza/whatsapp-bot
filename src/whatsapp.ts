
import { createWriteStream } from 'fs'

import makeWASocket, { DisconnectReason, useMultiFileAuthState, downloadMediaMessage, getContentType } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

import type { MessageDispatcher } from './dispatcher.js';


export async function connectToWhatsApp(dispatcher: MessageDispatcher) {
    const SAFELIST = JSON.parse(process.env.SAFELIST || '[]');

    const { state, saveCreds } = await useMultiFileAuthState('auth_info')

    const sock = makeWASocket({
        auth: state,
        version: [2, 3000, 1033893291], // avoid Connection Failure
        // printQRInTerminal: true // deprecated
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('💡 Scan the QR Code below with your WhatsApp:')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed due to an error, reconnecting...', shouldReconnect)
            if (shouldReconnect) {
                connectToWhatsApp(dispatcher)
            }
        } else if (connection === 'open') {
            console.log('✅ Connection opened successfully!')
        }

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
                    ""

        const messageType = getContentType(msg.message) // get what type of message it is (text, image, video...)

        if (messageType === 'imageMessage') {
            // download the message
            const stream = await downloadMediaMessage(
                msg,
                'stream', // can be 'buffer' too
                { },
                {
                    logger: sock.logger,
                    // pass this so that baileys can request a reupload of media
                    // that has been deleted
                    reuploadRequest: sock.updateMediaMessage
                }
            )
            // save to file
            const writeStream = createWriteStream('./my-download.jpeg')
            stream.pipe(writeStream)
        }


        const from = msg.key.remoteJid // ID de quem enviou
        if (text && from && msg.key.fromMe === false && SAFELIST.includes(from)) {
            const answer: string = await dispatcher.dispatch({ from, rawText: text });
            sock.sendMessage(from, { text: `🤖 ${answer}` })
        } else if (!text) {
            console.log(`⚠️ Message text from [${from}] not found`)
        } else {
            console.log(`⚠️ Message from [${from}] ignored`)
        }

        // console.debug(`DEBUG [${from}]: ${JSON.stringify(msg, null, 2)}`)
    })

    sock.ev.on('creds.update', saveCreds)
}
