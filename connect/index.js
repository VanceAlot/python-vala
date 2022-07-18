require('../config')

// baileys ka import
const {
    default: makeWASocket,
    useSingleFileAuthState,
    DisconnectReason,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    downloadContentFromMessage,
    makeInMemoryStore,
    jidDecode,
    jidNormalizedUser,
    proto
} = require("@adiwajshing/baileys")

// ye nahi samjha
const pino = require('pino')

const fs = require('fs')

// native fetch implementation cus ye timepass hai
const axios = require('axios')


const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')

const {
    Boom
} = require("@hapi/boom")








// main library import
const {
    smsg,
    getBuffer,
    getSizeMedia
} = require('../lib/myfunc')









const {
    state
} = useSingleFileAuthState(`./${global.sessionName}.json`)






// YE STORE DEFINE KARA HAI HAMNE
const store = makeInMemoryStore({
    logger: pino().child({
        level: 'fatal',
        stream: 'store'
    })
})







global.api = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({
    ...query,
    ...(apikeyqueryname ? {
        [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]
    } : {})
})) : '')




//start function define
async function start() {
    try {
        const webSocket = makeWASocket({
            logger: pino({
                level: 'silent'
            }),
            printQRInTerminal: true,
            browser: ["Pavit", "Chromium", "16.11"],
            auth: state
        })

        if (webSocket.user && webSocket.user.id){ 
          webSocket.user.jid = jidNormalizedUser(webSocket.user.id)
        }
        store.bind(webSocket.ev)

        //Connect To Command
        // ev = eventEmitter
        // chatUpdate ek json file hai, jisme jid, message and kaafi sari cheeze aati hai
        webSocket.ev.on('messages.upsert', async chatUpdate => {

            try {
                mek = chatUpdate.messages[0]
                if (!mek.message) return
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
                if (mek.key && mek.key.remoteJid === 'status@broadcast') return
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return






                // YE m define hua hai
                m = smsg(webSocket, mek, store)

                // mek kya hai ye???????
                //console.log(mek)


                // webSocket.JS KO YAHA IMPORT KARA HAI
                // kyuki webSocket async function hai, puri webSocket.js mai usko he export kara gaya tha
                // kaafi sara code hai webSocket async function mai


                // yaha pe jo webSocket pass hua hai voh webSocket websocket hai jo upar banaya hai iss he file mai
                // m ye cheez jo upar define kari
                // chatUpdate??
                // store??

                // pass everything to command.js ka big module export function to use for implmenting commands
                // import the fn and give it, it's args, so that it can handle ahead

                require("../command/commands.js")(webSocket, m, chatUpdate, store)


            } catch (err) {
                console.log(err)
            }
        })

        //Connection Active


        webSocket.ev.on('connection.update', async (update) => {
            const {
                connection,
                lastDisconnect
            } = update
            try {
                if (connection === 'close') {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode

                    console.log('lastDisconnect :', lastDisconnect)
                    console.log('lastDisconnect?.error: ', lastDisconnect?.error)

                    if (reason === DisconnectReason.badSession) {
                        console.log(`Bad Session File, Please Delete Session and Scan Again`);
                        start()
                    } else if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed, reconnecting....");
                        start();
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server, reconnecting...");
                        start();
                    } else if (reason === DisconnectReason.connectionReplaced) {
                        console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                        start()
                    } else if (reason === DisconnectReason.loggedOut) {
                        console.log(`Device Logged Out, Please Scan Again And Run.`);
                        start();
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.log("Restart Required, Restarting...");
                        start();
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut, Reconnecting...");
                        start();
                    } else webSocket.end(`Unknown DisconnectReason: ${reason}|${connection}`)
                }
                if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
                    console.log(`Connecting`)
                }
                if (update.connection == "open" || update.receivedPendingNotifications == "true") {
                    console.log(`[Connecting to] WhatsApp web`)
                    console.log(`[Connected] ` + JSON.stringify(webSocket.user, null, 2))
                }

            } catch (err) {
                console.log('error in connection.update' + err)
                start();
            }

        })

        //add detek pesan react emoji by FERDIZ AFK
        

        

        webSocket.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {}
                return decode.user && decode.server && decode.user + '@' + decode.server || jid
            } else return jid
        }

        webSocket.getName = (jid, withoutContact = false) => {
            id = webSocket.decodeJid(jid)
            withoutContact = webSocket.withoutContact || withoutContact
            let v
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = webSocket.groupMetadata(id) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
            else v = id === '0@s.whatsapp.net' ? {
                    id,
                    name: 'WhatsApp'
                } : id === webSocket.decodeJid(webSocket.user.id) ?
                webSocket.user :
                (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        webSocket.sendContact = async (jid, kon, quoted = '', opts = {}) => {
            let list = []
            for (let i of kon) {
                list.push({
                    displayName: await webSocket.getName(i + '@s.whatsapp.net'),
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await webSocket.getName(i + '@s.whatsapp.net')}\nFN:${await webSocket.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Phone\nitem2.EMAIL;type=INTERNET:semsources@gmail.com\nitem2.X-ABLabel:Email\nitem3.URL:https://instagram.com/semsources\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;India;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
                })
            }
            webSocket.sendMessage(jid, {
                contacts: {
                    displayName: `${list.length} Kontak`,
                    contacts: list
                },
                ...opts
            }, {
                quoted
            })
        }

        webSocket.serializeM = (m) => smsg(webSocket, m, store)




        /**
         *
         * @param {*} jid
         * @param {*} url
         * @param {*} caption
         * @param {*} quoted
         * @param {*} options
         */
        webSocket.sendFile = async (jid, url, caption, quoted, options = {}) => {
            let mime = '';
            let res = await axios.head(url)
            mime = res.headers['content-type']
            if (mime.split("/")[1] === "gif") {
                return webSocket.sendMessage(jid, {
                    video: await getBuffer(url),
                    caption: caption,
                    gifPlayback: true,
                    ...options
                }, {
                    quoted: quoted,
                    ...options
                })
            }
            let type = mime.split("/")[0] + "Message"
            if (mime === "application/pdf") {
                return webSocket.sendMessage(jid, {
                    document: await getBuffer(url),
                    mimetype: 'application/pdf',
                    caption: caption,
                    ...options
                }, {
                    quoted: quoted,
                    ...options
                })
            }
            if (mime.split("/")[0] === "image") {
                return webSocket.sendMessage(jid, {
                    image: await getBuffer(url),
                    caption: caption,
                    ...options
                }, {
                    quoted: quoted,
                    ...options
                })
            }
            if (mime.split("/")[0] === "video") {
                return webSocket.sendMessage(jid, {
                    video: await getBuffer(url),
                    caption: caption,
                    mimetype: 'video/mp4',
                    ...options
                }, {
                    quoted: quoted,
                    ...options
                })
            }
            if (mime.split("/")[0] === "audio") {
                return webSocket.sendMessage(jid, {
                    audio: await getBuffer(url),
                    caption: caption,
                    mimetype: 'audio/mpeg',
                    ...options
                }, {
                    quoted: quoted,
                    ...options
                })
            }
        }

        /** Send List Messaage
         *
         *@param {*} jid
         *@param {*} text
         *@param {*} footer
         *@param {*} title
         *@param {*} butText
         *@param [*] sections
         *@param {*} quoted
         */
        webSocket.sendList = (jid, text = '', footer = '', title = '', butText = '', sects = [], quoted) => {
            let sections = sects
            var listMes = {
                text: text,
                footer: footer,
                title: title,
                buttonText: butText,
                sections
            }
            webSocket.sendMessage(jid, listMes, {
                quoted: quoted
            })
        }

        /** Send Button 5 Message
         * 
         * @param {*} jid
         * @param {*} text
         * @param {*} footer
         * @param {*} button
         * @returns 
         */
        webSocket.sendButtonMsg = (jid, text = '', footer = '', but = []) => {
            let templateButtons = but
            var templateMessage = {
                text: text,
                footer: footer,
                templateButtons: templateButtons
            }
            webSocket.sendMessage(jid, templateMessage)
        }

        /** Send Button 5 Image
         *
         * @param {*} jid
         * @param {*} text
         * @param {*} footer
         * @param {*} image
         * @param [*] button
         * @param {*} options
         * @returns
         */
        webSocket.sendButtonImg = async (jid, text = '', footer = '', img, but = [], options = {}) => {
            let message = await prepareWAMessageMedia({
                image: img
            }, {
                upload: webSocket.waUploadToServer
            })
            var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
                templateMessage: {
                    hydratedTemplate: {
                        imageMessage: message.imageMessage,
                        "hydratedContentText": text,
                        "hydratedFooterText": footer,
                        "hydratedButtons": but
                    }
                }
            }), options)
            webSocket.relayMessage(jid, template.message, {
                messageId: template.key.id
            })
        }

        /** Send Button 5 Video
         *
         * @param {*} jid
         * @param {*} text
         * @param {*} footer
         * @param {*} Video
         * @param [*] button
         * @param {*} options
         * @returns
         */
        webSocket.sendButtonVid = async (jid, text = '', footer = '', vid, but = [], options = {}) => {
            let message = await prepareWAMessageMedia({
                video: vid
            }, {
                upload: webSocket.waUploadToServer
            })
            var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
                templateMessage: {
                    hydratedTemplate: {
                        videoMessage: message.videoMessage,
                        "hydratedContentText": text,
                        "hydratedFooterText": footer,
                        "hydratedButtons": but
                    }
                }
            }), options)
            webSocket.relayMessage(jid, template.message, {
                messageId: template.key.id
            })
        }

        /**
         * 
         * @param {*} jid 
         * @param {*} buttons 
         * @param {*} caption 
         * @param {*} footer 
         * @param {*} quoted 
         * @param {*} options 
         */
        webSocket.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
            let buttonMessage = {
                text,
                footer,
                buttons,
                headerType: 2,
                ...options
            }
            webSocket.sendMessage(jid, buttonMessage, {
                quoted,
                ...options
            })
        }

        /**
         * 
         * @param {*} jid 
         * @param {*} text 
         * @param {*} quoted 
         * @param {*} options 
         * @returns 
         */
        webSocket.sendText = (jid, text, quoted = '', options) => webSocket.sendMessage(jid, {
            text: text,
            ...options
        }, {
            quoted
        })

       

        
        

        /**
         * 
         * @param {*} jid 
         * @param {*} text 
         * @param {*} quoted 
         * @param {*} options 
         * @returns 
         */
        webSocket.sendTextWithMentions = async (jid, text, quoted, options = {}) => webSocket.sendMessage(jid, {
            text: text,
            contextInfo: {
                mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net')
            },
            ...options
        }, {
            quoted
        })

        /**
         * 
         * @param {*} message 
         * @param {*} filename 
         * @param {*} attachExtension 
         * @returns 
         */
        webSocket.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
            let quoted = message.msg ? message.msg : message
            let mime = (message.msg || message).mimetype || ''
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
            const stream = await downloadContentFromMessage(quoted, messageType)
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            let type = await FileType.fromBuffer(buffer)
            trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
            // save to file
            await fs.writeFileSync(trueFileName, buffer)
            return trueFileName
        }

        

        return webSocket
    } catch (err) {
        console.log(err)
        start()
    }
}
// ye khatam hua start
// ye call kiya usko
start()


// _________________________________________________________________________________________________
// RELOAD CODEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE

//  RELOAD CODE TO WATCH FOR CHANGES, INCLUDED IN ALL FILES
// HATA KE DEKHNA



// same update code, filename === index.js, usko reload karke cache mai dal rahe on case of changes
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})