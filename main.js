// function ---> runs index.js in a node subprocess


let { spawn } = require('child_process')
let path = require('path')


function start() {
	// C:\Users\Pavit Chhabra\Desktop\final-bot\Ichigo-Kurosaki\connect\index.js

	// process = node main.js abc cd def



	// /\ ka error

	let args = [path.join(__dirname, 'connect/index.js'), ...process.argv.slice(2)]
	console.log([process.argv[0], ...args].join('\n')) //.join() --> converts to string and \n isf ro spces between them
	// \n is for space between args
	let p = spawn(process.argv[0], args, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }  )
	// node C:\Users\Pavit Chhabra\Desktop\final-bot\Ichigo-Kurosaki\connect/index.js argsHere 
	.on('message', data => {
		if (data == 'reset') {
			console.log('Restarting Bot...')
			p.kill()
			start()
			delete p
		}
	})
	.on('exit', code => {
		console.error('Exited with code:', code)
		if (code == 1) start() // code 0 = succesful exit
		// code 1 = crash
	})
}
start()
