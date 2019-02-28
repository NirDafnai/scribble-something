const electron = require('electron');
const {app, BrowserWindow, dialog, ipcMain} = electron;
const url = require('url');
const path = require('path');
class Window
{
    /*
        Browser window class, creates a browser window
    */
    constructor(width, height, htmlfile) 
    {
        this.width = width;
        this.height = height;
        this.htmlfile = htmlfile;
        this.browserWindow;
        this.loadSettings();
    }
    loadSettings() 
    {
        /*
            Sets window properties, such as height and width and loads settings.
        */
        this.browserWindow = new BrowserWindow(
            {
            width: this.width, 
            height: this.height,
            backgroundColor: '#3e474e',
            show: false,
            minHeight: this.height + 20,
            minWidth: this.width + 20,
            webPreferences: 
            {
                nodeIntegration: true,
                contextIsolation: false
            }
        }
        );

        // Load html into window
        this.browserWindow.loadURL(url.format({
            pathname: path.join(__dirname, `public/${this.htmlfile}`),
            protocol: 'file:',
            slashes: true
        }));

        this.browserWindow.on('closed', () =>
        {
            let count = BrowserWindow.getAllWindows()
            .filter(window => {
                return window.isVisible()
            })
            .length

            if (count == 0) app.quit();
        }
        );
        

        
    }
    
}

module.exports = Window;