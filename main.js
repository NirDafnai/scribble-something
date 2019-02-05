const electron = require('electron');
const url = require('url');
const path = require('path');
const template = require('./menuTemplate')
const {app, BrowserWindow, Menu, ipcMain} = electron;
const net = require('net');

function appStart(mainMenuTemplate) 
{
    /**
        * Sets the properties of the app and adds listeners to app events.
        * @param {Array} mainMenuTemplate Contains an object for each sub-menu, e.g. 'File', 'Edit' and so forth.
    */

    let mainWindow;
    // Listen for app to be ready
    app.on('ready', () => 
    {
        // Create new window
        mainWindow = new BrowserWindow(
            {
            width:1150, 
            height:860,
            backgroundColor: '#3e474e',
            show: false,
            webPreferences: 
            {
                nodeIntegration: true,
                contextIsolation: false
            }
        }
        );
        mainWindow.setMinimumSize(1150, 900);
        
        mainWindow.on('ready-to-show', () => 
        { 
          mainWindow.show(); 
          mainWindow.focus(); 
        }
        );
        // Load html into window
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'public/mainWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        
        // Quit app when closed
        mainWindow.on('closed', () =>
        {
            app.quit();
        }
        );

        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
        Menu.setApplicationMenu(mainMenu);
        
        ipcMain.on('newMouseCoordinates', (event, data) => 
        {
            client.write("new&" + data + "\n");
        }
        );
        ipcMain.on('moveMouseCoordinates', (event, data) => 
        {
            client.write("move&" + data + "\n");
        }
        );
        ipcMain.on('fill', (event, data) => 
        {
            client.write("fill&" + data + "\n");
        }
        );
        ipcMain.on('board', (event, data) => 
        {
            client.write(data + "\n");
        }
        );
        ipcMain.on('clearCanvas', () => 
        {
            client.write("clearCanvas" + "\n");
        }
        );


        client.setEncoding('utf8');
        
        let img = [];
        client.on('data', (data) => 
        {
            data = data.replace(/\n|\r/g, "");

            if (data == "send_board") 
            {
                mainWindow.webContents.send("send_board");
            }
            else if (data == "clearCanvas") 
            {
                mainWindow.webContents.send("clearCanvas");
            }

            else if (data == "end")
            {
                    global.myObject = img.join('');
                    ipcMain.on("readytoget", () => 
                    {
                        mainWindow.webContents.send("board");
                        setTimeout(() => 
                        {
                            img = [];
                        }
                        , 500);
                    }
                    );

            }

            else 
            {
                data = data.split("&")
                if (data[0] == "new")
                    mainWindow.webContents.send("newMouseCoordinates", data[1]);
                else if (data[0] == "dataparts")
                {
                    img.push(data[1]);
                    client.write("ack\n");
                }
                else if (data[0] == "move")
                    mainWindow.webContents.send("moveMouseCoordinates", data[1]);
                else if (data[0] == "fill") 
                {
                    mainWindow.webContents.send("fill", data[1]);
                }
            }

        }
        );

    }
    );
}

let client;
function Main() 
{
    process.env.NODE_ENV = "development";
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
    client = new net.Socket();
    client.connect(8820, '127.0.0.1', () =>
    {
        console.log('Connected');
    }
    );
    appStart(template.getMenu(app));
}

if (require.main) // if __name__ == "__main__"
{
    Main();
}












