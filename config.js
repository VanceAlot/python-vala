const fs = require('fs')

// global --> global namespace (provided by nodejs) to define variables in

// Change here
global.ownerNumber = ['919770483089','919667240912']
global.ownerName = 'Pavit, Krrish'
global.packname = 'nodejs'
global.author = 'Pavit, Krrish'

// TODO: 
// change prefa to prefix
global.prefa = ['','!','.','#','!'] //Remove the "" if you don't want to allow no prefix

// stores current sessions login info there
global.sessionName = 'sessionFile'

// Change the botAdmin etc. object names if you want afterwards
// Change the message here
global.mess = {
   admin: 'You Are Not Admin!',
   botAdmin: 'Bot Not Admin!',
   botOwner: 'You Are Not My Owner!',
   group: 'Only Group!',
   private: 'Only Private Chat',
   wait: 'Loading...',
   done: 'Done!'
}

//Customize
global.thumb = fs.readFileSync('./media/semsources_logo.png') // globla thumbnail
global.donasi = fs.readFileSync('./media/donasi.jpg') // donation img
global.thumbnail = fs.readFileSync('./media/ichi.mp4') // mp4 video

// __dirname --> global varibale : gives dir in which you are
// __filename --> gives filename --> absolute path of this file's name

// they though __filename would be something like 'settings.js' so they require resolved it to an absolue path
// but __filename already gives the absolute path, so require resolve was pointless lol
// so keep this logic in mind while reading below code
// it makes more sense that way


let file = require.resolve(__filename)
console.log("filename: ", __filename)
console.log("file: ", file)

// file and filename turn out to be the same thing since filename was by itself an absolute path

// watch file kyu? --> cus changes hote he voh function run hoga, aur voh function is nothing
// but reloader of the module

fs.watchFile(file, () => {
      // fs.unwatchFile(file) // ye kyu? bas aur ni dekhna  changes ke liye
      // they though __filename would be something like 'settings.js'
      // and file was considered like the absolute path of __filename
      console.log(`Update'${__filename}'`)


      // Reload Lines

      // below two lines are used to put a new instance the module in cache
      // hence reloading it in cache
      // and node is concerened as far as the cache is

      delete require.cache[file] // shayad kyuki delete kar liya apne aap ko cache se
      require(file) // apne aap ko require kyu kar raha hai? --> taki vapis cache mai aa jaye
   }
)
