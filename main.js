const electron = require('electron');
const url = require('url');
const path = require('path');
const template = require('./menuTemplate')
const {app, BrowserWindow, Menu, ipcMain} = electron;


function appStart(mainMenuTemplate) 
{
    let mainWindow;
    // Listen for app to be ready
    app.on('ready', function() 
    {
        // Create new window
        mainWindow = new BrowserWindow({});
        // Load html into window
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'public/mainWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        // Quit app when closed
        mainWindow.on('closed', function() {
            app.quit();
        });
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
        Menu.setApplicationMenu(mainMenu);
        /*
        // Catch mouseCoordinates from index.html canvas.
        ipcMain.on('mouseCoordinates', (event, mouseX, mouseY) => {
            console.log(mouseX);
            console.log(mouseY);
            mainWindow.webContents.send('mouseCoordinates', mouseX, mouseY);
        });
        */
    }
    );
}


function Main() {
    process.env.NODE_ENV = "development";
    appStart(template.getMenu());
}

if (require.main) {
    Main();
}












