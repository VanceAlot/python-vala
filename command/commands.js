//Module
require('../config')
const {WA_DEFAULT_EPHEMERAL} = require('@adiwajshing/baileys')
const chalk = require('chalk')
const {exec} = require("child_process")
const fs = require('fs')
const moment = require('moment-timezone')
const util = require('util')
const os = require('os')
const speed = require('performance-now')
const {performance} = require('perf_hooks')
const { spawn } = require('child_process')
const path = require('path')

//Time

const time = moment().tz('Asia/Jakarta').format("HH:mm:ss")

//database
global.db = {} || JSON.parse(fs.readFileSync('./storage/db.json'))
if (global.db) global.db = {
    chats: {},
    ...(global.db || {})
}

//Module Exports
module.exports = webSocket = async (webSocket, m, chatUpdate, store) => {
    try {
        //console.log(m)

      // if(converstainType === true) {
     //  many if statements jo pata karti hai ki uska type kya hai and uske hisba se body ka value kar deti hai jispe bhi true aa jaye 
      //}
        var body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
        var budy = (typeof m.text == 'string' ? m.text : '')

        var prefix = '.';
        
        // var prefix = '.';
        // .trim() --> removes whitespaces "  " multiple spaces NOT one
        // .split(/ +/) --> splits teh string at each space and gives array
        // .shift ---> c = c[0] (c is array)
        const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase() // isolate firstword of the message to check as command
        const args = body.trim().split(/ +/).slice(1) // bache hue message ke sare shabd

        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''
        const from = m.key.remoteJid
        const {
            type,
            quotedMsg,
            mentioned,
            now,
            fromMe
        } = m
        const more = String.fromCharCode(8206)

        const groupMetadata = m.isGroup ? await webSocket.groupMetadata(m.chat).catch(() => {}) : ''
        const participants = m.isGroup ? await groupMetadata.participants : ''



        // for convineant only text sending
        const reply = (text) => {
            webSocket.sendMessage(m.chat, {
                text: text,
                mentions: [m.sender]
            }, {
                quoted: m
            })
        }
































        // Main switch cases, command implementation

        switch (command) {

            // case testList:
            //     webSocket.sendList
            // break


            case 'menu':
            case 'help':

                let menuString = `
*MENU*

.upload --> Please send the pdf and reply to it by .upload [subject] [type] [name]
            
    [subject] --> write subject whose stuff you wanna access
            
    [type] --> {ASSIGNMENTS, NOTES, PYQ, BOOKS, MISC.}

.tree

.generate [subject-name-1] [subject-name-2] [subject-name-3] ... and so on write all your subjects

*NOTE* - you can use genearte only *ONCE* for your given group

.getlink [name of file here]

.tagall

.help
`

                let buttonArrayForMenu = [
                    // quick reply button
                    // upload button
                    // {
                    //     "quickReplyButton": {
                    //         "displayText": "Upload",
                    //         "id": `upload`
                    //     }
                    // },
                    // URL Button
                    {
                        urlButton: {
                            displayText: 'Website 🔗',
                            url: 'https://google.com/'
                        }
                    }
                ]
                webSocket.sendButtonImg(m.chat, menuString, global.ownerName, global.thumb, buttonArrayForMenu);

            break

            case 'upload':
                await webSocket.downloadAndSaveMediaMessage(quoted)

                let data = {};
                data.subject = args[0].toLowerCase();
                data.type = args[1].toLowerCase();
                data.name = args[2].toLowerCase();

                fs.writeFile("pdfData.json", JSON.stringify(data), function(err){
                    if(err){
                        console.log('error + ', err)
                    }
                });

                try {
                    // spawn('rename', ['./undefined.pdf', data.name + 'pdf'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                    spawn('python', ['./lib/main.py'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                    // spawn('del', ['../undefined.pdf'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                    // spawn('del', ['pdfData.json'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                }
                catch(err){
                    if(err){
                        m.reply('please contact pavit')
                    }
                    else {
                        console.log('Uploaded Successfully!')
                    }
                }

            break
            
            case 'tree': {
                try {
                    spawn('python', ['./lib/tree.py'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                }
                catch(err){
                    if(err){
                        m.reply('please contact pavit')
                    }
                    else {
                        console.log('Uploaded Successfully!')
                    }
                }
                var tree = await fs.readFileSync('./tree.json', {
                    encoding:'utf8', 
                    flag:'r'
                });
                await webSocket.sendMessage(m.chat, 
                    {
                        text : tree
                    },
                    { quoted: m }
                )
            }
            break

            case 'getlink':

                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }                

                let file = {
                    fileKey: ""
                };
                file.fileKey = args[0];
                console.log(file)
                await fs.writeFileSync("file.json", JSON.stringify(file), function(err){
                    if(err){
                        console.log('error + ', err)
                    }
                });
                console.log("file.json has been written!")
                try {
                    spawn('python', ['./lib/getLink.py'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                }
                catch(err){
                    if(err){
                        m.reply('please contact pavit')
                    }
                    else {
                        console.log('Uploaded Successfully!')
                    }
                }
                
                console.log('getLink from python was executed and exited succesfully, reading link.json now')
                var linkJson = await fs.readFileSync('./link.json', {
                    encoding:'utf8', 
                    flag:'r'
                });
                console.log('I am linkJson from JS', linkJson)
                console.log("successfully read link.json, here's the linkKey", linkJson.linkKey)

                // var link = linkJson.linkKey;
                // webSocket.sendMessage(m.chat, 
                //     {
                //         text : link
                //     },
                //     { quoted: m }
                // )
                // console.log("succesfully sent message!")







            break

            case 'generate':

                let subjectsDict = {};
                for(let i=0; i< args.length; i++){
                    subjectsDict[args[i]] = "";
                }

                await fs.writeFile("generate.json", JSON.stringify(subjectsDict), function(err){
                    if(err){
                        console.log('error + ', err)
                    }
                });

                try {
                    // spawn('rename', ['./undefined.pdf', data.name + 'pdf'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                    spawn('python', ['./website/init.py'], {stdio: ['inherit', 'inherit', 'inherit', 'ipc']})
                }
                catch(err){
                    if(err){
                        m.reply('please contact pavit')
                    }
                    else {
                        console.log('Uploaded Successfully!')
                    }
                }

            break

            // tagall
            case'tagall': {
                    webSocket.sendMessage(m.chat, 
                        { 
                            text : args.join(" ") ? args.join(" ") : '*Everyone!*' , 
                            mentions: participants.map(a => a.id)
                        }, 
                        { quoted: m }
                    )
                }
            break
        }

    } catch (err) {
        console.log("error in command.js " + util.format(err))
        //  m.reply(util.format(err))
    }

}
// webSocket ka export ends here





// RELOAD CODE

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})