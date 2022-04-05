// main.js
// Modules to control application life and create native browser window
const utils = require("./utils.js");
const {
	      app,
	      BrowserWindow
      } = require('electron');
const path = require('path');
const fs = require("fs");

function windowOptions(title)
{
	return {
		width         : 800,
		height        : 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false
		},
		title:title
	}
}

let mainWindow;

function addWindow(title)
{
	if( !mainWindow )
	{
		mainWindow = new BrowserWindow(windowOptions(title));
		return mainWindow;
	}
	else
	{
		const subWindow = new BrowserWindow(windowOptions(title));
		mainWindow.addTabbedWindow( subWindow );
		return subWindow;
	}
}

function profileWindow()
{
	const window = addWindow("Profiles");
	//mainWindow.addTabbedWindow( subWindow );

	utils.compileToFile("profiles.pug");
	window.loadFile("profiles.html");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() =>
                     {
	                     profileWindow();
						 utils.compileToFile("profile.pug");

	                     app.on('activate', () =>
	                     {
		                     // On macOS it's common to re-create a window in the app when the
		                     // dock icon is clicked and there are no other windows open.
		                     if(BrowserWindow.getAllWindows().length === 0)
		                     {
			                     profileWindow();
		                     }
	                     });
                     });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () =>
{
	if(process.platform !== 'darwin')
	{
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
